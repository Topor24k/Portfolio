import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import HangingBadge from './HangingBadge'
import ProjectsView from './ProjectsView'
import AboutView from './AboutView'
import NavigationMenu from './NavigationMenu'
import GlitchRole from './GlitchRole'
import PageWipe from './PageWipe'
import SiteFooter from './SiteFooter'
import { setSoundMuted, playNavSound, playButtonClickSound } from './soundEffects'

function App() {
  const [isLight, setIsLight] = useState(false)
  const [musicOn, setMusicOn] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [isCardOpen, setIsCardOpen] = useState(false)
  const [currentView, setCurrentView] = useState('home') // 'home' | 'projects' | 'about' | 'contact'
  const [isPageTransitioning, setIsPageTransitioning] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [transitionLabel, setTransitionLabel] = useState('HOME')
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
    const updateScrollState = () => {
      setIsScrolled(window.scrollY > 24)
    }

    updateScrollState()
    window.addEventListener('scroll', updateScrollState, { passive: true })

    return () => window.removeEventListener('scroll', updateScrollState)
  }, [])

  useEffect(() => {
    const handleGlobalClick = (event) => {
      const button = event.target.closest('button, [role="button"]')
      if (!button) return
      // If clicking the badge card to flip, the switch sound is handled in HangingBadge
      if (button.closest('.badge-holder')) return
      // If clicking a nav link, handleNavigate handles the nav sound
      if (button.classList.contains('nav-link')) return
      playButtonClickSound()
    }
    window.addEventListener('click', handleGlobalClick, { capture: true })
    return () => window.removeEventListener('click', handleGlobalClick, { capture: true })
  }, [])

  const openBusinessCard = () => {
    if (isCardOpen || currentView !== 'home' || Date.now() < reopenAfter.current) return
    setIsCardOpen(true)
  }

  const closeBusinessCard = () => {
    reopenAfter.current = Date.now() + 1000
    setIsCardOpen(false)
  }

  const handleOpenProjects = () => {
    setCurrentView('projects')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const handleBackToHome = () => {
    setCurrentView('home')
    reopenAfter.current = Date.now() + 800
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const handleNavigate = (destination) => {
    if (destination === currentView || isPageTransitioning) return

    playNavSound()
    transitionTimers.current.forEach((timer) => window.clearTimeout(timer))
    setTransitionLabel(viewLabels[destination] || 'HOME')
    setIsCardOpen(false)
    setIsPageTransitioning(true)

    const swapTimer = window.setTimeout(() => {
      setCurrentView(destination)
      reopenAfter.current = Date.now() + 800
      window.scrollTo({ top: 0, behavior: 'instant' })
    }, 590)

    const finishTimer = window.setTimeout(() => {
      setIsPageTransitioning(false)
    }, 1370)

    transitionTimers.current = [swapTimer, finishTimer]
  }

  return (
    <main className={`portfolio-shell ${isLight ? 'light' : 'dark'}`}>
      <PageWipe active={isPageTransitioning} label={transitionLabel} />
      <header className={`site-header${isScrolled ? ' is-scrolled' : ''}`}>
        <button
          className="utility-button"
          type="button"
          onClick={() => {
            const next = !soundOn
            setSoundOn(next)
            setSoundMuted(!next)
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

      {currentView === 'about' ? (
        <AboutView onNavigate={handleNavigate} />
      ) : currentView !== 'home' ? (
        <ProjectsView view={currentView} onNavigate={handleNavigate} />
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
