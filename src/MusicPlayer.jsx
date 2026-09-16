import { useEffect, useRef, useState } from 'react'
import { readAudioPreference, saveAudioPreference } from './audioPreferences'
import './music-player.css'

const MUSIC = '/Background%20Music/Background%20Music%20For%20the%20Whole%20Website.mp3'

export default function MusicPlayer({ active, musicOn, onMusicToggle, showEffectsControl, soundOn, onSoundChange }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [status, setStatus] = useState('idle')

  const playAudio = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = 0.55
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setPlaying(true)
          setStatus('ready')
        })
        .catch((error) => {
          console.warn('Playback waiting for user interaction:', error)
          setPlaying(false)
          setStatus(error.name === 'NotAllowedError' ? 'blocked' : 'error')
        })
    }
  }

  const pauseAudio = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    setPlaying(false)
    setStatus('paused')
  }

  const handleToggle = () => {
    if (onMusicToggle) {
      onMusicToggle()
    } else {
      const audio = audioRef.current
      if (!audio) return
      if (!audio.paused) {
        pauseAudio()
        saveAudioPreference('music', false)
      } else {
        saveAudioPreference('music', true)
        playAudio()
      }
    }
  }

  // React to active view or musicOn changes
  useEffect(() => {
    const isWanted = musicOn !== undefined ? musicOn : readAudioPreference('music')
    if (!active || !isWanted) {
      pauseAudio()
    } else if (active && isWanted) {
      playAudio()
    }
  }, [active, musicOn])

  // Handle global unlock on first user gesture if browser blocked un-gestured autoplay
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const tryUnlock = () => {
      const isWanted = musicOn !== undefined ? musicOn : readAudioPreference('music')
      if (active && isWanted && audio.paused) {
        playAudio()
      }
    }

    window.addEventListener('pointerdown', tryUnlock, { passive: true })
    window.addEventListener('keydown', tryUnlock, { passive: true })
    window.addEventListener('click', tryUnlock, { passive: true })

    const onVisibilityChange = () => {
      const isWanted = musicOn !== undefined ? musicOn : readAudioPreference('music')
      if (document.hidden) {
        audio.pause()
      } else if (active && isWanted) {
        playAudio()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    const handlePlay = () => setPlaying(true)
    const handlePause = () => setPlaying(false)
    const handleError = () => {
      setStatus('error')
      setPlaying(false)
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('pointerdown', tryUnlock)
      window.removeEventListener('keydown', tryUnlock)
      window.removeEventListener('click', tryUnlock)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('error', handleError)
    }
  }, [active, musicOn])

  return (
    <aside className={`music-player${playing ? ' is-playing' : ''}`} hidden={!active} aria-label="Audio controls">
      <audio ref={audioRef} src={MUSIC} loop preload="auto" />
      <div className="music-control-group">
        <button
          type="button"
          className="music-toggle"
          onClick={handleToggle}
          aria-pressed={playing}
          aria-label={playing ? 'Turn background music off' : 'Turn background music on'}
        >
          <span className="music-waveform" aria-hidden="true">
            {Array.from({ length: 9 }, (_, index) => (
              <i key={index} />
            ))}
          </span>
        </button>
      </div>
      {showEffectsControl && (
        <button
          className="music-effects-toggle sound-toggle-btn"
          type="button"
          aria-pressed={soundOn}
          aria-label={soundOn ? 'Turn sound effects off' : 'Turn sound effects on'}
          onClick={() => onSoundChange?.(!soundOn)}
        >
          SFX: {soundOn ? 'ON' : 'OFF'}
        </button>
      )}
      <span className="music-status" role="status">
        {status === 'error' ? 'Music unavailable. Tap to retry.' : status === 'blocked' && active ? 'Tap MUSIC to play.' : ''}
      </span>
    </aside>
  )
}
