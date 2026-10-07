import { useLayoutEffect, useRef } from 'react'
import { Roll } from './motion/SplitText'

const VIEWS = [
  { id: 'home', label: 'HOME', short: 'Home' },
  { id: 'projects', label: 'PROJECTS', short: 'Work' },
  { id: 'about', label: 'ABOUT ME', short: 'About' },
  { id: 'contact', label: 'CONTACT', short: 'Contact' },
]

// Line icons for the phone dock; they inherit the tab's colour.
const ICONS = {
  home: <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />,
  projects: <><rect x="4" y="6" width="16" height="13" rx="1.5" /><path d="M9 6V4.5h6V6M4 11h16" /></>,
  about: <><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></>,
  contact: <><rect x="3.5" y="6" width="17" height="12" rx="1.5" /><path d="m4 7 8 6 8-6" /></>,
}

// Desktop: a pill that glides between links. Phone: a thumb-reachable tab dock.
function useGlidingIndicator(containerRef, indicatorRef, selector, currentView, vertical = false) {
  const hovered = useRef(null)
  const move = (target) => {
    const container = containerRef.current
    const indicator = indicatorRef.current
    const link = target || container?.querySelector(`${selector}.is-active`)
    if (!container || !indicator || !link) return
    indicator.style.width = `${link.offsetWidth}px`
    indicator.style.transform = `translateX(${link.offsetLeft}px)`
    if (vertical) indicator.style.height = `${link.offsetHeight}px`
    indicator.classList.toggle('is-ghost', Boolean(target) && !link.classList.contains('is-active'))
  }
  useLayoutEffect(() => {
    move(hovered.current)
    const observer = new ResizeObserver(() => move(hovered.current))
    observer.observe(containerRef.current)
    document.fonts?.ready.then(() => move(hovered.current))
    return () => observer.disconnect()
  }, [currentView])
  return {
    enter: (event) => { hovered.current = event.currentTarget; move(event.currentTarget) },
    leave: () => { hovered.current = null; move(null) },
  }
}

export default function NavigationMenu({ currentView, onNavigate }) {
  const navRef = useRef(null)
  const indicatorRef = useRef(null)
  const dockRef = useRef(null)
  const dockPillRef = useRef(null)
  const desktop = useGlidingIndicator(navRef, indicatorRef, '.nav-link', currentView)
  useGlidingIndicator(dockRef, dockPillRef, '.dock-tab', currentView, true)

  const tap = (id) => {
    if (id !== currentView) navigator.vibrate?.(8)
    onNavigate(id)
  }

  return (
    <>
      <nav className="desktop-nav" aria-label="Main navigation" ref={navRef} onMouseLeave={desktop.leave}>
        <span className="nav-indicator" ref={indicatorRef} aria-hidden="true" />
        {VIEWS.map((view) => (
          <button
            key={view.id}
            type="button"
            className={`nav-link${currentView === view.id ? ' is-active' : ''}`}
            aria-current={currentView === view.id ? 'page' : undefined}
            onMouseEnter={desktop.enter}
            onClick={() => onNavigate(view.id)}
          >
            <Roll>{view.label}</Roll>
          </button>
        ))}
      </nav>

      <nav className="mobile-dock" aria-label="Main navigation" ref={dockRef}>
        <span className="dock-pill" ref={dockPillRef} aria-hidden="true" />
        {VIEWS.map((view) => (
          <button
            key={view.id}
            type="button"
            className={`dock-tab${currentView === view.id ? ' is-active' : ''}`}
            aria-current={currentView === view.id ? 'page' : undefined}
            onClick={() => tap(view.id)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[view.id]}</svg>
            <span>{view.short}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
