import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@rv/config/site";
import { Container } from "@rv/components/ui/Container";
import { ContactForm } from "@rv/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: `Vraag over je bestelling, een retour of het videoprogramma? Neem contact op met ${SITE.brandName}. ${SITE.contact.responseTime}`,
  alternates: { canonical: "/contact" },
};

const QUICK_LINKS = [
  { href: "/retourbeleid", label: "Retourneren en herroepen" },
  { href: "/programma", label: "Hoe werkt het programma?" },
  { href: "/algemene-voorwaarden", label: "Algemene voorwaarden" },
] as const;

function DetailHeading({ children }: { children: string }) {
  return (
    <h2 className="flex items-center gap-3 text-eyebrow font-semibold uppercase text-ink-muted">
      <span aria-hidden className="size-1.5 rounded-full bg-accent" />
      {children}
    </h2>
  );
}

function ContactDetails() {
  return (
    <div className="grid gap-12">
      <div>
        <DetailHeading>Direct contact</DetailHeading>
        <ul className="mt-5 space-y-2 font-display text-2xl font-bold tracking-tight">
          <li>
            <span className="sr-only">E-mail: </span>
            <a href={`mailto:${SITE.contact.email}`} className="link-underline break-all">{SITE.contact.email}</a>
          </li>
          <li>
            <span className="sr-only">Telefoon: </span>
            <a href={`tel:${SITE.contact.phone.replace(/\s/g, "")}`} className="link-underline">{SITE.contact.phone}</a>
          </li>
        </ul>
        <p className="mt-4 text-sm text-ink-muted">{SITE.contact.responseTime}</p>
      </div>

      <div className="border-t border-line pt-10">
        <DetailHeading>Bedrijfsgegevens</DetailHeading>
        <address className="mt-5 not-italic leading-relaxed text-ink-soft">
          <span className="block font-semibold text-ink">{SITE.company.legalName}</span>
          <span className="block">{SITE.company.street}</span>
          <span className="block">{SITE.company.postalCity}</span>
          <span className="block">{SITE.company.country}</span>
        </address>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-ink-soft">
          <dt className="text-ink-muted">KvK</dt>
          <dd>{SITE.company.kvk}</dd>
          <dt className="text-ink-muted">Btw</dt>
          <dd>{SITE.company.vat}</dd>
        </dl>
        <p className="mt-4 text-xs text-ink-muted">Dit is geen retouradres. Lees eerst ons retourbeleid voordat je iets terugstuurt.</p>
      </div>

      <nav aria-label="Snel naar" className="border-t border-line pt-10">
        <DetailHeading>Misschien staat je antwoord hier</DetailHeading>
        <ul className="mt-5 divide-y divide-line border-y border-line">
          {QUICK_LINKS.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="group flex items-center justify-between py-4 font-medium text-ink-soft transition-colors duration-300 hover:text-ink">
                {item.label}
                <span aria-hidden className="text-accent transition-transform duration-300 ease-calm group-hover:translate-x-1">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default function ContactPage() {
  return (
    <section aria-labelledby="contact-titel" className="pt-12 pb-section md:pt-20">
      <Container className="grid gap-8 border-b border-line pb-14 lg:grid-cols-12 lg:items-end lg:pb-20">
        <div className="lg:col-span-8">
          <p className="flex items-center gap-3 text-eyebrow font-semibold uppercase text-ink-soft">
            <span aria-hidden className="size-1.5 rounded-full bg-accent" />
            Contact
          </p>
          <h1 id="contact-titel" className="mt-6 font-display text-display-xl uppercase">
            <span className="block">Een vraag?</span>
            <span className="block text-ink-muted">We denken mee.</span>
          </h1>
        </div>
        <p className="max-w-[30rem] text-lead text-ink-soft lg:col-span-4">
          Over je bestelling, een retour of welke variant van het programma bij je past. Je krijgt antwoord van een mens, niet van een bot.
        </p>
      </Container>
      <Container className="mt-14 grid gap-16 lg:mt-20 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ContactForm />
        </div>
        <aside aria-label="Contactgegevens" className="lg:col-span-4 lg:col-start-9">
          <ContactDetails />
        </aside>
      </Container>
    </section>
  );
}
