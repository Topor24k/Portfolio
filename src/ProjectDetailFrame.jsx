import { useEffect, useState } from 'react'
import './project-detail-frame.css'
import { playButtonClickSound, playNavSound } from './soundEffects'

export default function ProjectDetailFrame({ project, onBack, onNavigate }) {
  const artifacts = project.artifacts || [
    {
      id: 'primary',
      title: project.tab,
      subtitle: project.name,
      year: '2024',
      type: 'screen',
      description: project.details || project.description,
      image: project.cover,
      badge: 'PRIMARY',
    },
  ]

  const [activeArtifactId, setActiveArtifactId] = useState(artifacts[0]?.id)
  const activeArtifact = artifacts.find((a) => a.id === activeArtifactId) || artifacts[0]

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        playNavSound()
        onBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBack])

  const handleSelectArtifact = (artifact) => {
    playButtonClickSound()
    setActiveArtifactId(artifact.id)
  }

  const handleNextArtifact = () => {
    playButtonClickSound()
    const currentIndex = artifacts.findIndex((a) => a.id === activeArtifactId)
    const nextIndex = (currentIndex + 1) % artifacts.length
    setActiveArtifactId(artifacts[nextIndex].id)
  }

  const handleBackClick = () => {
    playNavSound()
    onBack()
  }

  return (
    <article className="project-detail-frame" aria-label={`Project detail: ${project.name}`}>
      {/* Top navigation and archival metadata bar */}
      <nav className="archival-topbar" aria-label="Project breadcrumb and navigation">
        <div className="archival-breadcrumbs">
          <span className="archival-crumb-source">
            {project.breadcrumbs || `PROJECTS / ARCHIVE / ${project.tab}`}
          </span>
        </div>

        <div className="archival-topbar-actions">
          <span className="archival-stamp">{project.archiveDate || 'Archive Assemblage · 2024'}</span>
          <button
            type="button"
            className="archival-back-btn"
            onClick={handleBackClick}
            aria-label="Back to projects list"
          >
            ← BACK TO PROJECTS
          </button>
        </div>
      </nav>

      {/* Main Archival Header */}
      <header className="archival-header">
        <p className="archival-eyebrow">{project.category}</p>
        <h1 className="archival-title">{project.name}</h1>

        <div className="archival-prose-grid">
          <p className="archival-prose-column">
            {project.overview?.p1 || project.description}
          </p>
          <p className="archival-prose-column">
            {project.overview?.p2 || project.details || project.description}
          </p>
        </div>
      </header>

      {/* Archival Artifact Workbench */}
      <section className="archival-workbench" aria-label="Interactive project artifacts desk">
        <div className="archival-desk">
          {/* Artifact items arranged across the desk */}
          <div className="archival-artifacts-stage">
            {artifacts.map((artifact, index) => {
              const isActive = artifact.id === activeArtifactId
              return (
                <div
                  key={artifact.id}
                  className={`archival-artifact-item archival-artifact--${artifact.type} ${
                    isActive ? 'is-active' : ''
                  }`}
                  onClick={() => handleSelectArtifact(artifact)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isActive}
                  aria-label={`View artifact ${artifact.title}: ${artifact.subtitle}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleSelectArtifact(artifact)
                    }
                  }}
                  style={{
                    '--item-index': index,
                  }}
                >
                  {/* Visual Header / Label on Artifact */}
                  <div className="artifact-header-strip">
                    <span className="artifact-id-badge">{artifact.badge || artifact.title}</span>
                    <span className="artifact-serial">{artifact.title}</span>
                  </div>

                  {/* Artifact Content Body */}
                  {artifact.type === 'screen' && artifact.image && (
                    <div className="artifact-screen-housing">
                      <img
                        src={artifact.image}
                        alt={artifact.subtitle}
                        className="artifact-screen-img"
                        loading="lazy"
                        draggable="false"
                      />
                    </div>
                  )}

                  {artifact.type === 'document' && (
                    <div className="artifact-document-sheet">
                      <div className="artifact-sheet-watermark">{artifact.docCategory || 'SPECIFICATION'}</div>
                      <div className="artifact-sheet-meta">
                        <span className="artifact-sheet-docnum">{artifact.docNumber || 'DOC // SPEC'}</span>
                        <span className="artifact-sheet-stamp">14 DAY USE</span>
                      </div>
                      <h3 className="artifact-sheet-title">{artifact.docTitle || artifact.subtitle}</h3>

                      {/* Technical Blueprint SVG Waveform / Grid */}
                      <div className="artifact-waveform-box" aria-hidden="true">
                        <svg viewBox="0 0 300 60" className="artifact-waveform-svg">
                          <polyline
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            points="0,30 20,30 35,10 50,50 65,30 90,30 110,8 125,48 140,30 170,30 190,15 210,45 225,30 260,30 280,18 300,30"
                          />
                        </svg>
                      </div>

                      <ul className="artifact-doc-lines">
                        {artifact.docLines?.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {artifact.type === 'photo' || artifact.type === 'log' ? (
                    <div className="artifact-photo-card">
                      <div className="artifact-sheet-meta">
                        <span className="artifact-sheet-docnum">{artifact.docNumber || 'LOG // RECORD'}</span>
                        <span className="artifact-photo-badge">{artifact.badge || 'VERIFIED'}</span>
                      </div>
                      <h3 className="artifact-photo-title">{artifact.docTitle || artifact.subtitle}</h3>

                      <ul className="artifact-doc-lines artifact-doc-lines--compact">
                        {artifact.docLines?.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>

                      <div className="artifact-photo-caption">
                        <span>{artifact.subtitle}</span>
                        <span className="artifact-photo-year">{artifact.year}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>

          {/* Floating Blue Dossier Card (Modeled after the reference video) */}
          <aside className="floating-dossier-card" aria-label="Artifact specification dossier">
            <div className="dossier-card-header">
              <span className="dossier-badge">{activeArtifact.title}</span>
            </div>

            <div className="dossier-body">
              <h2 className="dossier-title">{activeArtifact.subtitle}</h2>
              <p className="dossier-description">{activeArtifact.description}</p>
              <div className="dossier-meta-row">
                <span className="dossier-year">{activeArtifact.year}</span>
                <span className="dossier-type-tag">{activeArtifact.badge}</span>
              </div>
            </div>

            {/* Action buttons (Yellow pill button + red circle toggle from reference) */}
            <div className="dossier-actions">
              {project.link ? (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dossier-primary-btn"
                  aria-label={`Open external project link for ${project.name}`}
                >
                  <span className="dossier-btn-icon" aria-hidden="true">↗</span>
                  <span>VIEW PROJECT</span>
                </a>
              ) : (
                <button
                  type="button"
                  className="dossier-primary-btn"
                  onClick={handleNextArtifact}
                >
                  <span>NEXT ARTIFACT</span>
                </button>
              )}

              <button
                type="button"
                className="dossier-circle-btn"
                onClick={handleNextArtifact}
                title="Cycle next artifact"
                aria-label="Cycle to next artifact"
              >
                ↻
              </button>
            </div>
          </aside>
        </div>
      </section>

      {/* Disciplines and Footer Metadata */}
      <footer className="archival-footer">
        <div className="archival-disciplines">
          <span className="archival-disciplines-label">TAGGED DISCIPLINES:</span>
          {project.disciplines?.map((d) => (
            <span key={d} className="archival-discipline-pill">{d}</span>
          ))}
        </div>

        <button
          type="button"
          className="archival-footer-back"
          onClick={handleBackClick}
        >
          ← RETURN TO ALL PROJECTS
        </button>
      </footer>
    </article>
  )
}
