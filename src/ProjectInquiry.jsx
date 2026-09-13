import { useState, useEffect, useRef, useCallback } from 'react'

const testimonials = [
  {
    id: 1,
    name: 'Maria Santos',
    role: 'Owner, Bloom Cafe',
    quote:
      'Kayeen turned our rough ideas into a beautiful website that actually brought in new customers. The whole process was smooth and stress-free.',
  },
  {
    id: 2,
    name: 'James Rivera',
    role: 'Founder, JLD Marketing',
    quote:
      'Working with Kayeen was one of the best decisions we made. Our site looks professional, loads fast, and our clients always compliment it.',
  },
  {
    id: 3,
    name: 'Angela Cruz',
    role: 'Director, Qetsiyah Eco Park',
    quote:
      'He listened to every detail and delivered exactly what we envisioned — a site that tells our story and connects with visitors before they even arrive.',
  },
]

export default function ClientTestimonials() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef(null)

  const advance = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length)
  }, [])

  useEffect(() => {
    if (isPaused) return
    timerRef.current = setInterval(advance, 6000)
    return () => clearInterval(timerRef.current)
  }, [isPaused, advance])

  const goTo = (index) => {
    setActiveIndex(index)
    clearInterval(timerRef.current)
    setIsPaused(false)
  }

  const current = testimonials[activeIndex]

  return (
    <section
      className="client-testimonials"
      aria-labelledby="testimonials-title"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="testimonials-header">
        <div className="testimonials-tag">
          <span className="testimonials-dot" />
          <p className="testimonials-kicker">TESTIMONIALS</p>
        </div>
        <h2 id="testimonials-title" className="testimonials-title">
          WHAT MY CLIENT SAYS
        </h2>
      </div>

      <div className="testimonials-card" key={current.id}>
        <blockquote className="testimonials-quote">
          <span className="testimonials-open-mark" aria-hidden="true">"</span>
          <p>{current.quote}</p>
        </blockquote>
        <footer className="testimonials-attribution">
          <cite className="testimonials-name">{current.name}</cite>
          <span className="testimonials-role">{current.role}</span>
        </footer>
      </div>

      <div className="testimonials-controls" role="tablist" aria-label="Testimonial navigation">
        {testimonials.map((t, i) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={i === activeIndex}
            aria-label={`Testimonial from ${t.name}`}
            className={`testimonials-pip${i === activeIndex ? ' testimonials-pip--active' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </section>
  )
}
