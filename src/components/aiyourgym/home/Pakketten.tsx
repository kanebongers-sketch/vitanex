import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PAKKETTEN, PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { Knop, SectieKop } from '@/components/aiyourgym/site/bouwstenen'
import { AANMELDEN, aygPad } from '@/components/aiyourgym/site/paden'

// Overstappen en pakketten in het kort, met een link naar de volledige pagina's.

export function Overstap() {
  return (
    <section className="ayg-sectie" aria-labelledby="overstap-titel">
      <div className="ayg-wrap ayg-gesplitst">
        <SectieKop
          id="overstap-titel"
          label="Overstappen"
          titel="Werkt naast je ledenadministratie."
          tekst="Incasso en abonnementen blijven waar ze nu zijn. Je leden lees je in met een CSV-bestand uit je huidige systeem of uit Excel, en je ziet eerst precies wat er verandert."
        />
        <ol className="ayg-genummerd">
          <li>
            <div>
              <h3 className="ayg-h3">Ledenbestand inlezen</h3>
              <p>AI Your Gym herkent de kolommen. Nieuwe leden komen erbij, bestaande worden bijgewerkt, er wordt nooit iemand verwijderd.</p>
            </div>
          </li>
          <li>
            <div>
              <h3 className="ayg-h3">Huisstijl en vestigingen</h3>
              <p>Logo, kleuren, zalen, lessen en openingstijden. Daarna staat het rooster klaar voor je leden.</p>
            </div>
          </li>
          <li>
            <div>
              <h3 className="ayg-h3">Team erbij</h3>
              <p>Trainers en clubmanagers krijgen toegang tot wat zij nodig hebben.</p>
              <p className="ayg-ruim">
                <Link href={aygPad('/overstappen')} className="ayg-pijllink">
                  Zo stap je over <ArrowRight size={16} aria-hidden />
                </Link>
              </p>
            </div>
          </li>
        </ol>
      </div>
    </section>
  )
}

export function PakkettenKort() {
  return (
    <section className="ayg-sectie" aria-labelledby="pakketten-titel">
      <div className="ayg-wrap">
        <SectieKop
          naast
          id="pakketten-titel"
          label="Pakketten"
          titel="Een pakket dat past bij je sportschool."
          tekst={`Scherp geprijsd, met een prijs die past bij je sportschool. Probeer eerst ${PROEFDAGEN} dagen gratis.`}
        />
        <ul className="ayg-pakket-rij">
          {PAKKETTEN.map((p) => (
            <li key={p.sleutel} data-aanbevolen={p.aanbevolen ? '' : undefined}>
              <h3 className="ayg-h3">{p.naam}</h3>
              <p>{p.voorWie}</p>
            </li>
          ))}
        </ul>
        <div className="ayg-knoppen ayg-ruim-boven">
          <Knop href={aygPad('/prijzen')} pijl>
            Bekijk de pakketten
          </Knop>
          <Knop href={AANMELDEN} soort="rand">
            Probeer gratis
          </Knop>
        </div>
      </div>
    </section>
  )
}
