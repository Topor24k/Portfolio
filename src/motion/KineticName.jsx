import { useEffect, useRef, useState } from 'react'
import { lerp, motion, onFrame } from './engine'

let heroMounted = false

// The hero name, letter by letter: glyphs near the pointer lift, stretch and heat up.
export default function KineticName({ text }) {
  const ref = useRef(null)
  // The first mount sits under the opening intro, which hands off to this exact layout,
  // so only later visits (navigating back home) play the entrance.
  const [entering] = useState(() => { const again = heroMounted; heroMounted = true; return again })

  useEffect(() => {
    const root = ref.current
    const letters = [...root.querySelectorAll('.kinetic-char')].map((el) => ({ el, cx: 0, cy: 0, y: 0, s: 1, k: 0 }))
    let fontSize = 100

    const measure = () => {
      fontSize = parseFloat(getComputedStyle(root).fontSize) || 100
      letters.forEach((letter) => {
        const rect = letter.el.getBoundingClientRect()
        letter.cx = rect.left + rect.width / 2 + window.scrollX
        letter.cy = rect.top + rect.height / 2 - letter.y + window.scrollY
      })
    }
    const settle = window.setTimeout(measure, entering ? 1400 : 60)
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    document.fonts?.ready.then(measure)

    const stop = onFrame(() => {
      if (motion.reduced || !motion.finePointer) return
      const px = motion.pointerX + window.scrollX
      const py = motion.pointerY + window.scrollY
      const radius = fontSize * 2.2
      letters.forEach((letter) => {
        const distance = Math.hypot(px - letter.cx, py - letter.cy)
        const falloff = motion.pointerActive ? Math.max(0, 1 - distance / radius) : 0
        const force = falloff * falloff * (3 - 2 * falloff)
        const y = lerp(letter.y, -force * fontSize * 0.11, 0.14)
        const s = lerp(letter.s, 1 + force * 0.16, 0.14)
        const k = lerp(letter.k, force, 0.14)
        if (Math.abs(y - letter.y) < 0.01 && Math.abs(s - letter.s) < 0.0005) return
        letter.y = y; letter.s = s; letter.k = k
        letter.el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scaleY(${s.toFixed(4)})`
        letter.el.style.setProperty('--heat', k.toFixed(3))
      })
    })

    return () => { stop(); observer.disconnect(); window.clearTimeout(settle) }
  }, [entering])

  return (
    <span ref={ref} className={`kinetic-name${entering ? ' is-entering' : ''}`}>
      <span className="kc-sr-only">{text}</span>
      {/* Real spaces between words let phones stack the name; desktop keeps it on one line. */}
      {text.split(' ').map((word, w) => (
        <span className="kinetic-word" key={w}>
          {w > 0 && ' '}
          {[...word].map((char, c) => {
            const i = text.split(' ').slice(0, w).join(' ').length + (w > 0 ? 1 : 0) + c
            return <span className={`kinetic-char w${w}`} aria-hidden="true" style={{ '--i': i }} key={c}>{char}</span>
          })}
        </span>
      ))}
    </span>
  )
}
