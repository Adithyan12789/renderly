import { BRAND } from '@/lib/site-content'

const CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        heading: 'What we collect',
        body: 'Your name, email address, and the files you upload to your projects — 3D models, textures, reference images, and generated outputs.',
      },
      {
        heading: 'How we use it',
        body: 'To operate your account, process renders and exports you request, and enforce plan quotas. Uploaded files are stored in private storage and are only accessible to you and to links you explicitly share.',
      },
      {
        heading: 'Third-party processing',
        body: 'Render requests are sent to our AI image-generation provider solely to produce the outputs you request.',
      },
      {
        heading: 'Your choices',
        body: `You can delete projects and assets at any time. To delete your account, contact ${BRAND.contactEmail}.`,
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    sections: [
      {
        heading: 'Your content',
        body: 'You retain ownership of the models you upload and the renders you generate. You must have the rights to any content you upload.',
      },
      {
        heading: 'Acceptable use',
        body: 'Do not upload unlawful content, attempt to access other users’ data, or circumvent rate limits and usage quotas.',
      },
      {
        heading: 'AI output',
        body: 'AI-generated images may differ from your source geometry. Review outputs before relying on them for construction or contractual purposes.',
      },
      {
        heading: 'Contact',
        body: `Questions about these terms can be sent to ${BRAND.contactEmail}.`,
      },
    ],
  },
} as const

export function LegalPage({ kind }: { kind: keyof typeof CONTENT }) {
  const page = CONTENT[kind]
  return (
    <article className="mx-auto max-w-2xl px-5 py-20 md:py-28">
      <h1 className="text-4xl font-medium tracking-tight text-foreground">{page.title}</h1>
      <div className="mt-12 flex flex-col gap-10">
        {page.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-2">
            <h2 className="text-lg font-medium text-foreground">{section.heading}</h2>
            <p className="leading-relaxed text-muted">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  )
}
