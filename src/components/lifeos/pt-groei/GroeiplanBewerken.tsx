'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { CLUBS, CLUB_LABEL, type Club } from '@/lib/lifeos/pt-dashboard/clubs'
import { ACTIE_VOOR, MAX_ACTIES, VOOR_LABEL, type ActieVoor, type GroeiActie, type Groeiplan } from '@/lib/lifeos/pt-dashboard/groeiplan'
import { ptApi, leesLeeg } from '@/components/lifeos/pt-dashboard/api'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'

// Kane en de eigenaren: het groeiplan aanpassen. Dicht tot je op "Plan
// aanpassen" drukt, zodat de pagina voor iedereen eerst een leesbaar plan is.

type Doelen = Record<Club, string>

const naarDoelen = (d: Groeiplan['doelen']): Doelen =>
  Object.fromEntries(CLUBS.map((c) => [c, d[c] === undefined ? '' : String(d[c])])) as Doelen

export function GroeiplanBewerken({ code, plan }: { code: string; plan: Groeiplan }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [focus, setFocus] = useState(plan.focus)
  const [doelen, setDoelen] = useState<Doelen>(() => naarDoelen(plan.doelen))
  const [acties, setActies] = useState<GroeiActie[]>(plan.acties)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  const wijzig = (i: number, deel: Partial<GroeiActie>) => setActies((nu) => nu.map((a, j) => (j === i ? { ...a, ...deel } : a)))
  const verplaats = (i: number, stap: -1 | 1) =>
    setActies((nu) => {
      const j = i + stap
      if (j < 0 || j >= nu.length) return nu
      const kopie = [...nu]
      ;[kopie[i], kopie[j]] = [kopie[j], kopie[i]]
      return kopie
    })

  function annuleer() {
    setFocus(plan.focus)
    setDoelen(naarDoelen(plan.doelen))
    setActies(plan.acties)
    setFout(null)
    setOpen(false)
  }

  async function opslaan(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    setBezig(true)
    setFout(null)
    const uit = await ptApi(code, 'groeiplan', 'PUT', { focus, doelen, acties }, leesLeeg)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <div className="ptd-acties">
        <button type="button" className="ptd-knop ptd-knop--klein" onClick={() => setOpen(true)}>
          <Pencil size={14} aria-hidden /> Plan aanpassen
        </button>
      </div>
    )
  }

  return (
    <form className="ptd-form" onSubmit={(e) => void opslaan(e)} aria-labelledby="gp-bewerk-kop">
      <h2 id="gp-bewerk-kop">Plan aanpassen</h2>
      <div className="ptd-veld">
        <label htmlFor="gp-focus">Focus *</label>
        <textarea id="gp-focus" className="ptd-invoer" value={focus} onChange={(e) => setFocus(e.target.value)} maxLength={300} required />
      </div>

      <fieldset className="ptd-veld">
        <legend>Doel per club (actieve PT-klanten, leeg = geen doel)</legend>
        <div className="ptd-raster">
          {CLUBS.map((c) => (
            <div key={c} className="ptd-veld">
              <label htmlFor={`gp-doel-${c}`}>{CLUB_LABEL[c]}</label>
              <input
                id={`gp-doel-${c}`}
                className="ptd-invoer"
                type="number"
                inputMode="numeric"
                min={0}
                max={500}
                step={1}
                value={doelen[c]}
                onChange={(e) => setDoelen((nu) => ({ ...nu, [c]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="ptd-veld">
        <legend>Acties</legend>
        <ol className="gp-acties">
          {acties.map((a, i) => (
            <li key={i} className="ptd-rij gp-bewerk-actie">
              <div className="ptd-raster">
                <div className="ptd-veld">
                  <label htmlFor={`gp-titel-${i}`}>Titel *</label>
                  <input id={`gp-titel-${i}`} className="ptd-invoer" value={a.titel} maxLength={80} onChange={(e) => wijzig(i, { titel: e.target.value })} required />
                </div>
                <div className="ptd-veld">
                  <label htmlFor={`gp-voor-${i}`}>Voor</label>
                  <select id={`gp-voor-${i}`} className="ptd-invoer" value={a.voor} onChange={(e) => wijzig(i, { voor: e.target.value as ActieVoor })}>
                    {ACTIE_VOOR.map((v) => <option key={v} value={v}>{VOOR_LABEL[v]}</option>)}
                  </select>
                </div>
              </div>
              <div className="ptd-veld">
                <label htmlFor={`gp-uitleg-${i}`}>Uitleg</label>
                <textarea id={`gp-uitleg-${i}`} className="ptd-invoer" value={a.uitleg} maxLength={500} onChange={(e) => wijzig(i, { uitleg: e.target.value })} />
              </div>
              <div className="ptd-acties">
                <button type="button" className="ptd-knop ptd-knop--klein" onClick={() => verplaats(i, -1)} disabled={i === 0} aria-label={`${a.titel || 'Actie'} omhoog`}>
                  <ArrowUp size={14} aria-hidden />
                </button>
                <button type="button" className="ptd-knop ptd-knop--klein" onClick={() => verplaats(i, 1)} disabled={i === acties.length - 1} aria-label={`${a.titel || 'Actie'} omlaag`}>
                  <ArrowDown size={14} aria-hidden />
                </button>
                <button type="button" className="ptd-knop ptd-knop--klein" onClick={() => setActies((nu) => nu.filter((_, j) => j !== i))}>
                  <Trash2 size={14} aria-hidden /> Weghalen
                </button>
              </div>
            </li>
          ))}
        </ol>
        {acties.length < MAX_ACTIES ? (
          <div className="ptd-acties">
            <button type="button" className="ptd-knop ptd-knop--klein" onClick={() => setActies((nu) => [...nu, { titel: '', uitleg: '', voor: 'iedereen' }])}>
              <Plus size={14} aria-hidden /> Actie toevoegen
            </button>
          </div>
        ) : null}
      </fieldset>

      <div className="ptd-acties">
        <button type="submit" className="ptd-knop ptd-knop--primair" disabled={bezig}>{bezig ? 'Opslaan…' : 'Opslaan'}</button>
        <button type="button" className="ptd-knop" onClick={annuleer} disabled={bezig}>Annuleren</button>
      </div>
      <p className="ptd-hint">Iedereen in de PT-app ziet het plan na opslaan meteen.</p>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </form>
  )
}
