import 'dotenv/config'
import express from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execFile } from 'child_process'
import { promisify } from 'util'
import OpenAI from 'openai'
import ffmpegPath from 'ffmpeg-static'
import mongoose from 'mongoose'
import { analyzeAudio, buildAudioSummary } from './audioAnalysis.js'

const execFileAsync = promisify(execFile)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json())

// ── MongoDB ──────────────────────────────────────────────────────────
// Connection handled in start()

const speechSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  filename: String,
  transcript: String,
  metrics: mongoose.Schema.Types.Mixed,
  coaching: mongoose.Schema.Types.Mixed,
  vocalAnalysis: mongoose.Schema.Types.Mixed,
  argumentAnalysis: mongoose.Schema.Types.Mixed,
  rewrite: String,
})

const Speech = mongoose.model('Speech', speechSchema)

const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`)
    },
  }),
})

const NIM_BASE_URL = 'https://integrate.api.nvidia.com/v1'
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'
const VIDEO_EXTS = new Set(['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v'])

let _nimClient, _groqClient
function getNIM() {
  if (!_nimClient) _nimClient = new OpenAI({ apiKey: process.env.NVIDIA_API_KEY, baseURL: NIM_BASE_URL })
  return _nimClient
}
function getGroq() {
  if (!_groqClient) _groqClient = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: GROQ_BASE_URL })
  return _groqClient
}

async function extractAudio(inputPath, outputPath) {
  await execFileAsync(ffmpegPath, [
    '-i', inputPath,
    '-vn',
    '-acodec', 'libmp3lame',
    '-ar', '16000',
    '-ac', '1',
    '-q:a', '4',
    '-y',
    outputPath,
  ])
}

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'so', 'basically', 'literally', 'right', 'actually']

function detectFillers(words) {
  const hits = []
  const counts = {}
  for (const wordObj of words) {
    const w = wordObj.word.toLowerCase().replace(/[^a-z\s]/g, '').trim()
    for (const filler of FILLER_WORDS) {
      if (w === filler) {
        counts[filler] = (counts[filler] || 0) + 1
        hits.push({ word: filler, time: wordObj.start })
        break
      }
    }
  }
  return { counts, hits }
}

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function buildFillerSummary(counts, hits) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total === 0) return 'No notable filler words detected.'
  const breakdown = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([word, count]) => {
      const positions = hits.filter(h => h.word === word).map(h => formatTimestamp(h.time)).join(', ')
      return `"${word}" ×${count} (at ${positions})`
    })
    .join('; ')
  return `${total} total — ${breakdown}`
}

function extractJSON(text) {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) return JSON.parse(match[1].trim())
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start >= 0 && end > start) return JSON.parse(text.slice(start, end + 1))
  throw new Error('No JSON found in LLM response')
}

const COACH_SYSTEM = `You are a public speaking coach with zero tolerance for mediocrity. You have coached competitive debaters, TEDx speakers, and executives — and you have seen every bad habit a speaker can have. You do not soften feedback to protect feelings. You do not lead with what went well. You identify exactly what is broken, why it is broken, and what to do about it.

You are not cruel for the sake of it. You are direct because vague feedback wastes everyone's time. If something is good, you say so in one sentence and move on. If something is broken, you spend time on it.

## Rules

- Never open with a compliment. Open with the most important problem.
- Do not use the phrase "great job", "good start", "nice work", or any variant.
- Do not hedge. Say "your opening is weak" not "your opening could potentially be strengthened."
- Do not give more than 5 pieces of feedback. Prioritize ruthlessly.
- Every piece of feedback must include: what the problem is, one specific example from the transcript, and exactly what to do differently.
- If the speech is actually good, say so directly. Do not invent problems to seem tough.
- End with one sentence: the single most important thing this speaker needs to internalize before their next speech.

## Tone

Demanding coach, not a bully. You respect the speaker enough to tell them the truth.

## Output format

Respond with valid JSON only — no markdown, no backticks, no explanation outside the JSON.

