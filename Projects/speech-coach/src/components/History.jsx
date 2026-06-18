import { useState, useEffect } from 'react'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDuration(seconds) {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function preview(body) {
  if (!body) return ''
  return body.replace(/^problem\s+\d+:\s*/im, '').split('\n')[0].slice(0, 100)
}

export default function History({ onLoad }) {
  const [speeches, setSpeeches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    fetch('/api/speeches', { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setSpeeches(data)
      })
      .catch(err => {
        setError(err.name === 'AbortError' ? 'Server took too long — check MongoDB connection in your terminal.' : err.message)
      })
      .finally(() => { clearTimeout(timeout); setLoading(false) })
  }, [])

  async function handleLoad(id) {
    const res = await fetch(`/api/speeches/${id}`)
    const speech = await res.json()
    onLoad(speech)
  }

  async function handleDelete(id, e) {
    e.stopPropagation()
    setDeleting(id)
    await fetch(`/api/speeches/${id}`, { method: 'DELETE' })
    setSpeeches(prev => prev.filter(s => s._id !== id))
    setDeleting(null)
  }

  if (loading) return <p className="history-empty">Loading…</p>
  if (error) return <p className="upload-error">{error}</p>

  if (speeches.length === 0) {
    return (
      <div className="history-empty-wrap">
        <p className="history-empty">No saved speeches yet.</p>
        <p className="history-sub">Analyze a speech and hit Save to store it here.</p>
      </div>
    )
  }

  return (
    <div className="history-wrap">
      <ol className="history-list">
        {speeches.map(s => (
          <li key={s._id} className="history-item" onClick={() => handleLoad(s._id)}>
            <div className="history-item-inner">
              <div className="history-meta">
                <span className="history-date">{formatDate(s.createdAt)}</span>
                <span className="history-stats">
                  {formatDuration(s.metrics?.duration)} · {s.metrics?.wpm || '—'} WPM · {s.metrics?.totalFillers || 0} fillers
                </span>
              </div>
              {s.filename && <p className="history-filename">{s.filename}</p>}
              <p className="history-preview">{preview(s.coaching?.body)}</p>
            </div>
            <button
              className="history-delete"
              onClick={e => handleDelete(s._id, e)}
              disabled={deleting === s._id}
              aria-label="Delete"
            >
              {deleting === s._id ? 'Deleting…' : 'Delete'}
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
