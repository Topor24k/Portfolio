import React, { useEffect, useState, useCallback, useRef } from 'react';
import './project-detail-frame.css';
import { playButtonClickSound, playNavSound } from './soundEffects';

export default function ProjectDetailFrame({ project, onBack, onNavigate }) {
  const [activeArtifactId, setActiveArtifactId] = useState(null);
  const deskRef = useRef(null);

  const handleBack = useCallback(() => {
    playNavSound();
    if (onBack) onBack();
  }, [onBack]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeArtifactId) {
          setActiveArtifactId(null);
        } else {
          handleBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeArtifactId, handleBack]);

  const handleDeskClick = (e) => {
    if (e.target === deskRef.current) {
      setActiveArtifactId(null);
    }
  };

  const getArtifactPos = (index) => {
    const positions = [
      { left: '5%', top: '8%', rotate: '-3deg' },
      { left: '38%', top: '5%', rotate: '2deg' },
      { left: '15%', top: '55%', rotate: '-5deg' },
      { left: '55%', top: '45%', rotate: '4deg' },
      { left: '70%', top: '15%', rotate: '-2deg' },
    ];
    return positions[index % positions.length];
  };

  if (!project) return null;

  const activeArtifact = project.artifacts?.find(a => a.id === activeArtifactId);

  return (
    <div className="project-detail-container">
      {/* Top Bar */}
      <header className="detail-top-bar">
        <div className="breadcrumbs">
          <button className="back-btn" onClick={handleBack}>
            ← {project.breadcrumbs || 'Source / Drawer / Registry / Residue'}
          </button>
        </div>
        <div className="archive-meta">
          <span className="archive-label">Archive Assemblage</span>
          <span className="archive-date">{project.archiveDate || 'Jul 29, 1975'}</span>
        </div>
      </header>

      {/* Main Title */}
      <h1 className="project-title">{project.name}</h1>

      {/* Dual-column Prose */}
      {project.overview && (
        <div className="prose-columns">
          <div className="prose-col">{project.overview.p1}</div>
          <div className="prose-col">{project.overview.p2}</div>
        </div>
      )}

      {/* Artifacts Desk */}
      <div className="archival-desk" ref={deskRef} onClick={handleDeskClick}>
        <div className="desk-label">ARTIFACTS DESK</div>
        
        {project.artifacts?.map((artifact, index) => {
          const pos = getArtifactPos(index);
          const isFocused = activeArtifactId === artifact.id;
          const isDimmed = activeArtifactId && !isFocused;
          
          let className = 'desk-artifact';
          if (isFocused) className += ' is-focused';
          if (isDimmed) className += ' is-dimmed';
          
          return (
            <div 
              key={artifact.id}
              className={className}
              style={{
                '--rotate': pos.rotate,
                left: pos.left,
                top: pos.top,
              }}
              onClick={(e) => {
                e.stopPropagation();
                playButtonClickSound();
                setActiveArtifactId(artifact.id);
              }}
            >
              {artifact.type === 'screen' && (
                <div className="artifact-screen-housing">
                  <div className="screen-header">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                  </div>
                  {artifact.image ? (
                    <img src={artifact.image} alt={artifact.title} />
                  ) : (
                    <div className="placeholder-image">SCREEN CAPTURE</div>
                  )}
                </div>
              )}
              
              {artifact.type === 'document' && (
                <div className="artifact-document-housing">
                  <div className="doc-header">
                    <span className="doc-number">{artifact.docNumber || 'DOC-01'}</span>
                    <span className="doc-category">{artifact.docCategory || 'SPECIFICATION'}</span>
                  </div>
                  <h3 className="doc-title">{artifact.docTitle || artifact.title}</h3>
                  <div className="doc-lines">
                    {artifact.docLines?.map((line, i) => (
                      <div key={i} className="doc-line">{line}</div>
                    ))}
                    {!artifact.docLines && (
                      <>
                        <div className="doc-line"></div>
                        <div className="doc-line"></div>
                        <div className="doc-line"></div>
                        <div className="doc-line w-75"></div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {artifact.type === 'photo' && (
                <div className="artifact-photo-housing">
                  <div className="photo-frame">
                    {artifact.image ? (
                      <img src={artifact.image} alt={artifact.title} />
                    ) : (
                      <div className="placeholder-image">PHOTOGRAPH</div>
                    )}
                  </div>
                  <div className="photo-caption">{artifact.title}</div>
                </div>
              )}

              {artifact.type === 'log' && (
                <div className="artifact-log-housing">
                  <div className="log-header">FIELD LOG</div>
                  <div className="log-content">{artifact.description}</div>
                </div>
              )}
            </div>
          );
        })}

        {/* Floating Dossier Card */}
        <div className={`floating-dossier-card ${activeArtifactId ? 'is-expanded' : 'dossier-collapsed'}`}>
          {!activeArtifactId ? (
            <div className="dossier-label">Reading Area</div>
          ) : (
            <div className="dossier-content">
              <div className="dossier-header">
                <span className="dossier-badge">{activeArtifact.type.toUpperCase()}</span>
                <span className="dossier-year">{activeArtifact.year || '1995'}</span>
              </div>
              <h3 className="dossier-title">{activeArtifact.title}</h3>
              <p className="dossier-desc">{activeArtifact.description}</p>
              
              <div className="dossier-actions">
                <button className="dossier-btn-download" onClick={() => playButtonClickSound()}>Download</button>
                <button className="dossier-btn-action" onClick={() => {
                  playButtonClickSound();
                  setActiveArtifactId(null);
                }}>×</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
