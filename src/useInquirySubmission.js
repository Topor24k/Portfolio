import { useEffect, useRef, useState } from 'react'
import { deliverInquiry } from './contactDelivery'

export default function useInquirySubmission() {
  const [status, setStatus] = useState('idle')
  const pending = useRef(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      pending.current?.abort()
    }
  }, [])

  const submit = async (values) => {
    if (pending.current || status === 'success') return
    const controller = new AbortController()
    pending.current = controller
    setStatus('sending')
    const timeout = window.setTimeout(() => controller.abort(), 20000)
    try {
      const result = await deliverInquiry(values, controller.signal)
      if (mounted.current) setStatus(result)
    } catch {
      if (mounted.current) setStatus('error')
    } finally {
      window.clearTimeout(timeout)
      pending.current = null
    }
  }

  return { status, submit }
}
