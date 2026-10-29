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

// Functies in kleurhoofdstukken (richting 28-10-2026, Figma-frame "Functies"): de held
// met een index van vijf tegels, daarna elk hoofdstuk als eigen vol vlak in een eigen
// laag obsidiaan (obsidian iron, besluit Kane 29-10-2026) met een kop, een zin, drie
// korte punten en groot het scherm (sterk en beknopt, Kane 29-10-2026), en tot slot
// dezelfde oproep als de voorpagina.
export default async function FunctiesPagina() {
  const taal = await getSiteTaal()
  const t = FUNCTIES_PAGINA[taal]
  const s = FUNCTIES_SCHERMEN[taal]
  const actie = ACTIE[taal]
  return (
    <div className="vp fp">
      <section className="fp-held" aria-labelledby="fp-titel">
        <h1 id="fp-titel" className="vp-held-titel fp-titel">
          {regels(t.titel).map((r) => (
            <span key={r} className="vp-regel">
              <span>{r}</span>
            </span>
          ))}
        </h1>
        <div className="fp-held-tekst">
          <p className="vp-held-lead">{t.tekst}</p>
          <div className="vp-knoppen">
            <Link href={SITE_PADEN.AANMELDEN} className="vp-knop vp-knop-vol">
              {actie.probeerDagen(PROEFDAGEN)} <ArrowRight size={18} aria-hidden />
            </Link>
            <Link href={SITE_PADEN.DEMO_AANVRAGEN} className="vp-knop vp-knop-zacht">
              {actie.planDemo}
            </Link>
          </div>
        </div>
        <nav className="fp-index" aria-label={s.index}>
          <ul>
            {HOOFDSTUKKEN.map((h) => (
              <li key={h.sleutel}>
                <a href={`#${h.sleutel}`} className={`fp-vlak-${h.sleutel}`}>
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
            sleutel={h.sleutel}
            naam={g.naam}
            kop={g.kop}
            intro={g.intro}
            functies={g.functies}
            beeldLabel={t.beeld[h.sleutel]}
            spiegel={i % 2 === 1}
            taal={taal}
          />
        )
      })}
      <Oproep />
      <Onthul />
    </div>
  )
}
