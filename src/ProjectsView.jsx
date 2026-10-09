import { useState, useEffect } from 'react'
import './projects.css'
import { useProjects } from './lib/projectStore'
import FolderCard from './FolderCard'
import ProjectDetailFrame from './ProjectDetailFrame'
import { SplitText } from './motion/SplitText'


export default function ProjectsView({ onNavigate, setIsProjectDetailOpen }) {
  const projects = useProjects()
  // The selection is kept by id so it survives the project list refreshing from Supabase.
  const [selectedId, setSelectedId] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace(/^#\/?/, '').trim()
      if (hash.startsWith('project/')) return hash.replace('project/', '')
      try {
        return sessionStorage.getItem('kc_portfolio_project') || localStorage.getItem('kc_portfolio_project') || null
      } catch (e) {}
    }
    return null
  })
  const selectedProject = projects.find((p) => p.id === selectedId) || null

  useEffect(() => {
    if (setIsProjectDetailOpen) {
      setIsProjectDetailOpen(!!selectedProject)
    }
  }, [selectedProject, setIsProjectDetailOpen])

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim()
      if (hash.startsWith('project/')) {
        setSelectedId(hash.replace('project/', ''))
      } else {
        setSelectedId(null)
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleSelectProject = (proj) => {
    setSelectedId(proj.id)
    window.location.hash = `project/${proj.id}`
    try {
      sessionStorage.setItem('kc_portfolio_view', 'projects')
      sessionStorage.setItem('kc_portfolio_project', proj.id)
      localStorage.setItem('kc_portfolio_view', 'projects')
      localStorage.setItem('kc_portfolio_project', proj.id)
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const handleBackToProjects = () => {
    setSelectedId(null)
    window.location.hash = 'projects'
    try {
      sessionStorage.setItem('kc_portfolio_view', 'projects')
      sessionStorage.removeItem('kc_portfolio_project')
      localStorage.setItem('kc_portfolio_view', 'projects')
      localStorage.removeItem('kc_portfolio_project')
    } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  // If a specific project is selected, display it in the dedicated archival frame
  if (selectedProject) {
    return (
      <ProjectDetailFrame
        project={selectedProject}
        onBack={handleBackToProjects}
        onNavigate={onNavigate}
      />
    )
  }

  const clientProjects = projects.filter(
    (p) => p.projectType === 'client' || p.id === 'qetsiyah-eco-park' || p.id === 'jld-marketing'
  )
  const personalProjects = projects.filter(
    (p) => p.projectType === 'personal' || p.id === 'odyssey'
  )

  return (
    <div className="projects-view projects-view--grid">
      {/* Section header */}
      <header className="projects-header">
        <p className="projects-eyebrow" data-reveal="up">PORTFOLIO ARCHIVE</p>
        <SplitText as="h1" className="projects-title" text="SELECTED WORK" />
      </header>

      {/* Client Projects Section */}
      <section className="projects-group-section">
        <div className="projects-group-header" data-reveal="up">
          <div className="projects-group-tag">
            <span className="projects-group-dot" />
            <h2 className="projects-group-title">CLIENT PROJECTS</h2>
          </div>
          <span className="projects-group-count">0{clientProjects.length} PROJECTS</span>
        </div>
        <div className="projects-grid">
          {clientProjects.map((project, i) => (
            <FolderCard
              key={project.id}
              project={project}
              index={i}
              onSelect={handleSelectProject}
            />
          ))}
        </div>
      </section>

      {/* Personal Projects Section */}
      <section className="projects-group-section">
        <div className="projects-group-header" data-reveal="up">
          <div className="projects-group-tag">
            <span className="projects-group-dot" />
            <h2 className="projects-group-title">PERSONAL PROJECTS</h2>
          </div>
          <span className="projects-group-count">0{personalProjects.length} PROJECTS</span>
        </div>
        <div className="projects-grid">
          {personalProjects.map((project, i) => (
            <FolderCard
              key={project.id}
              project={project}
              index={clientProjects.length + i}
              onSelect={handleSelectProject}
            />
          ))}
        </div>
      </section>


    </div>
  )
}
