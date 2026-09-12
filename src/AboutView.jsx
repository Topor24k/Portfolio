import { useEffect, useState } from 'react'
import './about-view.css'

const WORD_SETS = [
  ['Keen', 'Meticulous', 'Creative'],
  ['Kayeen', 'Melecio', 'Campaña'],
]

function useRotatingHeadline() {
  const [setIndex, setSetIndex] = useState(0)
  const [displayedWords, setDisplayedWords] = useState(WORD_SETS[0])
  const [phase, setPhase] = useState('HOLD') // 'HOLD' | 'DELETING' | 'TYPING'

  useEffect(() => {
    let timer

    if (phase === 'HOLD') {
      timer = setTimeout(() => {
        setPhase('DELETING')
      }, 10000)
    } else if (phase === 'DELETING') {
      const anyHasLength = displayedWords.some((w) => w.length > 0)
      if (!anyHasLength) {
        setSetIndex((curr) => (curr + 1) % WORD_SETS.length)
        setPhase('TYPING')
      } else {
        timer = setTimeout(() => {
          setDisplayedWords((prev) => prev.map((w) => (w.length > 0 ? w.slice(0, -1) : '')))
        }, 45)
      }
    } else if (phase === 'TYPING') {
      const targetWords = WORD_SETS[setIndex]
      const allDone = displayedWords.every((w, i) => w === targetWords[i])

      if (allDone) {
        setPhase('HOLD')
      } else {
        timer = setTimeout(() => {
          setDisplayedWords((prev) =>
            prev.map((w, i) => {
              const target = targetWords[i]
              if (w.length < target.length) {
                return target.slice(0, w.length + 1)
              }
              return w
            })
          )
        }, 75)
      }
    }

    return () => clearTimeout(timer)
  }, [phase, displayedWords, setIndex])

  return displayedWords
}

const interests = [
  ['Writing', 'Structuring thoughts, organizing internal narratives, and practicing clear communication.'],
  ['Gaming', 'Immersive world-building, reflex training, and unraveling complex game mechanics.'],
  ['Eating', 'Savoring local gastronomy, comforting rituals, and discovering new flavors with friends.'],
  ['Board Games', 'Exploring strategy, solving challenges, and sharing a little friendly competition around the table.'],
]

export default function AboutView({ onNavigate }) {
  const headlineWords = useRotatingHeadline()

  return (
    <article className="about-view" aria-label="About Kayeen M. Campaña">
      <div className="about-container">
        <section className="about-cover" aria-labelledby="about-title">
          <div className="about-hero-grid">
            <figure className="about-portrait">
              <img
                src="/About%20Me%20Images/Kayeen%201.jpg"
                alt="Kayeen M. Campaña in a black jacket and tie, looking toward the right"
                width="1080"
                height="1080"
                draggable="false"
                fetchPriority="high"
              />
              <figcaption className="about-sr-only">Fig. 01 / Portrait & stance</figcaption>
            </figure>
            <div className="about-hero-copy">
              <p className="about-label">What I Am / Who I Am / What I Do</p>
              <h1 id="about-title" className="about-headline" aria-label="Keen, Meticulous, Creative. Kayeen Melecio Campaña.">
                <span aria-hidden="true">{headlineWords[0] || '\u00A0'}</span>
                <span aria-hidden="true">{headlineWords[1] || '\u00A0'}</span>
                <span className="about-accent" aria-hidden="true">{headlineWords[2] || '\u00A0'}</span>
              </h1>
              <p className="about-role">
                B.S. Computer Science student<br />
                Front-end design & development
              </p>
            </div>
          </div>

          <div className="about-cover-caption">
            <span>Kayeen M. Campaña</span>
            <span>Getafe, Bohol <span aria-hidden="true">→</span> Davao <span className="about-caption-separator">/</span> Age 21</span>
          </div>
        </section>

        <section className="about-foundation about-section" aria-labelledby="about-foundation-title">
          <div className="about-foundation-copy">
            <header>
              <p className="about-label">01 The foundation</p>
              <h2 id="about-foundation-title" className="about-section-title">The person<br />behind the pixels.</h2>
            </header>
            <div className="about-prose">
              <p className="about-lead">
                I am Kayeen M. Campaña, a 21-year-old Computer Science student from Davao City,
                originally from Getafe, Bohol. I have a strong foundation in front-end web development.
              </p>
              <p>
                Currently pursuing a Bachelor of Science in Computer Science, I channel my academic
                training into crafting clean, responsive, and user-focused web interfaces. My primary
                focus lies in front-end design — turning ideas into intuitive digital experiences.
              </p>
            </div>
          </div>
          <figure className="about-photo-story">
            <img
              className="about-photo-story-mirrored"
              src="/About%20Me%20Images/My%20Projects%20Side%20Photo.png"
              alt="Kayeen looking up from a laptop at a café table"
              width="1070"
              height="1082"
              draggable="false"
              loading="lazy"
              decoding="async"
            />
            <figcaption>
              <span>Davao City · Workspace & craft</span>
            </figcaption>
          </figure>
        </section>

        <section className="about-philosophy about-section" aria-labelledby="about-philosophy-title">
          <h2 id="about-philosophy-title" className="about-label">Core philosophy</h2>
          <blockquote>
            Success is not about doing everything perfectly, but about <span className="about-accent">consistently doing what's best.</span>
          </blockquote>
          <div className="about-creed">
            <span className="about-label">The creed I carry</span>
            <p>
              “I believe that real excellence is not about doing everything perfectly at first,
              but about consistently dedicating yourself to bringing aesthetic warmth and robust
              code mechanics to every single product.”
            </p>
          </div>
        </section>

        <section className="about-escapes about-section" aria-labelledby="about-escapes-title">
          <div className="about-escapes-copy">
            <p className="about-label">02 Creative escapes</p>
            <h2 id="about-escapes-title" className="about-section-title">A little life<br /><span className="about-accent">beyond the screen.</span></h2>
            <div className="about-prose">
              <p>
                Stepping back from the screen is just as vital as the time spent coding. Rest, curiosity,
                and sensory balance keep the creative instinct sharp and ready for the next challenge.
              </p>
            </div>
            <ol className="about-interests">
              {interests.map(([title, description], index) => (
                <li key={title}>
                  <span className="about-interest-number" aria-hidden="true">0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </li>
              ))}
            </ol>
          </div>
          <figure className="about-photo-story">
            <img
              src="/About%20Me%20Images/Thank%20You%20Side%20Photo.png"
              alt="Kayeen smiling and making a peace sign, with coffee and a ThinkPad"
              width="1233"
              height="1135"
              draggable="false"
              loading="lazy"
              decoding="async"
            />
            <figcaption>
              <span>{interests.map(([title]) => title).join(' · ')}</span>
            </figcaption>
          </figure>
        </section>

        <section className="about-next" aria-labelledby="about-next-title">
          <div>
            <p className="about-label">Ready to collaborate?</p>
            <h2 id="about-next-title" className="about-section-title">Explore the craft.</h2>
          </div>
          {onNavigate && (
            <div className="about-actions">
              <button type="button" className="about-action" onClick={() => onNavigate('projects')}>
                View projects <span aria-hidden="true">↗</span>
              </button>
              <button type="button" className="about-action about-action--quiet" onClick={() => onNavigate('contact')}>
                Get in touch <span aria-hidden="true">↗</span>
              </button>
            </div>
          )}
        </section>
      </div>
    </article>
  )
}
