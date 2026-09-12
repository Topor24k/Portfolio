import { useEffect, useRef, useState } from 'react'
import './hanging-badge.css'
import { playIdLaceSound, playIdSwitchSound } from './soundEffects'

export default function HangingBadge({ isOpen, onClose, onOpenProjects }) {
  const [flipped, setFlipped] = useState(false)
  const [pull, setPull] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [closing, setClosing] = useState(false)
  const [entered, setEntered] = useState(false)
  const [expanding, setExpanding] = useState(false)
  const [expandActive, setExpandActive] = useState(false)
  const [fadingOverlay, setFadingOverlay] = useState(false)
  const [expandRect, setExpandRect] = useState(null)
  const cardHolderRef = useRef(null)
  const gesture = useRef(null)
  const skipClick = useRef(false)
  const finishing = useRef(false)
  const closeCallback = useRef(onClose)
  closeCallback.current = onClose
  const threshold = Math.min(90, window.innerHeight * 0.12)

  useEffect(() => {
    if (!isOpen) {
      if (expanding) return
      setFlipped(false)
      setPull(0)
      setDragging(false)
      setClosing(false)
      setEntered(false)
      setExpanding(false)
      setExpandActive(false)
      setFadingOverlay(false)
      setExpandRect(null)
      gesture.current = null
      finishing.current = false
    } else {
      playIdLaceSound()
    }
  }, [isOpen, expanding])

  const handleExpandToProjects = (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (closing || expanding) return
    const rect = cardHolderRef.current?.getBoundingClientRect()
    if (rect) {
      setExpandRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      })
    }
    setFlipped(false)
    setExpanding(true)
  }

  useEffect(() => {
    if (!expanding) return
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setExpandActive(true)
      })
    })

    const timer1 = setTimeout(() => {
      onOpenProjects?.()
      setFadingOverlay(true)

      const timer2 = setTimeout(() => {
        onClose?.()
        setFlipped(false)
        setEntered(false)
        setClosing(false)
        setDragging(false)
        setPull(0)
        setExpanding(false)
        setExpandActive(false)
        setFadingOverlay(false)
        setExpandRect(null)
      }, 3050)

      return () => clearTimeout(timer2)
    }, 750)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer1)
    }
  }, [expanding, onOpenProjects, onClose])

  const dismiss = () => {
    if (finishing.current) return
    finishing.current = true
    gesture.current = null
    setDragging(false)
    setClosing(true)
    playIdLaceSound()
  }

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  useEffect(() => {
    if (!closing) return
    // The animation event closes normally; this also handles interrupted animations.
    const timeout = window.setTimeout(() => closeCallback.current(), 1100)
    return () => window.clearTimeout(timeout)
  }, [closing])

  const startDrag = (event) => {
    if (closing || !event.isPrimary || event.button !== 0) return
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, pull: 0, moved: false }
    skipClick.current = false
    setEntered(true)
    setDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const moveDrag = (event) => {
    const active = gesture.current
    if (!active || active.id !== event.pointerId) return
    const dx = event.clientX - active.x
    const dy = event.clientY - active.y
    if (Math.hypot(dx, dy) > 7) active.moved = true
    const downward = Math.max(0, dy)
    active.pull = Math.min(threshold, downward)
    setPull(active.pull)
  }

  const endDrag = (event, cancelled = false) => {
    const active = gesture.current
    if (!active || active.id !== event.pointerId) return
    gesture.current = null
    skipClick.current = active.moved || cancelled
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (!cancelled && active.pull >= threshold) dismiss()
    else setPull(0)
  }

  const flipCard = (event) => {
    if (closing || expanding) return
    if (event.target.closest?.('.badge-projects-btn') || event.target.closest?.('.badge-projects-overlay')) {
      return
    }
    if (skipClick.current && event.detail !== 0) {
      skipClick.current = false
      return
    }
    playIdSwitchSound()
    setFlipped((value) => !value)
  }

  return (
    <div
      id="hanging-business-card"
      className={`badge-stage${isOpen ? ' is-open' : ''}${entered ? ' has-entered' : ''}${dragging ? ' is-dragging' : ''}${closing ? ' is-closing' : ''}${expanding ? ' is-expanding' : ''}`}
      aria-hidden={!isOpen}
      style={{ '--lanyard-pull': `${pull}px`, '--pull-progress': Math.min(1, pull / threshold) }}
    >
      <div className="badge-anchor">
        <div className="badge-sway">
          <div
            className="badge-carriage"
            onAnimationEnd={(event) => {
              if (event.target === event.currentTarget && event.animationName === 'badge-drop') setEntered(true)
              if (event.target === event.currentTarget && event.animationName === 'badge-retract') closeCallback.current()
            }}
          >
            <svg className="badge-lace" viewBox="0 0 1024 1536" aria-hidden="true">
              <defs>
                {/* Cut out the photographic hardware, including the open metal loops. */}
                <clipPath id="lanyard-cutout">
                  <path clipRule="evenodd" d="M429 0 H593 V726 Q609 725 610 746 L613 788 Q613 801 600 815 Q615 853 609 899 Q607 924 593 937 L603 979 L603 1020 Q603 1034 592 1034 L590 1130 Q609 1138 603 1166 Q595 1211 572 1228 L541 1243 L539 1260 L551 1315 L579 1324 Q594 1330 589 1347 Q584 1360 559 1357 L570 1408 Q575 1432 554 1456 Q536 1474 510 1475 Q483 1474 466 1456 Q450 1440 454 1406 L472 1329 L484 1260 L484 1243 Q453 1235 437 1207 Q420 1180 418 1152 Q418 1139 433 1130 L432 1033 Q415 1035 414 1021 L415 979 L429 938 Q412 917 414 869 Q414 840 430 816 L417 803 Q409 794 413 776 L415 745 Q416 730 428 727 Z M432 771 Q450 778 577 773 L590 768 L587 778 L438 780 Z M435 1143 Q425 1146 431 1165 Q442 1201 461 1214 L482 1225 L482 1217 Q483 1208 493 1204 Q513 1198 531 1206 L540 1217 L540 1226 Q574 1214 586 1180 L591 1150 L587 1144 L584 1157 Q510 1164 439 1156 Z M493 1353 Q508 1340 524 1355 Q542 1376 548 1407 Q554 1430 537 1446 Q523 1459 508 1457 Q486 1454 475 1439 Q468 1425 473 1406 Z" />
                </clipPath>
              </defs>
              <image href="/Business%20Card/lanyard-hardware.png" width="1024" height="1536" clipPath="url(#lanyard-cutout)" />
            </svg>
            <div
              ref={cardHolderRef}
              role="button"
              className={`badge-holder${flipped ? ' is-flipped' : ''}`}
              tabIndex={isOpen && !closing ? 0 : -1}
              aria-label={flipped ? 'Show front of business card' : 'Show back of business card'}
              aria-describedby="badge-instructions"
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={(event) => endDrag(event, true)}
              onLostPointerCapture={(event) => endDrag(event, true)}
              onClick={flipCard}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  flipCard(event)
                }
              }}
              onDragStart={(event) => event.preventDefault()}
            >
              <span className="badge-rotator">
                <span className="badge-face badge-front" aria-hidden={flipped}>
                  <span className="badge-slot" aria-hidden="true" />
                  <img src="/Business%20Card/Front.png" alt="Kayeen M. Campaña — Web Developer. Business card front with contact details." draggable="false" />
                </span>
                <span className="badge-face badge-back" aria-hidden={!flipped}>
                  <span className="badge-slot" aria-hidden="true" />
                  <img src="/Business%20Card/Back.png" alt="Native Legacy logo — business card back." draggable="false" />
                  <div className="badge-projects-overlay">
                    <button
                      type="button"
                      className="badge-projects-btn"
                      onPointerDown={(e) => e.stopPropagation()}
                      onPointerUp={(e) => e.stopPropagation()}
                      onClick={handleExpandToProjects}
                      aria-label="View projects made with Native Legacy Group"
                    >
                      <span>VIEW PROJECTS WITH NATIVE LEGACY ↗</span>
                    </button>
                  </div>
                </span>
              </span>
            </div>
            <div className="badge-caption" id="badge-instructions">
              <span className="badge-side-label">{flipped ? '02 / BACK' : '01 / FRONT'}</span>
              <span>
                {dragging
                  ? (pull >= threshold ? 'RELEASE TO CLOSE ↑' : 'PULL A LITTLE MORE ↓')
                  : (flipped
                      ? 'CLICK TO FLIP BACK · OR VIEW PROJECTS ABOVE'
                      : 'CLICK TO FLIP · PULL DOWN TO CLOSE')}
              </span>
              <span className="badge-pull-track" aria-hidden="true"><span /></span>
              <span className="sr-only">Press Enter or Space to flip. Press Escape to close.</span>
            </div>
          </div>
        </div>
      </div>

      {expanding && (
        <div
          className={`badge-expansion-portal${expandActive ? ' is-expanded' : ''}${fadingOverlay ? ' is-fading' : ''}`}
          style={{
            '--start-top': `${expandRect?.top || 0}px`,
            '--start-left': `${expandRect?.left || 0}px`,
            '--start-width': `${expandRect?.width || 0}px`,
            '--start-height': `${expandRect?.height || 0}px`,
          }}
          aria-hidden="true"
        >
          <div className="expansion-inner">
            <img src="/Business%20Card/Back.png" alt="" className="expansion-image" />
          </div>
        </div>
      )}
    </div>
  )
}
