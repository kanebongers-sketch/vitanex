'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { isoWeekdag, minutenNaarTijd, tijdNaarMinuten } from '@/lib/club/rooster/tijd'
import type { Openingstijden } from '@/lib/club/rooster/openingstijden'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { kandidaten, type Kandidaat } from '@/lib/club/personeel/controle'
import { MIN_RUST_UREN } from '@/lib/club/personeel/regels'
import { UURSOORTEN, type Beschikbaarheid, type Dienst, type DienstSoort, type PersoneelLid, type Uursoort } from '@/lib/club/personeel/typen'
import { API, stuur, useActie } from './vraag'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'

type FormTekst = (typeof PERSONEEL)['nl']['formulier']

// Het formulier van een dienst. De lijst met medewerkers zet wie die dag kan
// en vrij is bovenaan; wie al staat of niet beschikbaar is staat onderaan met
// de reden erbij, en een gekozen persoon met een probleem geeft een waarschuwing.

export interface Start {
  datum: string
  begin: string | null
  eind: string | null
  medewerkerId: string | null
}

interface Props {
  vestiging: Vestiging
  dienst: Dienst | null
  start: Start
  team: PersoneelLid[]
  soorten: DienstSoort[]
  alle: Dienst[]
  beschikbaarheid: Beschikbaarheid[]
  bemand: Openingstijden
  sluitHref: string
}

interface Waarden {
  datum: string
  soortId: string
  begin: string
  eind: string
  medewerkerId: string
  notitie: string
  uursoort: Uursoort
}

function beginWaarden(dienst: Dienst | null, start: Start, soorten: readonly DienstSoort[], bemand: Openingstijden): Waarden {
  if (dienst) {
    return { datum: dienst.datum, soortId: dienst.soortId ?? '', begin: dienst.begin, eind: dienst.eind, medewerkerId: dienst.medewerkerId ?? '', notitie: dienst.notitie ?? '', uursoort: dienst.uursoort }
  }
  const dag = bemand[isoWeekdag(start.datum) - 1]
  const begin = start.begin ?? dag?.van ?? '08:00'
  const soort = soorten.find((s) => s.begin === begin && (!start.eind || s.eind === start.eind))
  const eind = start.eind ?? soort?.eind ?? minutenNaarTijd(Math.min(tijdNaarMinuten(begin) + 240, 23 * 60 + 59))
  return { datum: start.datum, soortId: soort?.id ?? '', begin, eind, medewerkerId: start.medewerkerId ?? '', notitie: '', uursoort: 'werk' }
}

function optieTekst(k: Kandidaat, tk: FormTekst): string {
  return k.waarschuwing ? tk.metWaarschuwing(k.lid.naam, k.waarschuwing) : k.beschikbaar.status === 'ja' ? tk.beschikbaar(k.lid.naam) : k.lid.naam
}

