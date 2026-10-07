import { INTRO_HITS, introLevel } from './introTimeline'

// Every pixel here is a pure function of the audio clock: scrubbing, pausing or
// running silently always lands on the same frame the sound is playing.

function seeded(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const easeOut = (x) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3
const window01 = (t, start, end) => Math.min(1, Math.max(0, (t - start) / (end - start)))
const CODE = "const idea = spark(); design(idea).withPointOfView(); export default code(make(it).real); motion.on('frame', reel); <Devspace kayeen />"
const GLYPHS = '01<>/{}[]=+*#&$;:'

function makeParticles(count, seed) {
  const random = seeded(seed)
  return Array.from({ length: count }, () => ({
    angle: random() * Math.PI * 2,
    speed: 0.25 + random() * 0.75,
    size: 1 + random() * 2.6,
    spin: random() * 6,
    accent: random() > 0.55,
  }))
}

export function createIntroStage(canvas) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  let width = 0, height = 0, ratio = 1, ink = '16,16,16', accent = '240,75,66'
  const burstA = makeParticles(110, 7)
  const burstB = makeParticles(160, 21)
  const columns = makeParticles(48, 99)

  const resize = () => {
    width = canvas.clientWidth
    height = canvas.clientHeight
    ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    const styles = getComputedStyle(canvas)
    ink = styles.getPropertyValue('--stage-ink').trim() || ink
    accent = styles.getPropertyValue('--stage-accent').trim() || accent
  }

  const ring = (cx, cy, radius, alpha, lineWidth, color) => {
    if (alpha <= 0.002 || radius <= 0) return
    ctx.strokeStyle = `rgba(${color},${alpha})`
    ctx.lineWidth = lineWidth
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.stroke()
  }

  const burst = (particles, t, start, cx, cy, reach) => {
    const age = t - start
    if (age < 0 || age > 1.6) return
    const travel = easeOut(age / 1.1)
    const fade = 1 - window01(age, 0.35, 1.6)
    particles.forEach((p) => {
      const distance = travel * reach * p.speed
      const x = cx + Math.cos(p.angle) * distance
      const y = cy + Math.sin(p.angle) * distance
      ctx.fillStyle = `rgba(${p.accent ? accent : ink},${0.85 * fade})`
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(p.spin * age)
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * (p.accent ? 3 : 1))
      ctx.restore()
    })
  }

  const draw = (t) => {
    const level = introLevel(t)
    const cx = width / 2, cy = height / 2
    const diagonal = Math.hypot(width, height)
    // Everything bows out as the background hands over to the real Home page.
    const outro = 1 - window01(t, 4.9, 5.9)
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.clearRect(0, 0, width, height)
    if (outro <= 0) return

    // IDEAS: a bloom that swells with every breath of the track.
    const ideas = 1 - window01(t, 1.4, 1.7)
    if (ideas > 0) {
      const radius = Math.min(width, height) * (0.16 + level * 0.32)
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      glow.addColorStop(0, `rgba(${accent},${0.22 * level * ideas})`)
      glow.addColorStop(1, `rgba(${accent},0)`)
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, width, height)
    }

    // CODE: deterministic glyph rain that only falls during its chapter.
    const code = window01(t, 2.62, 2.85) * (1 - window01(t, 3.9, 4.2))
    if (code > 0) {
      const size = Math.max(11, Math.min(16, width / 90))
      ctx.font = `500 ${size}px 'DM Mono', monospace`
      ctx.textAlign = 'center'
      const step = width / columns.length
      columns.forEach((column, i) => {
        const x = step * (i + 0.5)
        const fall = (t - 2.62) * (240 + column.speed * 520) - column.spin * 120
        for (let row = 0; row < 14; row++) {
          const y = fall - row * size * 1.35
          if (y < -size || y > height + size) continue
          const k = (i * 7 + row * 3 + Math.floor(t * 18)) % CODE.length
          const char = row === 0 ? GLYPHS[(i + Math.floor(t * 30)) % GLYPHS.length] : CODE[k]
          const alpha = (row === 0 ? 0.75 : 0.32 * (1 - row / 14)) * code * (0.45 + level * 0.8)
          ctx.fillStyle = `rgba(${row === 0 ? accent : ink},${alpha})`
          ctx.fillText(char, x, y)
        }
      })
      // A scanline sweeps the frame on the CODE hit.
      const scan = window01(t, 2.7, 3.35)
      if (scan > 0 && scan < 1) {
        const y = easeOut(scan) * height
        ctx.fillStyle = `rgba(${accent},${0.5 * (1 - scan)})`
        ctx.fillRect(0, y, width, 2)
        ctx.fillStyle = `rgba(${accent},${0.06 * (1 - scan)})`
        ctx.fillRect(0, y - 80, width, 80)
      }
    }

    // Shockwaves on every transient in the track.
    INTRO_HITS.forEach((hit, index) => {
      const age = t - hit
      if (age < 0 || age > 1.4) return
      const p = age / 1.4
      const strength = index === 2 || index === 5 ? 1 : 0.55
      ring(cx, cy, easeOut(p) * diagonal * 0.55, (1 - p) * 0.55 * strength, 1.5, index % 2 ? accent : ink)
      if (strength === 1) ring(cx, cy, easeOut(p * 0.8) * diagonal * 0.4, (1 - p) * 0.35, 1, accent)
    })
    burst(burstA, t, 1.57, cx, cy, Math.min(width, height) * 0.62)
    burst(burstB, t, 3.98, cx, cy, Math.max(width, height) * 0.7)

    // Oscilloscope: the track's loudness drawn as a living line under the words.
    const lineY = height * 0.82
    const amplitude = 8 + level * Math.min(70, height * 0.08)
    ctx.lineWidth = 1.5
    for (const [color, phase, alpha] of [[ink, 0, 0.35], [accent, 1.7, 0.85]]) {
      ctx.strokeStyle = `rgba(${color},${alpha * outro})`
      ctx.beginPath()
      for (let x = 0; x <= width; x += 6) {
        const u = x / width
        const taper = Math.sin(u * Math.PI)
        const y = lineY + Math.sin(u * 22 + t * 9 + phase) * Math.sin(u * 7 - t * 4) * amplitude * taper
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    // VU meter in the corner, driven by the same envelope.
    const bars = 18
    const baseX = Math.max(24, width * 0.04), baseY = height - Math.max(30, height * 0.06)
    for (let i = 0; i < bars; i++) {
      const wobble = 0.55 + 0.45 * Math.sin(i * 1.9 + t * 14)
      const h = 3 + level * 34 * wobble
      ctx.fillStyle = `rgba(${i > bars * 0.7 ? accent : ink},${0.7 * outro})`
      ctx.fillRect(baseX + i * 5, baseY - h, 2, h)
    }

    // A soft accent flash on the two biggest hits (kept gentle for comfort).
    for (const hit of [1.57, 3.98]) {
      const age = t - hit
      if (age >= 0 && age < 0.22) {
        ctx.fillStyle = `rgba(${accent},${0.1 * (1 - age / 0.22)})`
        ctx.fillRect(0, 0, width, height)
      }
    }
  }

  resize()
  return { draw, resize }
}