{
  "coaching": "Problem 1: [headline]\\nWhat's happening: [observation with transcript quote]\\nFix it: [concrete instruction]\\n\\nProblem 2: ...\\n\\nThe one thing: [single sentence]",
  "highlights": [
    { "quote": "exact phrase copied verbatim from the transcript", "label": "Problem N headline", "tip": "one sentence: what to do instead" }
  ]
}

The highlights array must contain 1–2 verbatim quotes per problem (pick the most damning example). Quotes must be exact substrings of the transcript — copy them character-for-character.`

async function getArgumentAnalysis(transcript) {
  const prompt = `You are a debate coach analyzing argument structure using the CWDAI framework: Claim → Warrant → Data → Analysis → Impact.

A strong argument has all five elements connected by a single line of reasoning. Your job is to find where that line holds and where it breaks.

Transcript:
"${transcript.slice(0, 4000)}"

CWDAI definitions:
- Claim: the main point being made — must be specific and arguable
- Warrant: the logical bridge explaining WHY the claim is true
- Data: evidence — evaluate if it ACTUALLY proves the warrant/claim, not just if it feels relevant
- Analysis: how well the speaker explains the connection between data, warrant, claim, and impact
- Impact: why the listener should care — three types:
  * Quantification: giving numbers (scale, magnitude)
  * Characterization: connecting numbers to people and describing what those people look like
  * Humanization: zooming into ONE specific person or example
  All good impacts must end with people — money is a valid intermediate, but must connect back to human consequences.

Respond with valid JSON only — no markdown, no backticks:

{
  "lineOfReasoning": "one sentence tracing the full claim→warrant→data→analysis→impact thread, or describing where it breaks",
  "claim": {
    "text": "the claim as stated or paraphrased, or null if absent",
    "clarity": "clear | present but buried | missing",
    "note": "one sentence"
  },
  "warrant": {
    "text": "the warrant as stated or paraphrased, or null if absent",
    "strength": "strong | weak | missing",
    "note": "one sentence — does it actually bridge the claim to the data?"
  },
  "data": {
    "present": true or false,
    "summary": "what evidence was offered, or null",
    "strength": "strong | adequate | weak | missing",
    "recommendation": "specific: what kind of evidence would actually prove this point? Only include if strength is weak or missing."
  },
  "analysis": {
    "depth": "thorough | surface | missing",
    "note": "one sentence — does the speaker explain what the evidence means?"
  },
  "impact": {
    "type": "quantification | characterization | humanization | mixed | missing",
    "endsWith": "people | money | idea | other",
    "note": "one sentence on the impact as delivered",
    "recommendation": "one sentence: how to strengthen it toward people. Omit if impact already ends with people."
  },
  "flowScore": "strong | adequate | broken | unclear",
  "flowNote": "one sentence: does the overall claim→warrant→data→analysis→impact chain connect?",
  "verdict": "one sentence: the single most important structural fix this speech needs"
}

Rules:
- Be specific — reference actual words and phrases from the transcript
- Do not invent problems. If a component is genuinely strong, say so.
- recommendation fields: only include when there is something concrete to suggest
- If the speech is under 30 words or has no argumentative content, set flowScore to "unclear" and reflect this in verdict`

  try {
    const res = await getNIM().chat.completions.create({
      model: 'meta/llama-3.3-70b-instruct',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = res.choices[0]?.message?.content || ''
    return extractJSON(raw)
  } catch (err) {
    console.error('Argument analysis error:', err.message)
    return null
  }
}

async function getVocalAnalysis({ transcript, audioSummary, segments, audioFeatures, duration }) {
  const segmentText = segments.slice(0, 30).map(s =>
    `[${Math.round(s.start)}s–${Math.round(s.end)}s]: "${s.text.trim()}"`
  ).join('\n')

  const { pitchTimeline = [], energyTimeline = [], wpmVariation = [] } = audioFeatures

  const metricsPerWindow = pitchTimeline.map(p => {
    const e = energyTimeline.find(e => e.time === p.time)
    const w = wpmVariation.find(w => w.timeStart !== undefined && Math.abs(w.timeStart - p.time) < 20)
    return `t=${p.time}s: pitch=${p.pitch ?? '?'}Hz, energy=${e ? e.value.toFixed(4) : '?'}, wpm=${w?.wpm ?? '?'}`
  }).join('\n')

  const prompt = `You are a vocal coach analyzing a speech recording.

