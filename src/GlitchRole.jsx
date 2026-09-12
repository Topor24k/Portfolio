import { useEffect, useRef, useState } from 'react'
import { playGlitchSound } from './soundEffects'

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
  const animFrameRef = useRef(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % ROLES.length
        triggerGlitch(ROLES[prevIndex], ROLES[nextIndex])
        return nextIndex
      })
    }, 3000)

    return () => {
      clearInterval(interval)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  const triggerGlitch = (fromText, toText) => {
    setIsGlitching(true)
    if (!document.hidden) {
      playGlitchSound()
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

  return (
    <p
      className={`hero-side hero-side-left${isGlitching ? ' is-glitching' : ''}`}
      data-text={displayText}
      aria-label={ROLES[roleIndex]}
    >
      <span className="glitch-text-inner">{displayText}</span>
    </p>
  )
}
