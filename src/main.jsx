import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import './styles.css'
import HangingBadge from './HangingBadge'
import ProjectsView from './ProjectsView'
import AboutView from './AboutView'
import ContactView from './ContactView'
import NavigationMenu from './NavigationMenu'
import GlitchRole from './GlitchRole'
import PageWipe from './PageWipe'
import SiteFooter from './SiteFooter'
import OpeningIntro from './OpeningIntro'
import HeroReveal from './HeroReveal'
import MusicPlayer from './MusicPlayer'
import MotionLayer from './motion/MotionLayer'
import HeroField from './motion/HeroField'
import HeroHud from './motion/HeroHud'
import KineticName from './motion/KineticName'
import HomeReel from './motion/HomeReel'
import { Roll } from './motion/SplitText'
import './motion/hero-motion.css'
import { readAudioPreference, saveAudioPreference } from './audioPreferences'
import { setSoundMuted, playNavSound, playIdLaceSound, playButtonClickSound, setActiveView, stopGlitchSound } from './soundEffects'

import './mobile.css'
import './phone.css'

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

  // Clear legacy persisted storage so old cached sessions don't force views
  try {
    sessionStorage.removeItem('kc_portfolio_view')
    sessionStorage.removeItem('kc_portfolio_project')
    localStorage.removeItem('kc_portfolio_view')
    localStorage.removeItem('kc_portfolio_project')
  } catch (e) {}

  // Check if there is an explicit deep link to a specific project (e.g. #project/odyssey)
  const fromHash = parseHash(window.location.hash)
  if (fromHash?.projectId) {
    return fromHash
  }

  // When opening the website, always show Home first and clean any stale leftover hash
  if (window.location.hash) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }

  return { view: 'home', projectId: null }
}

