import { useState } from 'react'
import TranscriptViewer from './TranscriptViewer.jsx'
import AudioTab from './AudioTab.jsx'

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function WpmNote({ wpm }) {
  if (wpm < 110) return <span className="metric-note slow">slow</span>
  if (wpm > 175) return <span className="metric-note fast">fast</span>
  return <span className="metric-note ok">good</span>
}

const CWDAI_STRENGTH_CLASS = {
  strong: 'cwdai-strong', adequate: 'cwdai-ok', clear: 'cwdai-strong',
  'present but buried': 'cwdai-warn', weak: 'cwdai-warn', missing: 'cwdai-crit',
  thorough: 'cwdai-strong', surface: 'cwdai-warn', broken: 'cwdai-crit', unclear: 'cwdai-warn',
}

const FLOW_SCORE_CLASS = { strong: 'cwdai-strong', adequate: 'cwdai-ok', broken: 'cwdai-crit', unclear: 'cwdai-warn' }

const IMPACT_TYPE_LABEL = {
  quantification: 'Quantification', characterization: 'Characterization',
  humanization: 'Humanization', mixed: 'Mixed', missing: 'Missing',
}

function CwdaiRow({ label, badge, badgeClass, note, children }) {
  return (
    <div className="cwdai-row">
      <div className="cwdai-row-head">
        <span className="cwdai-label">{label}</span>
        {badge && <span className={`cwdai-badge ${badgeClass || ''}`}>{badge}</span>}
      </div>
      {note && <p className="cwdai-note">{note}</p>}
      {children}
    </div>
  )
}

function ArgumentBlock({ data }) {
  if (!data) return null

  // Support both old schema (centralClaim) and new CWDAI schema
  if (!data.claim && data.centralClaim) {
    const { centralClaim, structure, flow, strengths = [], gaps = [], verdict } = data
    return (
      <div className="argument-body">
        {centralClaim && <div className="argument-claim"><span className="detail-label">Central claim</span><p>{centralClaim}</p></div>}
        {flow && <div className="argument-flow"><span className="detail-label">Flow · {structure}</span><p>{flow}</p></div>}
        {strengths.length > 0 && <div className="argument-strengths"><span className="detail-label">Strengths</span><ul>{strengths.map((s, i) => <li key={i}>{s}</li>)}</ul></div>}
        {gaps.length > 0 && <div className="argument-gaps"><span className="detail-label">Gaps</span>{gaps.map((g, i) => <div key={i} className="argument-gap"><p className="gap-issue">{g.issue}</p>{g.quote && <blockquote className="gap-quote">"{g.quote}"</blockquote>}<p className="gap-fix"><span className="fix-label">Fix it</span>{g.fix}</p></div>)}</div>}
        {verdict && <div className="argument-verdict"><span className="detail-label">Verdict</span><p>{verdict}</p></div>}
      </div>
    )
  }

  const { lineOfReasoning, claim, warrant, data: evidence, analysis, impact, flowScore, flowNote, verdict } = data

  return (
    <div className="argument-body cwdai-body">
      {lineOfReasoning && (
        <div className="cwdai-thread">
          <span className="cwdai-thread-label">Line of reasoning</span>
          <p>{lineOfReasoning}</p>
        </div>
      )}

      <div className="cwdai-grid">
        {claim && (
          <CwdaiRow label="C — Claim" badge={claim.clarity} badgeClass={CWDAI_STRENGTH_CLASS[claim.clarity]} note={claim.note}>
            {claim.text && <p className="cwdai-text">"{claim.text}"</p>}
          </CwdaiRow>
        )}

        {warrant && (
          <CwdaiRow label="W — Warrant" badge={warrant.strength} badgeClass={CWDAI_STRENGTH_CLASS[warrant.strength]} note={warrant.note}>
            {warrant.text && <p className="cwdai-text">"{warrant.text}"</p>}
          </CwdaiRow>
        )}

        {evidence && (
          <CwdaiRow label="D — Data" badge={evidence.strength} badgeClass={CWDAI_STRENGTH_CLASS[evidence.strength]} note={evidence.summary}>
            {evidence.recommendation && (
              <p className="cwdai-rec"><span className="fix-label">Stronger evidence</span>{evidence.recommendation}</p>
            )}
          </CwdaiRow>
        )}

        {analysis && (
          <CwdaiRow label="A — Analysis" badge={analysis.depth} badgeClass={CWDAI_STRENGTH_CLASS[analysis.depth]} note={analysis.note} />
        )}

        {impact && (
          <CwdaiRow
            label="I — Impact"
            badge={IMPACT_TYPE_LABEL[impact.type] || impact.type}
            badgeClass={impact.endsWith === 'people' ? 'cwdai-strong' : CWDAI_STRENGTH_CLASS[impact.type]}
            note={impact.note}
          >
            {impact.endsWith !== 'people' && impact.recommendation && (
              <p className="cwdai-rec"><span className="fix-label">Strengthen</span>{impact.recommendation}</p>
            )}
          </CwdaiRow>
        )}
      </div>

      {flowScore && (
        <div className="cwdai-flow">
          <span className={`cwdai-flow-score ${FLOW_SCORE_CLASS[flowScore] || ''}`}>Flow: {flowScore}</span>
          {flowNote && <p>{flowNote}</p>}
        </div>
      )}

      {verdict && (
        <div className="argument-verdict">
          <span className="detail-label">Verdict</span>
          <p>{verdict}</p>
        </div>
      )}
    </div>
  )
}

