import { useState, useEffect } from 'react'
import './projects.css'
import { projects } from './projects'
import FolderCard from './FolderCard'
import ProjectDetailFrame from './ProjectDetailFrame'


export default function ProjectsView({ onNavigate, setIsProjectDetailOpen }) {
  const [selectedProject, setSelectedProject] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace(/^#\/?/, '').trim()
      if (hash.startsWith('project/')) {
        const id = hash.replace('project/', '')
        return projects.find((p) => p.id === id) || null
      }
    }
    return null
  })

  useEffect(() => {
    if (setIsProjectDetailOpen) {
      setIsProjectDetailOpen(!!selectedProject)
    }
  }, [selectedProject, setIsProjectDetailOpen])

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim()
      if (hash.startsWith('project/')) {
        const id = hash.replace('project/', '')
        const found = projects.find((p) => p.id === id) || null
        setSelectedProject(found)
      } else {
        setSelectedProject(null)
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleSelectProject = (proj) => {
    setSelectedProject(proj)
    window.location.hash = `project/${proj.id}`
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  const handleBackToProjects = () => {
    setSelectedProject(null)
    window.location.hash = 'projects'
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
        <p className="projects-eyebrow">PORTFOLIO ARCHIVE</p>
        <h1 className="projects-title">SELECTED WORK</h1>
      </header>
      {/* Client Projects Section */}
      <section className="projects-group-section">
        <div className="projects-group-header">
          <div className="projects-group-tag">
            <span className="projects-group-dot" />
            <h2 className="projects-group-title">CLIENT PROJECTS</h2>
          </div>
          <span className="projects-group-count">0{clientProjects.length} ARCHIVE</span>
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
        <div className="projects-group-header">
          <div className="projects-group-tag">
            <span className="projects-group-dot" />
            <h2 className="projects-group-title">PERSONAL PROJECTS</h2>
          </div>
          <span className="projects-group-count">0{personalProjects.length} ARCHIVE</span>
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
