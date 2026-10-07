import { useEffect, useRef } from 'react'
import { lerp, motion, onFrame } from './engine'
import './motion.css'

// Declarative motion: any element in the app can opt in with data attributes.
//   data-reveal="up|mask|clip|fade|scale"  reveal once when scrolled into view
//   data-parallax="0.12"                   drift against scroll (sets --py)
//   data-magnetic="0.35"                   pull toward the pointer
//   data-tilt                              3D tilt + glare following the pointer
//   data-cursor="View"                     label shown inside the custom cursor
const INTERACTIVE = 'a, button, [role="button"], label, summary, [data-cursor]'

function useDeclarativeMotion() {
  useEffect(() => {
    const bound = new WeakSet()
    const parallaxVisible = new Set()
    const magnets = new Set()
    let scanQueued = false

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-revealed')
        revealObserver.unobserve(entry.target)
      })
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 })

    const parallaxObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) parallaxVisible.add(entry.target)
        else parallaxVisible.delete(entry.target)
      })
    }, { rootMargin: '20% 0px' })

    const bindTilt = (el) => {
      const move = (event) => {
        if (motion.reduced || event.pointerType !== 'mouse') return
        const rect = el.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width
        const y = (event.clientY - rect.top) / rect.height
        el.style.setProperty('--tilt-x', `${((0.5 - y) * 9).toFixed(2)}deg`)
        el.style.setProperty('--tilt-y', `${((x - 0.5) * 11).toFixed(2)}deg`)
        el.style.setProperty('--glare-x', `${(x * 100).toFixed(1)}%`)
        el.style.setProperty('--glare-y', `${(y * 100).toFixed(1)}%`)
        el.classList.add('is-tilting')
      }
      const leave = () => {
        el.style.setProperty('--tilt-x', '0deg')
        el.style.setProperty('--tilt-y', '0deg')
        el.classList.remove('is-tilting')
      }
      el.addEventListener('pointermove', move, { passive: true })
      el.addEventListener('pointerleave', leave)
    }

    const scan = () => {
      scanQueued = false
      document.querySelectorAll('[data-reveal], [data-parallax], [data-magnetic], [data-tilt]').forEach((el) => {
        if (bound.has(el)) return
        bound.add(el)
        if (el.hasAttribute('data-reveal')) {
          if (motion.reduced) el.classList.add('is-revealed')
          else revealObserver.observe(el)
        }
        if (el.hasAttribute('data-parallax')) parallaxObserver.observe(el)
        if (el.hasAttribute('data-magnetic')) magnets.add({ el, x: 0, y: 0, tx: 0, ty: 0 })
        if (el.hasAttribute('data-tilt')) bindTilt(el)
      })
      magnets.forEach((magnet) => { if (!magnet.el.isConnected) magnets.delete(magnet) })
    }

    const queueScan = () => {
      if (scanQueued) return
      scanQueued = true
      requestAnimationFrame(scan)
    }

    const mutations = new MutationObserver(queueScan)
    mutations.observe(document.getElementById('root'), { childList: true, subtree: true })
    scan()

    const stop = onFrame(() => {
      if (motion.reduced) return
      const vh = window.innerHeight
      parallaxVisible.forEach((el) => {
        const rect = el.getBoundingClientRect()
        const speed = Number(el.dataset.parallax) || 0.1
        const offset = (rect.top + rect.height / 2 - vh / 2) * -speed
        el.style.setProperty('--py', `${offset.toFixed(1)}px`)
      })

      magnets.forEach((magnet) => {
        const { el } = magnet
        if (motion.finePointer && motion.pointerActive) {
          const rect = el.getBoundingClientRect()
          const cx = rect.left + rect.width / 2 - magnet.x
          const cy = rect.top + rect.height / 2 - magnet.y
          const dx = motion.pointerX - cx
          const dy = motion.pointerY - cy
          const reach = Math.max(rect.width, rect.height) * 0.5 + 60
          const strength = Number(el.dataset.magnetic) || 0.3
          const inside = Math.hypot(dx, dy) < reach
          magnet.tx = inside ? dx * strength : 0
          magnet.ty = inside ? dy * strength : 0
        } else {
          magnet.tx = 0
          magnet.ty = 0
        }
        const nx = lerp(magnet.x, magnet.tx, 0.16)
        const ny = lerp(magnet.y, magnet.ty, 0.16)
        if (Math.abs(nx - magnet.x) < 0.01 && Math.abs(ny - magnet.y) < 0.01) return
        magnet.x = nx
        magnet.y = ny
        el.style.translate = `${nx.toFixed(2)}px ${ny.toFixed(2)}px`
      })
    })

    return () => {
      stop()
      mutations.disconnect()
      revealObserver.disconnect()
      parallaxObserver.disconnect()
    }
  }, [])
}

// The arrow itself is the native cursor (an SVG via CSS), so it is drawn by the OS with zero lag.
// Only the contextual label ("View case", "Open ID") is a DOM element, moved straight from pointer events.
function CursorLabel() {
  const labelRef = useRef(null)

  useEffect(() => {
    if (!motion.finePointer) return
    const label = labelRef.current
    let text = ''
    const move = (event) => {
      label.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`
    }
    const over = (event) => {
      const target = event.target instanceof Element ? event.target : null
      const next = target?.closest(INTERACTIVE)?.closest('[data-cursor]')?.dataset.cursor || ''
      if (next === text) return
      text = next
      if (next) label.firstChild.textContent = next
      label.classList.toggle('is-visible', Boolean(next))
    }
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerover', over)
    return () => {
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerover', over)
    }
  }, [])

  return <div ref={labelRef} className="kc-cursor-label" aria-hidden="true"><span /></div>
}

export default function MotionLayer() {
  useDeclarativeMotion()
  return (
    <>
      <div className="kc-scroll-progress" aria-hidden="true" />
      <div className="kc-grain" aria-hidden="true" />
      <CursorLabel />
    </>
  )
}
