import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import './project-detail-frame.css';
import { playButtonClickSound } from './soundEffects';

function ProjectTeam({ project }) {
  const members = project.team || [];
  if (!members.length) return null;

  return (
    <section className="project-team" aria-labelledby={`project-team-${project.id}`}>
      <header className="project-team-header">
        <div>
          <p className="project-team-kicker">People / Project contributors</p>
          <h2 id={`project-team-${project.id}`} className="project-team-title">Project Credits</h2>
        </div>
        <div className="project-team-mark">
          <span>{project.teamLabel || 'Project Team'}</span>
          <span>{String(members.length).padStart(2, '0')} / People</span>
        </div>
      </header>

      <div className={`project-team-grid project-team-grid--${members.length}`}>
        {members.map((member, index) => (
          <article className="project-team-member" key={member.name}>
            <div className="project-team-photo">
              <img src={member.image} alt={member.alt} loading="lazy" decoding="async" />
              <span aria-hidden="true">0{index + 1}</span>
            </div>
            <div className="project-team-credit">
              <h3>{member.name}</h3>
              <p>{member.role}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function ProjectDetailFrame({ project, onBack, onNavigate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const pointerRef = useRef({ startX: 0, startY: 0, active: false });

  const handleBack = useCallback(() => {
    playButtonClickSound();
    if (onBack) onBack();
  }, [onBack]);

  // Generate gallery items
  const galleryItems = useMemo(() => {
    if (!project) return [];

    if (project.gallery && project.gallery.length > 0) {
      return project.gallery.map((img, i) => ({
        id: `gallery-${i}`,
        src: typeof img === 'string' ? img : img.src,
        alt: `${project.name} preview ${i + 1}`,
      }));
    }

    if (project.images && project.images.length > 1) {
      return project.images.map((img, i) => ({
        id: `img-${i}`,
        src: img.src,
        alt: img.alt || `${project.name} preview ${i + 1}`,
      }));
    }

    const items = [{ id: 'cover', src: project.cover, alt: project.alt || project.name }];
    if (project.artifacts) {
      project.artifacts.forEach((artifact) => {
        if (artifact.image && artifact.image !== project.cover) {
          items.push({ id: artifact.id, src: artifact.image, alt: artifact.title });
        }
      });
    }
    return items;
  }, [project]);

  // Ensure minimum items for 3-card carousel (prev, center, next)
  const displayItems = useMemo(() => {
    if (galleryItems.length <= 1) {
      return galleryItems.map((item, i) => ({ ...item, displayIndex: i, keyId: `single-${i}` }));
    }
    if (galleryItems.length === 2) {
      return [
        { ...galleryItems[0], displayIndex: 0, keyId: '0-a' },
        { ...galleryItems[1], displayIndex: 1, keyId: '1-a' },
        { ...galleryItems[0], displayIndex: 0, keyId: '0-b' },
        { ...galleryItems[1], displayIndex: 1, keyId: '1-b' },
      ];
    }
    return galleryItems.map((item, i) => ({ ...item, displayIndex: i, keyId: `slide-${i}` }));
  }, [galleryItems]);

  const total = displayItems.length;

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    playButtonClickSound();
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    playButtonClickSound();
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Swipe gesture handling for touch and pointer events
  const handlePointerDown = (e) => {
    if (e.button && e.button !== 0) return;
    pointerRef.current = { startX: e.clientX, startY: e.clientY, active: true };
  };

  const handlePointerUp = (e) => {
    if (!pointerRef.current.active) return;
    pointerRef.current.active = false;

    const deltaX = e.clientX - pointerRef.current.startX;
    const deltaY = e.clientY - pointerRef.current.startY;

    // Minimum horizontal swipe distance of 40px and dominant horizontal movement
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  const handlePointerCancel = () => {
    pointerRef.current.active = false;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleBack();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBack, handleNext, handlePrev]);

  // Determine slide position relative to current center
  const getSlideState = (index) => {
    if (total <= 1) return { position: 'center', diff: 0 };
    let diff = index - currentIndex;
    while (diff > total / 2) diff -= total;
    while (diff < -total / 2) diff += total;

    if (diff === 0) return { position: 'center', diff };
    if (diff === -1) return { position: 'left', diff };
    if (diff === 1) return { position: 'right', diff };
    if (diff < -1) return { position: 'hidden-left', diff };
    return { position: 'hidden-right', diff };
  };

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

      {/* 3D Looping Carousel with Swipe Support */}
      <div className="project-carousel-container">
        <div 
          className="carousel-stage"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          {displayItems.map((item, index) => {
            const { position } = getSlideState(index);
            const isLeft = position === 'left';
            const isRight = position === 'right';

            return (
              <div
                key={item.keyId}
                className={`carousel-slide is-${position}`}
                onClick={(e) => {
                  if (isLeft) {
                    e.stopPropagation();
                    handlePrev();
                  } else if (isRight) {
                    e.stopPropagation();
                    handleNext();
                  }
                }}
                role={isLeft || isRight ? 'button' : undefined}
                tabIndex={isLeft || isRight ? 0 : -1}
                aria-label={isLeft ? 'Previous slide' : isRight ? 'Next slide' : undefined}
              >
                <img
                  src={item.src}
                  alt={item.alt || `${project.name} photo`}
                  className="carousel-img"
                  draggable={false}
                />
              </div>
            );
          })}

          {/* Left and Right Navigation Buttons */}
          {galleryItems.length > 1 && (
            <>
              <button
                type="button"
                className="carousel-side-btn prev-side-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                aria-label="Previous image"
              >
                <span className="btn-arrow">←</span>
                <span className="btn-text">PREV</span>
              </button>
              <button
                type="button"
                className="carousel-side-btn next-side-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                aria-label="Next image"
              >
                <span className="btn-text">NEXT</span>
                <span className="btn-arrow">→</span>
              </button>
            </>
          )}
        </div>

        {/* Carousel Indicator */}
        {galleryItems.length > 1 && (
          <div className="carousel-indicator">
            <span className="carousel-counter">
              {String((displayItems[currentIndex]?.displayIndex ?? currentIndex) + 1).padStart(2, '0')} / {String(galleryItems.length).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      <ProjectTeam project={project} />
    </div>
  );
}
