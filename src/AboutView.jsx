import { useEffect, useState } from 'react'
import LazyImage from './LazyImage'
import { ScrubText, SplitText } from './motion/SplitText'
import { AboutJourney, CountUp } from './motion/AboutMotion'
import { VelocityMarquee } from './motion/HomeReel'
import { projects } from './projects'
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
              <LazyImage
                src="/About%20Me%20Images/Kayeen%201.jpg"
                alt="Kayeen M. Campaña in a black jacket and tie, looking toward the right"
                width="1080"
                height="1080"
                aspectRatio="1 / 1"
                fetchPriority="high"
                loading="eager"
              />
              <figcaption className="about-sr-only">Fig. 01 / Portrait & stance</figcaption>
            </figure>
            <div className="about-hero-copy">
              <p className="about-label" data-reveal="up">What I Am / Who I Am / What I Do</p>
              <h1 id="about-title" className="about-headline" aria-label="Keen, Meticulous, Creative. Kayeen Melecio Campaña.">
                <span aria-hidden="true">{headlineWords[0] || '\u00A0'}</span>
                <span aria-hidden="true">{headlineWords[1] || '\u00A0'}</span>
                <span className="about-accent" aria-hidden="true">{headlineWords[2] || '\u00A0'}</span>
              </h1>
              <p className="about-role" data-reveal="up" style={{ '--reveal-delay': '200ms' }}>
                B.S. Computer Science student<br />
                Front-end design & development
              </p>
            </div>
          </div>

          <div className="about-cover-caption" data-reveal="fade">
            <span>Kayeen M. Campaña</span>
            <span>Getafe, Bohol <span aria-hidden="true">→</span> Davao <span className="about-caption-separator">/</span> Age 21</span>
          </div>

          <dl className="about-stats">
            {[
              ['Age', <CountUp to={21} />],
              ['Featured projects', <CountUp to={projects.length} />],
              ['Roles I play', <CountUp to={4} />],
              ['Based in', 'Davao'],
            ].map(([label, value], i) => (
              <div className="about-stat" key={label} data-reveal="up" style={{ '--reveal-delay': `${i * 90}ms` }}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="about-foundation about-section" aria-labelledby="about-foundation-title">
          <div className="about-foundation-copy">
            <header data-reveal="up">
              <p className="about-label">01 The foundation</p>
              <h2 id="about-foundation-title" className="about-section-title"><SplitText text="The person" reveal={false} /><br /><SplitText text="behind the pixels." reveal={false} delay={120} /></h2>
            </header>
            <div className="about-prose" data-reveal="up" style={{ '--reveal-delay': '150ms' }}>
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
          <figure className="about-photo-story" data-reveal="clip" data-tilt>
            <LazyImage
              className="about-photo-story-mirrored"
              src="/About%20Me%20Images/My%20Projects%20Side%20Photo.png"
              alt="Kayeen looking up from a laptop at a café table"
              width="1070"
              height="1082"
              aspectRatio="1070 / 1082"
              loading="lazy"
              decoding="async"
            />
            <span className="tilt-glare" aria-hidden="true" />
            <figcaption>
              <span>Davao City · Workspace & craft</span>
            </figcaption>
          </figure>
        </section>

        <AboutJourney />

        <section className="about-philosophy about-section" aria-labelledby="about-philosophy-title">
          <span className="about-quote-mark" data-parallax="0.25" aria-hidden="true"><span>“</span></span>
          <h2 id="about-philosophy-title" className="about-label">Core philosophy</h2>
          <ScrubText
            as="blockquote"
            text="Success is not about doing everything perfectly, but about consistently doing what's best."
            accent={[9, 10, 11, 12]}
          />
        </section>

        <section className="about-escapes about-section" aria-labelledby="about-escapes-title">
          <div className="about-escapes-copy">
            <p className="about-label" data-reveal="up">03 Creative escapes</p>
            <h2 id="about-escapes-title" className="about-section-title" data-reveal="up">A little life<br /><span className="about-accent">beyond the screen.</span></h2>
            <div className="about-prose">
              <p>
                Stepping back from the screen is just as vital as the time spent coding. Rest, curiosity,
                and sensory balance keep the creative instinct sharp and ready for the next challenge.
              </p>
            </div>
            <ol className="about-interests">
              {interests.map(([title, description], index) => (
                <li key={title} data-reveal="up" style={{ '--reveal-delay': `${index * 90}ms` }}>
                  <span className="about-interest-number" aria-hidden="true">0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </li>
              ))}
            </ol>
          </div>
          <figure className="about-photo-story" data-reveal="clip" data-tilt>
            <LazyImage
              src="/About%20Me%20Images/Thank%20You%20Side%20Photo.png"
              alt="Kayeen smiling and making a peace sign, with coffee and a ThinkPad"
              width="1233"
              height="1135"
              aspectRatio="1233 / 1135"
              loading="lazy"
              decoding="async"
            />
            <span className="tilt-glare" aria-hidden="true" />
            <figcaption>
              <span>{interests.map(([title]) => title).join(' · ')}</span>
            </figcaption>
          </figure>
        </section>

        <section className="about-marquee" aria-hidden="true">
          <VelocityMarquee items={['Let’s collaborate', 'Design', 'Code', 'Story']} />
        </section>

        <section className="about-next" aria-labelledby="about-next-title" data-reveal="up">
          <div>
            <p className="about-label">Ready to collaborate?</p>
            <h2 id="about-next-title" className="about-section-title">Explore the craft.</h2>
          </div>
          {onNavigate && (
            <div className="about-actions">
              <button type="button" className="about-action" data-magnetic="0.2" onClick={() => onNavigate('projects')}>
                View projects <span aria-hidden="true">↗</span>
              </button>
              <button type="button" className="about-action about-action--quiet" data-magnetic="0.2" onClick={() => onNavigate('contact')}>
                Get in touch <span aria-hidden="true">↗</span>
              </button>
            </div>
          )}
        </section>
      </div>
    </article>
  )
}
