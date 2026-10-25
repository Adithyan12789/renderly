import { SectionHeading, SerifAccent } from '@/components/ui/section-heading'
import { cn } from '@/lib/utils'

const ITEMS = [
  {
    src: '/images/gallery-tower.png',
    alt: 'Glass residential tower at dusk with lit interiors',
    title: 'Harbor Tower',
    style: 'Futuristic',
    className: 'md:col-span-2 md:row-span-2',
  },
  {
    src: '/images/gallery-kitchen.png',
    alt: 'Japandi kitchen with oak cabinets',
    title: 'Oak House Kitchen',
    style: 'Japanese',
    className: '',
  },
  {
    src: '/images/gallery-pavilion.png',
    alt: 'Timber pavilion in a forest clearing',
    title: 'Forest Pavilion',
    style: 'Scandinavian',
    className: '',
  },
  {
    src: '/images/gallery-loft.png',
    alt: 'Industrial loft with brick walls and steel windows',
    title: 'Mill Street Loft',
    style: 'Industrial',
    className: '',
  },
  {
    src: '/images/gallery-bedroom.png',
    alt: 'Warm minimal bedroom with linen bedding',
    title: 'Primary Suite',
    style: 'Warm Cozy',
    className: 'md:col-span-2',
  },
]

export function Gallery() {
  return (
    <section id="gallery" className="scroll-mt-20 pb-24 md:pb-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          eyebrow="Showcase"
          title={
            <>
              Rendered in <SerifAccent>Renderly</SerifAccent>
            </>
          }
          description="Exteriors, interiors, and landscapes — every image below was generated from a 3D model."
        />
        <ul className="mt-12 grid auto-rows-[260px] gap-4 md:grid-cols-3">
          {ITEMS.map((item) => (
            <li key={item.title} className={cn('group relative overflow-hidden rounded-2xl border border-border', item.className)}>
              <img
                src={item.src}
                alt={item.alt}
                loading="lazy"
                className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent p-5 pt-16">
                <p className="font-medium text-foreground">{item.title}</p>
                <span className="rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[11px] text-foreground/80 backdrop-blur">
                  {item.style}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
