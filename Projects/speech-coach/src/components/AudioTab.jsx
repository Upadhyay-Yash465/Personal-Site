function normalize(val, min, max) {
  if (max === min) return 0.5
  return (val - min) / (max - min)
}

function EmotionGraph({ emotionArc = [], pitchTimeline = [], energyTimeline = [], wpmVariation = [], duration = 60 }) {
  const W = 800
  const H = 180
  const PAD = { t: 28, r: 12, b: 36, l: 12 }
  const cW = W - PAD.l - PAD.r
  const cH = H - PAD.t - PAD.b

  const toX = t => PAD.l + (t / (duration || 1)) * cW
  const toY = (n) => PAD.t + cH - n * cH  // n: 0=bottom 1=top

  // Normalize pitch
  const pitches = pitchTimeline.filter(p => p.pitch != null).map(p => p.pitch)
  const pMin = pitches.length ? Math.min(...pitches) : 80
  const pMax = pitches.length ? Math.max(...pitches) : 300

  // Normalize energy
  const energies = energyTimeline.filter(e => e.value != null).map(e => e.value)
  const eMin = 0
  const eMax = energies.length ? Math.max(...energies) : 1

  // Pitch polyline
  const pitchPoints = pitchTimeline
    .filter(p => p.pitch != null)
    .map(p => `${toX(p.time + 2.5).toFixed(1)},${toY(normalize(p.pitch, pMin, pMax)).toFixed(1)}`)
    .join(' ')

  // Energy polyline
  const energyPoints = energyTimeline
    .filter(e => e.value != null)
    .map(e => `${toX(e.time + 2.5).toFixed(1)},${toY(normalize(e.value, eMin, eMax)).toFixed(1)}`)
    .join(' ')

  // WPM polyline
  const wpmVals = wpmVariation.map(w => w.wpm)
  const wMin = wpmVals.length ? Math.min(...wpmVals) : 0
  const wMax = wpmVals.length ? Math.max(...wpmVals) : 200
  const wpmPoints = wpmVariation
    .map(w => `${toX((w.timeStart ?? 0) + 10).toFixed(1)},${toY(normalize(w.wpm, wMin, wMax)).toFixed(1)}`)
    .join(' ')

  // Time tick marks
  const tickCount = Math.min(8, Math.ceil(duration / 15))
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => Math.round((duration / tickCount) * i))

  return (
    <div className="emotion-graph-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} aria-label="Emotion and vocal signal graph">

        {/* Emotion arc bands */}
        {emotionArc.map((seg, i) => (
          <g key={i}>
            <rect
              x={toX(seg.timeStart)} y={PAD.t}
              width={Math.max(0, toX(seg.timeEnd) - toX(seg.timeStart))}
              height={cH}
              fill={seg.color || '#444'}
              opacity={0.12 + (seg.intensity || 0.5) * 0.18}
            />
            <text
              x={(toX(seg.timeStart) + toX(seg.timeEnd)) / 2}
              y={PAD.t + 13}
              textAnchor="middle"
              fontSize="9"
              fill={seg.color || '#888'}
              opacity={0.95}
              fontFamily="DM Sans, system-ui, sans-serif"
            >
              {seg.label}
            </text>
          </g>
        ))}

        {/* Axis line */}
        <line x1={PAD.l} y1={PAD.t + cH} x2={W - PAD.r} y2={PAD.t + cH} stroke="#2c2c2c" strokeWidth="1" />

        {/* WPM bars (background) */}
        {wpmVariation.map((w, i) => {
          const x = toX(w.timeStart ?? 0)
          const nextX = toX((w.timeStart ?? 0) + 20)
          const h = normalize(w.wpm, wMin, wMax) * cH
          return (
            <rect key={i}
              x={x + 1} y={PAD.t + cH - h}
              width={Math.max(0, nextX - x - 2)} height={h}
              fill="#2c2c2c" opacity={0.6}
            />
          )
        })}

        {/* Energy line */}
        {energyPoints && (
          <polyline points={energyPoints} fill="none" stroke="#6a9fd8" strokeWidth="1.5" opacity="0.7" strokeLinejoin="round" />
        )}

        {/* Pitch line */}
        {pitchPoints && (
          <polyline points={pitchPoints} fill="none" stroke="#c0714a" strokeWidth="2" opacity="0.85" strokeLinejoin="round" />
        )}

        {/* Time ticks */}
        {ticks.map(t => {
          const x = toX(t)
          const m = Math.floor(t / 60)
          const s = t % 60
          return (
            <g key={t}>
              <line x1={x} y1={PAD.t + cH} x2={x} y2={PAD.t + cH + 4} stroke="#444" strokeWidth="1" />
              <text x={x} y={H - 6} textAnchor="middle" fontSize="8" fill="#666" fontFamily="DM Sans, sans-serif">
                {m}:{String(s).padStart(2, '0')}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="graph-legend">
        <span className="legend-item"><span className="legend-line pitch" />Pitch</span>
        <span className="legend-item"><span className="legend-line energy" />Energy</span>
        <span className="legend-item"><span className="legend-bar" />WPM</span>
      </div>
    </div>
  )
}

const RATING_CLASS = { strong: 'strong', 'needs work': 'needs-work', critical: 'critical' }

export default function AudioTab({ vocalAnalysis = {}, metrics = {} }) {
  const { emotionArc = [], vocalInsights = [] } = vocalAnalysis
  const { audio = {}, duration = 0, wpm = 0 } = metrics
  const { pitchTimeline = [], energyTimeline = [], wpmVariation = [], pitchStats, volume, energyProfile, pauses = [] } = audio

  return (
    <div className="audio-tab">

      <div className="audio-section">
        <h2 className="section-label">Vocal & emotional arc</h2>
        {emotionArc.length > 0 ? (
          <>
            <EmotionGraph
              emotionArc={emotionArc}
              pitchTimeline={pitchTimeline}
              energyTimeline={energyTimeline}
              wpmVariation={wpmVariation}
              duration={duration}
            />
            <div className="emotion-arc-list">
              {emotionArc.map((seg, i) => (
                <div key={i} className="emotion-segment" style={{ '--seg-color': seg.color || '#888' }}>
                  <div className="seg-header">
                    <span className="seg-dot" />
                    <span className="seg-label">{seg.label}</span>
                    <span className="seg-time">{Math.floor(seg.timeStart / 60)}:{String(seg.timeStart % 60).padStart(2, '0')} – {Math.floor(seg.timeEnd / 60)}:{String(seg.timeEnd % 60).padStart(2, '0')}</span>
                    <div className="seg-intensity-bar">
                      <div className="seg-intensity-fill" style={{ width: `${Math.round((seg.intensity || 0.5) * 100)}%` }} />
                    </div>
                  </div>
                  {seg.note && <p className="seg-note">{seg.note}</p>}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="audio-empty">No emotion arc data — reanalyze a speech to populate this.</p>
        )}
      </div>

      <div className="audio-section">
        <h2 className="section-label">Signal snapshot</h2>
        <div className="signal-grid">
          {pitchStats && (
            <div className="signal-card">
              <p className="signal-value">{pitchStats.mean} Hz</p>
              <p className="signal-label">Avg pitch</p>
              <p className="signal-sub">{pitchStats.min}–{pitchStats.max} Hz range · {pitchStats.variation}</p>
            </div>
          )}
          {volume && (
            <div className="signal-card">
              <p className="signal-value">{volume.loudness}</p>
              <p className="signal-label">Volume</p>
              <p className="signal-sub">{volume.mean} dB mean · {volume.dynamicRange} dB range</p>
            </div>
          )}
          {pauses.length > 0 && (
            <div className="signal-card">
              <p className="signal-value">{pauses.length}</p>
              <p className="signal-label">Pauses</p>
              <p className="signal-sub">{pauses.filter(p => p.type === 'long').length} long · {pauses.filter(p => p.type === 'meaningful').length} meaningful · {pauses.filter(p => p.type === 'brief').length} brief</p>
            </div>
          )}
          {energyProfile && (
            <div className="signal-card">
              <p className="signal-value" style={{ fontSize: '0.875rem' }}>{energyProfile.split(' — ')[0]}</p>
              <p className="signal-label">Energy profile</p>
              {energyProfile.includes('—') && <p className="signal-sub">{energyProfile.split(' — ')[1]}</p>}
            </div>
          )}
        </div>
      </div>

      {vocalInsights.length > 0 && (
        <div className="audio-section">
          <h2 className="section-label">Vocal coaching</h2>
          <div className="vocal-insights">
            {vocalInsights.map((insight, i) => (
              <div key={i} className={`vocal-insight ${RATING_CLASS[insight.rating] || ''}`}>
                <div className="insight-header">
                  <span className="insight-category">{insight.category}</span>
                  <span className={`insight-rating ${RATING_CLASS[insight.rating] || ''}`}>{insight.rating}</span>
                </div>
                <p className="insight-observation">{insight.observation}</p>
                <p className="insight-fix"><span className="fix-label">Fix it</span>{insight.fix}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
