import Link from 'next/link'
import type { Kerncijfers as Cijfers } from '@/lib/club/platform/tellingen'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { PLATFORM } from '@/lib/aiyourgym/taal/woorden/club/platform'

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

// Zes compacte tegels met alleen echte tellingen (geen omzet: de prijzen staan in Stripe).
export async function Kerncijfers({ cijfers: c }: KerncijfersProps) {
  const k = (await clubTekst(PLATFORM)).kerncijfers
  const tegels: Tegel[] = [
    { label: k.actief, waarde: c.actief, sub: k.actiefSub },
    { label: k.proef, waarde: c.inProef, sub: c.inProef === null ? k.proefFout : k.proefSub },
    { label: k.aanvragen, waarde: c.aanvragen, sub: k.aanvragenSub, aandacht: c.aanvragen ? 'merk' : undefined, href: '#platform-aanmeldingen-kop' },
    {
      label: k.demo,
      waarde: c.demoOpen ?? null,
      sub: c.demoOpen === null || c.demoOpen === undefined ? k.demoFout : k.demoSub,
      aandacht: c.demoOpen ? 'merk' : undefined,
      href: '#platform-demo-kop',
    },
    {
      label: k.support,
      waarde: c.supportOpen,
      sub: c.supportNietOpgepakt === null ? k.supportSub : k.supportNiet(c.supportNietOpgepakt),
      aandacht: c.supportNietOpgepakt ? 'merk' : undefined,
      href: '/club/hulp/meldingen?status=open',
    },
    { label: k.fouten, waarde: c.fouten24, sub: k.foutenSub, aandacht: c.fouten24 ? 'let-op' : undefined, href: '/club/systeem' },
  ]
  return (
    <section aria-labelledby="platform-cijfers-kop">
      <h2 id="platform-cijfers-kop" className="club-sr">{k.kop}</h2>
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