Audio signal data (per 5-second window):
${metricsPerWindow || audioSummary}

Speech segments with timestamps:
${segmentText || transcript.slice(0, 1500)}

Overall audio summary:
${audioSummary}

Respond with valid JSON only — no markdown, no backticks:

{
  "emotionArc": [
    {
      "timeStart": 0,
      "timeEnd": 20,
      "label": "one of: confident | nervous | excited | flat | uncertain | authoritative | engaged | trailing",
      "intensity": 0.0 to 1.0,
      "color": "one of: #70b870 | #c0714a | #e0a070 | #888888 | #b070b0 | #6a9fd8",
      "note": "one sentence observation about this segment"
    }
  ],
  "vocalInsights": [
    {
      "category": "Pitch & Inflection | Vocal Energy | Pacing & Rhythm | Clarity | Presence",
      "rating": "strong | needs work | critical",
      "observation": "specific observation grounded in the data",
      "fix": "concrete drill or technique to improve this"
    }
  ]
}

Rules:
- emotionArc should have one entry per meaningful segment (roughly every 15–30 seconds, aligned to natural speech breaks)
- Color map: confident=#70b870, excited=#c0714a, uncertain=#e0a070, flat=#888888, nervous=#b070b0, authoritative=#6a9fd8, engaged=#c0714a, trailing=#888888
- vocalInsights: 3–5 items covering different dimensions (pitch, energy, pacing, etc.)
- Every insight must reference specific timestamps or data points from the audio signal`

  try {
    const res = await getNIM().chat.completions.create({
      model: 'meta/llama-3.3-70b-instruct',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })
    const raw = res.choices[0]?.message?.content || ''
    const parsed = extractJSON(raw)
    return parsed
  } catch (err) {
    console.error('Vocal analysis error:', err.message)
    return { emotionArc: [], vocalInsights: [] }
  }
}

app.post('/api/analyze', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' })

  const uploadedPath = req.file.path
  const ext = path.extname(req.file.originalname || '').toLowerCase()
  const isVideo = VIDEO_EXTS.has(ext)
  const audioPath = isVideo ? uploadedPath + '_audio.mp3' : uploadedPath

  try {
    if (isVideo) await extractAudio(uploadedPath, audioPath)

    const audioStat = fs.statSync(audioPath)
    if (audioStat.size > 25 * 1024 * 1024) {
      return res.status(400).json({ error: 'Audio track exceeds 25 MB after extraction. Please trim the recording.' })
    }

    const transcription = await getGroq().audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-large-v3',
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    })

    const words = transcription.words || []
    const transcript = transcription.text || ''
    const duration = transcription.duration || 0
    const wpm = duration > 0 ? Math.round((words.length / duration) * 60) : 0

    const { counts, hits } = detectFillers(words)
    const fillerSummary = buildFillerSummary(counts, hits)
    const totalFillers = Object.values(counts).reduce((a, b) => a + b, 0)

    // Audio signal analysis (runs in parallel with filler detection above)
    const audioFeatures = await analyzeAudio(audioPath, words)
    const audioSummary = buildAudioSummary(audioFeatures)

    const pacingNote = wpm < 110
      ? `${wpm} WPM (slower than ideal — ideal range is 130–160)`
      : wpm > 175
      ? `${wpm} WPM (faster than ideal — ideal range is 130–160)`
      : `${wpm} WPM (within ideal 130–160 range)`

    const userMessage = `Transcript:\n"${transcript}"\n\nDelivery metadata:\n- Duration: ${Math.round(duration)}s\n- Pace: ${pacingNote}\n- Filler words: ${fillerSummary}\n\nAudio signal analysis:\n${audioSummary}`

    const response = await getNIM().chat.completions.create({
      model: 'meta/llama-3.3-70b-instruct',
      max_tokens: 2000,
      messages: [
        { role: 'system', content: COACH_SYSTEM },
        { role: 'user', content: userMessage },
      ],
    })

    const raw = response.choices[0]?.message?.content || ''
    let coaching = { body: raw, highlights: [] }

    try {
      const parsed = extractJSON(raw)
      coaching = { body: parsed.coaching || raw, highlights: parsed.highlights || [] }
    } catch {
      // LLM didn't return valid JSON — use raw text, no highlights
    }

    // Second + third LLM calls in parallel: vocal analysis & argument analysis
    const [vocalAnalysis, argumentAnalysis] = await Promise.all([
      getVocalAnalysis({
        transcript, audioSummary, segments: transcription.segments || [],
        audioFeatures, duration: Math.round(duration),
      }),
      getArgumentAnalysis(transcript),
    ])

    res.json({
      transcript,
      metrics: {
        duration: Math.round(duration),
        wpm,
        totalFillers,
        fillerCounts: counts,
        fillerHits: hits.map(h => ({ ...h, timeFormatted: formatTimestamp(h.time) })),
        audio: audioFeatures,
      },
      coaching,
      vocalAnalysis,
      argumentAnalysis,
    })
  } catch (err) {
    console.error('ANALYZE ERROR:', err)
    res.status(500).json({ error: err.message || 'Analysis failed.' })
  } finally {
    fs.unlink(uploadedPath, () => {})
    if (isVideo) fs.unlink(audioPath, () => {})
  }
})

app.post('/api/rewrite', async (req, res) => {
  const { transcript, coaching } = req.body
  if (!transcript) return res.status(400).json({ error: 'No transcript provided.' })

  try {
    const response = await getNIM().chat.completions.create({
      model: 'meta/llama-3.3-70b-instruct',
      max_tokens: 2000,
      messages: [
        {
          role: 'system',
          content: `You are a speechwriter. You will receive an original speech transcript and coaching feedback identifying its problems. Rewrite the speech to fix every identified problem while preserving the speaker's voice, intent, and core ideas. Do not add new ideas they did not express. Do not make it longer than necessary. Output only the rewritten speech — no preamble, no explanation, no "here is the rewrite".`,
        },
        {
          role: 'user',
          content: `Original transcript:\n"${transcript}"\n\nCoaching feedback (problems to fix):\n${coaching}`,
        },
      ],
    })

    const rewrite = response.choices[0]?.message?.content || ''
    res.json({ rewrite })
  } catch (err) {
    console.error('REWRITE ERROR:', err)
    res.status(500).json({ error: err.message || 'Rewrite failed.' })
  }
})

