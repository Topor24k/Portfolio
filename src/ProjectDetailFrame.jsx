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
          <div className="showcase-overlay">
            <div className="showcase-icon">⌘</div>
            <h3 className="showcase-title">{project.name} Overview</h3>
            <p className="showcase-desc">{project.description}</p>
          </div>
          <div className="health-score-box">
            <div className="score-label">Performance Score</div>
            <div className="score-number">98</div>
            <div className="score-label">out of 100</div>
          </div>
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
              <div className="showcase-overlay">
                <div className="showcase-icon">✧</div>
                <h3 className="showcase-title">{artifact.subtitle || artifact.title}</h3>
                <p className="showcase-desc">{artifact.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
