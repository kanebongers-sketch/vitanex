import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { OOGOPSLAG } from '@/lib/aiyourgym/taal/woorden/website/home'
import { aygPad } from '../site/paden'

// De positionering (ivoor): vijf plekken in een sportschool, een systeem. Een
// editoriale index zoals de inhoudsopgave van een magazine: groot nummer in
// cursief, de plek, wat die plek met Club doet, en een link naar de details.
// Alleen functies die Club echt heeft (inhoud/systeem.ts).

export async function Plekken() {
  const t = OOGOPSLAG[await getSiteTaal()]
  return (
    <section className="vp-plekken ayg-ivoor" aria-labelledby="vp-plekken-titel">
      <div className="ayg-wrap">
        <div className="vp-plekken-kop vp-onthul">
          <p className="ayg-label">{t.label}</p>
          <h2 id="vp-plekken-titel" className="ayg-h2">
            {t.titel.voor}
            <em>{t.titel.accent}</em>
            {t.titel.na}
          </h2>
          <p className="ayg-lead">{t.lead}</p>
        </div>
        <ol className="vp-plekken-lijst vp-onthul">
          {t.rollen.map((r, i) => (
            <li key={r.naam}>
              <Link href={aygPad(r.pad)}>
                <span className="vp-plekken-nr" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="vp-plekken-naam">{r.naam}</span>
                <span className="vp-plekken-tekst">{r.kop}</span>
                <ArrowUpRight className="vp-plekken-pijl" size={22} aria-hidden />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
