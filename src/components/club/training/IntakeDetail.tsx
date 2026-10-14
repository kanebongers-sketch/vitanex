import { ShieldCheck, ShieldOff } from 'lucide-react'
import { berekenBmi, bmiDuiding, PARQ_VRAGEN } from '@/lib/club/training/intake'
import type { Intake } from '@/lib/club/training/intake-rij'
import { DOEL_LABEL, NIVEAU_LABEL, VOORKEUR_LABEL, ZONE_LABEL } from '@/lib/club/training/typen'
import { toonDatumLang } from '@/lib/club/training/weergave'

interface IntakeDetailProps {
  intake: Intake
  trainer: string | null
}

function Regel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="club-training-def">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

const getal = (n: number | undefined, eenheid: string) => (n === undefined ? 'niet gemeten' : `${n.toLocaleString('nl-NL')} ${eenheid}`)

/** De inhoud van een intake, voor het zijpaneel. */
export function IntakeDetail({ intake, trainer }: IntakeDetailProps) {
  const a = intake.antwoorden
  const m = intake.metingen
  const bmi = berekenBmi(m.gewicht_kg, m.lengte_cm)
  const g = a?.gezondheid ?? null
  return (
    <div className="club-training-intakedetail">
      <p className="club-hint">
        {toonDatumLang(intake.datum)}
        {trainer ? ` · afgenomen door ${trainer}` : ''}
      </p>
      {a ? (
        <dl className="club-training-defs">
          <Regel label="Doelen">{a.doelen.map((d) => DOEL_LABEL[d]).join(', ')}</Regel>
          <Regel label="Ervaring">{NIVEAU_LABEL[a.niveau]}</Regel>
          <Regel label="Beschikbaar">{`${a.dagenPerWeek} ${a.dagenPerWeek === 1 ? 'dag' : 'dagen'} per week, ${a.minutenPerSessie} minuten`}</Regel>
          <Regel label="Voorkeur">{a.voorkeuren.length ? a.voorkeuren.map((v) => VOORKEUR_LABEL[v]).join(', ') : 'geen voorkeur'}</Regel>
          {a.motivatie && <Regel label="Motivatie">{a.motivatie}</Regel>}
        </dl>
      ) : (
        <p className="club-melding">De antwoorden van deze intake zijn niet leesbaar.</p>
      )}

      <section aria-label="Metingen">
        <h3 className="club-training-tussenkop">Metingen</h3>
        <dl className="club-training-defs club-training-defs--twee">
          <Regel label="Gewicht">{getal(m.gewicht_kg, 'kg')}</Regel>
          <Regel label="Lengte">{getal(m.lengte_cm, 'cm')}</Regel>
          <Regel label="BMI">{bmi ? `${bmi.toLocaleString('nl-NL')} (${bmiDuiding(bmi)})` : 'niet te berekenen'}</Regel>
          <Regel label="Vetpercentage">{getal(m.vetpercentage, '%')}</Regel>
          <Regel label="Buikomtrek">{getal(m.buikomtrek_cm, 'cm')}</Regel>
          {intake.toestemmingGezondheid && <Regel label="Rusthartslag">{getal(m.rusthartslag, 'slagen per minuut')}</Regel>}
          {intake.toestemmingGezondheid && <Regel label="Bloeddruk">{m.bloeddruk ?? 'niet gemeten'}</Regel>}
        </dl>
      </section>

      <section aria-label="Gezondheid">
        <h3 className="club-training-tussenkop">Gezondheid</h3>
        {intake.toestemmingGezondheid && g ? (
          <>
            <p className="club-chip club-chip--ok"><ShieldCheck aria-hidden size={14} /> Toestemming gegeven</p>
            <dl className="club-training-defs">
              <Regel label="Blessures">{g.blessures.length ? g.blessures.map((z) => ZONE_LABEL[z]).join(', ') : 'geen'}</Regel>
              {g.blessureToelichting && <Regel label="Toelichting">{g.blessureToelichting}</Regel>}
              {g.klachten && <Regel label="Klachten">{g.klachten}</Regel>}
              {g.medicatie && <Regel label="Medicatie">{g.medicatie}</Regel>}
              <Regel label="Gezondheidsvragen">
                {g.parqJa.length === 0
                  ? 'Overal nee'
                  : PARQ_VRAGEN.filter((v) => g.parqJa.includes(v.sleutel)).map((v) => <span key={v.sleutel} className="club-training-parq-ja">Ja: {v.vraag}</span>)}
              </Regel>
            </dl>
          </>
        ) : (
          <p className="club-hint"><ShieldOff aria-hidden size={14} /> Geen toestemming: er zijn geen gezondheidsgegevens vastgelegd.</p>
        )}
      </section>

      {intake.notitie && (
        <section aria-label="Notitie">
          <h3 className="club-training-tussenkop">Notitie</h3>
          <p className="club-training-tekst">{intake.notitie}</p>
        </section>
      )}
    </div>
  )
}
