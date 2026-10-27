'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarPlus, X } from 'lucide-react'
import type { LesVoorBoeken } from '@/lib/club/leden/hub/planning'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { formatDatum, formatTijd } from '@/lib/aiyourgym/taal/formaat'
import { LEDENKAART } from '@/lib/aiyourgym/taal/woorden/club/ledenkaart'
import { stuur } from '../stuur'

// Lessen voor het lid boeken en annuleren, vanaf de kaart. Zelfde API en regels
// als de balie in het rooster: past de les niet bij het lidmaatschap, dan eerst
// een waarschuwing met "Toch boeken" (de API logt dat).

export interface AankomendeLes {
  /** Het id van de reservering. */
  id: string
  lesNaam: string
  startOp: string
  eindOp: string
  statusTekst: string
  chip: string
}

interface LesBoekenProps {
  lidId: string
  aankomend: AankomendeLes[]
  /** null = het rooster kon niet worden gelezen. */
  lessen: LesVoorBoeken[] | null
}

type Melding = { soort: 'ok' | 'fout'; tekst: string } | null

function leesStatus(data: unknown): string | null {
  return typeof data === 'object' && data !== null && 'status' in data && typeof data.status === 'string' ? data.status : null
}

function leesWaarschuwing(data: unknown): string | null {
  if (leesStatus(data) !== 'waarschuwing') return null
  return typeof data === 'object' && data !== null && 'waarschuwing' in data && typeof data.waarschuwing === 'string' ? data.waarschuwing : ''
}

export function LesBoeken({ lidId, aankomend, lessen }: LesBoekenProps) {
  const w = useTekst(LEDENKAART).planning
  const taal = useTaal()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [bezig, setBezig] = useState<string | null>(null)
  const [melding, setMelding] = useState<Melding>(null)
  const [waarschuwing, setWaarschuwing] = useState<{ les: LesVoorBoeken; tekst: string } | null>(null)
  const wanneer = (start: string, eind: string) => w.tijdvak(formatDatum(start, taal, 'dag'), formatTijd(start, taal), formatTijd(eind, taal))

  function ververs() {
    startTransition(() => router.refresh())
  }

  async function boek(les: LesVoorBoeken, toch: boolean) {
    setBezig(les.id)
    setMelding(null)
    setWaarschuwing(null)
    const uit = await stuur('/api/club/rooster/reserveringen', 'POST', { lesId: les.id, lidId, bron: 'balie', toch })
    setBezig(null)
    if (!uit.ok) return setMelding({ soort: 'fout', tekst: uit.fout })
    const tekst = leesWaarschuwing(uit.data)
    if (tekst !== null) return setWaarschuwing({ les, tekst })
    setMelding({ soort: 'ok', tekst: leesStatus(uit.data) === 'wachtlijst' ? w.wachtlijst : w.gelukt })
    ververs()
  }

  async function annuleer(r: AankomendeLes) {
    if (!window.confirm(w.annuleerVraag(r.lesNaam))) return
    setBezig(r.id)
    setMelding(null)
    const uit = await stuur(`/api/club/rooster/reserveringen/${encodeURIComponent(r.id)}/annuleren`, 'POST')
    setBezig(null)
    if (!uit.ok) return setMelding({ soort: 'fout', tekst: uit.fout })
    setMelding({ soort: 'ok', tekst: w.geannuleerd })
    ververs()
  }

  return (
    <section className="club-kaart" id="les-boeken" aria-labelledby="lessen-kop">
      <div className="club-sectiekop">
        <h2 id="lessen-kop">{w.lessen}</h2>
      </div>
      {aankomend.length > 0 && (
        <ul className="club-lijst club-lidhub-lessen">
          {aankomend.map((r) => (
            <li key={r.id} className="club-rij">
              <span className="club-rij-hoofd">
                <span className="club-rij-titel">{r.lesNaam}</span>
                <span className="club-rij-sub">{wanneer(r.startOp, r.eindOp)}</span>
              </span>
              <span className={`club-chip ${r.chip}`}>{r.statusTekst}</span>
              <button type="button" className="club-knop club-knop--klein club-knop--stil" disabled={bezig !== null} onClick={() => void annuleer(r)}>
                <X aria-hidden size={14} /> {w.annuleren}
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3 className="club-leden-subkop club-lidhub-tussen">{w.boekKop}</h3>
      <p className="club-hint">{w.boekUitleg}</p>
      {waarschuwing && (
        <div className="club-melding club-melding--fout club-lidhub-melding" role="alert">
          <p><strong>{waarschuwing.les.naam}:</strong> {waarschuwing.tekst}</p>
          <div className="club-acties">
            <button type="button" className="club-knop club-knop--klein" disabled={bezig !== null} onClick={() => void boek(waarschuwing.les, true)}>{w.toch}</button>
            <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setWaarschuwing(null)}>{w.nietBoeken}</button>
          </div>
        </div>
      )}
      {melding && <p className={`club-melding ${melding.soort === 'ok' ? 'club-melding--ok' : 'club-melding--fout'}`} role="status">{melding.tekst}</p>}
      {lessen === null ? (
        <p className="club-melding club-melding--fout" role="alert">{w.ladenFout}</p>
      ) : lessen.length === 0 ? (
        <p className="club-hint">{w.geenLessen}</p>
      ) : (
        <ul className="club-lijst club-lidhub-lessen club-lidhub-scroll">
          {lessen.map((l) => (
            <li key={l.id} className="club-rij">
              <span className="club-rij-hoofd">
                <span className="club-rij-titel">{l.naam}</span>
                <span className="club-rij-sub">
                  {wanneer(l.startOp, l.eindOp)}{l.instructeur ? ` · ${l.instructeur}` : ''}
                </span>
              </span>
              <span className={`club-chip ${l.vol ? 'club-chip--let-op' : 'club-chip--geen'} club-getal`}>
                {l.vol ? w.vol(l.geboekt, l.capaciteit) : w.plekken(l.geboekt, l.capaciteit)}
              </span>
              <button type="button" className="club-knop club-knop--klein" disabled={bezig !== null} aria-busy={bezig === l.id || undefined} onClick={() => void boek(l, false)}>
                <CalendarPlus aria-hidden size={14} /> {w.boek}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
