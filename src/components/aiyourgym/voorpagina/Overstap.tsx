import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { VOORPAGINA } from '@/lib/aiyourgym/taal/woorden/website/voorpagina'
import { SITE_PADEN } from '../site/paden'

// Overstappen (obsidiaan): drie stappen als een tijdlijn met grote cursieve cijfers
// en een champagne lijn die ze verbindt. Kort; de zes stappen in detail en de
// gratis checklist staan op hun eigen pagina's (inhoud/vertrouwen.ts).

export async function Overstap() {
  const t = VOORPAGINA[await getSiteTaal()].overstap
  return (
    <section className="vp-overstap" aria-labelledby="vp-overstap-titel">
      <div className="ayg-wrap">
        <div className="ayg-sectiekop ayg-sectiekop--naast vp-onthul">
          <p className="ayg-label">{t.oog}</p>
          <h2 id="vp-overstap-titel" className="ayg-h2">
            {t.titel.voor} <em>{t.titel.accent}</em>
          </h2>
          <p className="ayg-lead">{t.tekst}</p>
        </div>
        <ol className="vp-overstap-stappen vp-onthul">
          {t.stappen.map((s, i) => (
            <li key={s.titel}>
              <span className="vp-overstap-nr" aria-hidden>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3>{s.titel}</h3>
              <p>{s.tekst}</p>
            </li>
          ))}
        </ol>
        <div className="ayg-knoppen vp-overstap-acties">
          <Link href={SITE_PADEN.OVERSTAPPEN} className="ayg-knop ayg-knop--rand">
            {t.link} <ArrowRight size={17} aria-hidden />
          </Link>
          <Link href={SITE_PADEN.OVERSTAPCHECKLIST} className="ayg-pijllink">
            {t.checklist} <ArrowRight size={17} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
