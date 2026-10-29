'use client'

import { useId, useMemo, useState, type FormEvent } from 'react'
import { useVestigingen } from '@/components/club/shell/VestigingenContext'
import { stuur } from '@/components/club/leden/stuur'
import { isDatum } from '@/lib/club/betalen/contract/datum'
import { BTW_REGELS, BTW_SLEUTELS, type BtwProcent } from '@/lib/club/betalen/geld/btw-tarieven'
import { leesPlanInvoer } from '@/lib/club/betalen/plannen/invoer'
import { DOELGROEPEN, INTERVALLEN, MAAND_INTERVALLEN, type Doelgroep, type Interval } from '@/lib/club/betalen/plannen/model'
import type { PlanWeergave } from '@/lib/club/betalen/plannen/weergave'
import { datumTekst } from '@/lib/club/betalen/plannen/voorbeeld'
import { beginPlanStaat, planBody, type PlanStaat } from './plan-staat'
import { PlanVoorbeeld } from './PlanVoorbeeld'
import { PlanVestigingen } from './PlanVestigingen'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { BETALEN } from '@/lib/aiyourgym/taal/woorden/club/betalen'

// Een plan toevoegen of wijzigen, met naast de velden een live voorbeeld uit
// dezelfde controle als op de server. Heeft het plan al leden en verandert de
// prijs, dan kies je een ingangsdatum: bestaande leden houden hun prijs.

interface Props {
  vormId: string
  vandaag: string
  begin?: PlanWeergave
  onKlaar: (tekst: string) => void
  onAnnuleer: () => void
}

