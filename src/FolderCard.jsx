import './folder-card.css'

export default function FolderCard({ project, index, onSelect }) {
  return (
    <article
      className="folder-card"
      style={{ animationDelay: `${index * 120}ms` }}
      onClick={() => onSelect(project)}
      role="button"
      tabIndex={0}
      aria-label={`View project: ${project.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(project)
        }
      }}
    >
      {/* Layered depth sheets behind the card */}
      <div className="folder-card-layers" aria-hidden="true">
        <span className="folder-layer folder-layer-2" />
        <span className="folder-layer folder-layer-1" />
      </div>

      {/* Trapezoid tab */}
      <div className="folder-tab">
        <span className="folder-tab-name">{project.tab}</span>
      </div>

      {/* Main card body */}
      <div className="folder-body">
        {/* Cover image */}
        <div className="folder-cover">
          <img
            src={project.cover}
            alt={project.alt}
            className="folder-cover-img"
            loading="lazy"
            draggable="false"
          />
        </div>

        {/* Project details */}
        <div className="folder-details">
          <p className="folder-category">{project.category}</p>
          <p className="folder-description">{project.description}</p>

          <div className="folder-disciplines">
            {project.disciplines.map((d) => (
              <span className="folder-discipline-tag" key={d}>
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}