export function DienstFormulier({ vestiging, dienst, start, team, soorten, alle, beschikbaarheid, bemand, sluitHref }: Props) {
  const router = useRouter()
  const [w, setW] = useState<Waarden>(() => beginWaarden(dienst, start, soorten, bemand))
  const { bezig, fout, setFout, voerUit } = useActie()
  const taal = useTaal()
  const alles = useTekst(PERSONEEL)
  const tk = alles.formulier
  const zet = <K extends keyof Waarden>(k: K, v: Waarden[K]) => setW((oud) => ({ ...oud, [k]: v }))
  const geldig = w.eind > w.begin

  const lijst = useMemo(
    () => (geldig ? kandidaten({ id: dienst?.id ?? 'nieuw', datum: w.datum, begin: w.begin, eind: w.eind, medewerkerId: null, uursoort: 'werk' }, team, alle, beschikbaarheid, MIN_RUST_UREN, taal) : []),
    [geldig, dienst?.id, w.datum, w.begin, w.eind, team, alle, beschikbaarheid, taal],
  )
  const goed = lijst.filter((k) => k.waarschuwing === null)
  const letOp = lijst.filter((k) => k.waarschuwing !== null)
  const gekozen = lijst.find((k) => k.lid.id === w.medewerkerId) ?? null

  function kiesSoort(id: string) {
    const s = soorten.find((x) => x.id === id)
    setW((oud) => (s ? { ...oud, soortId: id, begin: s.begin, eind: s.eind } : { ...oud, soortId: '' }))
  }

  async function opslaan(e: FormEvent) {
    e.preventDefault()
    if (!geldig) return setFout(tk.eindNaBegin)
    const body = { vestiging, datum: w.datum, begin: w.begin, eind: w.eind, medewerkerId: w.medewerkerId || null, soortId: w.soortId || null, notitie: w.notitie, uursoort: w.uursoort }
    const uit = await voerUit(() => (dienst ? stuur(`${API}/diensten/${dienst.id}`, 'PATCH', body) : stuur(`${API}/diensten`, 'POST', body)))
    if (uit.ok) router.push(sluitHref, { scroll: false })
  }

  return (
    <form className="club-personeel-formulier" onSubmit={opslaan}>
      <div className="club-formrij">
        <label className="club-veld">
          <span>{tk.datum}</span>
          <input className="club-invoer" type="date" required value={w.datum} onChange={(e) => zet('datum', e.target.value)} />
        </label>
        <label className="club-veld">
          <span>{tk.soort}</span>
          <select className="club-invoer" value={w.soortId} onChange={(e) => kiesSoort(e.target.value)}>
            <option value="">{tk.eigenTijden}</option>
            {soorten.map((s) => (
              <option key={s.id} value={s.id}>
                {s.naam} ({alles.algemeen.vanTot(s.begin, s.eind)})
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="club-formrij">
        <label className="club-veld">
          <span>{tk.begin}</span>
          <input className="club-invoer" type="time" step={900} required value={w.begin} onChange={(e) => zet('begin', e.target.value)} />
        </label>
        <label className="club-veld">
          <span>{tk.eind}</span>
          <input className="club-invoer" type="time" step={900} required value={w.eind} onChange={(e) => zet('eind', e.target.value)} aria-invalid={!geldig || undefined} />
        </label>
      </div>
      <label className="club-veld">
        <span>{tk.medewerker}</span>
        <select className="club-invoer" value={w.medewerkerId} onChange={(e) => zet('medewerkerId', e.target.value)} aria-describedby="club-personeel-mw-uitleg">
          <option value="">{tk.openOptie}</option>
          {goed.length > 0 && (
            <optgroup label={tk.kanVrij}>
              {goed.map((k) => (
                <option key={k.lid.id} value={k.lid.id}>{optieTekst(k, tk)}</option>
              ))}
            </optgroup>
          )}
          {letOp.length > 0 && (
            <optgroup label={tk.letOp}>
              {letOp.map((k) => (
                <option key={k.lid.id} value={k.lid.id}>{optieTekst(k, tk)}</option>
              ))}
            </optgroup>
          )}
        </select>
      </label>
      <p id="club-personeel-mw-uitleg" className={gekozen?.waarschuwing ? 'club-melding club-melding--fout' : 'club-hint'} role={gekozen?.waarschuwing ? 'alert' : undefined}>
        {gekozen?.waarschuwing
          ? tk.waarschuwing(gekozen.lid.naam, gekozen.waarschuwing.toLowerCase())
          : w.medewerkerId === ''
            ? tk.openUitleg
            : tk.geenBezwaren}
      </p>
      <div className="club-formrij">
        <label className="club-veld">
          <span>{tk.uursoort}</span>
          <select className="club-invoer" value={w.uursoort} onChange={(e) => zet('uursoort', UURSOORTEN.find((u) => u === e.target.value) ?? 'werk')}>
            {UURSOORTEN.map((u) => (
              <option key={u} value={u}>{alles.labels.uursoort[u]}</option>
            ))}
          </select>
        </label>
        <label className="club-veld">
          <span>{tk.notitie}</span>
          <input className="club-invoer" maxLength={300} value={w.notitie} onChange={(e) => zet('notitie', e.target.value)} placeholder={tk.notitiePlaats} />
        </label>
      </div>
      {fout && <p className="club-fout" role="alert">{fout}</p>}
      <div className="club-acties">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>
          {bezig ? alles.algemeen.bezig : dienst ? alles.algemeen.opslaan : tk.inplannen}
        </button>
      </div>
    </form>
  )
}
