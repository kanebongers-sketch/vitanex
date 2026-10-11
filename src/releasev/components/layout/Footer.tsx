import Link from "next/link";
import { LEGAL_NAV, MAIN_NAV, SITE } from "@rv/config/site";
import { Logo } from "./Logo";
import { Container } from "@rv/components/ui/Container";
import { PaymentBadges } from "@rv/components/ui/PaymentBadges";
import { NewsletterForm } from "@rv/components/newsletter/NewsletterForm";
import { CookieSettingsLink } from "@rv/components/consent/CookieSettingsLink";

const linkClass = "link-underline text-ink-soft transition-colors duration-300 hover:text-ink";

function FooterHeading({ children }: { children: string }) {
  return (
    <p className="flex items-center gap-3 text-eyebrow font-semibold uppercase text-ink-muted">
      <span aria-hidden className="size-1.5 rounded-full bg-accent" />
      {children}
    </p>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-canvas text-ink">
      <Container className="grid gap-12 py-section-sm md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="max-w-xs text-lead text-ink-soft">{SITE.tagline}</p>
          <div className="mt-8 max-w-md">
            <NewsletterForm />
          </div>
          <PaymentBadges className="mt-6" />
        </div>

        <nav aria-label="Footer" className="md:col-span-3 md:col-start-7">
          <FooterHeading>Winkel</FooterHeading>
          <ul className="mt-6 space-y-3">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Juridisch" className="md:col-span-3">
          <FooterHeading>Service</FooterHeading>
          <ul className="mt-6 space-y-3">
            {LEGAL_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>{item.label}</Link>
              </li>
            ))}
            <li>
              <CookieSettingsLink />
            </li>
          </ul>
        </nav>
      </Container>

      <Container className="border-t border-line pt-10">
        <Logo className="h-auto w-full text-ink" />
      </Container>

      <Container className="mt-10 flex flex-col gap-3 border-t border-line py-8 text-xs text-ink-muted md:flex-row md:justify-between">
        <p>
          © {year} {SITE.company.legalName} · KvK {SITE.company.kvk} · Btw {SITE.company.vat}
        </p>
        <p>
          {SITE.company.street}, {SITE.company.postalCity}
        </p>
        <p>Sfeerbeelden zijn deels met AI gemaakt.</p>
      </Container>
    </footer>
  );
}