// ── Speech history CRUD ──────────────────────────────────────────────
app.post('/api/speeches', async (req, res) => {
  try {
    const { filename, transcript, metrics, coaching, vocalAnalysis, argumentAnalysis } = req.body
    const speech = await Speech.create({ filename, transcript, metrics, coaching, vocalAnalysis, argumentAnalysis })
    res.json({ id: speech._id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/speeches', async (req, res) => {
  try {
    const speeches = await Speech.find()
      .sort({ createdAt: -1 })
      .select('createdAt filename metrics.duration metrics.wpm metrics.totalFillers coaching.body')
    res.json(speeches)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/speeches/:id', async (req, res) => {
  try {
    const speech = await Speech.findById(req.params.id)
    if (!speech) return res.status(404).json({ error: 'Not found.' })
    res.json(speech)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/speeches/:id/rewrite', async (req, res) => {
  try {
    await Speech.findByIdAndUpdate(req.params.id, { rewrite: req.body.rewrite })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/speeches/:id', async (req, res) => {
  try {
    await Speech.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.use(express.static(path.join(__dirname, 'dist')))
app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')))

const PORT = process.env.PORT || 3001

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MongoDB connected')
  } catch (err) {
    console.error('MongoDB connection FAILED:', err.message)
    console.error('Server will start but history will not work.')
  }
  app.listen(PORT, () => console.log(`Server running on :${PORT}`))
}

start()
