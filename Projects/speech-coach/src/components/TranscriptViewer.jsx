import { useState } from 'react'

function segmentTranscript(text, highlights) {
  if (!highlights?.length) return [{ type: 'text', content: text }]

  const positions = highlights
    .map((h, idx) => {
      const lower = text.toLowerCase()
      const quoteL = h.quote.toLowerCase()
      const start = lower.indexOf(quoteL)
      if (start < 0) return null
      return { idx, start, end: start + h.quote.length, label: h.label, tip: h.tip, quote: h.quote }
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start)

  const segments = []
  let cursor = 0

  for (const pos of positions) {
    if (pos.start < cursor) continue // skip overlaps
    if (pos.start > cursor) segments.push({ type: 'text', content: text.slice(cursor, pos.start) })
    segments.push({ type: 'highlight', content: text.slice(pos.start, pos.end), label: pos.label, tip: pos.tip, idx: pos.idx })
    cursor = pos.end
  }

  if (cursor < text.length) segments.push({ type: 'text', content: text.slice(cursor) })
  return segments
}

export default function TranscriptViewer({ transcript, highlights }) {
  const [activeIdx, setActiveIdx] = useState(null)
  const segments = segmentTranscript(transcript, highlights || [])
  const active = activeIdx !== null ? (highlights || [])[activeIdx] : null

  return (
    <div className="transcript-viewer">
      <p className="transcript-interactive">
        {segments.map((seg, i) => {
          if (seg.type === 'text') return <span key={i}>{seg.content}</span>
          const isActive = activeIdx === seg.idx
          return (
            <mark
              key={i}
              className={`transcript-mark${isActive ? ' is-active' : ''}`}
              onClick={() => setActiveIdx(isActive ? null : seg.idx)}
              title="Click for feedback"
            >
              {seg.content}
            </mark>
          )
        })}
      </p>

      {active && (
        <div className="transcript-callout">
          <button className="callout-close" onClick={() => setActiveIdx(null)} aria-label="Close">×</button>
          <p className="callout-label">{active.label}</p>
          <p className="callout-tip">{active.tip}</p>
        </div>
      )}

      {(!highlights || highlights.length === 0) && (
        <p className="transcript-no-highlights">No specific passages flagged.</p>
      )}
    </div>
  )
}