function CoachingBlock({ body }) {
  return (
    <div className="coaching-body">
      {body.split('\n\n').filter(p => p.trim()).map((block, i) => {
        const trimmed = block.trim()

        if (/^the one thing:/i.test(trimmed)) {
          const text = trimmed.replace(/^the one thing:\s*/i, '')
          return (
            <div key={i} className="one-thing">
              <span className="one-thing-label">The one thing</span>
              <p>{text}</p>
            </div>
          )
        }

        if (/^problem\s+\d+:/i.test(trimmed)) {
          const lines = trimmed.split('\n')
          const headline = lines[0].replace(/^problem\s+\d+:\s*/i, '')
          const rest = lines.slice(1)
          return (
            <div key={i} className="coaching-problem">
              <p className="problem-headline">{headline}</p>
              {rest.map((line, j) => {
                const whats = /^what'?s happening:\s*/i.test(line)
                const fix = /^fix it:\s*/i.test(line)
                if (whats) return <p key={j} className="problem-detail"><span className="detail-label">What's happening</span>{line.replace(/^what'?s happening:\s*/i, '')}</p>
                if (fix) return <p key={j} className="problem-fix"><span className="detail-label">Fix it</span>{line.replace(/^fix it:\s*/i, '')}</p>
                return line.trim() ? <p key={j}>{line}</p> : null
              })}
            </div>
          )
        }

        return <p key={i}>{trimmed}</p>
      })}
    </div>
  )
}

