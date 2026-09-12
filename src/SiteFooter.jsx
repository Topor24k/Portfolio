import { useEffect, useRef, useState } from 'react'
import './site-footer.css'

const GLYPHS = '!/<>-_\\*~01XZ?#&§@[]{}—=+*^'
const FOOTER_TEXTS = [
  'KAYEEN DEVSPACE',
  'REACH OUT',
  'OPEN A CONVERSATION'
]

export default function SiteFooter() {
  const [textIndex, setTextIndex] = useState(0)
  const [displayText, setDisplayText] = useState(FOOTER_TEXTS[0])
  const [isGlitching, setIsGlitching] = useState(false)
  const animFrameRef = useRef(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % FOOTER_TEXTS.length
        triggerGlitch(FOOTER_TEXTS[prevIndex], FOOTER_TEXTS[nextIndex])
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
            className={`footer-wordmark${isGlitching ? ' is-glitching' : ''}`} 
            id="footer-wordmark" 
            data-text={displayText}
          >
            {displayText}
          </h2>
        </div>
      </div>
    </footer>
  )
}
