import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { INTRO_DURATION, INTRO_WORDS, introFrame } from './introTimeline'
import { createIntroStage } from './introStage'
import HeroField from './motion/HeroField'
import './opening-intro.css'

const NAME = 'KAYEEN M. CAMPAÑA'
const CHAPTERS = ['Ideas', 'Design', 'Code', 'Kayeen']
const SCRAMBLE = '01<>/{}[]=+*#&$;:'
const EXPO = 'cubic-bezier(.16, 1, .3, 1)'
const SPRING = 'cubic-bezier(.34, 1.56, .64, 1)'

// Deterministic scatter so the name assembles the same way on every visit.
const scatter = [...NAME].map((_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453
  const b = Math.sin(i * 78.233) * 12345.6789
  const r1 = a - Math.floor(a), r2 = b - Math.floor(b)
  return { x: (r1 - 0.5) * 900, y: (r2 - 0.5) * 520, r: (r1 - r2) * 120 }
})

const chars = (text, className) => [...text].map((char, i) => (
  <span className={className} style={{ '--i': i }} key={i}>{char === ' ' ? ' ' : char}</span>
))

const timecode = (seconds) => {
  const whole = Math.floor(seconds)
  const frames = Math.floor((seconds - whole) * 30)
  return `00:${String(whole).padStart(2, '0')}:${String(frames).padStart(2, '0')}`
}

