import React, { useEffect, useCallback, useState, useMemo } from 'react';
import './project-detail-frame.css';
import { playNavSound, playButtonClickSound } from './soundEffects';

export default function ProjectDetailFrame({ project, onBack, onNavigate }) {
  const [mainIndex, setMainIndex] = useState(0);

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

  // Generate gallery items
  const galleryItems = useMemo(() => {
    if (!project) return [];
    
    // Default positions for styling variation if the same image is reused
    const sidePositions = ['left center', 'center center', 'right center'];
    
    const items = [
      { id: 'cover', src: project.cover, pos: 'center center' }
    ];
    
    if (project.artifacts) {
      project.artifacts.slice(0, 3).forEach((artifact, i) => {
        items.push({
          id: artifact.id,
          src: artifact.image || project.cover,
          pos: sidePositions[i % 3]
        });
      });
    }
    
    return items;
  }, [project]);

  if (!project) return null;

  const mainItem = galleryItems[mainIndex];
  const sideItems = galleryItems.map((item, index) => ({...item, originalIndex: index})).filter((_, index) => index !== mainIndex);

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
          <img 
            src={mainItem.src} 
            alt="Main showcase" 
            className="showcase-img" 
            style={{ objectPosition: mainItem.pos }}
          />
        </div>

        {sideItems.map((item) => (
          <div 
            key={item.id} 
            className="showcase-card side-card"
            onClick={() => {
              playButtonClickSound();
              setMainIndex(item.originalIndex);
            }}
          >
            <img 
              src={item.src} 
              alt="Side showcase" 
              className="showcase-img" 
              style={{ objectPosition: item.pos }} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}
