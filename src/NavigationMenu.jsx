import { useEffect, useRef, useState } from 'react'

export default function NavigationMenu({ currentView, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false)
  const dialogRef = useRef(null)
  const toggleRef = useRef(null)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)')
    const closeOnDesktop = () => { if (!media.matches) setIsOpen(false) }
    media.addEventListener('change', closeOnDesktop)
    return () => media.removeEventListener('change', closeOnDesktop)
  }, [])

  useEffect(() => { setIsOpen(false) }, [currentView])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!isOpen) {
      if (dialog.open) dialog.close()
      return
    }
    if (!window.matchMedia('(max-width: 760px)').matches) return
    dialog.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      if (dialog.open) dialog.close()
    }
  }, [isOpen])

  const closeMenu = () => {
    setIsOpen(false)
    toggleRef.current?.focus()
  }

  const navigateMobile = (destination) => {
    closeMenu()
    onNavigate(destination)
  }

  const views = [
    { id: 'home', label: 'HOME' },
    { id: 'projects', label: 'PROJECTS' },
    { id: 'about', label: 'ABOUT ME' },
    { id: 'contact', label: 'CONTACT' },
  ]

  return (
    <>
    <nav className="desktop-nav" aria-label="Main navigation">
      {views.map((view) => (
        <button
          key={view.id}
          type="button"
          className={`nav-link${currentView === view.id ? ' is-active' : ''}`}
          aria-current={currentView === view.id ? 'page' : undefined}
          onClick={() => onNavigate(view.id)}
        >
          {view.label}
        </button>
      ))}
    </nav>
    <button className="mobile-menu-toggle" type="button" ref={toggleRef}
      aria-label="Open navigation menu" aria-expanded={isOpen} aria-controls="mobile-navigation"
      aria-haspopup="dialog" onClick={() => setIsOpen(true)}>
      <span>MENU</span><span className="mobile-menu-bars" aria-hidden="true"><i /><i /></span>
    </button>
    <dialog ref={dialogRef} id="mobile-navigation" className="mobile-menu" aria-labelledby="mobile-menu-title"
      onCancel={(event) => { event.preventDefault(); closeMenu() }} onClose={() => setIsOpen(false)}>
      <div className="mobile-menu-top">
        <p id="mobile-menu-title">KC / DEVSPACE<span>Navigation</span></p>
        <button className="mobile-menu-close" type="button" onClick={closeMenu} aria-label="Close navigation menu">CLOSE <span aria-hidden="true">×</span></button>
      </div>
      <nav aria-label="Mobile navigation">
        {views.map((view, index) => <button key={view.id} type="button"
          className={`mobile-nav-link${currentView === view.id ? ' is-active' : ''}`}
          aria-current={currentView === view.id ? 'page' : undefined} onClick={() => navigateMobile(view.id)}>
          <span className="mobile-nav-number">0{index + 1}</span><span>{view.label}</span><span className="mobile-nav-arrow" aria-hidden="true">↗</span>
        </button>)}
      </nav>
    </dialog>
    </>
  )
}