export default function Results({ result, savedId, onSaved, onReset }) {
  const { metrics, coaching, transcript, filename, vocalAnalysis = {}, argumentAnalysis } = result
  const { duration = 0, wpm = 0, totalFillers = 0, fillerCounts = {}, fillerHits = [], audio = {} } = metrics || {}
  const { pitchStats, energyProfile, volume, pauses = [], wpmVariation = [] } = audio
  const [tab, setTab] = useState('feedback')
  const [rewrite, setRewrite] = useState(result.rewrite || null)
  const coachingBody = coaching?.body || ''
  const highlights = coaching?.highlights || []
  const [rewriting, setRewriting] = useState(false)
  const [rewriteError, setRewriteError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  const fillerRows = Object.entries(fillerCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([word, count]) => ({
      word,
      count,
      positions: fillerHits.filter(h => h.word === word).map(h => h.timeFormatted),
    }))

  async function handleRewrite() {
    setRewriting(true)
    setRewriteError(null)
    setRewrite(null)
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, coaching: coachingBody }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Server error ${res.status}`)
      }
      const data = await res.json()
      setRewrite(data.rewrite)
      if (savedId) {
        fetch(`/api/speeches/${savedId}/rewrite`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rewrite: data.rewrite }),
        }).catch(() => {})
      }
    } catch (err) {
      setRewriteError(err.message)
    } finally {
      setRewriting(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/speeches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, transcript, metrics, coaching, vocalAnalysis, argumentAnalysis }),
      })
      const data = await res.json()
      if (data.id) onSaved(data.id)
    } catch {
      // fail silently — not critical
    } finally {
      setSaving(false)
    }
  }

  async function handleCopy(text) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="results-wrap">

      <div className="results-topbar">
        {filename && <span className="results-filename">{filename}</span>}
        {!savedId
          ? <button className="ghost-btn" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          : <span className="saved-badge">Saved</span>
        }
      </div>

      <div className="results-metrics">
        <div className="metric">
          <span className="metric-value">{formatDuration(duration)}</span>
          <span className="metric-label">Duration</span>
        </div>
        <div className="metric">
          <span className="metric-value">{wpm} <WpmNote wpm={wpm} /></span>
          <span className="metric-label">Words / min</span>
        </div>
        <div className="metric">
          <span className="metric-value">{totalFillers}</span>
          <span className="metric-label">Filler words</span>
        </div>
        {pitchStats && (
          <div className="metric">
            <span className="metric-value">{pitchStats.mean} <span className="metric-unit">Hz</span></span>
            <span className="metric-label">Avg pitch · {pitchStats.variation}</span>
          </div>
        )}
        {pauses.length > 0 && (
          <div className="metric">
            <span className="metric-value">{pauses.length}</span>
            <span className="metric-label">Pauses · {pauses.filter(p => p.type === 'long').length} long</span>
          </div>
        )}
        {volume && (
          <div className="metric">
            <span className="metric-value">{volume.loudness}</span>
            <span className="metric-label">Volume · {volume.dynamicRange} dB range</span>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        <button className={`tab-btn${tab === 'feedback' ? ' active' : ''}`} onClick={() => setTab('feedback')}>Feedback</button>
        <button className={`tab-btn${tab === 'audio' ? ' active' : ''}`} onClick={() => setTab('audio')}>Audio Analysis</button>
      </div>

      {tab === 'feedback' && (
        <>
          {energyProfile && <p className="energy-note">Energy: {energyProfile}</p>}

          {wpmVariation.length > 1 && (
            <div className="wpm-variation">
              <h2 className="section-label">Speed variation</h2>
              <div className="wpm-bars">
                {wpmVariation.map((w, i) => {
                  const allWpms = wpmVariation.map(x => x.wpm)
                  const max = Math.max(...allWpms)
                  const pct = Math.round((w.wpm / max) * 100)
                  const note = w.wpm < 110 ? 'slow' : w.wpm > 175 ? 'fast' : ''
                  return (
                    <div key={i} className="wpm-bar-row">
                      <span className="wpm-bar-label">{w.window}</span>
                      <div className="wpm-bar-track">
                        <div className={`wpm-bar-fill${note ? ` ${note}` : ''}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="wpm-bar-value">{w.wpm}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {fillerRows.length > 0 && (
            <div className="filler-section">
              <h2 className="section-label">Filler word breakdown</h2>
              <table className="filler-table">
                <thead><tr><th>Word</th><th>Count</th><th>Timestamps</th></tr></thead>
                <tbody>
                  {fillerRows.map(row => (
                    <tr key={row.word}>
                      <td className="filler-word">"{row.word}"</td>
                      <td className="filler-count">×{row.count}</td>
                      <td className="filler-times">{row.positions.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="coaching-section">
            <h2 className="section-label">Coaching</h2>
            <CoachingBlock body={coachingBody} />
          </div>

          {argumentAnalysis && (
            <div className="argument-section">
              <div className="argument-section-head">
                <h2 className="section-label">Argument Structure</h2>
                <span className="cwdai-framework-tag">CWDAI</span>
              </div>
              <p className="cwdai-framework-desc">Claim → Warrant → Data → Analysis → Impact</p>
              <ArgumentBlock data={argumentAnalysis} />
            </div>
          )}
        </>
      )}

      {tab === 'audio' && (
        <AudioTab vocalAnalysis={vocalAnalysis} metrics={metrics} />
      )}

      {tab === 'feedback' && (
        <>
          <div className="transcript-section">
            <h2 className="section-label">Transcript — click highlighted sections for feedback</h2>
            <TranscriptViewer transcript={transcript || ''} highlights={highlights} />
          </div>

          <div className="rewrite-section">
            <div className="rewrite-header">
              <h2 className="section-label">Rewrite</h2>
              {!rewrite && !rewriting && (
                <button className="rewrite-btn" onClick={handleRewrite}>Rewrite with AI suggestions →</button>
              )}
            </div>
            {rewriting && <p className="rewrite-loading">Rewriting…</p>}
            {rewriteError && <p className="upload-error">{rewriteError}</p>}
            {rewrite && (
              <div className="rewrite-result">
                <div className="rewrite-actions">
                  <button className="ghost-btn" onClick={() => handleCopy(rewrite)}>{copied ? 'Copied' : 'Copy'}</button>
                  <button className="ghost-btn" onClick={() => setRewrite(null)}>Regenerate</button>
                </div>
                <div className="rewrite-text">
                  {rewrite.split('\n\n').filter(p => p.trim()).map((p, i) => <p key={i}>{p.trim()}</p>)}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <button className="reset-btn" onClick={onReset}>
        Analyze another speech
      </button>
    </div>
  )
}
