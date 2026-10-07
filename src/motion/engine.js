// One shared rAF loop for every scroll/pointer-driven effect on the site.
// Components subscribe with onFrame() instead of running their own loops.

export const motion = {
  scrollY: 0,
  velocity: 0,
  pointerX: -200,
  pointerY: -200,
  pointerActive: false,
  reduced: false,
  finePointer: false,
}

const subscribers = new Set()
let frameId = 0
let lastScroll = 0
let lastSkew = 0
let lastProgress = -1

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
export const lerp = (from, to, amount) => from + (to - from) * amount

function frame(now) {
  frameId = 0
  const y = window.scrollY
  const raw = y - lastScroll
  lastScroll = y
  motion.scrollY = y
  motion.velocity = lerp(motion.velocity, raw, 0.12)
  if (Math.abs(motion.velocity) < 0.01) motion.velocity = 0

  const root = document.documentElement
  const skew = motion.reduced ? 0 : clamp(motion.velocity * 0.12, -7, 7)
  if (Math.abs(skew - lastSkew) > 0.01) {
    root.style.setProperty('--scroll-skew', `${skew.toFixed(2)}deg`)
    lastSkew = skew
  }
  const max = root.scrollHeight - window.innerHeight
  const progress = max > 0 ? clamp(y / max, 0, 1) : 0
  if (Math.abs(progress - lastProgress) > 0.0005) {
    root.style.setProperty('--scroll-progress', progress.toFixed(4))
    lastProgress = progress
  }

  if (subscribers.size) frameId = requestAnimationFrame(frame)
  // One misbehaving effect must never stall every other animation on the page.
  subscribers.forEach((fn) => {
    try { fn(now) } catch (error) { console.error(error) }
  })
}

export function onFrame(fn) {
  subscribers.add(fn)
  if (!frameId) frameId = requestAnimationFrame(frame)
  return () => {
    subscribers.delete(fn)
    if (!subscribers.size && frameId) {
      cancelAnimationFrame(frameId)
      frameId = 0
    }
  }
}

if (typeof window !== 'undefined') {
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const fineQuery = window.matchMedia('(any-hover: hover) and (any-pointer: fine)')
  const sync = () => {
    motion.reduced = reducedQuery.matches
    motion.finePointer = fineQuery.matches
  }
  sync()
  reducedQuery.addEventListener('change', sync)
  fineQuery.addEventListener('change', sync)
  lastScroll = window.scrollY
  window.addEventListener('pointermove', (event) => {
    motion.pointerX = event.clientX
    motion.pointerY = event.clientY
    motion.pointerActive = true
  }, { passive: true })
  document.documentElement.addEventListener('pointerleave', () => { motion.pointerActive = false })
}
