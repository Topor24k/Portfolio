export const CONTACT_EMAIL = 'kayeencampana@gmail.com'
const CONTACT_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`

export function createInquiryPayload(values) {
  const custom = values.customGoal?.trim()
  const combinedGoals = [
    ...(values.goals || []),
    custom ? `Other: ${custom}` : '',
  ].filter(Boolean)

  return {
    name: values.name.trim(),
    email: values.email.trim(),
    business: values.business.trim(),
    message: values.message.trim(),
    website_goals: combinedGoals.join(', ') || 'To discuss together',
    preferred_timeline: values.timeline || 'Flexible / let’s discuss',
    consent: 'Agreed to be contacted about this website inquiry',
    _subject: `New website inquiry — ${values.business.trim()}`,
    _template: 'table',
    _honey: values._honey || '',
  }
}

export function inquiryEmailLink(values = {}) {
  const subject = `Website inquiry${values.business ? ` — ${values.business}` : ''}`
  const custom = values.customGoal?.trim()
  const combinedGoals = [
    ...(values.goals || []),
    custom ? `Other: ${custom}` : '',
  ].filter(Boolean)

  const body = [
    'Hello Kayeen,',
    'I’d like to build a website with you and your team.',
    values.business && `Business: ${values.business}`,
    values.message && `About my business:\n${values.message}`,
    combinedGoals.length ? `Website goals: ${combinedGoals.join(', ')}` : '',
    values.timeline && `Preferred timeline: ${values.timeline}`,
    values.name && `Name: ${values.name}`,
    values.email && `Email: ${values.email}`,
  ].filter(Boolean).join('\n\n')
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export async function deliverInquiry(values, signal) {
  const response = await fetch(CONTACT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(createInquiryPayload(values)),
    signal,
  })
  const result = await response.json()
  // An activation response is not confirmation of delivery to the inbox.
  if (/activat|confirm.*email|verify.*email/i.test(result.message || '')) {
    return 'activation'
  }
  if (!response.ok || !(result.success === true || result.success === 'true')) {
    throw new Error('The email service did not accept the inquiry.')
  }
  return 'success'
}
