'use client'

import { useState, type ReactNode } from 'react'
import { Check, Minus, Plus, TrendingDown, TrendingUp } from 'lucide-react'
import { INDELING_AANTALLEN, indeling } from '@/lib/club/voeding/eigen'
import { MAX_ADVIEZEN } from '@/lib/club/voeding/model'
import { ACTIVITEITEN, DOELEN, afwijkingTekst, verdeling, type VoedingDoel } from '@/lib/club/voeding/rekenhulp'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import type { VoedingTekst } from '@/lib/aiyourgym/taal/woorden/club/voeding'
import type { VoedingEigenTekst } from '@/lib/aiyourgym/taal/woorden/club/voeding-eigen'
import { macros, type Concept, type Indelingen } from './staat'

// De vier stappen van het eigen voedingsplan: doel, over jou (rekenhulp),
// dagdoel en je dag (momenten en adviezen). Elke stap is puur weergave plus
// een onWijzig; de wizard houdt de staat.

export interface StapProps {
  c: Concept
  onWijzig: (c: Concept) => void
  t: VoedingEigenTekst
  tv: VoedingTekst
  taal: Taal
}

const DOEL_ICOON: Record<VoedingDoel, ReactNode> = {
  afvallen: <TrendingDown size={22} strokeWidth={1.75} />,
  onderhoud: <Minus size={22} strokeWidth={1.75} />,
  aankomen: <TrendingUp size={22} strokeWidth={1.75} />,
}

export function DoelStap({ c, onWijzig, tv }: StapProps) {
  return (
    <div className="club-ve-keuzes" role="radiogroup" aria-labelledby="ve-stap-kop">
      {DOELEN.map((d) => (
        <button key={d} type="button" role="radio" aria-checked={c.doel === d} className="club-ve-doel" onClick={() => onWijzig({ ...c, doel: d })}>
          <span className="club-ve-doel-icoon" aria-hidden>{DOEL_ICOON[d]}</span>
          <span className="club-ve-doel-tekst">
            <strong>{tv.doel[d].label}</strong>
            <small>{tv.doel[d].uitleg}</small>
          </span>
          <span className="club-ve-doel-vink" aria-hidden>{c.doel === d && <Check size={16} strokeWidth={2.5} />}</span>
        </button>
      ))}
    </div>
  )
}

interface OverProps extends StapProps {
  fouten: string[]
}

export function OverJouStap({ c, onWijzig, t, tv, fouten }: OverProps) {
  const zet = (veld: keyof Concept['over'], waarde: string) => onWijzig({ ...c, over: { ...c.over, [veld]: waarde } })
  const tw = t.wizard
  return (
    <div className="club-ve-stapinhoud">
      <p className="club-ve-uitleg">{tw.overUitleg}</p>
      <div className="club-ve-maten">
        {([['gewicht', tw.gewicht, tw.kg, 'decimal'], ['lengte', tw.lengte, tw.cm, 'numeric'], ['leeftijd', tw.leeftijd, tw.jaar, 'numeric']] as const).map(([veld, label, eenheid, modus]) => (
          <label key={veld} className="club-ve-maat">
            <span>{label}</span>
            <span className="club-ve-maat-invoer">
              <input inputMode={modus} autoComplete="off" value={c.over[veld]} onChange={(e) => zet(veld, e.target.value)} />
              <small>{eenheid}</small>
            </span>
          </label>
        ))}
      </div>
      <fieldset className="club-ve-groep">
        <legend>{tw.geslacht} <small>{tw.geslachtHint}</small></legend>
        <div className="club-ve-segment">
          {(['man', 'vrouw', 'anders'] as const).map((g) => (
            <button key={g} type="button" aria-pressed={c.over.geslacht === g} onClick={() => zet('geslacht', g)}>{tv.geslacht[g]}</button>
          ))}
        </div>
      </fieldset>
      <fieldset className="club-ve-groep">
        <legend>{tw.activiteit}</legend>
        <div className="club-ve-activiteit" role="radiogroup">
          {ACTIVITEITEN.map((a) => (
            <button key={a} type="button" role="radio" aria-checked={c.over.activiteit === a} onClick={() => zet('activiteit', a)}>
              <strong>{tv.activiteit[a].label}</strong>
              <small>{tv.activiteit[a].uitleg}</small>
            </button>
          ))}
        </div>
      </fieldset>
      <label className="club-ve-toestemming">
        <input type="checkbox" checked={c.bewaar} onChange={(e) => onWijzig({ ...c, bewaar: e.target.checked })} />
        <span>
          {tw.bewaar}
          <small>{tw.bewaarHint}</small>
        </span>
      </label>
      <details className="club-ve-formule">
        <summary>{tw.formuleTitel}</summary>
        {tw.formule.map((zin) => <p key={zin}>{zin}</p>)}
      </details>
      {fouten.length > 0 && <p className="club-ve-fout" role="alert">{tw.nogNodig(fouten.join(', ').toLowerCase())}</p>}
    </div>
  )
}

const MACRO_VELDEN = [
  { veld: 'eiwit', sleutel: 'eiwit', klasse: 'is-eiwit' },
  { veld: 'kh', sleutel: 'koolhydraten', klasse: 'is-kh' },
  { veld: 'vet', sleutel: 'vet', klasse: 'is-vet' },
] as const

