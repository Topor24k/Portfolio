import { useEffect, useRef, useState } from 'react'
import { playHomeGlitchSound, stopGlitchSound } from './soundEffects'

const ROLES = [
  'CREATIVE DEVELOPER',
  'WEB DEVELOPER',
  'GRAPHIC DESIGNER',
  'FICTION WRITER',
]

const GLYPHS = '!/<>-_\\*~01XZ?#&§@[]{}—=+*^'

export default function GlitchRole() {
  const [roleIndex, setRoleIndex] = useState(0)
  const [displayText, setDisplayText] = useState(ROLES[0])
  const [isGlitching, setIsGlitching] = useState(false)
  const roleIndexRef = useRef(0)
  const animFrameRef = useRef(null)
  const roleRef = useRef(null)
  const isVisibleRef = useRef(true)

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      isVisibleRef.current = true
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = Boolean(entry && entry.isIntersecting)
        isVisibleRef.current = visible
        if (!visible) {
          stopGlitchSound()
        }
      },
      { threshold: 0.2 }
    )

    if (roleRef.current) {
      observer.observe(roleRef.current)
    }

    return () => {
      observer.disconnect()
      stopGlitchSound()
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isVisibleRef.current || document.hidden) return
      const prev = roleIndexRef.current
      const next = (prev + 1) % ROLES.length
      roleIndexRef.current = next
      setRoleIndex(next)
      triggerGlitch(ROLES[prev], ROLES[next])
    }, 5000)

    return () => {
      clearInterval(interval)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      stopGlitchSound()
    }
  }, [])

  const triggerGlitch = (fromText, toText) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
    }
    setIsGlitching(true)
    if (isVisibleRef.current && !document.hidden) {
      playHomeGlitchSound()
    }
    const startTime = performance.now()
    const duration = 480 // Cyberpunk scramble & slice duration (480ms)

    const updateFrame = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)

      if (progress < 1) {
        // Resolve characters from left to right as progress increases
        const resolvedCount = Math.floor(progress * toText.length)
        let scrambled = ''

        for (let i = 0; i < toText.length; i++) {
          if (i < resolvedCount) {
            scrambled += toText[i]
          } else if (toText[i] === ' ') {
            scrambled += ' '
          } else {
            scrambled += GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          }
        }

        setDisplayText(scrambled)
        animFrameRef.current = requestAnimationFrame(updateFrame)
      } else {
        setDisplayText(toText)
        setIsGlitching(false)
      }
    }

    animFrameRef.current = requestAnimationFrame(updateFrame)
  }

  const handleManualGlitch = () => {
    if (isGlitching) return
    if (ROLES[roleIndexRef.current] === 'FICTION WRITER') {
      triggerGlitch('FICTION WRITER', 'FICTION WRITER')
      return
    }
    const prev = roleIndexRef.current
    const next = (prev + 1) % ROLES.length
    roleIndexRef.current = next
    setRoleIndex(next)
    triggerGlitch(ROLES[prev], ROLES[next])
  }

  return (
    <p
      ref={roleRef}
      className={`hero-side hero-side-left home-glitch-hero${isGlitching ? ' home-glitch-active' : ''}`}
      data-text={displayText}
      aria-label={ROLES[roleIndex]}
      onClick={handleManualGlitch}
      style={{ cursor: 'pointer' }}
      title="Click to glitch role"
    >
      <span className="glitch-text-inner home-glitch-text" data-text={displayText}>{displayText}</span>
    </p>
  )
}
