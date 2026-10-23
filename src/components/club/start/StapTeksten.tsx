import Link from 'next/link'
import { ArrowRight, Check, Circle, Eye, FileSpreadsheet, LifeBuoy } from 'lucide-react'
import { startPad, type StapSleutel, type StapStand } from '@/lib/club/start/stappen'
import { demoInlezen, type DemoUitkomst } from '@/lib/club/start/demo-leden'
import { eersteDagStand, type EersteDagPunt } from '@/lib/club/start/eerste-dag'

// De stappen zonder eigen formulier: leden inlezen (met een voorbeeld dat
// niets opslaat) en "Klaar voor je eerste dag". Plus de introductie per stap.
// Niets hier belooft meer dan Club doet.

export const STAP_INTRO: Record<StapSleutel, string> = {
  soort: 'In ongeveer een kwartier staat je sportschool live. Kies wat voor sportschool je hebt, dan zetten wij de rest alvast klaar. Elke stap kun je overslaan en je voortgang wordt steeds bewaard.',
  huisstijl: 'Upload je logo, dan halen we de kleur er zelf uit. In het voorbeeld zie je meteen hoe de ledenapp er voor je leden uitziet.',
  vestigingen: 'Waar je sportschool zit en wanneer hij open is. Een klik voor de standaardtijden, of stel ze per dag in.',
  onderdelen: 'Wat je niet gebruikt, zet je uit. Het verdwijnt dan uit het menu, voor jou en je team.',
  lessen: 'De groepslessen die je geeft, en eventueel een paar vaste lessen in je week.',
  team: 'Alleen naam, e-mail en rol. Nodig iedereen meteen uit om in te loggen, of doe dat later bij Medewerkers.',
  leden: 'Lees je leden in uit je huidige systeem, of doe het later. Bekijk eerst hoe het werkt met een voorbeeld.',
  klaar: 'Je sportschool staat. Hier zie je je eigen adressen en een kort lijstje voor je eerste dag. Rond af als het klopt.',
}

const UITKOMST: Record<DemoUitkomst, { label: string; chip: string }> = {
  nieuw: { label: 'Nieuw lid', chip: 'club-chip--ok' },
  bijwerken: { label: 'Wordt bijgewerkt', chip: 'club-chip--info' },
  gelijk: { label: 'Al gelijk', chip: 'club-chip--uit' },
  dubbel: { label: 'Dubbel', chip: 'club-chip--info' },
  fout: { label: 'Kan niet mee', chip: 'club-chip--let-op' },
}

function DemoLeden({ vandaag }: { vandaag: string }) {
  const demo = demoInlezen(vandaag)
  return (
    <details className="club-start-uitklap club-start-demo">
      <summary>
        <Eye aria-hidden size={16} /> Bekijk eerst een voorbeeld
      </summary>
      <p className="club-hint">
        Een verzonnen bestand met {demo.rijen.length} rijen, door precies dezelfde controle als jouw bestand. <strong>Er wordt niets opgeslagen.</strong>
      </p>
      <p className="club-start-demo-herkend">
        <span className="club-zacht">Zelf herkend:</span> {demo.herkend.join(', ')}
      </p>
      <ul className="club-start-demo-rijen" role="list">
        {demo.rijen.map((r) => (
          <li key={r.regel}>
            <span className="club-start-demo-regel club-getal">{r.regel}</span>
            <span className="club-start-demo-naam">
              <strong>{r.naam}</strong>
              {r.melding && <span className="club-zacht">{r.melding}</span>}
            </span>
            <span className={`club-chip ${UITKOMST[r.uitkomst].chip}`}>{UITKOMST[r.uitkomst].label}</span>
          </li>
        ))}
      </ul>
      <p className="club-start-demo-som">
        Uitkomst: <strong>{demo.telling.nieuw} nieuwe leden</strong>, {demo.telling.dubbel} dubbel overgeslagen, {demo.telling.fout} rij die je eerst aanvult. Er wordt nooit iemand verwijderd.
      </p>
    </details>
  )
}

interface StapLedenProps {
  importPad: string | null
  vandaag: string
}

