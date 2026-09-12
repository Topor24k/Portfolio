import React, { useEffect, useCallback, useState, useMemo } from 'react';
import './project-detail-frame.css';
import { playNavSound, playButtonClickSound } from './soundEffects';

export default function ProjectDetailFrame({ project, onBack, onNavigate }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleBack = useCallback(() => {
    playNavSound();
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

      {/* 3D Looping Carousel */}
      <div className="project-carousel-container">
        <div className="carousel-stage">
          {displayItems.map((item, index) => {
            const { position } = getSlideState(index);
            const isLeft = position === 'left';
            const isRight = position === 'right';

            return (
              <div
                key={item.keyId}
                className={`carousel-slide is-${position}`}
                onClick={() => {
                  if (isLeft) handlePrev();
                  else if (isRight) handleNext();
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
                onClick={handlePrev}
                aria-label="Previous image"
              >
                <span className="btn-arrow">←</span>
                <span className="btn-text">PREV</span>
              </button>
              <button
                type="button"
                className="carousel-side-btn next-side-btn"
                onClick={handleNext}
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
    </div>
  );
}
