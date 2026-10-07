import { useEffect, useRef } from 'react'
import { lerp, motion, onFrame } from './engine'

const SPACING = 28

// A living dot lattice behind the hero: it breathes, parts around the pointer,
// and sends shockwaves out from every click.
export default function HeroField({ isLight, active }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    const hero = canvas.parentElement
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let width = 0, height = 0, ratio = 1, dots = []
    let visible = true
    let px = -9999, py = -9999, presence = 0
    const ripples = []
    const ink = isLight ? '16,16,16' : '246,243,237'
    const accent = '240,75,66'

    const resize = () => {
      width = hero.clientWidth
      height = hero.clientHeight
      ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      dots = []
      const offsetX = (width % SPACING) / 2
      const offsetY = (height % SPACING) / 2
      for (let y = offsetY; y <= height; y += SPACING) {
        for (let x = offsetX; x <= width; x += SPACING) dots.push(x, y)
      }
    }

    const pulse = (event) => {
      if (motion.reduced) return
      const rect = hero.getBoundingClientRect()
      ripples.push({ x: event.clientX - rect.left, y: event.clientY - rect.top, start: performance.now() })
      if (ripples.length > 4) ripples.shift()
    }

    const draw = (now) => {
      if (!visible) return
      const rect = hero.getBoundingClientRect()
      const inside = motion.pointerActive && motion.finePointer
        && motion.pointerY > rect.top && motion.pointerY < rect.bottom
      const tx = motion.pointerX - rect.left
      const ty = motion.pointerY - rect.top
      if (px < -999) { px = tx; py = ty }
      px = lerp(px, tx, 0.12)
      py = lerp(py, ty, 0.12)
      presence = lerp(presence, inside ? 1 : 0, 0.06)

      const t = now / 1000
      const reach = Math.min(width, height) * 0.24
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      ctx.clearRect(0, 0, width, height)

      for (let i = ripples.length - 1; i >= 0; i--) if (now - ripples[i].start > 1800) ripples.splice(i, 1)

      for (let i = 0; i < dots.length; i += 2) {
        let x = dots[i], y = dots[i + 1]
        if (!motion.reduced) y += Math.sin(x * 0.012 + t * 0.9) * 1.6 + Math.cos(y * 0.01 + t * 0.6) * 1.2
        let heat = 0

        const dx = x - px, dy = y - py
        const distance = Math.hypot(dx, dy) || 1
        if (presence > 0.01 && distance < reach) {
          const f = (1 - distance / reach) ** 2 * presence
          x += (dx / distance) * f * 26
          y += (dy / distance) * f * 26
          heat = f
        }
        for (const ripple of ripples) {
          const age = (now - ripple.start) / 1800
          const rx = x - ripple.x, ry = y - ripple.y
          const rd = Math.hypot(rx, ry) || 1
          const front = age * Math.max(width, height) * 0.9
          const band = 1 - Math.min(1, Math.abs(rd - front) / 70)
          if (band > 0) {
            const f = band * (1 - age)
            x += (rx / rd) * f * 18
            y += (ry / rd) * f * 18
            heat = Math.max(heat, f)
          }
        }

        const size = 1.2 + heat * 2
        ctx.fillStyle = heat > 0.08 ? `rgba(${accent},${0.25 + heat * 0.75})` : `rgba(${ink},${isLight ? 0.22 : 0.2})`
        ctx.fillRect(x - size / 2, y - size / 2, size, size)
      }
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(hero)
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
    io.observe(hero)
    hero.addEventListener('pointerdown', pulse)
    const stop = onFrame(draw)

    return () => {
      stop()
      resizeObserver.disconnect()
      io.disconnect()
      hero.removeEventListener('pointerdown', pulse)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [isLight, active])

  return <canvas ref={canvasRef} className="hero-field" aria-hidden="true" />
}
