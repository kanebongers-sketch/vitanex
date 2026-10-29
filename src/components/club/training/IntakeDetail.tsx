import { ShieldCheck, ShieldOff } from 'lucide-react'
import { berekenBmi, bmiDuiding } from '@/lib/club/training/intake'
import type { Intake } from '@/lib/club/training/intake-rij'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import { INTAKE, sectieInTaal } from '@/lib/aiyourgym/taal/woorden/club/intake'
import { TRAINING_LABELS } from '@/lib/aiyourgym/taal/woorden/club/training-labels'
import { toonDatumLang } from '@/lib/club/training/weergave'
import { toonWaarde, type EigenAntwoord } from '@/lib/club/intakevragen/eigen'

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

/** Eigen antwoorden per sectie, in de volgorde waarin ze zijn opgeslagen. */
function perSectie(eigen: readonly EigenAntwoord[]): [string, EigenAntwoord[]][] {
  const uit = new Map<string, EigenAntwoord[]>()
  for (const a of eigen) uit.set(a.sectie, [...(uit.get(a.sectie) ?? []), a])
  return [...uit.entries()]
}


/** De inhoud van een intake, voor het zijpaneel. */
export function IntakeDetail({ intake, trainer }: IntakeDetailProps) {
  const a = intake.antwoorden
  const m = intake.metingen
  const bmi = berekenBmi(m.gewicht_kg, m.lengte_cm)
  const g = a?.gezondheid ?? null
  const taal = useTaal()
  const t = useTekst(INTAKE).detail
  const l = useTekst(TRAINING_LABELS)
  const getal = (n: number | undefined, eenheid: string) => (n === undefined ? t.nietGemeten : `${formatGetal(n, taal)} ${eenheid}`)
  return (
    <div className="club-training-intakedetail">
      <p className="club-hint">
        {toonDatumLang(intake.datum, taal)}
        {trainer ? t.afgenomenDoor(trainer) : ''}
      </p>
      {a ? (
        <dl className="club-training-defs">
          <Regel label={t.doelen}>{a.doelen.map((d) => l.doel[d]).join(', ')}</Regel>
          <Regel label={t.ervaring}>{l.niveau[a.niveau]}</Regel>
          <Regel label={t.beschikbaar}>{t.beschikbaarTekst(a.dagenPerWeek, a.minutenPerSessie)}</Regel>
          <Regel label={t.voorkeur}>{a.voorkeuren.length ? a.voorkeuren.map((v) => l.voorkeur[v]).join(', ') : t.geenVoorkeur}</Regel>
          {a.motivatie && <Regel label={t.motivatie}>{a.motivatie}</Regel>}
        </dl>
      ) : (
        <p className="club-melding">{t.onleesbaar}</p>
      )}

      {a && a.eigen.length > 0 && perSectie(a.eigen).map(([sectie, antwoorden]) => (
        <section key={sectie} aria-label={sectieInTaal(sectie, taal)}>
          <h3 className="club-training-tussenkop">{sectieInTaal(sectie, taal)}</h3>
          <dl className="club-training-defs">
            {antwoorden.map((e) => <Regel key={e.vraagId} label={e.vraag}>{toonWaarde(e.soort, e.waarde, taal)}</Regel>)}
          </dl>
        </section>
      ))}

      <section aria-label={t.metingen}>
        <h3 className="club-training-tussenkop">{t.metingen}</h3>
        <dl className="club-training-defs club-training-defs--twee">
          <Regel label={t.gewicht}>{getal(m.gewicht_kg, 'kg')}</Regel>
          <Regel label={t.lengte}>{getal(m.lengte_cm, 'cm')}</Regel>
          <Regel label="BMI">{bmi ? `${formatGetal(bmi, taal)} (${bmiDuiding(bmi, taal)})` : t.bmiNiet}</Regel>
          <Regel label={t.vet}>{getal(m.vetpercentage, '%')}</Regel>
          <Regel label={t.buik}>{getal(m.buikomtrek_cm, 'cm')}</Regel>
          {intake.toestemmingGezondheid && <Regel label={t.hartslag}>{getal(m.rusthartslag, t.slagen)}</Regel>}
          {intake.toestemmingGezondheid && <Regel label={t.bloeddruk}>{m.bloeddruk ?? t.nietGemeten}</Regel>}
        </dl>
      </section>

      <section aria-label={t.gezondheid}>
        <h3 className="club-training-tussenkop">{t.gezondheid}</h3>
        {intake.toestemmingGezondheid && g ? (
          <>
            <p className="club-chip club-chip--ok"><ShieldCheck aria-hidden size={14} /> {t.toestemming}</p>
            <dl className="club-training-defs">
              <Regel label={t.blessures}>{g.blessures.length ? g.blessures.map((z) => l.zone[z]).join(', ') : t.geen}</Regel>
              {g.blessureToelichting && <Regel label={t.toelichting}>{g.blessureToelichting}</Regel>}
              {g.klachten && <Regel label={t.klachten}>{g.klachten}</Regel>}
              {g.medicatie && <Regel label={t.medicatie}>{g.medicatie}</Regel>}
              <Regel label={t.gezondheidsvragen}>
                {g.parqJa.length === 0
                  ? t.overalNee
                  : (Object.keys(l.parq) as (keyof typeof l.parq)[]).filter((p) => g.parqJa.includes(p)).map((p) => <span key={p} className="club-training-parq-ja">{t.ja(l.parq[p])}</span>)}
              </Regel>
            </dl>
          </>
        ) : (
          <p className="club-hint"><ShieldOff aria-hidden size={14} /> {t.geenToestemming}</p>
        )}
      </section>

      {intake.notitie && (
        <section aria-label={t.notitie}>
          <h3 className="club-training-tussenkop">{t.notitie}</h3>
          <p className="club-training-tekst">{intake.notitie}</p>
        </section>
      )}
    </div>
  )
}
