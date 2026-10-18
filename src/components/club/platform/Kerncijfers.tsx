import Link from 'next/link'
import type { Kerncijfers as Cijfers } from '@/lib/club/platform/tellingen'

interface KerncijfersProps {
  cijfers: Cijfers
}

interface Tegel {
  label: string
  waarde: number | null
  sub: string
  /** Vraagt dit getal iets van Kane? Dan krijgt de tegel een rand in de merkkleur of koraal. */
  aandacht?: 'merk' | 'let-op'
  href?: string
}

function getal(n: number | null): string {
  return n === null ? '?' : String(n)
}

// Vijf compacte tegels met alleen echte tellingen (geen omzet: de prijzen staan in Stripe).
export function Kerncijfers({ cijfers: c }: KerncijfersProps) {
  const tegels: Tegel[] = [
    { label: 'Actieve sportscholen', waarde: c.actief, sub: 'Met een lopend abonnement.' },
    { label: 'In proefperiode', waarde: c.inProef, sub: c.inProef === null ? 'Stripe niet te lezen.' : 'Proef loopt nog, volgens Stripe.' },
    { label: 'Open aanvragen', waarde: c.aanvragen, sub: 'Wachten op jouw contact.', aandacht: c.aanvragen ? 'merk' : undefined, href: '#platform-aanmeldingen-kop' },
    {
      label: 'Supportmeldingen',
      waarde: c.supportOpen,
      sub: c.supportNietOpgepakt === null ? 'Open of in behandeling.' : `${c.supportNietOpgepakt} nog niet opgepakt.`,
      aandacht: c.supportNietOpgepakt ? 'merk' : undefined,
      href: '/clubkane/hulp/meldingen?status=open',
    },
    { label: 'Fouten 24 uur', waarde: c.fouten24, sub: 'Verschillende serverfouten.', aandacht: c.fouten24 ? 'let-op' : undefined, href: '/clubkane/systeem' },
  ]
  return (
    <section aria-labelledby="platform-cijfers-kop">
      <h2 id="platform-cijfers-kop" className="club-sr">Kerncijfers</h2>
      <ul className="club-platform-tegels">
        {tegels.map((t) => {
          const inhoud = (
            <>
              <span className="club-tegel-label">{t.label}</span>
              <span className="club-tegel-getal">{getal(t.waarde)}</span>
              <span className="club-tegel-sub">{t.sub}</span>
            </>
          )
          return (
            <li key={t.label} className="club-tegel club-platform-tegel" data-aandacht={t.aandacht}>
              {t.href ? <Link href={t.href} className="club-platform-tegel-link">{inhoud}</Link> : inhoud}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
