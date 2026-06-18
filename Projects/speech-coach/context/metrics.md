# Speech Coach — Metrics Reference

Detailed explanation of every metric the system measures, how it's computed, what the numbers mean, and what good/bad looks like.

---

## Hard Metrics (deterministic, no LLM)

### Duration

**What it is:** Total length of the speech in seconds, as reported by Groq's Whisper transcription.

**How it's computed:** `transcription.duration` — Whisper returns this directly from the audio file. It reflects the actual audio length, not just word timestamps, so it includes silences and pauses.

**What it means:**
- Under 60s: too short to get meaningful delivery feedback; coaching will be surface-level
- 2–15 min: ideal range for the analysis pipeline
- Over 25 min: the audio file will exceed the 25MB server-side limit after extraction; the server rejects it

**Used for:** WPM calculation, WPM variation windowing, energy profile comparison, pause detection context.

---

### WPM (Words Per Minute)

**What it is:** The speaker's average delivery speed across the full speech.

**How it's computed:**
```js
wpm = Math.round((words.length / duration) * 60)
```
`words` comes from Whisper's word-level timestamps. This is a global average — it doesn't capture local speed variation (that's WPM Variation below).

**What good looks like:**
- **Ideal range: 130–160 WPM** — conversational, clear, gives the audience time to absorb
- **110–175 WPM** — acceptable depending on content density
- **< 110 WPM** — flagged as slow. Often reads as uncertain or monotonous
- **> 175 WPM** — flagged as fast. Audience loses retention; nerves often drive this

**Notes:** Average human conversation is ~120–150 WPM. Experienced public speakers deliberately sit around 130–150 for most content, dropping lower (90–110) for emphasis and allowing faster bursts (170–180) to convey urgency or excitement.

**In the UI:** Displayed as a metric with a color-coded note: `slow` (orange), `good` (green), `fast` (orange).

---

### Filler Words

**What it is:** Count of filler words spoken, with per-word breakdown and exact timestamps.

**How it's computed:** After Whisper transcribes with word-level timestamps, each word is matched against a hardcoded list:
```js
['um', 'uh', 'like', 'you know', 'so', 'basically', 'literally', 'right', 'actually']
```
Match is case-insensitive, punctuation-stripped, exact — `"likes"` does not match `"like"`. The phrase `"you know"` is matched as a two-word sequence.

**What it means:**
- **0–3**: Excellent — most polished professional speakers stay here
- **4–10**: Acceptable for conversational delivery; noticeable in formal contexts
- **10–20**: Distracting — audience notices, undermines authority
- **20+**: Critical — a core problem that needs drilling before anything else

**Timestamps:** Every filler occurrence has a `timeFormatted` string (e.g., `"1:23"`) so the speaker can go back to the exact moment in the recording.

**Limitations:** The list is conservative and English-only. Domain-specific fillers (`"basically"`, `"right"`) can be legitimate depending on context. The LLM coaching call receives the filler summary and will contextualize whether the count is actually a problem given the speech type.

---

### Pauses

**What it is:** Gaps between words classified by duration — indicates intentionality of silence.

**How it's computed:**
```js
gap = word[i].start - word[i-1].end
```
Any gap ≥ 0.5 seconds is recorded as a pause with `after` (word before the gap) and `before` (word after).

**Classification:**
| Type | Duration | What it usually means |
|------|----------|----------------------|
| `brief` | 0.5–1.0s | Natural breath, minor hesitation |
| `meaningful` | 1.0–2.0s | Intentional pause for emphasis or transition |
| `long` | > 2.0s | Lost place, nervous freeze, or very deliberate dramatic pause |

**What good looks like:**
- A few `meaningful` pauses at section transitions or after key statements = strong technique
- Many `brief` pauses = choppy, uncertain delivery
- Multiple `long` pauses = either very deliberate (rare) or the speaker lost their thread

**In the UI:** Shown in the metrics strip as total pause count with a breakdown of long vs meaningful vs brief. Also passed to the LLM vocal analysis call for contextual interpretation.

---

### WPM Variation

**What it is:** How the speaker's speed changed across different sections of the speech.

**How it's computed:** The full speech is divided into 20-second windows. Each window gets its own WPM:
```js
wpm = Math.round((wordsInWindow.length / 20) * 60)
```
Windows with no words (pure silence) are skipped.

**What it means:**
- **Flat variation (all windows within ~20 WPM of each other):** monotone pacing — the speaker sounds like they're reading. Audiences disengage.
- **Moderate variation (30–60 WPM swing):** natural, engaging. The speaker is adjusting speed to content.
- **Wild variation (60+ WPM swings):** can signal nervousness or poor structure — the speaker rushes through uncomfortable sections and slows down on familiar territory.

**In the UI:** Displayed as a horizontal bar chart per window. Bars colored terracotta (normal), blue (slow), orange (fast). Helps the speaker visually identify exactly where they rushed or dragged.

---

### Pitch (Fundamental Frequency)

**What it is:** The perceived "highness" or "lowness" of the speaker's voice, measured in Hertz (Hz), across the speech.

**How it's computed:** Raw PCM audio (mono, 16kHz) is extracted via ffmpeg. The [YIN algorithm](http://audition.ens.fr/adc/pdf/2002_JASA_YIN.pdf) (from the `pitchfinder` library) runs on 1024-sample frames with a 2048-sample stride. Only pitches in the 60–600Hz range are accepted (filters out noise and artifacts). Per 5-second window, valid pitch frames are averaged.

**Stats reported:**
- `mean`: average pitch across the speech
- `min` / `max`: range
- `stdDev`: standard deviation
- `variation`: label derived from stdDev
  - `< 15 Hz`: **flat (monotone)** — speaker's pitch barely varies
  - `15–35 Hz`: **moderate** — natural conversational variation
  - `> 35 Hz`: **expressive** — wide pitch range, emotionally engaged delivery

**Typical values by speaker type:**
- Average adult male speaking voice: 85–180 Hz
- Average adult female speaking voice: 165–255 Hz
- Trained orators deliberately push their range wider for emotional emphasis

**What good looks like:** Moderate to expressive variation. A monotone pitch (low stdDev) is the single strongest predictor of audience disengagement. Overly expressive pitch (very high stdDev) can seem performative.

**Limitations:** YIN works well on clean, close-mic audio. Background noise, reverb, or phone recordings will introduce errors. The 60Hz floor filters most interference, but room tone can occasionally register as a false pitch reading.

---

### Energy (RMS)

**What it is:** The loudness/intensity of the audio signal at any given moment, measured as root mean square of the PCM waveform.

**How it's computed:**
```js
rms = Math.sqrt(samples.reduce((s, x) => s + x*x, 0) / samples.length)
```
Computed per 5-second window on the raw f32le PCM data from ffmpeg.

**What it means:** RMS values are unitless (0.0 to 1.0 range of float32 audio). Higher = louder/more energetic. The absolute values matter less than the pattern across the speech.

**Energy profile** is derived by comparing average energy in the first third vs last third of the speech:
- **< 0.65 ratio (last/first):** `declining — trails off toward the end` — common in nervous speakers who lose steam
- **> 1.4 ratio:** `building — gains energy through the speech` — often a sign of someone warming up; ideal for some speech types
- **0.65–1.4:** `consistent throughout`

**Passed to LLM:** The per-window energy timeline is included in the vocal analysis prompt so the LLM can correlate energy dips/spikes with specific moments in the transcript.

---

### Volume (dBFS)

**What it is:** Absolute loudness of the recording, measured in decibels relative to full scale (dBFS).

**How it's computed:** ffmpeg's `volumedetect` filter — runs a full-file analysis and reports:
- `mean_volume`: average loudness in dBFS
- `max_volume`: peak loudness in dBFS
- `dynamicRange`: `max - mean` (how much the speaker varies their volume)

**Labels:**
| Range | Label |
|-------|-------|
| mean > -15 dBFS | `loud` |
| -15 to -25 dBFS | `moderate` |
| < -25 dBFS | `quiet` |

**What good looks like:**
- Mean in the `-15` to `-20` dBFS range: well-projected, good recording level
- Dynamic range of 8–15 dB: speaker is using volume variation for emphasis
- Dynamic range < 5 dB: flat, monotone volume — no emphasis through projection
- Dynamic range > 20 dB: either very dramatic OR uneven mic technique

**Note:** dBFS is always ≤ 0. -6 dBFS is very loud (close to clipping), -30 dBFS is quiet. Recording environment affects this heavily — a phone recorded from 3 feet away in a room will read very differently from a headset mic.

---

## LLM-Graded Metrics

### Coaching Feedback (NIM Llama-3.3-70b — Call 1)

**What it is:** Structured qualitative analysis of the speech's content and delivery, written from the perspective of a demanding coach.

**Input to LLM:** The transcript, plus a delivery metadata summary:
```
Duration: Xs
Pace: Y WPM (within/slower/faster than ideal 130–160)
Filler words: N total — "um" ×3 (at 0:12, 1:45); "like" ×2 (at 0:33, 2:01)
Pauses: N total — M long (>2s): after "..."; K meaningful (1–2s); J brief (0.5–1s)
Volume: loud/moderate/quiet (mean X dB, dynamic range Y dB)
Pitch: mean X Hz, range Y–Z Hz, variation: flat/moderate/expressive
Vocal energy: declining/building/consistent
```

**System prompt rules (enforced):**
- Never open with a compliment
- Never use "great job", "good start", "nice work"
- Max 5 problems, prioritized ruthlessly
- Every problem must include: what the problem is, a specific transcript quote, and what to do differently
- End with "The one thing" — single most important internalization

**Output schema:**
```json
{
  "coaching": "Problem 1: [headline]\nWhat's happening: [with quote]\nFix it: [instruction]\n\nThe one thing: [sentence]",
  "highlights": [
    { "quote": "exact verbatim phrase", "label": "Problem N", "tip": "one-sentence fix" }
  ]
}
```

**Highlights** are verbatim substrings of the transcript. They're used by `TranscriptViewer` to highlight clickable passages — clicking reveals the label and tip. The LLM is instructed to pick the "most damning" 1–2 examples per problem.

---

### Vocal Analysis (NIM Llama-3.3-70b — Call 2)

**What it is:** Emotional and vocal quality assessment, grounded in the acoustic signal data.

**Input to LLM:** Per-5s window data (pitch Hz, energy RMS, WPM), speech segments with timestamps, and the full audio summary.

**Emotion Arc:** The speech is segmented into emotionally coherent chunks. Each chunk gets:
- `label`: one of `confident | nervous | excited | flat | uncertain | authoritative | engaged | trailing`
- `intensity`: 0.0–1.0 float (how strongly the label applies)
- `color`: fixed color per label (e.g., confident = `#70b870`, nervous = `#b070b0`)
- `timeStart` / `timeEnd`: seconds
- `note`: one sentence observation about the segment

**In the UI:** Rendered as colored bands in an SVG graph with pitch (terracotta line), energy (blue line), and WPM (gray bars) overlaid. The legend below lists each segment with intensity bar.

**Vocal Insights:** 3–5 structured coaching items covering different dimensions:

| Category | What it assesses |
|----------|-----------------|
| Pitch & Inflection | Whether pitch varies appropriately, avoiding monotone |
| Vocal Energy | Whether energy level and intensity suit the speech context |
| Pacing & Rhythm | Whether speed variation creates natural rhythm |
| Clarity | Pronunciation, enunciation, pace-related intelligibility |
| Presence | Overall command, confidence, authority in the voice |

Each insight has:
- `rating`: `strong | needs work | critical`
- `observation`: specific finding grounded in the acoustic data (must reference timestamps/values)
- `fix`: a concrete drill or technique to improve

---

### Argument & Structure Analysis — CWDAI Framework (NIM Llama-3.3-70b — Call 3)

**What it is:** Dedicated logical analysis of the speech's argument using the CWDAI framework (Claim → Warrant → Data → Analysis → Impact). Runs in parallel with vocal analysis. The framework's full reference is in `context/cwdai-framework.md`.

**Input to LLM:** The raw transcript (truncated to 4000 chars if longer).

**Output schema:**
```json
{
  "lineOfReasoning": "one sentence tracing or diagnosing the claim→warrant→data→analysis→impact thread",
  "claim": {
    "text": "string | null",
    "clarity": "clear | present but buried | missing",
    "note": "one sentence"
  },
  "warrant": {
    "text": "string | null",
    "strength": "strong | weak | missing",
    "note": "one sentence — does it bridge the claim to the data?"
  },
  "data": {
    "present": true,
    "summary": "what evidence was offered",
    "strength": "strong | adequate | weak | missing",
    "recommendation": "what kind of evidence would actually prove this (only when weak/missing)"
  },
  "analysis": {
    "depth": "thorough | surface | missing",
    "note": "does the speaker explain what the evidence means?"
  },
  "impact": {
    "type": "quantification | characterization | humanization | mixed | missing",
    "endsWith": "people | money | idea | other",
    "note": "one sentence on the impact as delivered",
    "recommendation": "how to strengthen it toward people (omitted if already ends with people)"
  },
  "flowScore": "strong | adequate | broken | unclear",
  "flowNote": "does the full chain connect?",
  "verdict": "single most important structural fix"
}
```

**CWDAI elements:**
| Element | What it checks |
|---------|---------------|
| Claim | Is the main point stated explicitly and early? Is it arguable? |
| Warrant | Is there a logical bridge from data to claim? Or does the speaker just assert and cite? |
| Data | Does the evidence ACTUALLY prove the point, or just feel relevant? |
| Analysis | Does the speaker explain what the evidence means, or just move on? |
| Impact | Does it end with people? Three types: Quantification (numbers) → Characterization (numbers + people) → Humanization (one person, zoomed in) |

**The impact rule:** All strong impacts end with people. Money is an intermediate impact. How money affects a specific person is a final impact.

**flowScore values:**
- `strong` — all five elements connect in a clear chain
- `adequate` — mostly connected, minor gaps
- `broken` — one or more elements clearly disconnected from the rest
- `unclear` — no discernible argumentative structure

**In the UI:** Displayed as "Argument & Structure" below coaching in the Feedback tab. Line of reasoning shown first (accent-bordered block), then a CWDAI grid with one row per element (badge shows strength rating, color-coded green/orange/red), then flow assessment, then verdict in Cormorant display type.

---

## What Is NOT Measured

- **Eye contact / body language** — audio-only pipeline by design
- **Vocabulary level / reading ease** — Flesch-Kincaid or similar not implemented
- **Audience appropriateness** — no context about who the speech is for
- **Multilingual content** — Whisper handles multilingual transcription but the filler word list and coaching prompts are English-only
