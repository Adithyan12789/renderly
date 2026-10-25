import { Loader2 } from 'lucide-react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Field, FormAlert, Input } from '@/components/ui/field'
import { useAsyncSubmit } from '@/hooks/use-async-submit'
import { authService, type RegisterPayload } from '@/services/auth'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from '@/stores/toast-store'

export function RegisterPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)

  const { submit, isSubmitting, error } = useAsyncSubmit(async (payload: RegisterPayload) => {
    const data = await authService.register(payload)
    if (data?.user) {
      setUser(data.user)
    }
    return data
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email')).trim()
    const name = String(form.get('name')).trim()
    const password = String(form.get('password'))

    const ok = await submit({ name, email, password })

    if (ok) {
      toast.success('Account created! Welcome to Renderly.', 'Welcome')
      navigate('/app')
    } else if (error) {
      toast.error(error, 'Registration failed')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-medium tracking-tight text-foreground">Create your account</h1>
        <p className="mt-2 text-sm text-muted">Start on the free Starter plan. No credit card required.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormAlert message={error} />
        <Field id="name" label="Full name">
          <Input id="name" name="name" autoComplete="name" required maxLength={80} placeholder="Ada Lovelace" />
        </Field>
        <Field id="email" label="Work email">
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@studio.com" />
        </Field>
        <Field id="password" label="Password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            aria-describedby="password-help"
          />
          <p id="password-help" className="text-xs text-muted">
            At least 8 characters.
          </p>
        </Field>
        <Button type="submit" size="lg" className="mt-2" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-sm text-muted">
        {'Already have an account? '}
        <Link to="/login" className="text-foreground underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
