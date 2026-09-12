import { useEffect, useRef } from 'react'
import './project-modal.css'

export default function ProjectModal({ project, onClose, onNavigate }) {
  const backdropRef = useRef(null)

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)

    // Prevent body scroll while modal is open
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose()
  }

  const number = (() => {
    // We don't have the index here, but we can derive from the project id
    // For a cleaner approach the parent passes it
    return null
  })()

  return (
    <div
      className="project-modal-backdrop"
      ref={backdropRef}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={project.name}
    >
      <div className="project-modal-card">
        <button
          className="modal-close-btn"
          type="button"
          onClick={onClose}
          aria-label="Close project details"
        >
          ✕
        </button>

        {/* Header */}
        <p className="modal-eyebrow">{project.category}</p>
        <h2 className="modal-title">{project.name}</h2>

        {/* Description */}
        <p className="modal-body-text">{project.details || project.description}</p>

        {/* Image gallery */}
        <div className="project-modal-gallery">
          {project.images.map((img, i) => (
            <figure className="project-modal-figure" key={i}>
              <img
                src={img.src}
                alt={img.alt}
                className="project-modal-img"
                loading="lazy"
                draggable="false"
              />
              {img.caption && (
                <figcaption className="project-modal-caption">
                  {img.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>

        {/* Disciplines */}
        <div className="modal-skills-group">
          <span className="modal-skills-label">DISCIPLINES</span>
          <div className="modal-tags-list">
            {project.disciplines.map((d) => (
              <span className="modal-tag" key={d}>{d}</span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="modal-actions-row">
          {project.link && (
            <a
              className="modal-action-primary"
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              VIEW PROJECT →
            </a>
          )}
          {project.destination && onNavigate && (
            <button
              className="modal-action-secondary"
              type="button"
              onClick={() => {
                onClose()
                onNavigate(project.destination)
              }}
            >
              VIEW LIVE →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

