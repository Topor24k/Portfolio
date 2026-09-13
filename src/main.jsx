import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import HangingBadge from './HangingBadge'
import ProjectsView from './ProjectsView'
import AboutView from './AboutView'
import ContactView from './ContactView'
import NavigationMenu from './NavigationMenu'
import GlitchRole from './GlitchRole'
import PageWipe from './PageWipe'
import SiteFooter from './SiteFooter'
import { setSoundMuted, playNavSound, playIdLaceSound, playButtonClickSound, setActiveView, stopGlitchSound } from './soundEffects'

const VALID_VIEWS = ['home', 'projects', 'about', 'contact']

function parseHash(hashStr) {
  const clean = (hashStr || '').replace(/^#\/?/, '').trim()
  if (!clean) return null
  if (clean.startsWith('project/')) {
    return { view: 'projects', projectId: clean.replace('project/', '') }
  }
  if (clean === 'projects' || clean === 'project') {
    return { view: 'projects', projectId: null }
  }
  if (VALID_VIEWS.includes(clean)) {
    return { view: clean, projectId: null }
  }
  return null
}

function getInitialNavigation() {
  if (typeof window === 'undefined') {
    return { view: 'home', projectId: null }
  }

  // 1. Check URL hash first
  const fromHash = parseHash(window.location.hash)
  if (fromHash) {
    try {
      sessionStorage.setItem('kc_portfolio_view', fromHash.view)
      localStorage.setItem('kc_portfolio_view', fromHash.view)
      if (fromHash.projectId) {
        sessionStorage.setItem('kc_portfolio_project', fromHash.projectId)
        localStorage.setItem('kc_portfolio_project', fromHash.projectId)
      } else {
        sessionStorage.removeItem('kc_portfolio_project')
        localStorage.removeItem('kc_portfolio_project')
      }
    } catch (e) {}
    return fromHash
  }

  // 2. Check storage fallback (survives hard refresh or HMR even if hash was missing)
  try {
    const savedView = sessionStorage.getItem('kc_portfolio_view') || localStorage.getItem('kc_portfolio_view')
    const savedProject = sessionStorage.getItem('kc_portfolio_project') || localStorage.getItem('kc_portfolio_project')
    if (savedView && VALID_VIEWS.includes(savedView) && savedView !== 'home') {
      if (savedView === 'projects' && savedProject) {
        window.history.replaceState(null, '', `#project/${savedProject}`)
        return { view: 'projects', projectId: savedProject }
      }
      window.history.replaceState(null, '', `#${savedView}`)
      return { view: savedView, projectId: null }
    }
  } catch (e) {}

  return { view: 'home', projectId: null }
}

function App() {
  const [isLight, setIsLight] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [isCardOpen, setIsCardOpen] = useState(false)
  const [isProjectDetailOpen, setIsProjectDetailOpen] = useState(() => {
    return Boolean(getInitialNavigation().projectId)
  })
  const [currentView, setCurrentView] = useState(() => {
    const init = getInitialNavigation().view
    setActiveView(init)
    return init
  })
  const [isPageTransitioning, setIsPageTransitioning] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [transitionLabel, setTransitionLabel] = useState(() => {
    const view = getInitialNavigation().view
    return view === 'about' ? 'ABOUT ME' : view.toUpperCase()
  })
  const reopenAfter = useRef(0)
  const transitionTimers = useRef([])

  const viewLabels = {
    home: 'HOME',
    projects: 'PROJECTS',
    about: 'ABOUT ME',
    contact: 'CONTACT',
  }

  useEffect(() => () => {
    transitionTimers.current.forEach((timer) => window.clearTimeout(timer))
  }, [])

  useEffect(() => {
    setActiveView(currentView)
  }, [currentView])

  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseHash(window.location.hash) || { view: 'home', projectId: null }
      stopGlitchSound()
      setActiveView(parsed.view)
      setCurrentView((prev) => (prev !== parsed.view ? parsed.view : prev))
      setIsProjectDetailOpen(Boolean(parsed.projectId))
      try {
        sessionStorage.setItem('kc_portfolio_view', parsed.view)
        localStorage.setItem('kc_portfolio_view', parsed.view)
        if (parsed.projectId) {
          sessionStorage.setItem('kc_portfolio_project', parsed.projectId)
          localStorage.setItem('kc_portfolio_project', parsed.projectId)
        } else {
          sessionStorage.removeItem('kc_portfolio_project')
          localStorage.removeItem('kc_portfolio_project')
        }
      } catch (e) {}
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    const updateScrollState = () => {
      setIsScrolled(window.scrollY > 24)
    }

    updateScrollState()
    window.addEventListener('scroll', updateScrollState, { passive: true })
    return () => window.removeEventListener('scroll', updateScrollState)
  }, [])

  useEffect(() => {
    const handleGlobalClick = (event) => {
      const target = event.target
      if (!target) return
      const button = target.closest('button, [role="button"], input[type="submit"], input[type="button"], .contact-choice, .project-consent')
      if (!button) return
      if (button.disabled || button.getAttribute('aria-disabled') === 'true') return
      // If clicking the badge card to flip, the switch sound is handled in HangingBadge
      if (button.closest('.badge-holder') && !button.closest('.badge-projects-btn')) return
      // If clicking a nav link, handleNavigate handles the nav sound
      if (button.classList.contains('nav-link')) return
      // If clicking hero name lockup, it drops the badge with the lace sound
      if (button.classList.contains('hero-name-lockup')) return
      // If clicking the sound toggle button, it handles its own click sound explicitly
      if (button.classList.contains('sound-toggle-btn')) return

      playButtonClickSound()
    }
    window.addEventListener('click', handleGlobalClick, { capture: true })
    return () => window.removeEventListener('click', handleGlobalClick, { capture: true })
  }, [])

  const openBusinessCard = () => {
    if (isCardOpen || currentView !== 'home' || Date.now() < reopenAfter.current) return
    stopGlitchSound()
    playIdLaceSound()
    setIsCardOpen(true)
  }

  const closeBusinessCard = () => {
    reopenAfter.current = Date.now() + 1000
    setIsCardOpen(false)
  }

  const handleOpenProjects = () => {
    stopGlitchSound()
    setActiveView('projects')
    setCurrentView('projects')
    setIsProjectDetailOpen(false)
    window.location.hash = 'projects'
    try {
      sessionStorage.setItem('kc_portfolio_view', 'projects')
      sessionStorage.removeItem('kc_portfolio_project')
      localStorage.setItem('kc_portfolio_view', 'projects')
      localStorage.removeItem('kc_portfolio_project')
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const handleBackToHome = () => {
    stopGlitchSound()
    setActiveView('home')
    setCurrentView('home')
    setIsProjectDetailOpen(false)
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    try {
      sessionStorage.setItem('kc_portfolio_view', 'home')
      sessionStorage.removeItem('kc_portfolio_project')
      localStorage.setItem('kc_portfolio_view', 'home')
      localStorage.removeItem('kc_portfolio_project')
    } catch (e) {}
    reopenAfter.current = Date.now() + 800
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const handleNavigate = (destination) => {
    if (destination === currentView || isPageTransitioning) return

    stopGlitchSound()
    setActiveView('transitioning')
    playNavSound()
    transitionTimers.current.forEach((timer) => window.clearTimeout(timer))
    setTransitionLabel(viewLabels[destination] || 'HOME')
    setIsCardOpen(false)
    setIsPageTransitioning(true)

    const swapTimer = window.setTimeout(() => {
      setCurrentView(destination)
      setActiveView(destination)
      setIsProjectDetailOpen(false)
      reopenAfter.current = Date.now() + 800
      window.scrollTo({ top: 0, behavior: 'instant' })

      const targetHash = destination === 'home' ? '' : destination
      if (targetHash) {
        window.location.hash = targetHash
      } else {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }

      try {
        sessionStorage.setItem('kc_portfolio_view', destination)
        sessionStorage.removeItem('kc_portfolio_project')
        localStorage.setItem('kc_portfolio_view', destination)
        localStorage.removeItem('kc_portfolio_project')
      } catch (e) {}
    }, 590)

    const finishTimer = window.setTimeout(() => {
      setIsPageTransitioning(false)
    }, 1370)

    transitionTimers.current = [swapTimer, finishTimer]
  }

  return (
    <main className={`portfolio-shell ${isLight ? 'light' : 'dark'}`}>
      <PageWipe active={isPageTransitioning} label={transitionLabel} />
      {!isProjectDetailOpen && (
        <header className={`site-header${isScrolled ? ' is-scrolled' : ''}`}>
          <button
            className="utility-button sound-toggle-btn"
            type="button"
            onClick={() => {
              const next = !soundOn
              setSoundOn(next)
              setSoundMuted(!next)
              playButtonClickSound(true)
            }}
          >
            SOUND: {soundOn ? 'ON' : 'OFF'}
          </button>

          <NavigationMenu currentView={currentView} onNavigate={handleNavigate} />

          <div className="utility-actions">
            <button className="utility-button" type="button" onClick={() => setIsLight(!isLight)}>
              <span aria-hidden="true">✱</span> {isLight ? 'LIGHT' : 'DARK'}
            </button>
          </div>
        </header>
      )}

      {currentView === 'about' ? (
        <AboutView onNavigate={handleNavigate} />
      ) : currentView === 'contact' ? (
        <ContactView onNavigate={handleNavigate} />
      ) : currentView !== 'home' ? (
        <ProjectsView onNavigate={handleNavigate} setIsProjectDetailOpen={setIsProjectDetailOpen} />
      ) : (
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-title-wrapper">
            <GlitchRole />
            <h1 id="hero-title">
              <button
                className="hero-name-lockup"
                type="button"
                aria-label="Click to view ID badge"
                aria-expanded={isCardOpen}
                aria-controls="hanging-business-card"
                onClick={openBusinessCard}
              >
                KAYEEN M. CAMPAÑA
              </button>
            </h1>
            <p className="hero-side hero-side-right">DAVAO CITY, PHILIPPINES.</p>
          </div>

          <p className="hero-guide-prompt" aria-hidden="true">
            <span>CLICK NAME TO VIEW ID ↑</span>
          </p>
        </section>
      )}

      {currentView !== 'home' && (
        <SiteFooter currentView={currentView} onNavigate={handleNavigate} />
      )}

      <HangingBadge
        isOpen={isCardOpen}
        onClose={closeBusinessCard}
        onOpenProjects={handleOpenProjects}
      />
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>,
)
