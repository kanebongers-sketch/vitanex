import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { BEHEER } from '@/lib/aiyourgym/taal/woorden/club/beheer'
import type { TeDoenId, TeDoenOverzicht } from '@/lib/club/kern/instel-te-doen'

// Alleen als er echt iets openstaat: hoogstens drie grote acties en hoe ver je
// bent. Is alles klaar, dan staat dit blok er niet (de pagina geeft null).

interface NogTeDoenProps {
  overzicht: TeDoenOverzicht
  /** De link per open punt (met de vestiging erbij). */
  href: Record<TeDoenId, string>
}

export async function NogTeDoen({ overzicht, href }: NogTeDoenProps) {
  const t = (await clubTekst(BEHEER)).centrum
  const deel = overzicht.totaal > 0 ? overzicht.klaar / overzicht.totaal : 0
  return (
    <section className="club-ic-tedoen" aria-labelledby="club-ic-tedoen-kop">
      <div className="club-ic-tedoen-kop">
        <h2 id="club-ic-tedoen-kop">{t.nogTeDoen}</h2>
        <span className="club-ic-tedoen-stand">{t.klaar(overzicht.klaar, overzicht.totaal)}</span>
      </div>
      <div
        className="club-ic-balk"
        role="progressbar"
        aria-labelledby="club-ic-tedoen-kop"
        aria-valuemin={0}
        aria-valuemax={overzicht.totaal}
        aria-valuenow={overzicht.klaar}
        aria-valuetext={t.klaar(overzicht.klaar, overzicht.totaal)}
      >
        <span style={{ transform: `scaleX(${deel})` }} />
      </div>
      <ul className="club-ic-acties" role="list">
        {overzicht.open.map((id) => (
          <li key={id}>
            <Link href={href[id]} className="club-ic-actie">
              <span className="club-ic-actie-tekst">
                <strong>{t.acties[id].titel}</strong>
                <span>{t.acties[id].uitleg}</span>
              </span>
              <ArrowRight aria-hidden size={18} className="club-ic-actie-pijl" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
