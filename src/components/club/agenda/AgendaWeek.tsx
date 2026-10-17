'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, X } from 'lucide-react'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { SOORTEN, SOORT_LABEL, formWaarden, isSoort, tijdLabel, type AgendaItem, type AgendaSoort } from '@/lib/club/agenda/model'
import { stuur } from '@/components/club/leden/stuur'

// De week van een vestiging: zeven dagen naast elkaar (op de telefoon onder
// elkaar), elke afspraak met tijd, soort en wie. Tik op een afspraak om hem te
// wijzigen; "Nieuwe afspraak" opent hetzelfde formulier leeg.

const HERHAAL = [3, 7, 11, 25] as const

const DAG = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })

interface Props {
  vestiging: Vestiging
  dagen: { datum: string; items: AgendaItem[] }[]
  vandaag: string
  medewerkers: readonly { id: string; naam: string }[]
}

interface Concept {
  id: string | null
  titel: string
  soort: AgendaSoort
  datum: string
  begin: string
  eind: string
  heleDag: boolean
  medewerkerId: string
  notitie: string
  /** Alleen bij een nieuwe afspraak: zoveel weken extra herhalen. */
  herhaalWeken: number
}

const leegConcept = (datum: string): Concept => ({ id: null, titel: '', soort: 'afspraak', datum, begin: '09:00', eind: '10:00', heleDag: false, medewerkerId: '', notitie: '', herhaalWeken: 0 })
const vanItem = (a: AgendaItem): Concept => ({ id: a.id, titel: a.titel, soort: a.soort, ...formWaarden(a), heleDag: a.heleDag, medewerkerId: a.medewerkerId ?? '', notitie: a.notitie ?? '', herhaalWeken: 0 })

