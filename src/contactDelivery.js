export const CONTACT_EMAIL = 'kayeencampana@gmail.com'
export const WEB3FORMS_ACCESS_KEY = 'f1b51e4e-8c33-436e-bc3f-749061d02052'
const CONTACT_ENDPOINT = 'https://api.web3forms.com/submit'

export function createInquiryPayload(values) {
  const custom = values.customGoal?.trim()
  const combinedGoals = [
    ...(values.goals || []),
    custom ? `Other: ${custom}` : '',
  ].filter(Boolean)

  return {
    access_key: WEB3FORMS_ACCESS_KEY,
    subject: `New website inquiry — ${values.business?.trim() || 'Client'}`,
    from_name: 'KC Portfolio Inquiry',
    name: values.name?.trim() || '',
    email: values.email?.trim() || '',
    business: values.business?.trim() || '',
    message: values.message?.trim() || '',
    website_goals: combinedGoals.join(', ') || 'To discuss together',
    preferred_timeline: values.timeline || 'Flexible / let’s discuss',
    consent: 'Agreed to be contacted about this website inquiry',
    botcheck: values._honey || '',
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
  if (!response.ok || !(result.success === true || result.success === 'true')) {
    throw new Error(result.message || 'The email service did not accept the inquiry.')
  }
  return 'success'
}
