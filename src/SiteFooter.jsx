import { useEffect, useRef, useState } from 'react'
import { playFooterGlitchSound, stopGlitchSound } from './soundEffects'
import './site-footer.css'

const GLYPHS = '!/<>-_\\*~01XZ?#&§@[]{}—=+*^'
const FOOTER_TEXTS = [
  'KAYEEN DEVSPACE',
  'REACH OUT',
  'OPEN A CONVERSATION'
]

export default function SiteFooter({ currentView = 'home' }) {
  const [textIndex, setTextIndex] = useState(0)
  const [displayText, setDisplayText] = useState(FOOTER_TEXTS[0])
  const [isGlitching, setIsGlitching] = useState(false)
  const textIndexRef = useRef(0)
  const animFrameRef = useRef(null)
  const wordmarkRef = useRef(null)
  const isFullFrameRef = useRef(false)

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      isFullFrameRef.current = false
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          isFullFrameRef.current = false
          return
        }
        // Strict full frame: the wordmark itself must be at least 85% visible in the viewport
        const isFull = Boolean(entry.isIntersecting && entry.intersectionRatio >= 0.85)
        isFullFrameRef.current = isFull
        if (!isFull) {
          stopGlitchSound()
        }
      },
      { threshold: [0, 0.5, 0.85, 1.0] }
    )

    if (wordmarkRef.current) {
      observer.observe(wordmarkRef.current)
    }

    return () => {
      observer.disconnect()
      stopGlitchSound()
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isFullFrameRef.current || document.hidden) return
      const prev = textIndexRef.current
      const next = (prev + 1) % FOOTER_TEXTS.length
      textIndexRef.current = next
      setTextIndex(next)
      triggerGlitch(FOOTER_TEXTS[prev], FOOTER_TEXTS[next])
    }, 4000)

    return () => {
      clearInterval(interval)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      stopGlitchSound()
    }
  }, [currentView])

  const triggerGlitch = (fromText, toText) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
    }
    setIsGlitching(true)
    if (isFullFrameRef.current) {
      playFooterGlitchSound(true)
    }
    const startTime = performance.now()
    const duration = 480 

    const updateFrame = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)

      if (progress < 1) {
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
    <footer className="site-footer" aria-labelledby="footer-wordmark">
      <div className="footer-master-container">
        <div className="footer-wordmark-wrap">
          <h2 
            ref={wordmarkRef}
            className={`footer-wordmark footer-glitch-wordmark${isGlitching ? ' footer-glitch-active' : ''}`} 
            id="footer-wordmark" 
            data-text={displayText}
            aria-label={FOOTER_TEXTS[textIndex]}
          >
            <span className="footer-glitch-text" data-text={displayText}>{displayText}</span>
          </h2>
        </div>
      </div>
    </footer>
  )
}
