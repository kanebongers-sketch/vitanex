'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { actieveVragen, secties } from '@/lib/club/intakevragen/lijst'
import type { IntakeVraag } from '@/lib/club/intakevragen/soorten'
import { IntakeSectie, Stap } from '@/components/club/intakevragen/IntakeSectie'
import { idUit, stuur } from './api'
import { beginStaat, eersteOpen, metingenKlaar, naarVerzoek, sectieKlaar, type IntakeStaat } from './intake-staat'
import { IntakeToestemming } from './IntakeGezondheid'
import { IntakeMetingen } from './IntakeMetingen'
import { LidKiezer, type GekozenLid } from './LidKiezer'
import { VoorstelKnop } from './VoorstelKnop'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { INTAKE, sectieInTaal, vraagInTaal } from '@/lib/aiyourgym/taal/woorden/club/intake'

interface IntakeFormulierProps {
  vestiging: string
  beginLid: GekozenLid | null
  trainers: { id: string; naam: string }[]
  vandaag: string
  /** Pad naar de intakes van een lid ({lid}) en naar de editor ({id}). */
  lidHref: string
  editorHref: string
  /** De intakevragen van de sportschool (club_intakevragen of de standaardset). */
  vragen: IntakeVraag[]
}

/** De intake: lid, de secties van de sportschool en de metingen op een scherm, met de voortgang ernaast. */
export function IntakeFormulier({ vestiging, beginLid, trainers, vandaag, lidHref, editorHref, vragen }: IntakeFormulierProps) {
  const [lid, setLid] = useState<GekozenLid | null>(beginLid)
  const taal = useTaal()
  const t = useTekst(INTAKE).formulier
  const [s, setS] = useState<IntakeStaat>(() => beginStaat(vandaag, trainers[0]?.id ?? ''))
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const [opgeslagen, setOpgeslagen] = useState<string | null>(null)
  const zet = (deel: Partial<IntakeStaat>) => setS((oud) => ({ ...oud, ...deel }))
  const actief = useMemo(() => actieveVragen(vragen), [vragen])
  const delen = useMemo(() => secties(actief), [actief])
  const toestemmingIn = delen.find((d) => d.vragen.some((v) => v.gezondheid))?.naam ?? null
  const open = eersteOpen(actief, s)
  const voortgang = [
    { sleutel: 'lid', label: t.lidGekozen, klaar: lid !== null },
    ...delen.map((d) => ({ sleutel: `sectie-${d.naam}`, label: sectieInTaal(d.naam, taal), klaar: sectieKlaar(d.vragen, s) })),
    { sleutel: 'metingen', label: t.metingen, klaar: metingenKlaar(s) },
  ]

  async function bewaar(e: React.FormEvent) {
    e.preventDefault()
    if (!lid) return setFout(t.kiesLid)
    if (open) return setFout(t.vulIn(vraagInTaal(open, taal).vraag))
    setBezig(true)
    setFout(null)
    const u = await stuur('/intakes', 'POST', naarVerzoek(s, lid.id, actief))
    setBezig(false)
    const id = u.ok ? idUit(u.data) : null
    if (!id) return setFout(u.ok ? t.mislukt : u.fout)
    setOpgeslagen(id)
  }

  if (opgeslagen && lid) {
    return (
      <section className="club-kaart club-kaart--accent club-training-klaar" aria-live="polite">
        <p className="club-boventitel">{t.opgeslagen}</p>
        <h2>{lid.naam}</h2>
        <p className="club-hint">{t.volgende}</p>
        <div className="club-acties">
          <VoorstelKnop intakeId={opgeslagen} editorHref={editorHref} groot />
          <Link className="club-knop club-knop--stil" href={lidHref.replace('__lid__', lid.id)}>{t.later(lid.naam.split(' ')[0])}</Link>
        </div>
      </section>
    )
  }

  return (
    <form className="club-training-intake" onSubmit={bewaar} noValidate>
      <div className="club-training-stappen">
        <Stap nr={1} titel={t.stapLid}>
          {lid ? (
            <div className="club-training-lidfilter">
              <span className="club-training-lidfilter-naam">{lid.naam}</span>
              {lid.lidnummer && <span className="club-zacht">{lid.lidnummer}</span>}
              <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => setLid(null)}>{t.anderLid}</button>
            </div>
          ) : (
            <LidKiezer vestiging={vestiging} onKies={setLid} autoFocus />
          )}
          <div className="club-formrij">
            <label className="club-veld">
              <span>{t.datum}</span>
              <input type="date" className="club-invoer" value={s.datum} max={vandaag} onChange={(e) => zet({ datum: e.target.value })} />
            </label>
            <label className="club-veld">
              <span>{t.trainer}</span>
              <select className="club-invoer" value={s.medewerkerId} onChange={(e) => zet({ medewerkerId: e.target.value })}>
                <option value="">{t.geen}</option>
                {trainers.map((t) => <option key={t.id} value={t.id}>{t.naam}</option>)}
              </select>
            </label>
          </div>
        </Stap>

        {delen.map((d, i) => (
          <IntakeSectie key={d.naam} nr={i + 2} naam={d.naam} vragen={d.vragen} s={s} zet={zet} metToestemming={d.naam === toestemmingIn} />
        ))}

        <Stap nr={delen.length + 2} titel={t.metingen}>
          {toestemmingIn === null && <IntakeToestemming aan={s.toestemming} onZet={(aan) => zet({ toestemming: aan })} />}
          <IntakeMetingen s={s} zet={zet} />
          <label className="club-veld">
            <span>{t.notitie}</span>
            <textarea className="club-invoer" value={s.notitie} maxLength={2000} onChange={(e) => zet({ notitie: e.target.value })} rows={3} />
          </label>
        </Stap>
      </div>

      <aside className="club-training-voortgang" aria-label={t.voortgang}>
        <ol>
          {voortgang.map((v) => (
            <li key={v.sleutel} data-klaar={v.klaar}>
              <span className="club-training-vinkje" aria-hidden>{v.klaar ? <Check size={14} /> : null}</span>
              {v.label}
              <span className="club-sr">{v.klaar ? t.klaar : t.open}</span>
            </li>
          ))}
        </ol>
        <p className="club-hint">{s.toestemming ? t.metToestemming : t.zonderToestemming}</p>
        {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
        <button type="submit" className="club-knop club-knop--primair club-knop--groot" disabled={bezig || !lid}>
          {bezig ? t.opslaanBezig : t.opslaan}
        </button>
      </aside>
    </form>
  )
}
