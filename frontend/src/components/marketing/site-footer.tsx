import { Link } from 'react-router'
import { Logo } from '@/components/ui/logo'
import { BRAND, MARKETING_NAV } from '@/lib/site-content'

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:px-8">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            AI-powered visualization for architects, interior designers, and real estate teams.
          </p>
        </div>

        <FooterColumn title="Product">
          {MARKETING_NAV.map((item) => (
            <Link key={item.hash} to={{ pathname: '/', hash: item.hash }} className="hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </FooterColumn>

        <FooterColumn title="Account">
          <Link to="/login" className="hover:text-foreground">
            Log in
          </Link>
          <Link to="/register" className="hover:text-foreground">
            Create account
          </Link>
          <Link to="/forgot-password" className="hover:text-foreground">
            Reset password
          </Link>
        </FooterColumn>

        <FooterColumn title="Company">
          <a href={`mailto:${BRAND.contactEmail}`} className="hover:text-foreground">
            Contact
          </a>
          <Link to="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-foreground">
            Terms
          </Link>
        </FooterColumn>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-5 py-6 text-xs text-muted md:px-8">
          {`© ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.`}
        </p>
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 text-sm text-muted">
      <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-foreground">{title}</h3>
      {children}
    </div>
  )
}