export function PlanFormulier({ vormId, vandaag, begin, onKlaar, onAnnuleer }: Props) {
  const vestigingen = useVestigingen()
  const id = useId()
  const [s, setS] = useState<PlanStaat>(() => beginPlanStaat(begin))
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const taal = useTaal()
  const tb = useTekst(BETALEN)
  const t = tb.plan
  const zet = <K extends keyof PlanStaat>(k: K, v: PlanStaat[K]) => setS((oud) => ({ ...oud, [k]: v }))
  const slugs = useMemo(() => vestigingen.map((v) => v.sleutel), [vestigingen])
  const controle = useMemo(() => leesPlanInvoer(planBody(s, vormId), slugs), [s, vormId, slugs])
  const prijsAnders = controle.ok && begin !== undefined && (controle.waarde.bedragCent !== begin.laatste.bedragCent || controle.waarde.btwProcent !== begin.laatste.btwProcent)
  const vraagDatum = prijsAnders && begin !== undefined && begin.contracten > 0

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    if (!controle.ok) return setFout(controle.fout)
    setBezig(true)
    setFout(null)
    const body = planBody(s, vormId)
    const uit = begin ? await stuur(`/api/club/betalen/plannen/${begin.id}`, 'PATCH', body) : await stuur('/api/club/betalen/plannen', 'POST', body)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    const vanaf = (uit.data as { geldigVanaf?: unknown } | null)?.geldigVanaf
    onKlaar(isDatum(vanaf) ? t.bewaardVanaf(s.naam, datumTekst(vanaf, taal)) : begin ? t.aangepast(s.naam) : t.toegevoegd(s.naam))
  }

  return (
    <form className="club-plan-form" onSubmit={(e) => void bewaar(e)} aria-describedby={fout ? `${id}-fout` : undefined}>
      <div className="club-plan-velden">
        <label className="club-veld">
          <span>{t.naam}</span>
          <input className="club-invoer" required maxLength={80} value={s.naam} onChange={(e) => zet('naam', e.target.value)} placeholder={t.naamVoorbeeld} />
        </label>
        <div className="club-formrij club-plan-rij3">
          <label className="club-veld">
            <span>{t.prijs}</span>
            <input className="club-invoer" inputMode="decimal" required value={s.bedrag} onChange={(e) => zet('bedrag', e.target.value)} placeholder="39,95" />
          </label>
          <label className="club-veld">
            <span>{t.betalen}</span>
            <select className="club-invoer" value={s.interval} onChange={(e) => zet('interval', e.target.value as Interval)}>
              {INTERVALLEN.map((i) => <option key={i} value={i}>{tb.interval[i]}</option>)}
            </select>
          </label>
          <label className="club-veld">
            <span>{t.btw}</span>
            <select className="club-invoer" value={s.btw} onChange={(e) => zet('btw', Number(e.target.value) as BtwProcent)}>
              {BTW_SLEUTELS.map((k) => <option key={k} value={BTW_REGELS[k].procent}>{tb.btw[k].label}</option>)}
            </select>
          </label>
        </div>
        <p className="club-hint">{tb.btw[BTW_SLEUTELS.find((k) => BTW_REGELS[k].procent === s.btw) ?? 'laag'].voorstelVoor}. {t.btwToetsen}</p>
        {vraagDatum && begin && (
          <div className="club-plan-prijsdatum">
            <p>{t.bestaandeLeden(begin.contracten)}</p>
            <label className="club-veld club-plan-smal">
              <span>{t.vanaf}</span>
              <input className="club-invoer" type="date" required min={vandaag} value={s.prijsVanaf} onChange={(e) => zet('prijsVanaf', e.target.value)} />
            </label>
          </div>
        )}

        <fieldset className="club-plan-groep">
          <legend className="club-label">{t.contract}</legend>
          <div className="club-formrij club-plan-rij3">
            <label className="club-veld">
              <span>{t.looptijd}</span>
              <input className="club-invoer" type="number" inputMode="numeric" min={1} max={12} value={s.looptijd} onChange={(e) => zet('looptijd', e.target.value)} placeholder={t.looptijdLeeg} />
            </label>
            <label className="club-veld">
              <span>{t.opzeg}</span>
              <input className="club-invoer" type="number" inputMode="numeric" min={0} max={31} value={s.opzeg} onChange={(e) => zet('opzeg', e.target.value)} />
            </label>
            <label className="club-veld">
              <span>{t.na}</span>
              <select className="club-invoer" value={s.verlenging} onChange={(e) => zet('verlenging', e.target.value === 'geen' ? 'geen' : 'onbepaald')}>
                <option value="onbepaald">{t.doorlopen}</option>
                <option value="geen">{t.stopt}</option>
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="club-plan-groep">
          <legend className="club-label">{t.startFactuur}</legend>
          <div className="club-formrij club-plan-rij3">
            <label className="club-veld">
              <span>{t.proef}</span>
              <input className="club-invoer" type="number" inputMode="numeric" min={0} max={60} value={s.proef} onChange={(e) => zet('proef', e.target.value)} />
            </label>
            <label className="club-veld">
              <span>{t.inschrijf}</span>
              <input className="club-invoer" inputMode="decimal" value={s.inschrijf} onChange={(e) => zet('inschrijf', e.target.value)} placeholder={t.geen} />
            </label>
            <label className="club-veld">
              <span>{t.factuurDag}</span>
              <input className="club-invoer" type="number" inputMode="numeric" min={1} max={28} disabled={!MAAND_INTERVALLEN.has(s.interval)} value={s.factuurDag} onChange={(e) => zet('factuurDag', e.target.value)} placeholder={t.startdag} />
            </label>
          </div>
          {s.factuurDag !== '' && (
            <label className="club-lidm-vink">
              <input type="checkbox" checked={s.proRata} onChange={(e) => zet('proRata', e.target.checked)} /> {t.proRata}
            </label>
          )}
        </fieldset>

        <fieldset className="club-plan-groep">
          <legend className="club-label">{t.voorWie}</legend>
          <label className="club-veld club-plan-smal">
            <span>{t.doelgroep}</span>
            <select className="club-invoer" value={s.doelgroep} onChange={(e) => zet('doelgroep', e.target.value as Doelgroep)}>
              {DOELGROEPEN.map((d) => <option key={d} value={d}>{tb.doelgroep[d]}</option>)}
            </select>
          </label>
          <label className="club-lidm-vink">
            <input type="checkbox" checked={s.bewijs} onChange={(e) => zet('bewijs', e.target.checked)} /> {t.bewijs}
          </label>
          <PlanVestigingen alle={s.alle} gekozen={s.vestigingen} onAlle={(a) => zet('alle', a)} onKies={(l) => zet('vestigingen', l)} />
          <label className="club-lidm-vink">
            <input type="checkbox" checked={s.actief} onChange={(e) => zet('actief', e.target.checked)} /> {t.teKoop}
          </label>
        </fieldset>
      </div>

      <div className="club-plan-zij">
        {controle.ok ? (
          <PlanVoorbeeld plan={controle.waarde} vandaag={vandaag} metWet />
        ) : (
          <p className="club-plan-voorbeeld club-plan-voorbeeld--wacht">{controle.fout}</p>
        )}
        <div id={`${id}-fout`} role="alert">
          {fout && <p className="club-melding club-melding--fout">{fout}</p>}
        </div>
        <div className="club-lidm-formacties">
          <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>
            {bezig ? t.bezig : begin ? t.opslaan : t.toevoegen}
          </button>
          <button type="button" className="club-knop club-knop--stil" onClick={onAnnuleer}>
            {t.annuleren}
          </button>
        </div>
      </div>
    </form>
  )
}
