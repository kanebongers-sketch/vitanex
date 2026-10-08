'use client'

import { useState, type FormEvent } from 'react'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import {
  ABONNEMENT, ABONNEMENTEN, KLANT_STATUSSEN, KLANT_STATUS_LABEL, eindeVastePeriode, laatsteDag, leesKlant,
  type KlantInvoer, type PtKlant,
} from '@/lib/lifeos/pt-dashboard/abonnementen'
import { CLUBS, CLUB_LABEL, isClub, type Club } from '@/lib/lifeos/pt-dashboard/clubs'
import { dagLang } from '@/lib/lifeos/pt-dashboard/datum'
import { Keuzes, Veld } from './velden'
import { leesLeeg, ptApi } from './api'

// Een PT-klant met abonnement vastleggen of bijwerken. De prijs volgt uit het
// abonnement en de club (Eersel wijkt af); de looptijd uit de voorwaarden.

interface Props {
  code: string
  vandaag: string
  standaardClub: Club | null
  klant?: PtKlant
  /** Voorinvulling vanuit een klant-geworden lead. */
  vanLead?: { id: string; naam: string; contact: string | null; club: Club | null }
  onOpgeslagen: (k: PtKlant) => void
  onVerwijderd?: (id: string) => void
  onAnnuleer: () => void
  /** Alleen de beheerder: kies (of wissel) de trainer van deze klant. */
  trainers?: readonly { id: string; naam: string }[]
  trainerId?: string
}

/** Tijdens het invullen mag de club nog leeg zijn; opslaan vraagt er dan om. */
type Concept = Omit<KlantInvoer, 'club'> & { club: Club | null }

