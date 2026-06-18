const STAGES = [
  { key: 'uploading', label: 'Uploading' },
  { key: 'transcribing', label: 'Transcribing' },
  { key: 'analyzing', label: 'Analyzing' },
]

export default function Processing({ stage }) {
  const currentIndex = STAGES.findIndex(s => s.key === stage)

  return (
    <div className="processing-wrap" role="status" aria-live="polite">
      <div className="processing-steps">
        {STAGES.map((s, i) => (
          <div
            key={s.key}
            className={`processing-step${i === currentIndex ? ' active' : i < currentIndex ? ' done' : ''}`}
          >
            <span className="step-dot" aria-hidden="true" />
            <span className="step-label">{s.label}</span>
          </div>
        ))}
      </div>
      <p className="processing-sub">
        {stage === 'uploading' && 'Sending your file to the server…'}
        {stage === 'transcribing' && 'Whisper is transcribing your speech…'}
        {stage === 'analyzing' && 'Claude is reading the transcript…'}
      </p>
    </div>
  )
}
