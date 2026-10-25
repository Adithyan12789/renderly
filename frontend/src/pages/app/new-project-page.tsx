import { Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { PageHeader } from '@/components/app/page-header'
import { Button, buttonVariants } from '@/components/ui/button'
import { Field, FormAlert, Input, Textarea } from '@/components/ui/field'
import { useAsyncSubmit } from '@/hooks/use-async-submit'
import { PROJECT_TYPES } from '@/lib/site-content'
import { cn } from '@/lib/utils'
import { projectsService } from '@/services/projects'
import { toast } from '@/stores/toast-store'
import type { ProjectType } from '@/types'

export function NewProjectPage() {
  const navigate = useNavigate()
  const [type, setType] = useState<ProjectType>('architecture')
  const { submit, isSubmitting, error } = useAsyncSubmit(projectsService.create)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name')).trim()
    const description = String(form.get('description') ?? '').trim()

    const ok = await submit({ name, description, type })
    if (ok) {
      toast.success(`Project "${name}" was created successfully!`, 'Project Created')
      navigate('/app/projects')
    } else if (error) {
      toast.error(error)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="New project" description="Name your project and choose what you're visualizing." />

      <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6">
        <FormAlert message={error} />
        <Field id="project-name" label="Project name">
          <Input id="project-name" name="name" required maxLength={120} placeholder="Hillside Residence" />
        </Field>
        <Field id="project-description" label="Description">
          <Textarea
            id="project-description"
            name="description"
            maxLength={1000}
            placeholder="Client, site, and design intent"
          />
        </Field>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1.5 text-sm font-medium text-foreground">Project type</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {PROJECT_TYPES.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent',
                  type === option.value ? 'border-accent/60 bg-accent/[0.06]' : 'border-border bg-surface hover:border-border-strong',
                )}
              >
                <input
                  type="radio"
                  name="type"
                  value={option.value}
                  checked={type === option.value}
                  onChange={() => setType(option.value)}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-foreground">{option.label}</span>
                <span className="text-xs leading-relaxed text-muted">{option.description}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            Create project
          </Button>
          <Link to="/app/projects" className={buttonVariants({ variant: 'ghost' })}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
