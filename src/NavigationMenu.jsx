export default function NavigationMenu({ currentView, onNavigate }) {
  const views = [
    { id: 'home', label: 'HOME' },
    { id: 'projects', label: 'PROJECTS' },
    { id: 'about', label: 'ABOUT ME' },
    { id: 'contact', label: 'CONTACT' },
  ]

  return (
    <nav className="desktop-nav" aria-label="Main navigation">
      {views.map((view) => (
        <button
          key={view.id}
          type="button"
          className={`nav-link${currentView === view.id ? ' is-active' : ''}`}
          onClick={() => onNavigate(view.id)}
        >
          {view.label}
        </button>
      ))}
    </nav>
  )
}
