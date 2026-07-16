'use client'

import { useCallback, useId, useState, type CSSProperties, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'
import { MOMENTEN, isMoment, type Moment, type NieuweVoedingLog } from '@/lib/lifeos/voeding/voeding'
import { momentLabel } from '@/lib/lifeos/voeding/formatteer'

// Het logformulier. Presentational: het weet niets van fetch — het roept
// `onVoegToe` aan en meldt of het lukte.
//
// ─── ALLEEN DE OMSCHRIJVING IS VERPLICHT ────────────────────────────────────
// Dat is geen coulance maar het ontwerp. Wie eerst vier macro's moet invullen,
// logt de derde dag niets meer — en dan meet je zijn motivatie, niet zijn
// voeding. Een halve log is beter dan geen log, dus de macro's staan achter een
// vouw en de knop werkt zonder ze.
//
// De lege velden worden NIET stiekem 0. Ze gaan als null naar de server (zie
// `leesOptioneelGetal` in lib/lifeos/voeding/voeding.ts) en tellen daardoor
// nergens als gemeten nul mee.

interface VoedingFormulierProps {
  bezig: boolean
  /** Geeft `true` als het lukte; dan pas leegt het formulier zichzelf. */
  onVoegToe: (invoer: Omit<NieuweVoedingLog, 'datum'>) => Promise<boolean>
}

/** Lege string = niet ingevuld. Bewust string en geen number: zie `getal`. */
interface Velden {
  omschrijving: string
  kcal: string
  eiwitG: string
  koolhydratenG: string
  vetG: string
  moment: string
}

const LEEG: Velden = {
  omschrijving: '',
  kcal: '',
  eiwitG: '',
  koolhydratenG: '',
  vetG: '',
  moment: '',
}

/**
 * Een leeg veld wordt `null`, nooit 0.
 *
 * Hier zou een `Number(v)` het hele project slopen: `Number('')` is 0, en dan
 * is elk leeggelaten veld ineens een gemeten nul. De server valideert dit
 * nogmaals — diepteverdediging, want deze regel mag nergens wegvallen.
 */
function getal(v: string): number | null {
  const tekst = v.trim()
  if (tekst.length === 0) return null
  const n = Number(tekst.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export function VoedingFormulier({ bezig, onVoegToe }: VoedingFormulierProps) {
  const [velden, setVelden] = useState<Velden>(LEEG)
  const id = useId()

  const zet = useCallback(<K extends keyof Velden>(veld: K, waarde: string) => {
    // Nieuw object, geen in-place mutatie.
    setVelden((h) => ({ ...h, [veld]: waarde }))
  }, [])

  const verstuur = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      const omschrijving = velden.omschrijving.trim()
      if (omschrijving.length === 0 || bezig) return

      const moment: Moment | null = isMoment(velden.moment) ? velden.moment : null
      const gelukt = await onVoegToe({
        omschrijving,
        kcal: getal(velden.kcal),
        eiwitG: getal(velden.eiwitG),
        koolhydratenG: getal(velden.koolhydratenG),
        vetG: getal(velden.vetG),
        moment,
      })

      // Alleen legen als het lukte. Anders gooien we weg wat de gebruiker net
      // typte, en mag hij het na een netwerkfout opnieuw intikken.
      if (gelukt) setVelden(LEEG)
    },
    [velden, bezig, onVoegToe],
  )

  return (
    <form onSubmit={(e) => void verstuur(e)} style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <label htmlFor={`${id}-wat`} style={VERBORGEN}>
          Wat at je?
        </label>
        <input
          id={`${id}-wat`}
          value={velden.omschrijving}
          onChange={(e) => zet('omschrijving', e.target.value)}
          placeholder="Wat at je?"
          maxLength={200}
          style={{ ...INVOER, flex: 1, minWidth: 140 }}
        />

        <label htmlFor={`${id}-moment`} style={VERBORGEN}>
          Moment
        </label>
        <select
          id={`${id}-moment`}
          value={velden.moment}
          onChange={(e) => zet('moment', e.target.value)}
          style={{ ...INVOER, flex: 'none', cursor: 'pointer' }}
        >
          {/* Ook het moment mag leeg: soms eet je gewoon iets. */}
          <option value="">Moment</option>
          {MOMENTEN.map((m) => (
            <option key={m} value={m}>
              {momentLabel(m)}
            </option>
          ))}
        </select>
      </div>

      {/* Native <details>: werkt met toetsenbord en screenreader zonder JS, en
          houdt de macro's uit de weg zonder ze te verstoppen. */}
      <details>
        <summary style={SAMENVATTING}>Cijfers erbij (mag leeg)</summary>
        <div style={MACRO_RASTER}>
          <Getal id={`${id}-kcal`} label="Calorieën" eenheid="kcal" waarde={velden.kcal} onZet={(v) => zet('kcal', v)} />
          <Getal id={`${id}-eiwit`} label="Eiwit" eenheid="g" waarde={velden.eiwitG} onZet={(v) => zet('eiwitG', v)} />
          <Getal id={`${id}-kh`} label="Koolhydraten" eenheid="g" waarde={velden.koolhydratenG} onZet={(v) => zet('koolhydratenG', v)} />
          <Getal id={`${id}-vet`} label="Vet" eenheid="g" waarde={velden.vetG} onZet={(v) => zet('vetG', v)} />
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-4)', margin: '10px 0 0', lineHeight: 1.5 }}>
          Wat je leeg laat blijft leeg — het telt nergens als nul mee.
        </p>
      </details>

      <div>
        <Knop type="submit" variant="primair" disabled={bezig || velden.omschrijving.trim().length === 0}>
          <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
          {bezig ? 'Bezig…' : 'Log dit'}
        </Knop>
      </div>
    </form>
  )
}

interface GetalProps {
  id: string
  label: string
  eenheid: string
  waarde: string
  onZet: (waarde: string) => void
}

function Getal({ id, label, eenheid, waarde, onZet }: GetalProps) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <label htmlFor={id} style={LABEL}>
        {label} <span style={{ color: 'var(--text-4)' }}>({eenheid})</span>
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={waarde}
        onChange={(e) => onZet(e.target.value)}
        placeholder="—"
        style={INVOER}
      />
    </div>
  )
}

/** Zichtbaar voor screenreaders, niet voor het oog. */
const VERBORGEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

const INVOER: CSSProperties = {
  padding: '8px 12px',
  borderRadius: 10,
  border: '1px solid var(--line)',
  background: 'var(--bg-raised)',
  color: 'var(--text-1)',
  fontFamily: 'inherit',
  fontSize: 13,
  minWidth: 0,
}

const LABEL: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  color: 'var(--text-3)',
}

const SAMENVATTING: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-3)',
  cursor: 'pointer',
  padding: '2px 0',
}

const MACRO_RASTER: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(112px, 1fr))',
  gap: 10,
  marginTop: 10,
}
