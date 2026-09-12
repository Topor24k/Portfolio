import React, { useEffect, useCallback } from 'react';
import './project-detail-frame.css';
import { playNavSound } from './soundEffects';

export default function ProjectDetailFrame({ project, onBack, onNavigate }) {
  const handleBack = useCallback(() => {
    playNavSound();
    if (onBack) onBack();
  }, [onBack]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleBack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBack]);

  if (!project) return null;

  return (
    <div className="project-detail-container">
      {/* Top Bar */}
      <header className="detail-top-bar">
        <div className="breadcrumbs">
          <button className="back-btn" onClick={handleBack}>
            ← Back To Project
          </button>
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

      {/* Project Showcase Gallery */}
      <div className="project-showcase">
        <div className="showcase-card main-card">
          <img src={project.cover} alt={project.name} className="showcase-img" />
        </div>

        {project.artifacts?.slice(0, 3).map((artifact, idx) => {
          // Adjust object-position so the same image looks slightly different in each column
          const positions = ['left center', 'center center', 'right center'];
          return (
            <div key={artifact.id} className="showcase-card side-card">
              <img 
                src={project.cover} 
                alt={artifact.title} 
                className="showcase-img" 
                style={{ objectPosition: positions[idx % positions.length] }} 
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
