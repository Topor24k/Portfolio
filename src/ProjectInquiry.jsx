export default function ProjectInquiry() {
  const handleSubmit = (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = data.get('name')?.toString().trim() || 'Prospective client'
    const email = data.get('email')?.toString().trim() || 'Not provided'
    const business = data.get('business')?.toString().trim() || 'Not provided'
    const message = data.get('message')?.toString().trim() || 'I would like to build a website for my business.'
    const subject = encodeURIComponent(`Website inquiry — ${business}`)
    const body = encodeURIComponent(
      `Hello Kayeen,\n\nI’d like to build my first website with you and your team.\n\nAbout my business:\n${message}\n\nBusiness name: ${business}\nContact name: ${name}\nEmail: ${email}`,
    )

    window.location.href = `mailto:kayeencampana@gmail.com?subject=${subject}&body=${body}`
  }

  return (
    <section className="project-inquiry" aria-labelledby="project-inquiry-title">
      <div className="project-inquiry-intro">
        <p className="project-inquiry-kicker">Contact</p>
        <h2 id="project-inquiry-title"><span className="project-inquiry-heading-line">Build Your</span><span>First Website.</span></h2>
        <p className="project-inquiry-summary">
          Give your business a digital home. Work with me and my team to turn your story, services, and goals into a website built to grow with you.
        </p>
        <div className="project-inquiry-meta" aria-hidden="true">
          <span>Made for growing businesses</span>
          <span>01 / Client inquiry</span>
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

        <label className="project-field">
          <span>What is the name of your business?</span>
          <input name="business" type="text" autoComplete="organization" required />
        </label>

        <label className="project-field project-field--message">
          <span>Tell me about your business</span>
          <textarea name="message" rows="4" required />
        </label>

        <div className="project-inquiry-footer">
          <label className="project-consent">
            <input name="consent" type="checkbox" required />
            <span>I agree to be contacted about my website.</span>
          </label>
          <button className="project-inquiry-submit" type="submit">
            Build my website <span aria-hidden="true">↗</span>
          </button>
        </div>
      </form>
    </section>
  )
}