export function KlantFormulier({ code, vandaag, standaardClub, klant, vanLead, onOpgeslagen, onVerwijderd, onAnnuleer, trainers, trainerId: beginTrainer }: Props) {
  const [v, setV] = useState<Concept>(() =>
    klant
      ? { ...klant }
      : {
          naam: vanLead?.naam ?? '', contact: vanLead?.contact ?? null, duoPartner: null,
          club: vanLead?.club ?? standaardClub, abonnement: '1x', startdatum: vandaag,
          status: 'actief', opgezegdOp: null, notitie: null, leadId: vanLead?.id ?? null,
        },
  )
  const [trainer, setTrainer] = useState(beginTrainer ?? trainers?.[0]?.id ?? '')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const zet = <K extends keyof Concept>(k: K, w: Concept[K]) => setV((x) => ({ ...x, [k]: w }))
  const id = klant?.id ?? 'nieuw'
  const metEinde = v.status === 'opgezegd' || v.status === 'gestopt'

  async function opslaan(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (!v.club) return setFout('Kies de club waar deze klant traint.')
    setBezig(true)
    setFout(null)
    const body = trainers ? { ...v, trainerId: trainer } : v
    const uit = klant
      ? await ptApi(code, `klanten/${klant.id}`, 'PUT', body, leesKlant)
      : await ptApi(code, 'klanten', 'POST', body, leesKlant)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    onOpgeslagen(uit.waarde)
  }

  async function verwijder() {
    if (!klant || !window.confirm(`${klant.naam} verwijderen? Gebruik dit alleen bij een vergissing — stoppen of opzeggen zet je via de status.`)) return
    setBezig(true)
    const uit = await ptApi(code, `klanten/${klant.id}`, 'DELETE', undefined, leesLeeg)
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    onVerwijderd?.(klant.id)
  }

  return (
    <form className="ptd-form" onSubmit={(e) => void opslaan(e)} aria-labelledby={`kf-${id}`}>
      <h3 id={`kf-${id}`}>{klant ? `${klant.naam} bijwerken` : 'Nieuwe PT-klant'}</h3>
      <div className="ptd-raster">
        <Veld label="Naam *" id={`knaam-${id}`}>
          <input id={`knaam-${id}`} className="ptd-invoer" value={v.naam} onChange={(e) => zet('naam', e.target.value)} maxLength={120} required autoComplete="off" />
        </Veld>
        <Veld label="Telefoon / contact" id={`kcontact-${id}`}>
          <input id={`kcontact-${id}`} className="ptd-invoer" value={v.contact ?? ''} onChange={(e) => zet('contact', e.target.value || null)} maxLength={160} inputMode="tel" autoComplete="off" />
        </Veld>
        {trainers ? (
          <Veld label="Trainer *" id={`ktrainer-${id}`}>
            <select id={`ktrainer-${id}`} className="ptd-invoer" value={trainer} onChange={(e) => setTrainer(e.target.value)} required>
              {trainers.map((t) => <option key={t.id} value={t.id}>{t.naam}</option>)}
            </select>
          </Veld>
        ) : null}
        <Veld label="Club *" id={`kclub-${id}`}>
          <select id={`kclub-${id}`} className="ptd-invoer" value={v.club ?? ''} onChange={(e) => zet('club', isClub(e.target.value) ? e.target.value : null)} required>
            <option value="" disabled>Kies…</option>
            {CLUBS.map((c) => <option key={c} value={c}>{CLUB_LABEL[c]}</option>)}
          </select>
        </Veld>
        <Veld label="Startdatum *" id={`kstart-${id}`} hint={`3 maanden vast: t/m ${dagLang(eindeVastePeriode(v.startdatum))}, daarna maandelijks opzegbaar.`}>
          <input id={`kstart-${id}`} type="date" className="ptd-invoer" value={v.startdatum} onChange={(e) => e.target.value && zet('startdatum', e.target.value)} required />
        </Veld>
      </div>

      <div className="ptd-veld">
        <span>Abonnement *</span>
        <div className="ptd-abo" role="group" aria-label="Abonnement">
          {ABONNEMENTEN.map((a) => (
            <button key={a} type="button" aria-pressed={v.abonnement === a} onClick={() => zet('abonnement', a)}>
              <strong>{ABONNEMENT[a].label}</strong>
              <span>{ABONNEMENT[a].duo ? 'Twee personen' : 'Eén persoon'}</span>
            </button>
          ))}
        </div>
        {v.club === 'eersel' ? <p className="ptd-hint">Eersel heeft eigen prijzen; die staan hierboven al.</p> : null}
        {v.club === null ? <p className="ptd-hint">Kies eerst de club: in Eersel gelden andere prijzen.</p> : null}
      </div>

      {ABONNEMENT[v.abonnement].duo ? (
        <Veld label="Duo-partner" id={`kduo-${id}`} hint="Eén abonnement voor twee; beide krijgen een eigen plan en metingen.">
          <input id={`kduo-${id}`} className="ptd-invoer" value={v.duoPartner ?? ''} onChange={(e) => zet('duoPartner', e.target.value || null)} maxLength={120} autoComplete="off" />
        </Veld>
      ) : null}

      <Keuzes
        label="Status"
        opties={KLANT_STATUSSEN.map((s) => ({ waarde: s, label: KLANT_STATUS_LABEL[s] }))}
        waarde={v.status}
        onKies={(s) => s && setV((x) => ({ ...x, status: s, opgezegdOp: s === 'opgezegd' || s === 'gestopt' ? (x.opgezegdOp ?? vandaag) : null }))}
      />
      {v.status === 'bevroren' ? <p className="ptd-hint">Bevroren (blessure, ziekte): telt niet mee als lopende klant tot je hem weer op actief zet.</p> : null}
      {metEinde ? (
        <Veld
          label={v.status === 'opgezegd' ? 'Opgezegd op *' : 'Gestopt op *'}
          id={`kop-${id}`}
          hint={v.status === 'opgezegd' && v.opgezegdOp ? `Volgens de voorwaarden loopt het abonnement t/m ${dagLang(laatsteDag(v.startdatum, v.opgezegdOp))}.` : undefined}
        >
          <input id={`kop-${id}`} type="date" className="ptd-invoer" min={v.startdatum} value={v.opgezegdOp ?? ''} onChange={(e) => zet('opgezegdOp', e.target.value || null)} required />
        </Veld>
      ) : null}

      <Veld label="Notities" id={`knotitie-${id}`}>
        <textarea id={`knotitie-${id}`} className="ptd-invoer" value={v.notitie ?? ''} onChange={(e) => zet('notitie', e.target.value || null)} maxLength={1000} placeholder="Doel, blessures, afspraken…" />
      </Veld>

      <div className="ptd-acties">
        <button type="submit" className="ptd-knop ptd-knop--primair" disabled={bezig}>{bezig ? 'Opslaan…' : klant ? 'Opslaan' : 'Klant opslaan'}</button>
        <button type="button" className="ptd-knop" onClick={onAnnuleer} disabled={bezig}>Annuleren</button>
        {klant && onVerwijderd ? (
          <button type="button" className="ptd-knop ptd-knop--gevaar ptd-rechts" onClick={() => void verwijder()} disabled={bezig}>Verwijderen</button>
        ) : null}
      </div>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </form>
  )
}
