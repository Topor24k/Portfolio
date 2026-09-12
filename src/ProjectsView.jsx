import { useState } from 'react'
import './projects.css'
import { projects } from './projects'
import FolderCard from './FolderCard'
import ProjectModal from './ProjectModal'

export default function ProjectsView({ view = 'projects', onNavigate }) {
  const [selectedProject, setSelectedProject] = useState(null)

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
            onSelect={setSelectedProject}
          />
        ))}
      </div>

      {/* Project detail modal */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  )
}
