import { useEffect, useRef } from 'react'
import { useProjects } from '../lib/projectStore'
import { clamp, lerp, motion, onFrame } from './engine'
import { Roll, ScrubText, SplitText } from './SplitText'
import './home-reel.css'

const ROLES = ['Creative Developer', 'Web Developer', 'Graphic Designer', 'Fiction Writer']
const STACK = ['React', 'JavaScript', 'TypeScript', 'UI / UX', 'Motion', 'Full-Stack', 'WebGL']

const CAPABILITIES = [
  ['Front-End Development', 'Responsive interfaces in React, JavaScript & TypeScript'],
  ['UI / UX Design', 'Intuitive flows, editorial layouts and design systems'],
  ['Full-Stack Builds', 'Reservation systems, inquiry pipelines and back offices'],
  ['Narrative & Writing', 'A fiction writer’s instinct for story in every brand'],
]

// Rows drift continuously; scrolling speeds them up and flips their direction.
export function VelocityMarquee({ items, reverse = false, outlined = false }) {
  const trackRef = useRef(null)

  useEffect(() => {
    const track = trackRef.current
    let offset = 0, direction = 1, speed = 1, copyWidth = 0, visible = true
    const measure = () => { copyWidth = track.firstElementChild.getBoundingClientRect().width }
    measure()
    const resize = new ResizeObserver(measure)
    resize.observe(track)
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
    io.observe(track)
    const stop = onFrame(() => {
      if (!visible || motion.reduced || !copyWidth) return
      if (Math.abs(motion.velocity) > 0.5) direction = Math.sign(motion.velocity)
      speed = lerp(speed, 1 + Math.min(Math.abs(motion.velocity) * 0.35, 14), 0.1)
      offset += 0.6 * speed * direction * (reverse ? -1 : 1)
      offset = ((offset % copyWidth) + copyWidth) % copyWidth
      track.style.transform = `translate3d(${-offset}px, 0, 0)`
    })
    return () => { stop(); resize.disconnect(); io.disconnect() }
  }, [reverse])

  const copy = (key) => (
    <div className="marquee-copy" key={key} aria-hidden={key > 0 || undefined}>
      {items.map((item) => <span key={item}>{item}<i>✱</i></span>)}
    </div>
  )

  return (
    <div className={`marquee-row${outlined ? ' marquee-row--outline' : ''}`}>
      <div className="marquee-track" ref={trackRef}>{[0, 1, 2].map(copy)}</div>
    </div>
  )
}

// Vertical scroll drives a horizontal filmstrip of projects while the frame stays pinned.
function WorkReel({ projects, onOpenProject, onNavigate }) {
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const barRef = useRef(null)
  const countRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    const cards = [...track.querySelectorAll('.reel-card')]
    const bar = barRef.current
    const count = countRef.current
    const media = window.matchMedia('(max-width: 760px)')
    let distance = 0, current = 0, visible = false, lastIndex = -1

    const layout = () => {
      if (media.matches) {
        section.style.height = ''
        track.style.transform = ''
        distance = 0
        return
      }
      distance = Math.max(0, track.scrollWidth - window.innerWidth)
      section.style.height = `${distance + window.innerHeight}px`
    }
    layout()
    const resize = new ResizeObserver(layout)
    resize.observe(track)
    media.addEventListener('change', layout)
    window.addEventListener('resize', layout)
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting }, { rootMargin: '10% 0px' })
    io.observe(section)

    const setCount = (progress) => {
      bar.style.transform = `scaleX(${progress.toFixed(4)})`
      const index = Math.min(projects.length, Math.max(1, Math.round(progress * (projects.length - 1)) + 1))
      if (index !== lastIndex) { count.textContent = String(index).padStart(2, '0'); lastIndex = index }
    }

    const stop = onFrame(() => {
      if (!visible) return
      // Phones swipe the strip natively; the counter just follows the swipe.
      if (media.matches) {
        const max = track.scrollWidth - track.clientWidth
        setCount(max > 0 ? clamp(track.scrollLeft / max, 0, 1) : 0)
        return
      }
      if (!distance) return
      const rect = section.getBoundingClientRect()
      const target = clamp(-rect.top / distance, 0, 1)
      current = motion.reduced ? target : lerp(current, target, 0.12)
      track.style.transform = `translate3d(${(-current * distance).toFixed(2)}px, 0, 0)`
      const vw = window.innerWidth
      cards.forEach((card) => {
        const box = card.getBoundingClientRect()
        const offset = (box.left + box.width / 2 - vw / 2) / vw
        card.style.setProperty('--px', `${clamp(offset * -5, -6, 6).toFixed(2)}%`)
      })
      setCount(current)
    })

    return () => {
      stop(); resize.disconnect(); io.disconnect()
      media.removeEventListener('change', layout)
      window.removeEventListener('resize', layout)
    }
  }, [projects])

  return (
    <section className="reel" ref={sectionRef} aria-labelledby="reel-title">
      <div className="reel-sticky">
        <div className="reel-track" ref={trackRef} style={{ '--reel-count': projects.length + 1 }}>
          <header className="reel-intro">
            <p className="reel-kicker" data-reveal="up">(02) Selected work</p>
            <h2 id="reel-title"><SplitText text="Built" /><br /><SplitText text="to be" delay={120} /><br /><em><SplitText text="felt." delay={240} /></em></h2>
            <p className="reel-hint" data-reveal="up" style={{ '--reveal-delay': '300ms' }}>
              <span className="reel-hint-desktop">Keep scrolling</span><span className="reel-hint-phone">Swipe to explore</span> <span aria-hidden="true">→</span>
            </p>
          </header>

          {projects.map((project, i) => (
            <article className="reel-card" key={project.id}>
              <button type="button" className="reel-card-hit" data-cursor="View case" onClick={() => onOpenProject(project)}
                aria-label={`Open case study: ${project.name}`}>
                <div className="reel-card-frame">
                  <div className="reel-card-media">
                    <img src={project.cover} alt="" loading="lazy" decoding="async" />
                  </div>
                  <span className="reel-card-index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className="reel-card-meta">
                  <p className="reel-card-category">{project.category}</p>
                  <h3>{project.name}</h3>
                  <ul>{project.disciplines.map((d) => <li key={d}>{d}</li>)}</ul>
                </div>
              </button>
            </article>
          ))}

          <div className="reel-outro">
            <button type="button" className="reel-outro-link" data-magnetic="0.25" data-cursor="Archive" onClick={() => onNavigate('projects')}>
              <span>Full<br />archive</span><i aria-hidden="true">↗</i>
            </button>
          </div>
        </div>

        <div className="reel-progress" aria-hidden="true">
          <span><b ref={countRef}>01</b> / {String(projects.length).padStart(2, '0')}</span>
          <div className="reel-progress-bar"><i ref={barRef} /></div>
          <span>Selected work</span>
        </div>
      </div>
    </section>
  )
}

