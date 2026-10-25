import { Link } from 'react-router'
import { BRAND } from '@/lib/site-content'
import { cn } from '@/lib/utils'

export interface RenderlyIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
  size?: number | string
}

export function RenderlyIcon({ className, size = 28, ...props }: RenderlyIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn('shrink-0 transition-transform duration-300 group-hover:scale-105', className)}
      {...props}
    >
      <defs>
        <radialGradient id="r-icon-glow" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#2a2319" />
          <stop offset="100%" stopColor="#121215" />
        </radialGradient>
        <linearGradient id="r-icon-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff0d4" />
          <stop offset="30%" stopColor="#f5cf92" />
          <stop offset="70%" stopColor="#e3b57a" />
          <stop offset="100%" stopColor="#b67f3c" />
        </linearGradient>
        <linearGradient id="r-icon-gold-deep" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e3b57a" />
          <stop offset="50%" stopColor="#a67435" />
          <stop offset="100%" stopColor="#6e491c" />
        </linearGradient>
        <linearGradient id="r-icon-titanium" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#565761" />
          <stop offset="50%" stopColor="#2d2e35" />
          <stop offset="100%" stopColor="#17181c" />
        </linearGradient>
        <linearGradient id="r-icon-border" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(245, 207, 146, 0.45)" />
          <stop offset="50%" stopColor="rgba(255, 255, 255, 0.12)" />
          <stop offset="100%" stopColor="rgba(227, 181, 122, 0.15)" />
        </linearGradient>
      </defs>

      {/* Rounded Hex/Squircle Base */}
      <rect width="48" height="48" rx="12" fill="url(#r-icon-glow)" />
      <rect
        width="46"
        height="46"
        x="1"
        y="1"
        rx="11"
        stroke="url(#r-icon-border)"
        strokeWidth="1.2"
        className="transition-colors duration-300 group-hover:stroke-accent/60"
      />

      {/* Faceted Architectural 'R' Group (Scaled & Centered) */}
      <g transform="translate(13, 11) scale(0.48)">
        {/* Left Spine Bevel */}
        <polygon points="0,0 7,6 7,38 0,44" fill="#18191e" />
        {/* Left Pillar Face */}
        <polygon points="7,6 14,0 14,44 7,38" fill="url(#r-icon-titanium)" />
        {/* Pillar Gold Highlight Ridge */}
        <polygon points="7,6 8,7 8,37 7,38" fill="url(#r-icon-gold)" opacity="0.9" />

        {/* Top Aperture Loop */}
        <polygon points="14,0 26,0 22,7 14,7" fill="url(#r-icon-titanium)" />
        <path
          d="M 26,0 C 37,0 43,7 43,18 C 43,26 39,32 32,35 L 26,27 C 30,25 33,22 33,18 C 33,12 29,7 22,7 L 26,0 Z"
          fill="url(#r-icon-gold)"
        />
        {/* Inner Cutout Void */}
        <polygon points="14,7 22,7 22,23 14,23" fill="#0c0d10" />

        {/* Dynamic Diagonal Rendering Kick / Ray Leg */}
        <polygon points="20,24 31,22 44,44 33,44" fill="url(#r-icon-gold)" />
        <polygon points="20,24 33,44 26,44 14,28" fill="url(#r-icon-gold-deep)" />
        <polygon points="31,22 44,44 41,44 30,24" fill="#ffffff" opacity="0.6" />

        {/* Specular Render Flare */}
        <g transform="translate(30, 23)">
          <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
          <polygon points="0,-7 1.5,-2 7,0 1.5,2 0,7 -1.5,2 -7,0 -1.5,-2" fill="#ffffff" />
          <polygon points="0,-4 1,-1 4,0 1,1 0,4 -1,1 -4,0 -1,-1" fill="url(#r-icon-gold)" />
        </g>
      </g>
    </svg>
  )
}

export interface LogoProps {
  to?: string
  className?: string
  showBadge?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ to = '/', className, showBadge = true, size = 'md' }: LogoProps) {
  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 36 : 30

  return (
    <Link
      to={to}
      className={cn(
        'group inline-flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-95',
        className,
      )}
    >
      <div className="relative">
        {/* Ambient Hover Glow */}
        <div
          aria-hidden="true"
          className="absolute -inset-1 rounded-xl bg-accent/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100"
        />
        <RenderlyIcon size={iconSize} />
      </div>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            'font-semibold tracking-tight text-foreground transition-colors group-hover:text-white',
            size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-[15px]',
          )}
        >
          {BRAND.name}
        </span>

        {showBadge && (
          <span className="hidden items-center rounded border border-accent/25 bg-accent/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-accent sm:inline-flex">
            STUDIO
          </span>
        )}
      </div>
    </Link>
  )
}
