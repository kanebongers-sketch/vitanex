import Link from 'next/link'
import { ArrowRight, Check, Circle, Eye, LifeBuoy } from 'lucide-react'
import { LedenImport } from '@/components/club/leden/import/LedenImport'
import { startPad, type StapSleutel, type StapStand } from '@/lib/club/start/stappen'
import { demoInlezen, type DemoUitkomst } from '@/lib/club/start/demo-leden'
import { eersteDagStand, type EersteDagPunt } from '@/lib/club/start/eerste-dag'

// Leden inlezen (het echte inlezen staat in de stap zelf, met een voorbeeld
// dat niets opslaat) en "Klaar voor je eerste dag". Plus de introductie per
// stap. Niets hier belooft meer dan Club doet.

export const STAP_INTRO: Record<StapSleutel, string> = {
  soort: 'In ongeveer een kwartier staat je sportschool live. Kies wat voor sportschool je hebt, dan vullen wij de volgende stappen alvast in. Je voortgang wordt steeds bewaard.',
  huisstijl: 'Upload je logo, dan halen we de kleur er zelf uit. Kies ook je eigen adres. In het voorbeeld zie je meteen hoe de ledenapp er voor je leden uitziet.',
  vestigingen: 'Waar je sportschool zit, wanneer hij open is en hoe leden een les boeken.',
  onderdelen: 'Wat je niet gebruikt, zet je uit. Het verdwijnt dan uit het menu, voor jou en je team.',
  lessen: 'De lessen die je geeft en je vaste week, met zaal en instructeur. Na opslaan staan ze in het rooster.',
  team: 'Naam, e-mail, functie en vestiging van je medewerkers, en wat elke functie ziet. Nodig iedereen meteen uit om in te loggen.',
  leden: 'Lees je leden in uit je huidige systeem. Je ziet eerst wat er gebeurt; pas daarna lees je in.',
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
    <section className="club-start-blok club-start-demo" aria-labelledby="start-demo-kop">
      <h2 id="start-demo-kop">
        <Eye aria-hidden size={18} /> Zo werkt het
      </h2>
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
    </section>
  )
}

interface StapLedenProps {
  vestiging: string
  vestigingLabel: string
  /** De volgende stap, voor de knop na het inlezen. */
  verderPad: string
  vandaag: string
}

export function StapLedenInlezen({ vestiging, vestigingLabel, verderPad, vandaag }: StapLedenProps) {
  return (
    <div className="club-start-twee">
      <div className="club-start-stapel club-start-inlezen">
        <section className="club-start-blok" aria-labelledby="start-inlezen-kop">
          <h2 id="start-inlezen-kop">Je ledenbestand</h2>
          <ol className="club-start-genummerd">
            <li>Exporteer je leden uit je huidige systeem (zoals Virtuagym) als CSV, of kies gewoon je Excel-lijst (.xlsx). Club leest het eerste werkblad.</li>
            <li>Een naam is genoeg: voornaam en achternaam, of de hele naam in een kolom. Andere kolommen herkent Club zelf.</li>
            <li>Je ziet eerst wat er gebeurt. Pas daarna lees je in.</li>
          </ol>
          <p className="club-hint">Begin je zonder leden, of komen ze straks via de app? Ga dan gewoon verder.</p>
        </section>
        <LedenImport vestiging={vestiging} vestigingLabel={vestigingLabel} terugNaarStart={verderPad} />
      </div>
      <DemoLeden vandaag={vandaag} />
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
              {p.pad ? (
                <Link href={p.pad} className="club-knop club-knop--klein" aria-label={`${p.titel}: ${p.af === true ? 'aanpassen' : 'nu doen'}`}>
                  {p.af === true ? 'Aanpassen' : 'Nu doen'} <ArrowRight aria-hidden size={14} />
                </Link>
              ) : (
                <span className="club-chip club-chip--uit">Na afronden</span>
              )}
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
        </section>
      </div>
    </div>
  )
}
