import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Hoofdstuk } from '@/components/aiyourgym/functies-pagina/Hoofdstuk'
import { HOOFDSTUKKEN } from '@/components/aiyourgym/inhoud/functies'
import { SITE_PADEN } from '@/components/aiyourgym/site/paden'
import { Onthul } from '@/components/aiyourgym/voorpagina/Onthul'
import { Oproep } from '@/components/aiyourgym/voorpagina/Oproep'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { siteAlternates } from '@/lib/aiyourgym/taal/metadata'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { ACTIE } from '@/lib/aiyourgym/taal/woorden/website/actie'
import { FUNCTIES_PAGINA } from '@/lib/aiyourgym/taal/woorden/website/functies'
import { FUNCTIES_SCHERMEN } from '@/lib/aiyourgym/taal/woorden/website/functies-schermen'

export async function generateMetadata(): Promise<Metadata> {
  const taal = await getSiteTaal()
  const t = FUNCTIES_PAGINA[taal]
  return { title: t.metaTitel, description: t.metaOmschrijving, alternates: siteAlternates('/functies') }
}

/** De titel in twee regels: elke zin op een eigen regel. */
function regels(titel: string): string[] {
  return titel.split(/(?<=\.)\s+/)
}

// Functies in de richting "Obsidian Luxury" (28-10-2026): de held op obsidiaan met een
// index van vijf hoofdstukken, daarna elk hoofdstuk als eigen vlak in het ritme van de
// site (Beheer obsidiaan, Coaching antraciet, Planning ivoor, Groei obsidiaan,
// Betrokkenheid antraciet) en tot slot dezelfde oproep als de voorpagina.
export default async function FunctiesPagina() {
  const taal = await getSiteTaal()
  const t = FUNCTIES_PAGINA[taal]
  const s = FUNCTIES_SCHERMEN[taal]
  const actie = ACTIE[taal]
  return (
    <div className="vp fp">
      <section className="fp-held ayg-wrap" aria-labelledby="fp-titel">
        <p className="ayg-label fp-oog">{t.label}</p>
        <h1 id="fp-titel" className="vp-held-titel fp-titel">
          {regels(t.titel).map((r) => (
            <span key={r} className="vp-regel">
              <span>{r}</span>
            </span>
          ))}
        </h1>
        <div className="fp-held-tekst">
          <p className="ayg-lead">{t.tekst}</p>
          <div className="ayg-knoppen">
            <Link href={SITE_PADEN.AANMELDEN} className="ayg-knop ayg-knop--accent">
              {actie.probeerDagen(PROEFDAGEN)} <ArrowRight size={18} aria-hidden />
            </Link>
            <Link href={SITE_PADEN.DEMO_AANVRAGEN} className="ayg-knop ayg-knop--rand">
              {actie.planDemo}
            </Link>
          </div>
        </div>
        <nav className="fp-index" aria-label={s.index}>
          <ul>
            {HOOFDSTUKKEN.map((h, i) => (
              <li key={h.sleutel}>
                <a href={`#${h.sleutel}`}>
                  <span className="fp-index-nr" aria-hidden>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {t.hoofdstukken[h.sleutel].naam}
                  <ArrowRight size={18} aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </section>
      {HOOFDSTUKKEN.map((h, i) => {
        const g = t.hoofdstukken[h.sleutel]
        return (
          <Hoofdstuk
            key={h.sleutel}
            nr={i + 1}
            sleutel={h.sleutel}
            naam={g.naam}
            kop={g.kop}
            intro={g.intro}
            functies={g.functies}
            beeldLabel={t.beeld[h.sleutel]}
            taal={taal}
          />
        )
      })}
      <Oproep />
      <Onthul />
    </div>
  )
}
