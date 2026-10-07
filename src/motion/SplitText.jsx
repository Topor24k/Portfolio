import { useEffect, useRef } from 'react'
import { clamp, onFrame } from './engine'

// Splits a line into masked glyphs; the parent (or itself) receives .is-revealed.
export function SplitText({ text, as: Tag = 'span', className = '', reveal = true, delay = 0, ...rest }) {
  let index = 0
  const words = text.split(' ')
  return (
    <Tag
      className={`split-text ${className}`.trim()}
      data-reveal={reveal ? 'split' : undefined}
      style={{ '--reveal-delay': `${delay}ms` }}
      {...rest}
    >
      <span className="kc-sr-only">{text}</span>
      {words.map((word, w) => (
        <span className="split-word" aria-hidden="true" key={`${word}-${w}`}>
          {[...word].map((char) => (
            <span className="split-mask" key={index}>
              <span className="split-char" style={{ '--i': index++ }}>{char}</span>
            </span>
          ))}
          {w < words.length - 1 && ' '}
        </span>
      ))}
    </Tag>
  )
}

// A paragraph whose words light up in reading order as it scrolls through the viewport.
export function ScrubText({ text, accent = [], as: Tag = 'p', className = '' }) {
  const ref = useRef(null)
  const words = text.split(' ')

  useEffect(() => {
    const el = ref.current
    const spans = [...el.querySelectorAll('.scrub-word')]
    let visible = false
    let last = -1
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
    observer.observe(el)
    const stop = onFrame(() => {
      if (!visible) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const progress = clamp((vh * 0.85 - rect.top) / (rect.height + vh * 0.45), 0, 1)
      if (Math.abs(progress - last) < 0.001) return
      last = progress
      const lit = progress * (spans.length + 3)
      spans.forEach((span, i) => span.style.setProperty('--lit', clamp(lit - i, 0, 1).toFixed(2)))
    })
    return () => { stop(); observer.disconnect() }
  }, [text])

  return (
    <Tag ref={ref} className={`scrub-text ${className}`.trim()}>
      <span className="kc-sr-only">{text}</span>
      {words.map((word, i) => (
        <span aria-hidden="true" key={i}>
          <span className={`scrub-word${accent.includes(i) ? ' is-accent' : ''}`}>{word}</span>{' '}
        </span>
      ))}
    </Tag>
  )
}

export function Roll({ children }) {
  return <span className="roll"><span>{children}</span><span aria-hidden="true">{children}</span></span>
}
