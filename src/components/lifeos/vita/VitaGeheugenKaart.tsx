'use client'

import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { Kaart } from '@/components/lifeos/os/Kaart'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { bewaarGeheugen, haalGeheugen, wisGeheugen } from '@/lib/lifeos/vita/client'
import {
  GEHEUGEN_IN_PROMPT,
  GEHEUGEN_SOORTEN,
  MAX_INHOUD_LENGTE,
  type GeheugenRegel,
  type GeheugenSoort,
} from '@/lib/lifeos/vita/geheugen'

// Wat Vita over je onthoudt — en jij beslist wat erin staat.
//
// De API (lezen, toevoegen, wissen) bestond al; alleen dit paneel ontbrak. Zonder
// paneel kon je niet zien wat Vita bij elke vraag meekrijgt, en een verouderd
// feit ("ik train 3× per week") bleef stil je antwoorden kleuren.
//
// Eerlijk over de grens: Vita neemt per vraag alleen de meest recente
// GEHEUGEN_IN_PROMPT regels mee. Staan er meer, dan zegt het paneel dat.

const SOORT_LABEL: Record<GeheugenSoort, string> = {
  voorkeur: 'Voorkeur',
  feit: 'Feit',
  doel: 'Doel',
}

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; melding: string }
  | { fase: 'ok'; regels: GeheugenRegel[] }

export function VitaGeheugenKaart() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const [soort, setSoort] = useState<GeheugenSoort>('feit')
  const [inhoud, setInhoud] = useState('')
  const [bezig, setBezig] = useState(false)
  const [actieFout, setActieFout] = useState<string | null>(null)

  const laad = useCallback((signaal: AbortSignal) => {
    void haalGeheugen(signaal).then((uit) => {
      if (signaal.aborted) return
      setStaat(uit.ok ? { fase: 'ok', regels: uit.regels } : { fase: 'fout', melding: uit.melding })
    })
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    laad(controller.signal)
    return () => controller.abort()
  }, [laad])

  const opnieuw = useCallback(() => {
    setStaat({ fase: 'laden' })
    laad(new AbortController().signal)
  }, [laad])

  async function voegToe(e: FormEvent) {
    e.preventDefault()
    const tekst = inhoud.trim()
    if (tekst.length === 0 || staat.fase !== 'ok') return
    setBezig(true)
    setActieFout(null)
    const uit = await bewaarGeheugen(soort, tekst)
    setBezig(false)
    if (!uit.ok) {
      setActieFout(uit.melding)
      return
    }
    setInhoud('')
    setStaat({ fase: 'ok', regels: [uit.regel, ...staat.regels] })
  }

  async function wis(regel: GeheugenRegel) {
    if (staat.fase !== 'ok') return
    setActieFout(null)
    const uit = await wisGeheugen(regel.id)
    if (!uit.ok) {
      setActieFout(uit.melding)
      return
    }
    setStaat({ fase: 'ok', regels: staat.regels.filter((r) => r.id !== regel.id) })
  }

  return (
    <Kaart titel="Wat Vita onthoudt">
      {staat.fase === 'laden' ? <div aria-hidden style={SKELET} /> : null}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.melding} opnieuw={opnieuw} /> : null}
      {staat.fase === 'ok' ? (
        <div style={{ display: 'grid', gap: 14 }}>
          {staat.regels.length === 0 ? (
            <p style={UITLEG}>
              Vita onthoudt nog niets over je. Voeg een feit, voorkeur of doel toe — dat neemt hij mee in elk antwoord.
            </p>
          ) : (
            <ul style={LIJST}>
              {staat.regels.map((r) => (
                <li key={r.id} style={REGEL}>
                  <span style={SOORT}>{SOORT_LABEL[r.soort]}</span>
                  <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{r.inhoud}</span>
                  <button
                    type="button"
                    aria-label={`Vergeet: ${r.inhoud}`}
                    onClick={() => void wis(r)}
                    style={WIS}
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {staat.regels.length > GEHEUGEN_IN_PROMPT ? (
            <p style={UITLEG}>
              Vita neemt per vraag de {GEHEUGEN_IN_PROMPT} nieuwste regels mee; oudere staan hier wel, maar tellen niet meer mee.
            </p>
          ) : null}
          <form onSubmit={(e) => void voegToe(e)} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <label style={{ display: 'contents' }}>
              <span className="sr-only">Soort</span>
              <select value={soort} onChange={(e) => setSoort(e.target.value as GeheugenSoort)} style={VELD}>
                {GEHEUGEN_SOORTEN.map((s) => (
                  <option key={s} value={s}>{SOORT_LABEL[s]}</option>
                ))}
              </select>
            </label>
            <label style={{ display: 'contents' }}>
              <span className="sr-only">Wat moet Vita onthouden?</span>
              <input
                value={inhoud}
                onChange={(e) => setInhoud(e.target.value)}
                maxLength={MAX_INHOUD_LENGTE}
                placeholder="Bv. ik train 's ochtends het liefst"
                style={{ ...VELD, flex: '1 1 200px' }}
              />
            </label>
            <Knop variant="primair" type="submit" disabled={bezig || inhoud.trim().length === 0}>
              {bezig ? 'Bezig…' : 'Onthoud'}
            </Knop>
          </form>
          {actieFout ? <Foutmelding bericht={actieFout} /> : null}
        </div>
      ) : null}
    </Kaart>
  )
}

const SKELET: CSSProperties = { height: 64, borderRadius: 10, background: 'var(--bg-raised)' }
const UITLEG: CSSProperties = { margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--text-3)' }
const LIJST: CSSProperties = { listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }
const REGEL: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: 13.5,
  color: 'var(--text-1)',
  padding: '7px 0',
  borderBottom: '1px solid var(--line)',
}
const SOORT: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--text-4)',
  minWidth: 64,
}
const WIS: CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: 28,
  height: 28,
  borderRadius: 8,
  border: '1px solid var(--line)',
  background: 'transparent',
  color: 'var(--text-3)',
  cursor: 'pointer',
}
const VELD: CSSProperties = {
  appearance: 'none',
  fontFamily: 'inherit',
  fontSize: 13,
  color: 'var(--text-1)',
  background: 'var(--bg-raised)',
  border: '1px solid var(--line)',
  borderRadius: 8,
  padding: '7px 10px',
}
