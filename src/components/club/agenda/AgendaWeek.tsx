'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, X } from 'lucide-react'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { SOORTEN, formWaarden, isSoort, tijdLabel, type AgendaItem, type AgendaSoort } from '@/lib/club/agenda/model'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { AGENDA } from '@/lib/aiyourgym/taal/woorden/club/agenda'
import { stuur } from '@/components/club/leden/stuur'

// De week van een vestiging: zeven dagen naast elkaar (op de telefoon onder
// elkaar), elke afspraak met tijd, soort en wie. Tik op een afspraak om hem te
// wijzigen; "Nieuwe afspraak" opent hetzelfde formulier leeg.

const HERHAAL = [3, 7, 11, 25] as const

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
  const taal = useTaal()
  const w = useTekst(AGENDA)
  const t = w.week
  const dagLabel = (d: string) => formatDatum(`${d}T12:00:00Z`, taal, 'weekdagKort')
  const naamVan = new Map(medewerkers.map((m) => [m.id, m.naam]))
  const standaardDag = dagen.some((d) => d.datum === vandaag) ? vandaag : dagen[0].datum
  const zet = <K extends keyof Concept>(k: K, w: Concept[K]) => setConcept((c) => (c ? { ...c, [k]: w } : c))

  async function voerUit(actie: Promise<{ ok: boolean; fout?: string }>) {
    setBezig(true)
    setFout(null)
    const uit = await actie
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout ?? t.mis)
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
    if (!concept?.id || bezig || !window.confirm(t.verwijderVraag(concept.titel))) return
    void voerUit(stuur(`/api/club/agenda/${concept.id}`, 'DELETE'))
  }

  return (
    <>
      <div className="club-acties">
        <button type="button" className="club-knop club-knop--primair" onClick={() => { setFout(null); setConcept(leegConcept(standaardDag)) }}>
          <Plus size={16} aria-hidden /> {t.nieuw}
        </button>
      </div>

      {concept ? (
        <form className="club-kaart ag-form" onSubmit={opslaan} aria-labelledby="ag-form-kop">
          <div className="club-sectiekop">
            <h2 id="ag-form-kop">{concept.id ? t.wijzigen : t.nieuw}</h2>
            <button type="button" className="club-knop club-knop--stil club-knop--klein" onClick={() => setConcept(null)} aria-label={t.sluiten}><X size={16} aria-hidden /></button>
          </div>
          <div className="club-formrij">
            <label className="club-veld"><span>{t.titel}</span>
              <input className="club-invoer" value={concept.titel} onChange={(e) => zet('titel', e.target.value)} maxLength={160} required autoFocus placeholder={t.titelPlaats} />
            </label>
            <label className="club-veld"><span>{t.soort}</span>
              <select className="club-invoer" value={concept.soort} onChange={(e) => isSoort(e.target.value) && zet('soort', e.target.value)}>
                {SOORTEN.map((s) => <option key={s} value={s}>{w.soort[s]}</option>)}
              </select>
            </label>
            <label className="club-veld"><span>{t.wie}</span>
              <select className="club-invoer" value={concept.medewerkerId} onChange={(e) => zet('medewerkerId', e.target.value)}>
                <option value="">{t.niemand}</option>
                {medewerkers.map((m) => <option key={m.id} value={m.id}>{m.naam}</option>)}
              </select>
            </label>
          </div>
          <div className="club-formrij">
            <label className="club-veld"><span>{t.datum}</span>
              <input type="date" className="club-invoer" value={concept.datum} onChange={(e) => zet('datum', e.target.value)} required />
            </label>
            <label className="club-veld"><span>{t.van}</span>
              <input type="time" step={300} className="club-invoer" value={concept.begin} onChange={(e) => zet('begin', e.target.value)} disabled={concept.heleDag} required={!concept.heleDag} />
            </label>
            <label className="club-veld"><span>{t.tot}</span>
              <input type="time" step={300} className="club-invoer" value={concept.eind} onChange={(e) => zet('eind', e.target.value)} disabled={concept.heleDag} required={!concept.heleDag} />
            </label>
          </div>
          <div className="club-formrij">
            <label className="ag-vinkje">
              <input type="checkbox" checked={concept.heleDag} onChange={(e) => zet('heleDag', e.target.checked)} /> {t.heleDag}
            </label>
            {concept.id ? null : (
              <label className="club-veld"><span>{t.herhalen}</span>
                <select className="club-invoer" value={concept.herhaalWeken} onChange={(e) => zet('herhaalWeken', Number(e.target.value))}>
                  <option value={0}>{t.nietHerhalen}</option>
                  {HERHAAL.map((n) => <option key={n} value={n}>{t.elkeWeek(n)}</option>)}
                </select>
              </label>
            )}
          </div>
          <label className="club-veld"><span>{t.notitie}</span>
            <textarea className="club-invoer" value={concept.notitie} onChange={(e) => zet('notitie', e.target.value)} maxLength={2000} rows={3} />
          </label>
          {fout ? <p className="club-melding club-melding--fout" role="alert">{fout}</p> : null}
          <div className="club-acties">
            <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>{bezig ? t.opslaanBezig : t.opslaan}</button>
            <button type="button" className="club-knop" onClick={() => setConcept(null)} disabled={bezig}>{t.annuleren}</button>
            {concept.id ? (
              <button type="button" className="club-knop club-knop--gevaar" onClick={verwijder} disabled={bezig}><Trash2 size={15} aria-hidden /> {t.verwijderen}</button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="ag-week">
        {dagen.map((d) => (
          <section key={d.datum} className={`ag-dag${d.datum === vandaag ? ' ag-dag--vandaag' : ''}`} aria-label={dagLabel(d.datum)}>
            <h2 className="ag-dag-kop">
              {dagLabel(d.datum)}
              {d.datum === vandaag ? <span className="club-chip club-chip--merk">{t.vandaag}</span> : null}
            </h2>
            {d.items.length === 0 ? (
              <button type="button" className="ag-leeg" onClick={() => { setFout(null); setConcept(leegConcept(d.datum)) }}>
                <span className="club-sr">{t.toevoegenOp(dagLabel(d.datum))}</span>
                <Plus size={14} aria-hidden />
              </button>
            ) : (
              <ul className="ag-items">
                {d.items.map((a) => (
                  <li key={a.id}>
                    <button type="button" className={`ag-item ag-item--${a.soort}`} onClick={() => { setFout(null); setConcept(vanItem(a)) }}>
                      <span className="ag-tijd">{tijdLabel(a, taal)}</span>
                      <span className="ag-titel">{a.titel}</span>
                      <span className="ag-meta">{w.soort[a.soort]}{a.medewerkerId && naamVan.get(a.medewerkerId) ? ` · ${naamVan.get(a.medewerkerId)}` : ''}</span>
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
