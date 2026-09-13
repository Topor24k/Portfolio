import { useEffect, useRef, useState } from 'react'
import { BusinessFields, ContactFields, InquiryConsent, InquiryFeedback, InquiryPrivacy } from './InquiryFields'
import useInquirySubmission from './useInquirySubmission'
import './projects.css'
import './contact-view.css'

const STEPS = ['Your business', 'Your website', 'Your details']
const GOALS = ['Introduce my business', 'Get more inquiries', 'Take bookings', 'Sell products', 'Showcase my work', 'Help me decide']
const TIMELINES = ['As soon as possible', 'In 1–3 months', 'Flexible / let’s discuss']
const INITIAL_BRIEF = { business: '', message: '', name: '', email: '', goals: [], timeline: TIMELINES[2], consent: false, _honey: '' }

export default function ContactView({ onNavigate }) {
  const [step, setStep] = useState(0)
  const [brief, setBrief] = useState(INITIAL_BRIEF)
  const { status, submit } = useInquirySubmission()
  const formRef = useRef(null)
  const stepTitle = useRef(null)
  const previousStep = useRef(0)
  const busy = status === 'sending'

  useEffect(() => {
    if (step !== previousStep.current) stepTitle.current?.focus()
    previousStep.current = step
  }, [step])

  const updateField = ({ target }) => {
    target.setCustomValidity('')
    setBrief((value) => ({ ...value, [target.name]: target.type === 'checkbox' ? target.checked : target.value }))
  }

  const toggleGoal = (goal) => setBrief((value) => ({
    ...value,
    goals: value.goals.includes(goal) ? value.goals.filter((item) => item !== goal) : [...value.goals, goal],
  }))

  const handleSubmit = (event) => {
    event.preventDefault()
    const message = formRef.current.elements.namedItem('message')
    if (message) message.setCustomValidity(brief.message.trim().length < 10 ? 'Tell me a little more about your business (at least 10 characters).' : '')
    if (!formRef.current.reportValidity()) return
    if (step < 2) setStep((value) => value + 1)
    else submit(brief)
  }

  return <section className="contact-view" aria-labelledby="contact-title">
    <div className="contact-container">
      <div className="contact-composition">
        <div className="contact-intro">
          <p className="contact-kicker"><span aria-hidden="true" /> Reach Out.</p>
          <h1 id="contact-title">YOUR<br />BUSINESS.<br /><span>ONLINE.</span></h1>
          <p className="contact-lead">Your first website starts here.</p>
          <p className="contact-description">Tell me what you’re building. My team and I will help turn your business into a website that feels like you and works for your customers.</p>
          <button type="button" className="contact-work-link" onClick={() => onNavigate('projects')}>Explore our work <span aria-hidden="true">↗</span></button>
        </div>

        <div className="contact-brief">
          <div className="contact-brief-label"><span>Let’s make a plan</span><span>Website brief</span></div>
          <ol className="contact-steps" aria-label="Inquiry progress">
            {STEPS.map((label, index) => <li key={label} data-active={index === step} data-complete={index < step} aria-current={index === step ? 'step' : undefined}>
              <span className="contact-step-number">0{index + 1}</span><span>{label}</span>
            </li>)}
          </ol>

          <form ref={formRef} className="contact-brief-form" onSubmit={handleSubmit} noValidate aria-busy={busy}>
            <div className="inquiry-honeypot" aria-hidden="true">
              <label>Leave this field empty<input name="_honey" type="text" tabIndex={-1} autoComplete="off" value={brief._honey} onChange={updateField} /></label>
            </div>
            <fieldset className="contact-step-fields" disabled={busy || status === 'success'}>
              <legend className="contact-visually-hidden">{STEPS[step]}</legend>
              <div className="contact-step-heading">
                <h2 ref={stepTitle} tabIndex={-1}>{['Tell me your story.', 'What should it do?', 'Let’s connect.'][step]}</h2>
                <p>{['A little about your business is all we need to begin.', 'Choose what matters to you. We can work out the details together.', 'Review your brief and let me know where to reply.'][step]}</p>
              </div>
              {step === 0 && <BusinessFields values={brief} onChange={updateField} />}
              {step === 1 && <>
                <fieldset className="contact-options">
                  <legend>I’d like my website to… <span>(choose any)</span></legend>
                  <div className="contact-goals">
                    {GOALS.map((goal) => <label className="contact-choice" key={goal}>
                      <input type="checkbox" checked={brief.goals.includes(goal)} onChange={() => toggleGoal(goal)} />
                      <span className="contact-choice-label">{goal}<span className="contact-choice-mark" aria-hidden="true">{brief.goals.includes(goal) ? '✓' : '+'}</span></span>
                    </label>)}
                  </div>
                </fieldset>
                <fieldset className="contact-options">
                  <legend>When would you like to launch?</legend>
                  <div className="contact-timelines">
                    {TIMELINES.map((timeline) => <label className="contact-choice" key={timeline}>
                      <input type="radio" name="timeline" value={timeline} checked={brief.timeline === timeline} onChange={updateField} />
                      <span className="contact-choice-label">{timeline}</span>
                    </label>)}
                  </div>
                </fieldset>
              </>}
              {step === 2 && <>
                <div className="contact-review">
                  <div className="contact-review-top"><span>Your brief</span><button type="button" onClick={() => setStep(0)}>Edit ↗</button></div>
                  <h3>{brief.business}</h3>
                  <p className="contact-review-message">{brief.message}</p>
                  <dl><div><dt>Website goals</dt><dd>{brief.goals.join(' · ') || 'Let’s decide together'}</dd></div><div><dt>Timeline</dt><dd>{brief.timeline}</dd></div></dl>
                </div>
                <ContactFields values={brief} onChange={updateField} />
                <InquiryConsent checked={brief.consent} onChange={updateField} />
              </>}
            </fieldset>
            <div className="contact-form-actions">
              {step > 0 ? <button className="contact-back" type="button" disabled={busy || status === 'success'} onClick={() => setStep((value) => value - 1)}>← Back</button> : <span className="contact-form-note">No technical knowledge needed.</span>}
              <button className="project-inquiry-submit" type="submit" disabled={busy || status === 'success'}>
                {busy ? 'Sending…' : status === 'success' ? 'Inquiry submitted' : step === 2 ? 'Send my inquiry' : 'Continue'}<span aria-hidden="true">{status === 'success' ? '✓' : '↗'}</span>
              </button>
            </div>
            <InquiryFeedback status={status} values={brief} />
            {step === 2 && <InquiryPrivacy />}
          </form>
        </div>
      </div>
    </div>
  </section>
}
