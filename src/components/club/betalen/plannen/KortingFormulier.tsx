'use client'

import { useId, useMemo, useState, type FormEvent } from 'react'
import { stuur } from '@/components/club/leden/stuur'
import { leesKortingInvoer } from '@/lib/club/betalen/plannen/korting-invoer'
import type { Korting, KortingSoort } from '@/lib/club/betalen/plannen/model'
import { centNaarInvoer, invoerNaarCent, kortingWaardeTekst } from '@/lib/club/betalen/plannen/tekst'

// Een korting of actie toevoegen of wijzigen: naam, procent of bedrag, voor
// welk plan, hoe lang (termijnen), een optionele code, wanneer hij geldt, hoe
// vaak en aan of uit. Dezelfde controle als op de server kijkt live mee.

export interface PlanKeuze {
  id: string
  label: string
}

interface Props {
  plannen: readonly PlanKeuze[]
  begin?: Korting
  onKlaar: (tekst: string) => void
  onAnnuleer?: () => void
}

interface Staat {
  naam: string
  code: string
  soort: KortingSoort
  waarde: string
  planId: string
  van: string
  tot: string
  duur: string
  max: string
  bewijs: boolean
  actief: boolean
}

function beginStaat(k?: Korting): Staat {
  return {
    naam: k?.naam ?? '',
    code: k?.code ?? '',
    soort: k?.soort ?? 'procent',
    waarde: k ? (k.soort === 'procent' ? String(k.waarde) : centNaarInvoer(k.waarde)) : '',
    planId: k?.planId ?? '',
    van: k?.geldigVanaf ?? '',
    tot: k?.geldigTot ?? '',
    duur: k?.duurTermijnen ? String(k.duurTermijnen) : '',
    max: k?.maxGebruik ? String(k.maxGebruik) : '',
    bewijs: k?.vereistBewijs ?? false,
    actief: k?.actief ?? true,
  }
}

function body(s: Staat): Record<string, unknown> {
  return {
    naam: s.naam,
    code: s.code,
    soort: s.soort,
    waarde: s.soort === 'procent' ? s.waarde : (invoerNaarCent(s.waarde) ?? Number.NaN),
    planId: s.planId === '' ? null : s.planId,
    geldigVanaf: s.van,
    geldigTot: s.tot,
    duurTermijnen: s.duur,
    maxGebruik: s.max,
    vereistBewijs: s.bewijs,
    actief: s.actief,
  }
}

export function KortingFormulier({ plannen, begin, onKlaar, onAnnuleer }: Props) {
  const id = useId()
  const [s, setS] = useState<Staat>(() => beginStaat(begin))
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const zet = <K extends keyof Staat>(k: K, v: Staat[K]) => setS((oud) => ({ ...oud, [k]: v }))
  const ids = useMemo(() => plannen.map((p) => p.id), [plannen])
  const controle = useMemo(() => leesKortingInvoer(body(s), ids), [s, ids])

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    if (!controle.ok) return setFout(controle.fout)
    setBezig(true)
    setFout(null)
    const uit = begin ? await stuur(`/api/club/betalen/kortingen/${begin.id}`, 'PATCH', body(s)) : await stuur('/api/club/betalen/kortingen', 'POST', body(s))
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    if (!begin) setS(beginStaat())
    onKlaar(begin ? `${s.naam} is aangepast.` : `${s.naam} is toegevoegd.`)
  }

  return (
    <form className="club-korting-form" onSubmit={(e) => void bewaar(e)} aria-describedby={fout ? `${id}-fout` : undefined}>
      <label className="club-veld">
        <span>Naam</span>
        <input className="club-invoer" required maxLength={80} value={s.naam} onChange={(e) => zet('naam', e.target.value)} placeholder="Zomeractie of Studentenkorting" />
      </label>
      <div className="club-formrij club-plan-rij3">
        <label className="club-veld">
          <span>Soort</span>
          <select className="club-invoer" value={s.soort} onChange={(e) => setS((o) => ({ ...o, soort: e.target.value === 'bedrag' ? 'bedrag' : 'procent', waarde: '' }))}>
            <option value="procent">Procent</option>
            <option value="bedrag">Bedrag in euro</option>
          </select>
        </label>
        <label className="club-veld">
          <span>{s.soort === 'procent' ? 'Procent' : 'Bedrag per termijn'}</span>
          <input className="club-invoer" required inputMode={s.soort === 'procent' ? 'numeric' : 'decimal'} value={s.waarde} onChange={(e) => zet('waarde', e.target.value)} placeholder={s.soort === 'procent' ? '25' : '5,00'} />
        </label>
        <label className="club-veld">
          <span>Aantal termijnen</span>
          <input className="club-invoer" type="number" inputMode="numeric" min={1} max={60} value={s.duur} onChange={(e) => zet('duur', e.target.value)} placeholder="Hele looptijd" />
        </label>
      </div>
      <label className="club-veld">
        <span>Geldt voor</span>
        <select className="club-invoer" value={s.planId} onChange={(e) => zet('planId', e.target.value)}>
          <option value="">Alle plannen</option>
          {plannen.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </label>
      <div className="club-formrij club-plan-rij3">
        <label className="club-veld">
          <span>Code (mag leeg)</span>
          <input className="club-invoer" maxLength={30} autoCapitalize="characters" spellCheck={false} value={s.code} onChange={(e) => zet('code', e.target.value)} placeholder="WELKOM" />
        </label>
        <label className="club-veld">
          <span>Geldig vanaf</span>
          <input className="club-invoer" type="date" value={s.van} onChange={(e) => zet('van', e.target.value)} />
        </label>
        <label className="club-veld">
          <span>Geldig tot en met</span>
          <input className="club-invoer" type="date" min={s.van || undefined} value={s.tot} onChange={(e) => zet('tot', e.target.value)} />
        </label>
      </div>
      <label className="club-veld club-plan-smal">
        <span>Hooguit zo vaak te gebruiken</span>
        <input className="club-invoer" type="number" inputMode="numeric" min={1} value={s.max} onChange={(e) => zet('max', e.target.value)} placeholder="Onbeperkt" />
      </label>
      <label className="club-lidm-vink">
        <input type="checkbox" checked={s.bewijs} onChange={(e) => zet('bewijs', e.target.checked)} /> Bewijs nodig, zoals een studentenkaart
      </label>
      <label className="club-lidm-vink">
        <input type="checkbox" checked={s.actief} onChange={(e) => zet('actief', e.target.checked)} /> Aan
      </label>
      <p className={controle.ok ? 'club-hint' : 'club-hint club-korting-wacht'} aria-live="polite">
        {controle.ok
          ? `${kortingWaardeTekst(controle.waarde)}${controle.waarde.duurTermijnen ? `, ${controle.waarde.duurTermijnen} ${controle.waarde.duurTermijnen === 1 ? 'termijn' : 'termijnen'}` : ', de hele looptijd'}.`
          : controle.fout}
      </p>
      <div id={`${id}-fout`} role="alert">
        {fout && <p className="club-melding club-melding--fout">{fout}</p>}
      </div>
      <div className="club-lidm-formacties">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>
          {bezig ? 'Bezig...' : begin ? 'Opslaan' : 'Korting toevoegen'}
        </button>
        {onAnnuleer && (
          <button type="button" className="club-knop club-knop--stil" onClick={onAnnuleer}>Annuleren</button>
        )}
      </div>
    </form>
  )
}
