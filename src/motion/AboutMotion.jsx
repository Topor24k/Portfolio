import { useEffect, useRef } from 'react'
import { clamp, motion, onFrame } from './engine'

// Numbers roll up from zero the first time they scroll into view.
export function CountUp({ to, pad = 2 }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    const format = (n) => String(n).padStart(pad, '0')
    if (motion.reduced) { el.textContent = format(to); return }
    el.textContent = format(0)
    let frame = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const start = performance.now()
      const step = (now) => {
        const p = Math.min(1, (now - start) / 1600)
        el.textContent = format(Math.round(to * (1 - (1 - p) ** 4)))
        if (p < 1) frame = requestAnimationFrame(step)
      }
      frame = requestAnimationFrame(step)
    }, { threshold: 0.6 })
    observer.observe(el)
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  }, [to, pad])
  return <span ref={ref}>{String(to).padStart(pad, '0')}</span>
}

const STOPS = [
  ['Origin', 'Getafe, Bohol', 'Where the story begins — an island hometown before the move to the city.'],
  ['Base', 'Davao City', 'Where I study, build and write today.'],
  ['Discipline', 'B.S. Computer Science', 'Academic training channelled into clean, responsive, user-focused interfaces.'],
  ['Collaboration', 'Native Legacy Team', 'Shipping client platforms like Qetsiyah Eco Park and JLD Property Management with Allen and Bern.'],
  ['Craft', 'Fiction Writer', 'Exploring narrative structure — the same instinct that shapes every interface I design.'],
]

// A vertical route that draws itself as you scroll, lighting each stop it passes.
export function AboutJourney() {
  const listRef = useRef(null)
  const fillRef = useRef(null)

  useEffect(() => {
    const list = listRef.current
    const fill = fillRef.current
    const stops = [...list.querySelectorAll('.journey-stop')]
    let visible = false, last = -1
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
    observer.observe(list)
    const stop = onFrame(() => {
      if (!visible) return
      const rect = list.getBoundingClientRect()
      const head = window.innerHeight * 0.6
      const progress = clamp((head - rect.top) / rect.height, 0, 1)
      if (Math.abs(progress - last) < 0.0005) return
      last = progress
      fill.style.transform = `scaleY(${progress.toFixed(4)})`
      stops.forEach((el) => {
        const box = el.getBoundingClientRect()
        el.classList.toggle('is-passed', box.top + 18 < head)
      })
    })
    return () => { stop(); observer.disconnect() }
  }, [])

  return (
    <section className="about-journey about-section" aria-labelledby="about-journey-title">
      <header className="about-journey-head">
        <p className="about-label" data-reveal="up">02 The route so far</p>
        <h2 id="about-journey-title" className="about-section-title" data-reveal="up">From Bohol<br /><span className="about-accent">to the browser.</span></h2>
      </header>
      <ol className="journey" ref={listRef}>
        <span className="journey-line" aria-hidden="true"><i ref={fillRef} /></span>
        {STOPS.map(([kicker, title, text], i) => (
          <li className="journey-stop" key={title} data-reveal="up">
            <span className="journey-dot" aria-hidden="true" />
            <span className="journey-index">0{i + 1} / {kicker}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
