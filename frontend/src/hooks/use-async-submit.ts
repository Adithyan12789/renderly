import { useState } from 'react'
import { getErrorMessage } from '@/lib/api'

export function useAsyncSubmit<TArgs extends unknown[]>(action: (...args: TArgs) => Promise<unknown>) {
  const [isSubmitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(...args: TArgs): Promise<boolean> {
    setSubmitting(true)
    setError(null)
    try {
      await action(...args)
      return true
    } catch (caught) {
      setError(getErrorMessage(caught))
      return false
    } finally {
      setSubmitting(false)
    }
  }

  return { submit, isSubmitting, error }
}
