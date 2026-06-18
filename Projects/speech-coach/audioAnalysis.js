import { spawn } from 'child_process'
import { createRequire } from 'module'
import ffmpegPath from 'ffmpeg-static'

const require = createRequire(import.meta.url)
const { YIN } = require('pitchfinder')

const SAMPLE_RATE = 16000
const PITCH_FRAME = 1024
const PITCH_STRIDE = PITCH_FRAME * 2
const WIN_SECS = 5
const ENERGY_WIN = SAMPLE_RATE * WIN_SECS

function getPCMSamples(audioPath) {
  return new Promise((resolve, reject) => {
    const chunks = []
    const proc = spawn(ffmpegPath, ['-i', audioPath, '-ar', String(SAMPLE_RATE), '-ac', '1', '-f', 'f32le', 'pipe:1'])
    proc.stdout.on('data', c => chunks.push(c))
    proc.stderr.on('data', () => {})
    proc.on('close', () => {
      const buf = Buffer.concat(chunks)
      resolve(new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 4)))
    })
    proc.on('error', reject)
  })
}

function getVolumeInfo(audioPath) {
  return new Promise(resolve => {
    const lines = []
    const proc = spawn(ffmpegPath, ['-i', audioPath, '-af', 'volumedetect', '-f', 'null', '-'])
    proc.stderr.on('data', d => lines.push(d.toString()))
    proc.on('close', () => {
      const out = lines.join('')
      const meanM = out.match(/mean_volume:\s*([-\d.]+)\s*dB/)
      const maxM  = out.match(/max_volume:\s*([-\d.]+)\s*dB/)
      if (!meanM) return resolve(null)
      const mean = parseFloat(meanM[1])
      const max  = maxM ? parseFloat(maxM[1]) : null
      resolve({
        mean, max,
        dynamicRange: max !== null ? parseFloat((max - mean).toFixed(1)) : null,
        loudness: mean > -15 ? 'loud' : mean > -25 ? 'moderate' : 'quiet',
      })
    })
    proc.on('error', () => resolve(null))
  })
}

export function detectPauses(words) {
  const pauses = []
  for (let i = 1; i < words.length; i++) {
    const gap = (words[i].start ?? 0) - (words[i - 1].end ?? words[i - 1].start ?? 0)
    if (gap >= 0.5) {
      pauses.push({
        start: parseFloat((words[i - 1].end ?? 0).toFixed(2)),
        duration: parseFloat(gap.toFixed(2)),
        type: gap >= 2 ? 'long' : gap >= 1 ? 'meaningful' : 'brief',
        after: words[i - 1].word?.trim() ?? '',
        before: words[i].word?.trim() ?? '',
      })
    }
  }
  return pauses
}

export function getWpmVariation(words) {
  if (words.length < 5) return []
  const totalDuration = words[words.length - 1].end ?? 0
  if (totalDuration < 20) return []
  const WIN = 20
  const windows = []
  for (let t = 0; t < totalDuration; t += WIN) {
    const inWin = words.filter(w => (w.start ?? 0) >= t && (w.start ?? 0) < t + WIN)
    if (!inWin.length) continue
    windows.push({
      timeStart: Math.round(t),
      window: `${Math.round(t)}–${Math.round(Math.min(t + WIN, totalDuration))}s`,
      wpm: Math.round((inWin.length / WIN) * 60),
    })
  }
  return windows
}

