export default function ProjectInquiry() {
  const handleSubmit = (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = data.get('name')?.toString().trim() || 'Portfolio visitor'
    const email = data.get('email')?.toString().trim() || 'Not provided'
    const service = data.get('service')?.toString() || 'General project inquiry'
    const message = data.get('message')?.toString().trim() || 'I would like to discuss a project.'
    const subject = encodeURIComponent(`Project inquiry — ${name}`)
    const body = encodeURIComponent(
      `Hello Kayeen,\n\n${message}\n\nProject type: ${service}\nName: ${name}\nEmail: ${email}`,
    )

    window.location.href = `mailto:kayeencampana@gmail.com?subject=${subject}&body=${body}`
  }

  return (
    <section className="project-inquiry" aria-labelledby="project-inquiry-title">
      <div className="project-inquiry-intro">
        <p className="project-inquiry-kicker">Contact me</p>
        <h2 id="project-inquiry-title">Start Your<br /><span>Project.</span></h2>
        <p className="project-inquiry-summary">
          Have an idea worth building? Tell me where you want to take it, and we’ll shape a clear path forward.
        </p>
        <div className="project-inquiry-meta" aria-hidden="true">
          <span>Open for selected work</span>
          <span>01 / Inquiry desk</span>
        </div>
      </div>

      <form className="project-inquiry-form" onSubmit={handleSubmit}>
        <div className="project-inquiry-row">
          <label className="project-field">
            <span>Your name</span>
            <input name="name" type="text" autoComplete="name" required />
          </label>
          <label className="project-field">
            <span>Email address</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
        </div>

        <label className="project-field project-field--select">
          <span>I’m interested in</span>
          <select name="service" defaultValue="Web design and development" required>
            <option>Web design and development</option>
            <option>Front-end development</option>
            <option>Full-stack web platform</option>
            <option>UI/UX design</option>
            <option>Creative collaboration</option>
          </select>
        </label>

        <label className="project-field project-field--message">
          <span>Tell me about your project</span>
          <textarea name="message" rows="4" required />
        </label>

        <div className="project-inquiry-footer">
          <label className="project-consent">
            <input name="consent" type="checkbox" required />
            <span>I agree to be contacted about this project.</span>
          </label>
          <button className="project-inquiry-submit" type="submit">
            Start a conversation <span aria-hidden="true">↗</span>
          </button>
        </div>
      </form>
    </section>
  )
}
