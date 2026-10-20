import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eisKane } from '@/lib/club/toegang'
import { PROTOTYPE_OEFENINGEN } from '@/lib/club/training/illustratie'
import { materiaalVoorbeelden } from '@/lib/club/training/illustratie/galerij'
import { repdbBeeldBestand, REPDB_ALLE_KOPPELINGEN, REPDB_BRON } from '@/lib/club/training/beelden-repdb'
import { OEFENINGEN_3D } from '@/lib/club/training/3d'
import { coachingVoor } from '@/lib/club/training/coaching'
import { OefeningBeeld } from '@/components/club/training/OefeningBeeld'
import { IllustratieStil } from '@/components/club/training/illustratie/IllustratieSvg'
import { VergelijkRij } from '@/components/club/training/illustratie/VergelijkRij'
import { Vergelijk3dRij } from '@/components/club/training/drie/Vergelijk3dRij'
import '@/components/club/training/illustratie/illustratie.css'
import '@/components/club/training/illustratie/beelden.css'

export const metadata: Metadata = { title: 'Oefenbeelden' }

// Vergelijkpagina voor Kane: per oefening het huidige RepDB-beeld naast een
// eigen illustratie die volledig in code wordt getekend (skelet, houdingen als
// gewrichtshoeken, materiaal als losse onderdelen). Alleen een prototype: in de
// bibliotheek, de editor en de ledenapp verandert niets.
// Daarnaast staan oefeningen in 3D (three.js, eigen figuur en materiaal,
// houdingen als data in src/lib/club/training/3d). Een 3D-oefening zonder eigen
// tekening krijgt een eigen rij met de kernpunten uit de coaching.

interface Rij3d {
  readonly naam: string
  readonly toont: readonly string[]
  readonly repdb: string | null
}

function rijen3d(): Rij3d[] {
  const getekend = new Set(PROTOTYPE_OEFENINGEN.map((o) => o.naam))
  return OEFENINGEN_3D.filter((o) => !getekend.has(o.naam)).map((o) => ({
    naam: o.naam,
    toont: coachingVoor(o.naam)?.kernpunten.map((k) => k.punt) ?? [],
    repdb: REPDB_ALLE_KOPPELINGEN.find((k) => k.naam === o.naam)?.id ?? null,
  }))
}

export default async function BeeldenPagina() {
  await eisKane()
  const materiaal = materiaalVoorbeelden()
  const alleen3d = rijen3d()
  return (
    <>
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">Training · prototype · alleen Kane</p>
          <h1>Oefenbeelden</h1>
          <p>
            Eigen tekeningen in code naast de huidige beelden, voor {OEFENINGEN_3D.length} oefeningen ook in 3D. Begin- en eindhouding zijn gewrichtshoeken; de beweging ertussen wordt uitgerekend,
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

      <section className="club-beelden club-beelden-bibliotheek" aria-labelledby="ill-3d-bibliotheek">
        <div className="club-sectiekop">
          <h2 id="ill-3d-bibliotheek">Meer oefeningen in 3D</h2>
          <span>Gebouwd met bouwstenen per bewegingspatroon</span>
        </div>
        {alleen3d.map((r) => (
          <Vergelijk3dRij
            key={r.naam}
            naam={r.naam}
            toont={r.toont}
            huidig={
              r.repdb ? (
                <OefeningBeeld
                  naam={r.naam}
                  formaat="groot"
                  beeld={{ start: repdbBeeldBestand(r.repdb, 'start'), eind: repdbBeeldBestand(r.repdb, 'eind'), bron: 'repdb', enkel: false }}
                />
              ) : null
            }
          />
        ))}
      </section>

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