function App() {
  const [isLight, setIsLight] = useState(false)
  const [soundOn, setSoundOn] = useState(() => readAudioPreference('effects'))
  const [musicOn, setMusicOn] = useState(() => readAudioPreference('music'))
  const [showIntro, setShowIntro] = useState(() => !parseHash(window.location.hash)?.projectId)
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

  const changeSound = (enabled) => {
    setSoundOn(enabled)
    setSoundMuted(!enabled)
    saveAudioPreference('effects',enabled)
    if (enabled) playButtonClickSound()
  }

  const toggleMusic = (override) => {
    const next = typeof override === 'boolean' ? override : !musicOn
    setMusicOn(next)
    saveAudioPreference('music', next)
  }

  useEffect(() => { setSoundMuted(!soundOn) }, [soundOn])

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
    setActiveView(showIntro ? 'intro' : currentView)
  }, [currentView, showIntro])

  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseHash(window.location.hash) || { view: 'home', projectId: null }
      stopGlitchSound()
      setActiveView(parsed.view)
      setCurrentView((prev) => (prev !== parsed.view ? parsed.view : prev))
      setIsProjectDetailOpen(Boolean(parsed.projectId))
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
      if (target.closest('.opening-intro')) return
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
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const handleBackToHome = () => {
    stopGlitchSound()
    setActiveView('home')
    setCurrentView('home')
    setIsProjectDetailOpen(false)
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    reopenAfter.current = Date.now() + 800
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  // Every page change runs under the colour wipe; the view swaps while the screen is covered.
  const runTransition = (label, swap) => {
    stopGlitchSound()
    setActiveView('transitioning')
    playNavSound()
    transitionTimers.current.forEach((timer) => window.clearTimeout(timer))
    setTransitionLabel(label)
    setIsCardOpen(false)
    setIsPageTransitioning(true)

    const swapTimer = window.setTimeout(() => {
      swap()
      reopenAfter.current = Date.now() + 800
      window.scrollTo({ top: 0, behavior: 'instant' })
    }, 590)

    const finishTimer = window.setTimeout(() => {
      setIsPageTransitioning(false)
    }, 1370)

    transitionTimers.current = [swapTimer, finishTimer]
  }

  const handleNavigate = (destination) => {
    if (destination === currentView || isPageTransitioning) return

    runTransition(viewLabels[destination] || 'HOME', () => {
      setCurrentView(destination)
      setActiveView(destination)
      setIsProjectDetailOpen(false)

      const targetHash = destination === 'home' ? '' : destination
      if (targetHash) {
        window.location.hash = targetHash
      } else {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    })
  }

  const handleOpenProject = (project) => {
    if (isPageTransitioning) return
    runTransition(project.tab, () => {
      window.location.hash = `project/${project.id}`
      setCurrentView('projects')
      setActiveView('projects')
      setIsProjectDetailOpen(true)
    })
  }

  // The new theme spreads out from the toggle as a growing circle.
  const toggleTheme = (event) => {
    const next = !isLight
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduced) {
      setIsLight(next)
      return
    }
    const x = event.clientX || window.innerWidth - 60
    const y = event.clientY || 40
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    const transition = document.startViewTransition(() => flushSync(() => setIsLight(next)))
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 900, easing: 'cubic-bezier(.83, 0, .17, 1)', pseudoElement: '::view-transition-new(root)' },
      )
    }).catch(() => {})
  }

  return (
    <main className={`portfolio-shell ${isLight ? 'light' : 'dark'}${isProjectDetailOpen ? ' is-detail' : ''}`}>
      <MotionLayer />
      {showIntro && <OpeningIntro soundOn={soundOn} isLight={isLight}
        onSoundChange={changeSound}
        onComplete={() => {
          setShowIntro(false)
          requestAnimationFrame(() => document.getElementById('hero-title')?.focus({ preventScroll: true }))
        }} />}
      <PageWipe active={isPageTransitioning} label={transitionLabel} />
      <MusicPlayer
        active={!showIntro}
        musicOn={musicOn}
        onMusicToggle={toggleMusic}
        showEffectsControl={isProjectDetailOpen}
        soundOn={soundOn}
        onSoundChange={changeSound}
      />
      {!isProjectDetailOpen && (
        <header className={`site-header${isScrolled ? ' is-scrolled' : ''}`}>
          <button
            className="utility-button sound-toggle-btn"
            type="button"
            aria-pressed={soundOn}
            aria-label={soundOn ? 'Turn sound effects off' : 'Turn sound effects on'}
            onClick={() => changeSound(!soundOn)}
          >
            SFX: {soundOn ? 'ON' : 'OFF'}
          </button>

          <NavigationMenu currentView={currentView} onNavigate={handleNavigate} />

          <div className="utility-actions">
            <button className="utility-button theme-toggle" type="button" data-magnetic="0.3" onClick={toggleTheme}
              aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}>
              <span className="theme-toggle-star" aria-hidden="true">✱</span> <Roll>{isLight ? 'LIGHT' : 'DARK'}</Roll>
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
        <>
        <section className="hero" id="top" aria-labelledby="hero-title">
          <HeroField active={!isPageTransitioning} isLight={isLight} />
          <HeroReveal active={!showIntro && !isCardOpen && !isPageTransitioning} isLight={isLight} />
          {!showIntro && <HeroHud />}
          <div className="hero-title-wrapper hero-scrolled-fade">
            {showIntro ? <p className="hero-side hero-side-left">CREATIVE DEVELOPER</p> : <GlitchRole />}
            <h1 id="hero-title" tabIndex={-1}>
              <button
                className="hero-name-lockup"
                type="button"
                aria-label="Click to view ID badge"
                aria-expanded={isCardOpen}
                aria-controls="hanging-business-card"
                data-cursor="Open ID"
                onClick={openBusinessCard}
              >
                <KineticName text="KAYEEN M. CAMPAÑA" />
              </button>
            </h1>
            <p className="hero-side hero-side-right">DAVAO CITY, PHILIPPINES.</p>
          </div>

          <p className="hero-guide-prompt" aria-hidden="true">
            <span>CLICK NAME TO VIEW ID</span>
          </p>
        </section>
        <HomeReel onNavigate={handleNavigate} onOpenProject={handleOpenProject} />
        </>
      )}

      <SiteFooter currentView={currentView} onNavigate={handleNavigate} />

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
