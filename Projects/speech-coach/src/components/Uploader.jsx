import { useState, useRef } from 'react'

const ACCEPTED = '.mp3,.mp4,.m4a,.webm,.wav,.ogg,.mpeg,.mpga,.mov'

export default function Uploader({ onFile, error }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  function handleChange(e) {
    const file = e.target.files[0]
    if (file) onFile(file)
  }

  return (
    <div className="uploader-wrap">
      <div className="uploader-intro">
        <p className="uploader-lead">Upload a recording of your speech.</p>
        <p className="uploader-sub">
          You'll get back integrated feedback on your delivery and content — pacing, filler words with exact timestamps, argument structure, and word choice — written like a coach, not a rubric.
        </p>
      </div>

      <button
        className={`drop-zone${dragging ? ' dragging' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        aria-label="Upload audio or video file"
      >
        <span className="drop-icon" aria-hidden="true">↑</span>
        <span className="drop-label">Drop file here or click to browse</span>
        <span className="drop-formats">mp3, mp4, m4a, mov, webm, wav, ogg · audio extracted from video automatically</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleChange}
        className="visually-hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {error && (
        <p className="upload-error" role="alert">{error}</p>
      )}
    </div>
  )
}
