import { useEffect, useRef } from 'react'
import { clamp, motion, onFrame } from './engine'

const clock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
})

// Editorial heads-up display framing the hero: crop marks, status and live Davao time.
export default function HeroHud() {
  const hudRef = useRef(null)
  const timeRef = useRef(null)

  useEffect(() => {
    const tick = () => { if (timeRef.current) timeRef.current.textContent = clock.format(new Date()) }
    tick()
    const timer = window.setInterval(tick, 1000)
    let lastExit = -1
    const hero = hudRef.current.parentElement
    const stop = onFrame(() => {
      const exit = motion.reduced ? 0 : clamp(window.scrollY / window.innerHeight, 0, 1)
      if (Math.abs(exit - lastExit) > 0.001) { hero.style.setProperty('--hero-exit', exit.toFixed(3)); lastExit = exit }
    })
    return () => { window.clearInterval(timer); stop(); hero.style.removeProperty('--hero-exit') }
  }, [])

  return (
    <div ref={hudRef} className="hero-hud" aria-hidden="true">
      <span className="hud-mark hud-mark--tl" />
      <span className="hud-mark hud-mark--tr" />
      <span className="hud-mark hud-mark--bl" />
      <span className="hud-mark hud-mark--br" />

      <p className="hud-status"><i /> Open for projects <span>/ 2026</span></p>

      <div className="hud-readout">
        <p><span>PHT</span> <b ref={timeRef}>--:--:--</b></p>
      </div>

      <div className="hud-scroll">
        <span>Scroll</span>
        <i />
      </div>
    </div>
  )
}
