import { useState } from 'react'
import { BusinessFields, ContactFields, InquiryConsent, InquiryFeedback, InquiryPrivacy } from './InquiryFields'
import useInquirySubmission from './useInquirySubmission'

export default function ProjectInquiry() {
  const { status, submit } = useInquirySubmission()
  const [submittedValues, setSubmittedValues] = useState({})
  const handleSubmit = (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    form.elements.message.setCustomValidity(values.message.trim().length < 10 ? 'Tell me a little more about your business (at least 10 characters).' : '')
    if (!form.reportValidity()) return
    setSubmittedValues(values)
    submit(values)
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

      <form className="project-inquiry-form" onSubmit={handleSubmit} noValidate aria-busy={status === 'sending'} onInput={({ target }) => target.setCustomValidity?.('')}>
        <div className="inquiry-honeypot" aria-hidden="true">
          <label>Leave this field empty<input name="_honey" type="text" autoComplete="off" tabIndex={-1} /></label>
        </div>
        <fieldset className="inquiry-fields" disabled={status === 'sending' || status === 'success'}>
          <ContactFields />
          <BusinessFields />
          <div className="project-inquiry-footer">
            <InquiryConsent />
            <button className="project-inquiry-submit" type="submit">
              {status === 'sending' ? 'Sending…' : status === 'success' ? 'Inquiry submitted' : 'Build my website'} <span aria-hidden="true">↗</span>
            </button>
          </div>
        </fieldset>
        <InquiryFeedback status={status} values={submittedValues} />
        <InquiryPrivacy />
      </form>
    </section>
  )
}
