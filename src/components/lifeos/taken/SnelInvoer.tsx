'use client'

import { useId, useMemo, useState, type FormEvent } from 'react'
import { CalendarDays, Plus, Tag } from 'lucide-react'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { haalJson, leesNiets } from '@/lib/lifeos/api/http'
import { meldWijziging } from '@/lib/lifeos/events'
import { leesSnelleTaak } from '@/lib/lifeos/taken/snelinvoer'

// Eén regel, zoals je het zegt: "morgen Ruben bellen #werk". Terwijl je typt zie je
// wat LifeOS ervan maakt (dag + categorie); Enter en hij staat erin. Gedeeld door
// de takenkaart en de snelle knop die op elke LifeOS-pagina zit.

const DAG = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })

function dagLabel(sleutel: string): string {
  const [j, m, d] = sleutel.split('-').map(Number)
  const datum = new Date(j, m - 1, d)
  const vandaag = new Date()
  vandaag.setHours(0, 0, 0, 0)
  const verschil = Math.round((datum.getTime() - vandaag.getTime()) / 86_400_000)
  if (verschil === 0) return 'Vandaag'
  if (verschil === 1) return 'Morgen'
  return DAG.format(datum)
}

interface Props {
  /** Na een geslaagde toevoeging (bv. popup sluiten). */
  onToegevoegd?: (titel: string) => void
  autoFocus?: boolean
}

export function SnelInvoer({ onToegevoegd, autoFocus = false }: Props) {
  const uitlegId = useId()
  const [tekst, setTekst] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const voorbeeld = useMemo(() => (tekst.trim() ? leesSnelleTaak(tekst, new Date()) : null), [tekst])

  async function toevoegen(e: FormEvent) {
    e.preventDefault()
    if (!voorbeeld || bezig) return
    setBezig(true)
    setFout(null)
    const uitkomst = await haalJson('/api/lifeos/taken', leesNiets, {
      method: 'POST',
      body: JSON.stringify({ titel: voorbeeld.titel, datum: voorbeeld.datum, categorie: voorbeeld.categorie }),
    })
    setBezig(false)
    if (!uitkomst.ok) {
      setFout(uitkomst.fout)
      return
    }
    setTekst('')
    meldWijziging('taken')
    onToegevoegd?.(voorbeeld.titel)
  }

  return (
    <form onSubmit={(e) => void toevoegen(e)} style={{ display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          placeholder="Nieuwe taak… bv. “morgen Ruben bellen #werk”"
          aria-label="Nieuwe taak"
          aria-describedby={uitlegId}
          autoFocus={autoFocus}
          style={{
            flex: 1, minWidth: 0, appearance: 'none', fontFamily: 'inherit', fontSize: 14,
            color: 'var(--text-1)', background: 'var(--bg-raised)', border: '1px solid var(--line)',
            borderRadius: 10, padding: '10px 12px',
          }}
        />
        <button
          type="submit"
          disabled={!voorbeeld || bezig}
          aria-label="Taak toevoegen"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 42, flexShrink: 0,
            borderRadius: 10, border: '1px solid var(--brand)', background: 'var(--brand-soft)', color: 'var(--brand)',
            cursor: voorbeeld && !bezig ? 'pointer' : 'not-allowed', opacity: voorbeeld && !bezig ? 1 : 0.5,
          }}
        >
          <Plus size={18} strokeWidth={2.4} aria-hidden />
        </button>
      </div>
      <p id={uitlegId} aria-live="polite" style={{ margin: 0, display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: 'var(--text-3)', minHeight: 17 }}>
        {voorbeeld ? (
          <>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <CalendarDays size={12} aria-hidden /> {voorbeeld.datum ? dagLabel(voorbeeld.datum) : 'Ooit'}
            </span>
            {voorbeeld.categorie ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Tag size={12} aria-hidden /> {voorbeeld.categorie}
              </span>
            ) : null}
          </>
        ) : (
          'Dag en #categorie mag je er gewoon in typen.'
        )}
      </p>
      {fout ? <Foutmelding bericht={fout} /> : null}
    </form>
  )
}
