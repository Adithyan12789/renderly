import { Loader2 } from 'lucide-react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Field, FormAlert, Input } from '@/components/ui/field'
import { useAsyncSubmit } from '@/hooks/use-async-submit'
import { authService, type LoginPayload } from '@/services/auth'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from '@/stores/toast-store'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setUser = useAuthStore((state) => state.setUser)
  const prefilledEmail = (location.state as { email?: string } | null)?.email ?? ''

  const { submit, isSubmitting, error } = useAsyncSubmit(async (payload: LoginPayload) => {
    const data = await authService.login(payload)
    setUser(data.user, data.token)
    return data
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email')).trim()
    const password = String(form.get('password'))

    const res = await submit({ email, password })
    if (res) {
      toast.success('Welcome back to Renderly!', 'Logged in')
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || '/app'
      navigate(from, { replace: true })
    } else if (error) {
      toast.error(error, 'Login failed')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-medium tracking-tight text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">Log in to continue to your workspace.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormAlert message={error} />
        <Field id="email" label="Email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={prefilledEmail}
            placeholder="you@studio.com"
          />
        </Field>
        <Field
          id="password"
          label="Password"
          hint={
            <Link to="/forgot-password" className="text-xs text-muted hover:text-foreground">
              Forgot password?
            </Link>
          }
        >
          <Input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} />
        </Field>
        <Button type="submit" size="lg" className="mt-2" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <p className="text-sm text-muted">
        {'New to Renderly? '}
        <Link to="/register" className="text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