export function AgendaWeek({ vestiging, dagen, vandaag, medewerkers }: Props) {
  const router = useRouter()
  const [concept, setConcept] = useState<Concept | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const [, startTransition] = useTransition()
  const naamVan = new Map(medewerkers.map((m) => [m.id, m.naam]))
  const standaardDag = dagen.some((d) => d.datum === vandaag) ? vandaag : dagen[0].datum
  const zet = <K extends keyof Concept>(k: K, w: Concept[K]) => setConcept((c) => (c ? { ...c, [k]: w } : c))

  async function voerUit(actie: Promise<{ ok: boolean; fout?: string }>) {
    setBezig(true)
    setFout(null)
    const uit = await actie
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout ?? 'Er ging iets mis.')
    setConcept(null)
    startTransition(() => router.refresh())
  }

  function opslaan(e: FormEvent) {
    e.preventDefault()
    if (!concept || bezig) return
    const body = { ...concept, vestiging, medewerkerId: concept.medewerkerId || null }
    void voerUit(concept.id ? stuur(`/api/club/agenda/${concept.id}`, 'PATCH', body) : stuur('/api/club/agenda', 'POST', body))
  }

  function verwijder() {
    if (!concept?.id || bezig || !window.confirm(`"${concept.titel}" verwijderen?`)) return
    void voerUit(stuur(`/api/club/agenda/${concept.id}`, 'DELETE'))
  }

  return (
    <>
      <div className="club-acties">
        <button type="button" className="club-knop club-knop--primair" onClick={() => { setFout(null); setConcept(leegConcept(standaardDag)) }}>
          <Plus size={16} aria-hidden /> Nieuwe afspraak
        </button>
      </div>

      {concept ? (
        <form className="club-kaart ag-form" onSubmit={opslaan} aria-labelledby="ag-form-kop">
          <div className="club-sectiekop">
            <h2 id="ag-form-kop">{concept.id ? 'Afspraak wijzigen' : 'Nieuwe afspraak'}</h2>
            <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => setConcept(null)} aria-label="Sluiten"><X size={16} aria-hidden /></button>
          </div>
          <div className="club-formrij">
            <label className="club-veld"><span>Titel *</span>
              <input className="club-invoer" value={concept.titel} onChange={(e) => zet('titel', e.target.value)} maxLength={160} required autoFocus placeholder="bv. Teamoverleg" />
            </label>
            <label className="club-veld"><span>Soort</span>
              <select className="club-invoer" value={concept.soort} onChange={(e) => isSoort(e.target.value) && zet('soort', e.target.value)}>
                {SOORTEN.map((s) => <option key={s} value={s}>{SOORT_LABEL[s]}</option>)}
              </select>
            </label>
            <label className="club-veld"><span>Wie</span>
              <select className="club-invoer" value={concept.medewerkerId} onChange={(e) => zet('medewerkerId', e.target.value)}>
                <option value="">Niemand in het bijzonder</option>
                {medewerkers.map((m) => <option key={m.id} value={m.id}>{m.naam}</option>)}
              </select>
            </label>
          </div>
          <div className="club-formrij">
            <label className="club-veld"><span>Datum *</span>
              <input type="date" className="club-invoer" value={concept.datum} onChange={(e) => zet('datum', e.target.value)} required />
            </label>
            <label className="club-veld"><span>Van</span>
              <input type="time" step={300} className="club-invoer" value={concept.begin} onChange={(e) => zet('begin', e.target.value)} disabled={concept.heleDag} required={!concept.heleDag} />
            </label>
            <label className="club-veld"><span>Tot</span>
              <input type="time" step={300} className="club-invoer" value={concept.eind} onChange={(e) => zet('eind', e.target.value)} disabled={concept.heleDag} required={!concept.heleDag} />
            </label>
          </div>
          <div className="club-formrij">
            <label className="ag-vinkje">
              <input type="checkbox" checked={concept.heleDag} onChange={(e) => zet('heleDag', e.target.checked)} /> Hele dag
            </label>
            {concept.id ? null : (
              <label className="club-veld"><span>Herhalen</span>
                <select className="club-invoer" value={concept.herhaalWeken} onChange={(e) => zet('herhaalWeken', Number(e.target.value))}>
                  <option value={0}>Niet herhalen</option>
                  {HERHAAL.map((w) => <option key={w} value={w}>Elke week, nog {w} keer</option>)}
                </select>
              </label>
            )}
          </div>
          <label className="club-veld"><span>Notitie</span>
            <textarea className="club-invoer" value={concept.notitie} onChange={(e) => zet('notitie', e.target.value)} maxLength={2000} rows={3} />
          </label>
          {fout ? <p className="club-melding club-melding--fout" role="alert">{fout}</p> : null}
          <div className="club-acties">
            <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>{bezig ? 'Opslaan…' : 'Opslaan'}</button>
            <button type="button" className="club-knop" onClick={() => setConcept(null)} disabled={bezig}>Annuleren</button>
            {concept.id ? (
              <button type="button" className="club-knop club-knop--gevaar" onClick={verwijder} disabled={bezig}><Trash2 size={15} aria-hidden /> Verwijderen</button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="ag-week">
        {dagen.map((d) => (
          <section key={d.datum} className={`ag-dag${d.datum === vandaag ? ' ag-dag--vandaag' : ''}`} aria-label={DAG.format(new Date(`${d.datum}T12:00:00Z`))}>
            <h2 className="ag-dag-kop">
              {DAG.format(new Date(`${d.datum}T12:00:00Z`))}
              {d.datum === vandaag ? <span className="club-chip club-chip--merk">vandaag</span> : null}
            </h2>
            {d.items.length === 0 ? (
              <button type="button" className="ag-leeg" onClick={() => { setFout(null); setConcept(leegConcept(d.datum)) }}>
                <span className="club-sr">Afspraak toevoegen op {DAG.format(new Date(`${d.datum}T12:00:00Z`))}</span>
                <Plus size={14} aria-hidden />
              </button>
            ) : (
              <ul className="ag-items">
                {d.items.map((a) => (
                  <li key={a.id}>
                    <button type="button" className={`ag-item ag-item--${a.soort}`} onClick={() => { setFout(null); setConcept(vanItem(a)) }}>
                      <span className="ag-tijd">{tijdLabel(a)}</span>
                      <span className="ag-titel">{a.titel}</span>
                      <span className="ag-meta">{SOORT_LABEL[a.soort]}{a.medewerkerId && naamVan.get(a.medewerkerId) ? ` · ${naamVan.get(a.medewerkerId)}` : ''}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </>
  )
}
