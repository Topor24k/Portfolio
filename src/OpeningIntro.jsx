import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { INTRO_DURATION, INTRO_WORDS, introFrame } from './introTimeline'
import './opening-intro.css'

export default function OpeningIntro({ soundOn, onSoundChange, onComplete }) {
  const dialogRef = useRef(null)
  const audioRef = useRef(null)
  const startRef = useRef(null)
  const animations = useRef([])
  const clock = useRef({ mode: 'idle', elapsed: 0, previous: 0, stalled: 0 })
  const finished = useRef(false)
  const completeRef = useRef(onComplete)
  const [running, setRunning] = useState(false)
  const [soundUnavailable, setSoundUnavailable] = useState(false)
  const [reduced, setReduced] = useState(false)
  completeRef.current = onComplete

  const finish = () => {
    if (finished.current) return
    finished.current = true
    audioRef.current?.pause()
    dialogRef.current?.close()
    completeRef.current()
  }

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    const audio = audioRef.current
    finished.current = false
    dialog.showModal()
    startRef.current?.focus({ preventScroll: true })
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => {
      setReduced(media.matches)
      if (media.matches && clock.current.mode !== 'idle') finish()
    }
    updateMotion()
    media.addEventListener('change', updateMotion)
    return () => {
      finished.current = true
      audio.pause()
      document.body.style.overflow = previousOverflow
      media.removeEventListener('change', updateMotion)
      dialog.close()
    }
  }, [])

  useEffect(() => { audioRef.current.muted = !soundOn }, [soundOn])

  const silentFallback = () => {
    if (finished.current || clock.current.mode === 'idle') return
    audioRef.current.pause()
    clock.current.mode = 'silent'
    clock.current.previous = performance.now()
    setSoundUnavailable(true)
  }

  const start = () => {
    if (clock.current.mode !== 'idle') return
    if (reduced) { finish(); return }
    clock.current = { mode: 'pending', elapsed: 0, previous: performance.now(), stalled: 0 }
    setRunning(true)
    const audio = audioRef.current
    audio.volume = .65
    audio.muted = !soundOn
    audio.play().then(() => {
      if (finished.current || clock.current.mode !== 'pending') { audio.pause(); return }
      clock.current.mode = 'audio'
      if (document.hidden) audio.pause()
    }).catch(silentFallback)
  }

  useLayoutEffect(() => {
    if (!running) return
    const dialog = dialogRef.current
    const add = (selector, frames, duration, delay = 0) => {
      const el = dialog.querySelector(selector)
      if (!el) return
      const animation = el.animate(frames, { duration, delay, fill: 'both', easing: 'linear' })
      animation.pause()
      animation.currentTime = 0
      animations.current.push(animation)
    }

    INTRO_WORDS.forEach((cue, index) => {
      add(`[data-word="${index}"]`, [
        { opacity: 0, transform: 'translateY(32%)', clipPath: 'inset(100% 0 0)', offset: 0 },
        { opacity: 1, transform: 'translateY(0)', clipPath: 'inset(0)', offset: .18, easing: 'cubic-bezier(.2,.8,.2,1)' },
        { opacity: 1, transform: 'translateY(0)', clipPath: 'inset(0)', offset: .81 },
        { opacity: 0, transform: 'translateY(-24%)', clipPath: 'inset(0 0 100%)', offset: 1 },
      ], (cue.end - cue.start) * 1000, cue.start * 1000)
    })
    add('.intro-final', [
      { opacity: 0, transform: 'translateY(20px)', offset: 0 },
      { opacity: 1, transform: 'translateY(0)', offset: .2 },
      { opacity: 1, transform: 'translateY(0)', offset: .85 },
      { opacity: 0, transform: 'translateY(0)', offset: 1 },
    ], 3530, 3980)
    add('.intro-registration', [{ opacity: .7 }, { opacity: 0 }], 600, 4200)
    add('.intro-background', [{ opacity: 1 }, { opacity: 0 }], 1250, 5900)

    let frameId
    const tick = (now) => {
      if (finished.current) return
      const state = clock.current
      const delta = Math.max(0, (now - state.previous) / 1000)
      state.previous = now
      if (!document.hidden) {
        if (state.mode === 'audio') {
          const next = audioRef.current.currentTime
          state.stalled = next > state.elapsed ? 0 : state.stalled + delta
          state.elapsed = next
          if (audioRef.current.ended) state.elapsed = INTRO_DURATION
        } else if (state.mode === 'silent') state.elapsed += Math.min(delta, .1)
        else state.stalled += delta
        // Network errors and interrupted playback must never trap a visitor.
        if (state.stalled > 3 && state.mode !== 'silent') silentFallback()
        const frame = introFrame(state.elapsed)
        animations.current.forEach((animation) => { animation.currentTime = frame.elapsed * 1000 })
        if (frame.done) { finish(); return }
      }
      frameId = requestAnimationFrame(tick)
    }
    const onVisibilityChange = () => {
      clock.current.previous = performance.now()
      if (clock.current.mode !== 'audio') return
      if (document.hidden) audioRef.current.pause()
      else audioRef.current.play().catch(silentFallback)
    }
    frameId = requestAnimationFrame(tick)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      cancelAnimationFrame(frameId)
      animations.current.forEach((animation) => animation.cancel())
      animations.current = []
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [running])

  return <dialog ref={dialogRef} className={`opening-intro${running ? ' is-running' : ''}`} aria-label="Welcome to Kayeen Devspace"
    onCancel={(event) => { event.preventDefault(); finish() }}>
    <audio ref={audioRef} src="/Sound%20Effects/Intro%20Opening.wav" preload="auto" onError={silentFallback} />
    <div className="intro-background" aria-hidden="true" />
    <div className="intro-registration" aria-hidden="true"><i /><i /><i /><i /><span /></div>

    <div className="intro-cover" hidden={running}>
      <h1>KAYEEN <span>DEVSPACE</span></h1>
      <button ref={startRef} className="intro-enter" type="button" onClick={start}>Enter Devspace <span aria-hidden="true">↗</span></button>
    </div>

    <div className="intro-sequence" aria-hidden="true" hidden={!running}>
      {INTRO_WORDS.map((cue, index) => <div key={cue.word} className="intro-word" data-word={index}>
        <strong>{cue.word}</strong><span className="intro-word-caption">{cue.caption}</span>
      </div>)}
      <div className="hero intro-final"><div className="hero-title-wrapper">
        <p className="hero-side hero-side-left">CREATIVE DEVELOPER</p>
        <h1>KAYEEN M. CAMPAÑA</h1>
        <p className="hero-side hero-side-right">DAVAO CITY, PHILIPPINES.</p>
      </div></div>
    </div>
    <p className="intro-sr-only" role="status">{soundUnavailable ? 'Audio unavailable. The opening will continue without sound.' : running ? 'Opening playing.' : 'Choose Enter Devspace to play the opening.'}</p>
  </dialog>
}
