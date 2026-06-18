import { useState, useEffect } from 'react'
import Uploader from './components/Uploader.jsx'
import Processing from './components/Processing.jsx'
import Results from './components/Results.jsx'
import History from './components/History.jsx'

export default function App() {
  const [view, setView] = useState('home') // home | analyzing | results | history
  const [stage, setStage] = useState('idle')
  const [result, setResult] = useState(null)
  const [savedId, setSavedId] = useState(null)
  const [error, setError] = useState(null)

  async function handleFile(file) {
    setError(null)
    setSavedId(null)
    setView('analyzing')
    setStage('uploading')

    const formData = new FormData()
    formData.append('audio', file)

    try {
      setStage('transcribing')
      const res = await fetch('/api/analyze', { method: 'POST', body: formData })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Server error ${res.status}`)
      }

      setStage('analyzing')
      await new Promise(r => setTimeout(r, 600))

      const data = await res.json()
      setResult({ ...data, filename: file.name })
      setView('results')
    } catch (err) {
      setError(err.message || 'Something went wrong. Check your API keys and try again.')
      setView('home')
      setStage('idle')
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('sc-theme') || 'dark'
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('sc-theme', next)
  }

  function reset() {
    setView('home')
    setStage('idle')
    setResult(null)
    setSavedId(null)
    setError(null)
  }

  function loadSavedSpeech(speech) {
    setResult({ ...speech, filename: speech.filename || 'Saved speech' })
    setSavedId(speech._id)
    setView('results')
  }

  return (
    <div className="app">
      <header className="app-header">
        <a href="../.." className="back-link">← Yash Upadhyay</a>
        <h1 className="app-title" onClick={reset} style={{ cursor: 'pointer' }}>Speech Coach</h1>
        <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle light/dark mode">
          <span className="theme-toggle-icon" aria-hidden="true" />
        </button>
        <button
          className={`nav-btn${view === 'history' ? ' active' : ''}`}
          onClick={() => view === 'history' ? reset() : setView('history')}
        >
          {view === 'history' ? 'New analysis' : 'History'}
        </button>
      </header>

      <main className="app-main">
        {view === 'home' && (
          <Uploader onFile={handleFile} error={error} />
        )}
        {view === 'analyzing' && (
          <Processing stage={stage} />
        )}
        {view === 'results' && result && (
          <Results result={result} savedId={savedId} onSaved={setSavedId} onReset={reset} />
        )}
        {view === 'history' && (
          <History onLoad={loadSavedSpeech} />
        )}
      </main>
    </div>
  )
}