async function analyzePCM(audioPath) {
  const samples = await getPCMSamples(audioPath)
  const detect = YIN({ sampleRate: SAMPLE_RATE })

  // Per-5s window: collect pitches and energy
  const pitchTimeline = []
  const energyTimeline = []

  const totalWindows = Math.floor(samples.length / ENERGY_WIN)

  for (let w = 0; w < totalWindows; w++) {
    const winStart = w * ENERGY_WIN
    const winSamples = samples.slice(winStart, winStart + ENERGY_WIN)
    const timeLabel = w * WIN_SECS

    // Energy (RMS)
    const rms = Math.sqrt(winSamples.reduce((s, x) => s + x * x, 0) / winSamples.length)
    energyTimeline.push({ time: timeLabel, value: parseFloat(rms.toFixed(6)) })

    // Pitch (avg of valid frames in this window)
    const winPitches = []
    for (let i = 0; i + PITCH_FRAME <= winSamples.length; i += PITCH_STRIDE) {
      const frame = winSamples.slice(i, i + PITCH_FRAME)
      const p = detect(frame)
      if (p && p > 60 && p < 600) winPitches.push(p)
    }
    const avgPitch = winPitches.length ? Math.round(winPitches.reduce((a, b) => a + b, 0) / winPitches.length) : null
    pitchTimeline.push({ time: timeLabel, pitch: avgPitch })
  }

  // Overall pitch stats
  const allPitches = pitchTimeline.filter(p => p.pitch).map(p => p.pitch)
  let pitchStats = null
  if (allPitches.length > 3) {
    const mean = allPitches.reduce((a, b) => a + b, 0) / allPitches.length
    const min  = Math.min(...allPitches)
    const max  = Math.max(...allPitches)
    const stdDev = Math.sqrt(allPitches.reduce((s, p) => s + (p - mean) ** 2, 0) / allPitches.length)
    pitchStats = {
      mean: Math.round(mean), min: Math.round(min), max: Math.round(max),
      stdDev: Math.round(stdDev),
      variation: stdDev < 15 ? 'flat (monotone)' : stdDev < 35 ? 'moderate' : 'expressive',
    }
  }

  // Energy profile
  const energyVals = energyTimeline.map(e => e.value)
  let energyProfile = null
  if (energyVals.length >= 3) {
    const third = Math.ceil(energyVals.length / 3)
    const firstAvg = energyVals.slice(0, third).reduce((a, b) => a + b, 0) / third
    const lastAvg  = energyVals.slice(-third).reduce((a, b) => a + b, 0) / third
    const ratio = lastAvg / (firstAvg || 1)
    energyProfile = ratio < 0.65 ? 'declining — trails off toward the end'
      : ratio > 1.4 ? 'building — gains energy through the speech'
      : 'consistent throughout'
  }

  return { pitchStats, pitchTimeline, energyTimeline, energyProfile }
}

export async function analyzeAudio(audioPath, words) {
  const [pcm, volume] = await Promise.all([
    analyzePCM(audioPath).catch(() => ({})),
    getVolumeInfo(audioPath).catch(() => null),
  ])
  return {
    pauses: detectPauses(words),
    wpmVariation: getWpmVariation(words),
    volume,
    ...pcm,
  }
}

export function buildAudioSummary({ pauses, wpmVariation, volume, pitchStats, energyProfile }) {
  const lines = []

  if (pauses?.length) {
    const byType = { long: [], meaningful: [], brief: [] }
    pauses.forEach(p => byType[p.type]?.push(p))
    const parts = []
    if (byType.long.length)       parts.push(`${byType.long.length} long (>2s): after "${byType.long.map(p => p.after).join('", "')}"`)
    if (byType.meaningful.length) parts.push(`${byType.meaningful.length} meaningful (1–2s)`)
    if (byType.brief.length)      parts.push(`${byType.brief.length} brief (0.5–1s)`)
    lines.push(`Pauses: ${pauses.length} total — ${parts.join(', ')}`)
  } else {
    lines.push('Pauses: none detected (may indicate rushed or unbroken delivery)')
  }

  if (wpmVariation?.length > 1) {
    const wmps = wpmVariation.map(w => w.wpm)
    const min = Math.min(...wmps); const max = Math.max(...wmps)
    lines.push(`Speed variation: ${min}–${max} WPM (slowest: ${wpmVariation.find(w => w.wpm === min)?.window}, fastest: ${wpmVariation.find(w => w.wpm === max)?.window})`)
  }

  if (volume) lines.push(`Volume: ${volume.loudness} (mean ${volume.mean} dB, dynamic range ${volume.dynamicRange} dB)`)
  if (pitchStats) lines.push(`Pitch: mean ${pitchStats.mean} Hz, range ${pitchStats.min}–${pitchStats.max} Hz, variation ${pitchStats.variation}`)
  if (energyProfile) lines.push(`Vocal energy: ${energyProfile}`)

  return lines.join('\n')
}
