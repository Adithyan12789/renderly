import { ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Field, FormAlert, Input } from '@/components/ui/field'
import { useAsyncSubmit } from '@/hooks/use-async-submit'
import { authService } from '@/services/auth'

import { toast } from '@/stores/toast-store'

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const { submit, isSubmitting, error } = useAsyncSubmit(authService.forgotPassword)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = String(new FormData(event.currentTarget).get('email')).trim()
    const ok = await submit(email)
    if (ok) {
      setSentTo(email)
      toast.success('Password reset instructions sent to your email.', 'Check your inbox')
    } else if (error) {
      toast.error(error)
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-6" role="status">
        <span className="grid size-11 place-items-center rounded-xl border border-border bg-surface-raised text-success">
          <MailCheck className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-foreground">Check your inbox</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {`If an account exists for ${sentTo}, you'll receive a link to reset your password.`}
          </p>
        </div>
        <BackToLogin />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-medium tracking-tight text-foreground">Reset your password</h1>
        <p className="mt-2 text-sm text-muted">{"Enter your email and we'll send you a reset link."}</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormAlert message={error} />
        <Field id="email" label="Email">
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@studio.com" />
        </Field>
        <Button type="submit" size="lg" className="mt-2" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          Send reset link
        </Button>
      </form>
      <BackToLogin />
    </div>
  )
}

function BackToLogin() {
  return (
    <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground">
      <ArrowLeft className="size-4" aria-hidden="true" />
      Back to log in
    </Link>
  )
}
