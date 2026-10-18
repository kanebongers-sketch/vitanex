import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eisKane } from '@/lib/club/toegang'
import { PROTOTYPE_OEFENINGEN } from '@/lib/club/training/illustratie'
import { materiaalVoorbeelden } from '@/lib/club/training/illustratie/galerij'
import { repdbBeeldBestand, REPDB_BRON } from '@/lib/club/training/beelden-repdb'
import { OefeningBeeld } from '@/components/club/training/OefeningBeeld'
import { IllustratieStil } from '@/components/club/training/illustratie/IllustratieSvg'
import { VergelijkRij } from '@/components/club/training/illustratie/VergelijkRij'
import '@/components/club/training/illustratie/illustratie.css'
import '@/components/club/training/illustratie/beelden.css'

export const metadata: Metadata = { title: 'Oefenbeelden' }

// Vergelijkpagina voor Kane: per oefening het huidige RepDB-beeld naast een
// eigen illustratie die volledig in code wordt getekend (skelet, houdingen als
// gewrichtshoeken, materiaal als losse onderdelen). Alleen een prototype: in de
// bibliotheek, de editor en de ledenapp verandert niets.

export default async function BeeldenPagina() {
  await eisKane()
  const materiaal = materiaalVoorbeelden()
  return (
    <>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">Training · prototype · alleen Kane</p>
          <h1>Oefenbeelden</h1>
          <p>
            Eigen tekeningen in code naast de huidige beelden. Begin- en eindhouding zijn gewrichtshoeken; de beweging ertussen wordt uitgerekend,
            met handen en voeten vast op het materiaal. De werkende spieren krijgen de accentkleur van de sportschool. Er is nog niets vervangen.
          </p>
        </div>
        <nav aria-label="Training" className="club-acties">
          <Link href="/clubkane/training" className="club-knop club-knop--klein">
            <ArrowLeft size={14} aria-hidden /> Training
          </Link>
        </nav>
      </header>

      <div className="club-beelden">
        {PROTOTYPE_OEFENINGEN.map((o, i) => (
          <VergelijkRij
            key={o.naam}
            index={i}
            huidig={
              <OefeningBeeld
                naam={o.naam}
                formaat="groot"
                beeld={{ start: repdbBeeldBestand(o.repdb, 'start'), eind: repdbBeeldBestand(o.repdb, 'eind'), bron: 'repdb', enkel: false }}
              />
            }
          />
        ))}
      </div>

      <section className="club-beelden-materiaal" aria-labelledby="ill-materiaal">
        <div className="club-sectiekop">
          <h2 id="ill-materiaal">Materiaal</h2>
          <span>Losse onderdelen in dezelfde stijl</span>
        </div>
        <div className="club-beelden-materiaalraster">
          {materiaal.map((m) => (
            <figure key={m.naam} className="club-beelden-variant">
              <div className="club-ill">
                <IllustratieStil lagen={m.lagen} kader={m.kader} label={m.naam} />
              </div>
              <figcaption>{m.naam}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <p className="club-training-beeldbron">
        Huidige beelden: <a href={REPDB_BRON.bron} target="_blank" rel="noreferrer">{REPDB_BRON.vereist}</a>. Nieuwe beelden: eigen tekening van Fit Factory.
      </p>
    </>
  )
}