export function StapLedenInlezen({ importPad, vandaag }: StapLedenProps) {
  return (
    <div className="club-start-twee">
      <section className="club-start-blok club-start-actie" aria-labelledby="start-inlezen-kop">
        <h2 id="start-inlezen-kop">Je ledenbestand</h2>
        <ol className="club-start-genummerd">
          <li>Exporteer je leden uit je huidige systeem (zoals Virtuagym) als CSV, of kies gewoon je Excel-lijst (.xlsx). Club leest het eerste werkblad.</li>
          <li>Een naam is genoeg: voornaam en achternaam, of de hele naam in een kolom. Andere kolommen herkent Club zelf.</li>
          <li>Je ziet eerst wat er gebeurt. Pas daarna lees je in.</li>
        </ol>
        {importPad ? (
          <Link href={importPad} className="club-knop club-knop--primair">
            <FileSpreadsheet aria-hidden size={16} /> Bestand kiezen
          </Link>
        ) : (
          <p className="club-melding">Leden staat uit of er is nog geen vestiging. Zet Leden aan bij Onderdelen of voeg eerst een vestiging toe.</p>
        )}
        <DemoLeden vandaag={vandaag} />
      </section>
      <section className="club-start-blok" aria-labelledby="start-later-kop">
        <h2 id="start-later-kop">Later doen</h2>
        <p>Geen bestand bij de hand? Ga gewoon verder. Je vindt het inlezen later bij Leden, en het staat op de checklist aan het eind van de wizard.</p>
        <p className="club-hint">Na het inlezen brengt de knop Verder met de startwizard je hier terug.</p>
      </section>
    </div>
  )
}

interface StapKlaarProps {
  punten: readonly EersteDagPunt[]
  stand: readonly StapStand[]
  vestiging: string | null
}

function PuntStatus({ af }: { af: boolean | null }) {
  if (af === true) return <Check aria-hidden size={14} strokeWidth={3} />
  return <Circle aria-hidden size={10} strokeWidth={2.5} />
}

export function StapKlaar({ punten, stand, vestiging }: StapKlaarProps) {
  const { af, meetbaar } = eersteDagStand(punten)
  const open = stand.filter((s) => !s.af && s.sleutel !== 'klaar')
  return (
    <div className="club-start-twee">
      <section className="club-start-blok" aria-labelledby="start-eerste-kop">
        <div className="club-start-blokkop">
          <h2 id="start-eerste-kop">Klaar voor je eerste dag</h2>
          <span className="club-chip club-chip--merk">
            {af} van {meetbaar} staat er
          </span>
        </div>
        <ul className="club-start-eerste" role="list">
          {punten.map((p) => (
            <li key={p.id} data-af={p.af === true || undefined}>
              <span className="club-start-bol" aria-hidden>
                <PuntStatus af={p.af} />
              </span>
              <span className="club-start-eerste-tekst">
                <strong>{p.titel}</strong>
                <span className="club-zacht">{p.uitleg}</span>
              </span>
              <Link href={p.pad} className="club-knop club-knop--klein" aria-label={`${p.titel}: ${p.af === true ? 'bekijken' : 'nu doen'}`}>
                {p.af === true ? 'Bekijken' : p.af === false ? 'Nu doen' : 'Openen'} <ArrowRight aria-hidden size={14} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <div className="club-start-stapel">
        {open.length > 0 && (
          <section className="club-start-blok" aria-labelledby="start-open-kop">
            <h2 id="start-open-kop">Nog open in de wizard</h2>
            <ul className="club-start-links" role="list">
              {open.map((s) => (
                <li key={s.sleutel}>
                  <Link href={startPad(s.nummer, vestiging)}>
                    {s.nummer}. {s.titel} <ArrowRight aria-hidden size={14} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="club-start-blok club-start-hulp" aria-labelledby="start-hulp-kop">
          <LifeBuoy aria-hidden size={28} />
          <h2 id="start-hulp-kop">Hulp nodig?</h2>
          <p>Kom je er niet uit, of wil je dat we meekijken? In de pakketten Club en Keten zit persoonlijke hulp bij het inrichten.</p>
          <Link href="/club/hulp" className="club-knop">
            Naar hulp en support
          </Link>
          <p className="club-hint">Alles uit deze wizard vind je later terug in het instellingencentrum onder Beheer.</p>
        </section>
      </div>
    </div>
  )
}