export function DagdoelStap({ c, onWijzig, t, tv, taal }: StapProps) {
  const m = macros(c)
  const geldig = [m.eiwitG, m.koolhydratenG, m.vetG].every(Number.isFinite)
  const v = geldig ? verdeling(m) : { eiwit: 0, koolhydraten: 0, vet: 0 }
  const hint = geldig && Number.isFinite(m.kcal) ? afwijkingTekst(m, taal) : null
  const stap = (delta: number) => {
    const nu = Number.isFinite(m.kcal) ? m.kcal : 2000
    onWijzig({ ...c, kcal: String(Math.min(6000, Math.max(800, nu + delta))) })
  }
  return (
    <div className="club-ve-stapinhoud">
      <p className="club-ve-uitleg">{c.verbruik ? t.wizard.berekend(formatGetal(c.verbruik.rust, taal), formatGetal(c.verbruik.dag, taal)) : t.wizard.zelf}</p>
      <div className="club-ve-kcal">
        <button type="button" className="club-ve-rond" onClick={() => stap(-50)} aria-label={t.wizard.kcalMinder}><Minus size={18} aria-hidden /></button>
        <label>
          <input inputMode="numeric" value={c.kcal} onChange={(e) => onWijzig({ ...c, kcal: e.target.value })} aria-describedby="ve-kcal-label" />
          <span id="ve-kcal-label">{t.wizard.kcal}</span>
        </label>
        <button type="button" className="club-ve-rond" onClick={() => stap(50)} aria-label={t.wizard.kcalMeer}><Plus size={18} aria-hidden /></button>
      </div>
      <div className="club-voeding-balk club-ve-balk" aria-hidden>
        {v.eiwit > 0 && <span className="is-eiwit" style={{ flexGrow: v.eiwit }} />}
        {v.koolhydraten > 0 && <span className="is-kh" style={{ flexGrow: v.koolhydraten }} />}
        {v.vet > 0 && <span className="is-vet" style={{ flexGrow: v.vet }} />}
      </div>
      <div className="club-ve-macros">
        {MACRO_VELDEN.map((r) => (
          <label key={r.veld} className={`club-ve-macro club-voeding-macro ${r.klasse}`}>
            <span>{tv.macro[r.sleutel]}</span>
            <input inputMode="numeric" value={c[r.veld]} onChange={(e) => onWijzig({ ...c, [r.veld]: e.target.value })} />
            <small>{t.wizard.gram} · {v[r.sleutel]}%</small>
          </label>
        ))}
      </div>
      {hint && <p className="club-ve-hint" role="status">{hint}</p>}
    </div>
  )
}

interface DagProps extends StapProps {
  namen: Indelingen
}

export function DagStap({ c, onWijzig, t, tv, namen }: DagProps) {
  const tw = t.wizard
  const [eigen, setEigen] = useState('')
  const suggesties = [...new Set([...tv.adviezenVeld.voorbeelden, ...c.adviezen])]
  const vol = c.adviezen.length >= MAX_ADVIEZEN
  const wissel = (a: string) => onWijzig({ ...c, adviezen: c.adviezen.includes(a) ? c.adviezen.filter((x) => x !== a) : vol ? c.adviezen : [...c.adviezen, a] })
  const voegToe = () => {
    const schoon = eigen.trim().replace(/\s+/g, ' ').slice(0, 200)
    if (schoon && !c.adviezen.includes(schoon) && !vol) onWijzig({ ...c, adviezen: [...c.adviezen, schoon] })
    setEigen('')
  }
  return (
    <div className="club-ve-stapinhoud">
      <fieldset className="club-ve-groep">
        <legend>{tw.momenten}</legend>
        <div className="club-ve-segment">
          {INDELING_AANTALLEN.map((n) => (
            <button key={n} type="button" aria-pressed={c.aantal === n} aria-label={tw.momentenLabel(n)} onClick={() => onWijzig({ ...c, aantal: n, maaltijden: indeling(n, namen[n], c.maaltijden) })}>
              {tw.aantal(n)}
            </button>
          ))}
        </div>
      </fieldset>
      <ol className="club-ve-dag">
        {c.maaltijden.map((m, i) => (
          <li key={`${m.naam}-${i}`}>
            <time>{m.tijd}</time>
            <label>
              <strong>{m.naam}</strong>
              <input
                value={m.voorbeelden}
                maxLength={400}
                placeholder={tw.voorbeelden}
                aria-label={`${m.naam}: ${tw.voorbeelden}`}
                onChange={(e) => onWijzig({ ...c, maaltijden: c.maaltijden.map((x, j) => (j === i ? { ...x, voorbeelden: e.target.value } : x)) })}
              />
            </label>
          </li>
        ))}
      </ol>
      <fieldset className="club-ve-groep">
        <legend>{tw.adviezenTitel} <small>{tw.adviezenHint}</small></legend>
        <div className="club-ve-chips">
          {suggesties.map((a) => (
            <button key={a} type="button" aria-pressed={c.adviezen.includes(a)} onClick={() => wissel(a)}>
              {c.adviezen.includes(a) && <Check size={14} strokeWidth={2.5} aria-hidden />}
              {a}
            </button>
          ))}
        </div>
        <div className="club-ve-eigen-advies">
          <input
            value={eigen}
            maxLength={200}
            placeholder={tw.eigenAdviesPlaats}
            aria-label={tw.eigenAdvies}
            onChange={(e) => setEigen(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                voegToe()
              }
            }}
          />
          <button type="button" className="club-lidapp-knop" onClick={voegToe} disabled={!eigen.trim() || vol}>{tw.toevoegen}</button>
        </div>
        {vol && <p className="club-ve-hint">{tw.maxAdviezen(MAX_ADVIEZEN)}</p>}
      </fieldset>
    </div>
  )
}
