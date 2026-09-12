import { useState, useEffect } from 'react'
import './projects.css'
import { projects } from './projects'
import FolderCard from './FolderCard'
import ProjectDetailFrame from './ProjectDetailFrame'

export default function ProjectsView({ view = 'projects', onNavigate, setIsProjectDetailOpen }) {
  const [selectedProject, setSelectedProject] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#project/')) {
      const id = window.location.hash.replace('#project/', '')
      return projects.find((p) => p.id === id) || null
    }
    return null
  })

  useEffect(() => {
    if (setIsProjectDetailOpen) {
      setIsProjectDetailOpen(!!selectedProject)
    }
  }, [selectedProject, setIsProjectDetailOpen])

  const titles = {
    about: {
      eyebrow: 'ABOUT ME',
      title: 'COMING SOON',
    },
    contact: {
      eyebrow: 'CONTACT',
      title: 'COMING SOON',
    },
  }

  // About and Contact stay as "coming soon" placeholders
  if (view !== 'projects') {
    const current = titles[view] || titles.about
    return (
      <div className="projects-view">
        <section className="coming-soon-container">
          <div className="coming-soon-content">
            <p className="coming-soon-eyebrow">{current.eyebrow}</p>
            <h1 className="coming-soon-title">{current.title}</h1>
          </div>
        </section>
      </div>
    )
  }

  // If a specific project is selected, display it in the dedicated archival frame
  if (selectedProject) {
    return (
      <ProjectDetailFrame
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        onNavigate={onNavigate}
      />
    )
  }

  return (
    <div className="projects-view projects-view--grid">
      {/* Section header */}
      <header className="projects-header">
        <p className="projects-eyebrow">PROJECTS</p>
        <h1 className="projects-title">SELECTED WORK</h1>
      </header>

      {/* Folder card grid */}
      <div className="projects-grid">
        {projects.map((project, i) => (
          <FolderCard
            key={project.id}
            project={project}
            index={i}
            onSelect={(proj) => {
              setSelectedProject(proj)
              window.scrollTo({ top: 0, behavior: 'instant' })
            }}
          />
        ))}
      </div>
    </div>
  )
}
