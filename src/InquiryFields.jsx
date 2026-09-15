import { CONTACT_EMAIL, inquiryEmailLink } from './contactDelivery'

export function BusinessFields({ values, onChange }) {
  return <>
    <label className="project-field">
      <span>What is the name of your business?</span>
      <input name="business" type="text" autoComplete="organization" maxLength={120}
        pattern=".*\S.*" title="Please enter your business name."
        value={values?.business} onChange={onChange} required />
    </label>
    <label className="project-field project-field--message">
      <span>Tell me about your business</span>
      <textarea name="message" rows="4" minLength={10} maxLength={4000}
        value={values?.message} onChange={onChange} required />
    </label>
  </>
}

export function ContactFields({ values, onChange }) {
  return <div className="project-inquiry-row">
    <label className="project-field">
      <span>Your name</span>
      <input name="name" type="text" autoComplete="name" maxLength={100}
        pattern=".*\S.*" title="Please enter your name."
        value={values?.name} onChange={onChange} required />
    </label>
    <label className="project-field">
      <span>Email address</span>
      <input name="email" type="email" autoComplete="email" maxLength={254}
        value={values?.email} onChange={onChange} required />
    </label>
  </div>
}

export function InquiryConsent({ checked, onChange }) {
  return <label className="project-consent">
    <input name="consent" type="checkbox" checked={checked} onChange={onChange} required />
    <span>I agree to be contacted about my website.</span>
  </label>
}

export function InquiryPrivacy() {
  return <p className="inquiry-privacy">
    Your details are sent directly to Kayeen to discuss your website project. No spam, ever.
  </p>
}

export function InquiryFeedback({ status, values }) {
  const messages = {
    sending: 'Sending your inquiry…',
    success: 'Inquiry submitted! Thank you for introducing your business — I’ll reply to the email you provided.',
    error: 'We couldn’t confirm your submission. Your details are still here. Try again, or send them directly by email.',
  }
  return <div className="inquiry-feedback" data-status={status} role="status" aria-live="polite" aria-atomic="true">
    {messages[status] && <p>{messages[status]}</p>}
    {status === 'error' &&
      <a href={inquiryEmailLink(values)}>Email {CONTACT_EMAIL} ↗</a>}
  </div>
}