export default function HomeReel({ onNavigate, onOpenProject }) {
  const projects = useProjects()
  return (
    <div className="home-reel">
      <section className="home-marquee" aria-label="Roles and tools">
        <div className="home-marquee-skew">
          <VelocityMarquee items={ROLES} />
          <VelocityMarquee items={STACK} reverse outlined />
        </div>
      </section>

      <section className="home-manifesto" aria-labelledby="manifesto-label">
        <p id="manifesto-label" className="home-label" data-reveal="up">(01) Manifesto</p>
        <ScrubText
          className="home-manifesto-text"
          text="I craft clean, responsive and user-focused digital experiences — where aesthetic warmth meets robust code, tuned down to the smallest detail."
          accent={[10, 11, 12, 13, 14]}
        />
        <div className="home-manifesto-foot">
          <span data-reveal="line" className="home-rule" />
          <p data-reveal="up">B.S. Computer Science · Native Legacy Team · Davao City</p>
        </div>
      </section>

      <WorkReel projects={projects} onOpenProject={onOpenProject} onNavigate={onNavigate} />

      <section className="home-capabilities" aria-labelledby="capabilities-title">
        <header className="home-capabilities-head">
          <p className="home-label" data-reveal="up">(03) Capabilities</p>
          <h2 id="capabilities-title"><SplitText text="What I bring" /><br /><SplitText text="to the table." delay={160} /></h2>
        </header>
        <ol className="capability-list">
          {CAPABILITIES.map(([title, detail], i) => (
            <li className="capability" key={title} data-reveal="up" style={{ '--reveal-delay': `${i * 80}ms` }}>
              <span className="capability-index">0{i + 1}</span>
              <h3><Roll>{title}</Roll></h3>
              <p>{detail}</p>
              <span className="capability-arrow" aria-hidden="true">↗</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-cta" aria-labelledby="cta-title">
        <p className="home-label" data-reveal="up">(04) Next chapter</p>
        <h2 id="cta-title" className="home-cta-title">
          <SplitText text="Let’s make" /><br />
          <span className="home-cta-outline"><SplitText text="it move." delay={180} /></span>
        </h2>
        <div className="home-cta-actions">
          <button type="button" className="home-cta-orb" data-magnetic="0.45" data-cursor="Let’s talk" onClick={() => onNavigate('contact')}>
            <span>Start a<br />project</span>
          </button>
          <button type="button" className="home-cta-link" onClick={() => onNavigate('about')}>
            <Roll>More about me</Roll> <span aria-hidden="true">↗</span>
          </button>
        </div>
      </section>
    </div>
  )
}