export default function OpeningIntro({ soundOn, onSoundChange, onComplete, isLight = false }) {
  const dialogRef = useRef(null)
  const audioRef = useRef(null)
  const startRef = useRef(null)
  const canvasRef = useRef(null)
  const timecodeRef = useRef(null)
  const hudRef = useRef(null)
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
    // Every animation is created paused and scrubbed to the audio clock each frame.
    const track = (el, frames, duration, delay = 0, fill = 'both') => {
      const animation = el.animate(frames, { duration, delay, fill, easing: 'linear' })
      animation.pause()
      animation.currentTime = 0
      animations.current.push(animation)
    }
    const add = (selector, frames, duration, delay, fill) => {
      const el = dialog.querySelector(selector)
      if (el) track(el, frames, duration, delay, fill)
    }
    const addEach = (selector, build) => {
      dialog.querySelectorAll(selector).forEach((el, i) => {
        const [frames, duration, delay, fill] = build(i)
        track(el, frames, duration, delay, fill)
      })
    }
    const ms = (seconds) => Math.round(seconds * 1000)
    const glitch = (selector, at) => add(selector, [
      { textShadow: '-14px 0 rgb(0 240 255 / 85%), 14px 0 rgb(255 0 85 / 85%)', transform: 'translateX(6px) skewX(-8deg)' },
      { textShadow: '6px 0 rgb(0 240 255 / 60%), -6px 0 rgb(255 0 85 / 60%)', transform: 'translateX(-4px) skewX(4deg)', offset: .35 },
      { textShadow: '0 0 transparent, 0 0 transparent', transform: 'none' },
    ], 360, ms(at), 'forwards')

    INTRO_WORDS.forEach((cue, index) => {
      const length = ms(cue.end - cue.start)
      add(`[data-word="${index}"]`, [
        { opacity: 0, transform: 'scale(1)', filter: 'blur(0)', offset: 0 },
        { opacity: 1, transform: 'scale(1)', filter: 'blur(0)', offset: .005 },
        { opacity: 1, transform: 'scale(1)', filter: 'blur(0)', offset: .84, easing: 'cubic-bezier(.7,0,.84,0)' },
        { opacity: 0, transform: 'scale(1.12)', filter: 'blur(10px)', offset: 1 },
      ], length, ms(cue.start))
      add(`[data-word="${index}"] .intro-word-caption`, [
        { clipPath: 'inset(0 100% 0 0)', easing: EXPO }, { clipPath: 'inset(0 0% 0 0)' },
      ], 600, ms(cue.start) + 260)
    })

    // IDEAS — letters rise out of their masks.
    addEach('[data-word="0"] .intro-char', (i) => [[
      { transform: 'translateY(110%) rotate(9deg)', easing: EXPO }, { transform: 'none' },
    ], 820, 40 + i * 48])
    glitch('[data-word="0"] strong', .53)

    // DESIGN — glyphs spring open on the big hit while construction lines draw themselves.
    addEach('[data-word="1"] .intro-char', (i) => [[
      { transform: 'scale(0) rotate(-70deg)', opacity: 0, easing: SPRING }, { transform: 'none', opacity: 1 },
    ], 620, ms(1.52) + i * 32])
    addEach('[data-word="1"] .intro-guides > *', (i) => [[
      { strokeDashoffset: 1, easing: EXPO }, { strokeDashoffset: 0 },
    ], 700, ms(1.57) + i * 55])
    glitch('[data-word="1"] strong', 1.57)

    // CODE — brackets slam in from the sides; the letters decode (see tick).
    add('[data-word="2"] .intro-bracket--open', [{ transform: 'translateX(-40vw)', opacity: 0, easing: EXPO }, { transform: 'none', opacity: 1 }], 520, ms(2.66))
    add('[data-word="2"] .intro-bracket--close', [{ transform: 'translateX(40vw)', opacity: 0, easing: EXPO }, { transform: 'none', opacity: 1 }], 520, ms(2.66))
    addEach('[data-word="2"] .intro-char', (i) => [[{ opacity: 0 }, { opacity: 1 }], 120, ms(2.69) + i * 40])
    glitch('[data-word="2"] strong', 2.7)
    glitch('[data-word="2"] strong', 3.17)

    // KAYEEN — the name assembles from scattered glyphs into the exact Home layout.
    add('.intro-final', [
      { opacity: 1, offset: 0 }, { opacity: 1, offset: .85 }, { opacity: 0, offset: 1 },
    ], 3530, 3980)
    addEach('.intro-name-char', (i) => [[
      { opacity: 0, transform: `translate(${scatter[i].x}px, ${scatter[i].y}px) rotate(${scatter[i].r}deg) scale(.35)`, filter: 'blur(14px)', easing: EXPO },
      { opacity: 1, transform: 'none', filter: 'blur(0)' },
    ], 1050, 3980 + i * 26])
    add('.intro-final .hero-side-left', [{ opacity: 0, transform: 'translateY(12px)', easing: EXPO }, { opacity: 1, transform: 'none' }], 700, 4620)
    add('.intro-final .hero-side-right', [{ opacity: 0, transform: 'translateY(-12px)', easing: EXPO }, { opacity: 1, transform: 'none' }], 700, 4740)
    add('.intro-name-line', [
      { transform: 'scaleX(0)', transformOrigin: '0 50%', offset: 0, easing: 'cubic-bezier(.83,0,.17,1)' },
      { transform: 'scaleX(1)', transformOrigin: '0 50%', offset: .4 },
      { transform: 'scaleX(1)', transformOrigin: '100% 50%', offset: .41 },
      { transform: 'scaleX(1)', transformOrigin: '100% 50%', offset: .62, easing: 'cubic-bezier(.83,0,.17,1)' },
      { transform: 'scaleX(0)', transformOrigin: '100% 50%', offset: 1 },
    ], 1300, 4380)

    add('.intro-progress i', [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], ms(INTRO_DURATION))
    add('.intro-hud', [{ opacity: 1 }, { opacity: 0 }], 700, 5200)
    add('.intro-registration', [{ opacity: .7 }, { opacity: 0 }], 600, 4200)
    add('.intro-background', [{ opacity: 1 }, { opacity: 0 }], 1250, 5900)

    const stage = createIntroStage(canvasRef.current)
    const codeChars = [...dialog.querySelectorAll('[data-word="2"] .intro-char')]
    const codeText = INTRO_WORDS[2].word
    let lastTimecode = '', lastChapter = -1, lastScramble = -1

    const render = (elapsed, chapter) => {
      stage?.draw(elapsed)
      const code = timecode(elapsed)
      if (code !== lastTimecode) { timecodeRef.current.textContent = code; lastTimecode = code }
      if (chapter !== lastChapter) { hudRef.current.dataset.chapter = chapter; lastChapter = chapter }
      const tick = Math.floor(elapsed * 24)
      if (tick !== lastScramble) {
        lastScramble = tick
        codeChars.forEach((el, i) => {
          const resolved = elapsed >= 2.78 + i * 0.1
          el.textContent = resolved ? codeText[i] : SCRAMBLE[(tick + i * 5) % SCRAMBLE.length]
        })
      }
    }

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
        render(frame.elapsed, frame.chapter)
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
    const onResize = () => stage?.resize()
    frameId = requestAnimationFrame(tick)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(frameId)
      animations.current.forEach((animation) => animation.cancel())
      animations.current = []
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('resize', onResize)
    }
  }, [running])

  return <dialog ref={dialogRef} className={`opening-intro${running ? ' is-running' : ''}`} aria-label="Welcome to Kayeen Devspace"
    onCancel={(event) => { event.preventDefault(); finish() }}>
    <audio ref={audioRef} src="/Sound%20Effects/Intro%20Opening.wav" preload="auto" onError={silentFallback} />
    <div className="intro-background" aria-hidden="true" />
    {!running && <HeroField active isLight={isLight} />}
    <canvas ref={canvasRef} className="intro-stage" aria-hidden="true" hidden={!running} />
    <div className="intro-registration" aria-hidden="true"><i /><i /><i /><i /><span /></div>

    <div className="intro-cover" hidden={running}>
      <div className="intro-meta intro-meta--top" aria-hidden="true">
        <span>KC / Devspace</span>
        <span>Portfolio — 2026</span>
      </div>
      <p className="intro-kicker"><span aria-hidden="true" />Creative developer · Davao City, PH</p>
      <h1 aria-label="Kayeen Devspace">
        <span className="intro-cover-line" aria-hidden="true">{chars('KAYEEN', 'intro-cover-char')}</span>{' '}
        <span className="intro-cover-line intro-cover-accent" aria-hidden="true">{chars('DEVSPACE', 'intro-cover-char')}</span>
      </h1>
      <div className="intro-actions">
        <button ref={startRef} className="intro-enter" type="button" data-magnetic="0.3" onClick={start}>
          Enter Devspace <span aria-hidden="true">↗</span>
        </button>
        <button className="intro-sound" type="button" aria-pressed={soundOn} onClick={() => onSoundChange?.(!soundOn)}>
          <span className={`intro-sound-bars${soundOn ? ' is-on' : ''}`} aria-hidden="true"><i /><i /><i /><i /></span>
          Sound {soundOn ? 'on' : 'off'}
        </button>
      </div>
      <div className="intro-meta intro-meta--bottom" aria-hidden="true">
        <span>Best experienced with sound</span>
        <span>Press Enter ↵</span>
      </div>
    </div>

    <div className="intro-sequence" aria-hidden="true" hidden={!running}>
      <div className="intro-hud" ref={hudRef} data-chapter="0">
        <p className="intro-timecode"><span>TC</span> <b ref={timecodeRef}>00:00:00</b></p>
        <ol className="intro-chapters">{CHAPTERS.map((label, i) => <li key={label}><span>0{i + 1}</span>{label}</li>)}</ol>
        <div className="intro-progress"><i /></div>
      </div>

      {INTRO_WORDS.map((cue, index) => <div key={cue.word} className={`intro-word intro-word--${index}`} data-word={index}>
        {index === 1 && <svg className="intro-guides" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
          <line x1="0" y1="190" x2="1000" y2="190" pathLength="1" />
          <line x1="0" y1="410" x2="1000" y2="410" pathLength="1" />
          <line x1="250" y1="0" x2="250" y2="600" pathLength="1" />
          <line x1="750" y1="0" x2="750" y2="600" pathLength="1" />
          <circle cx="500" cy="300" r="250" pathLength="1" />
          <circle cx="500" cy="300" r="140" pathLength="1" />
          <line x1="0" y1="600" x2="1000" y2="0" pathLength="1" />
          <rect x="250" y="190" width="500" height="220" pathLength="1" />
        </svg>}
        <strong>
          {index === 2 && <span className="intro-bracket intro-bracket--open">&lt;</span>}
          {[...cue.word].map((char, i) => <span className="intro-char-mask" key={i}><span className="intro-char">{char}</span></span>)}
          {index === 2 && <span className="intro-bracket intro-bracket--close">/&gt;</span>}
        </strong>
        <span className="intro-word-caption">{cue.caption}</span>
      </div>)}

      <div className="hero intro-final"><div className="hero-title-wrapper">
        <p className="hero-side hero-side-left">CREATIVE DEVELOPER</p>
        <h1>{NAME.split(' ').map((word, w) => <span className="name-word" key={w}>{w > 0 && ' '}{[...word].map((char, c) => (
          <span className={`intro-name-char w${w}`} key={c}>{char}</span>
        ))}</span>)}</h1>
        <span className="intro-name-line" />
        <p className="hero-side hero-side-right">DAVAO CITY, PHILIPPINES.</p>
      </div></div>
    </div>
    <p className="intro-sr-only" role="status">{soundUnavailable ? 'Audio unavailable. The opening will continue without sound.' : running ? 'Opening playing.' : 'Choose Enter Devspace to play the opening.'}</p>
  </dialog>
}
