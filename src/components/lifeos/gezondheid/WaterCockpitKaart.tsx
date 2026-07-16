'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { GlassWater, Plus } from 'lucide-react'
import { Kaart } from '@/components/lifeos/os/Kaart'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { VoortgangsBalk } from './VoortgangsBalk'
import { haalJson } from '@/lib/lifeos/api/http'
import { isObject, getalOfNull } from './lees'

// ─── Water — echte MentaForce-data, geen localStorage ───────────────────────
// Schrijft naar `/api/water` (tabel water_logs) op Kane's gewone sessie, precies
// zoals de /water-pagina. Optimistisch: de teller loopt meteen op, en rolt terug
// met een zichtbare fout als de server het niet opslaat.

const GLAS_ML = 250 // Eén glas. Ook de knop-eenheid: rustig en voorspelbaar.
const FLES_ML = 500

interface WaterView {
  vandaag_ml: number
  doel_ml: number | null
}

/** Narrowt `GET /api/water`. `null` = onverwachte vorm → foutstaat. */
function leesWater(ruw: unknown): WaterView | null {
  if (!isObject(ruw)) return null
  const vandaag = getalOfNull(ruw.vandaag_ml)
  if (vandaag === null) return null
  return { vandaag_ml: vandaag, doel_ml: getalOfNull(ruw.doel_ml) }
}

/** Narrowt `POST /api/water` → het nieuwe serverzijdige totaal. */
function leesNieuwTotaal(ruw: unknown): { nieuw_totaal: number; doel_ml: number | null } | null {
  if (!isObject(ruw)) return null
  const totaal = getalOfNull(ruw.nieuw_totaal)
  if (totaal === null) return null
  return { nieuw_totaal: totaal, doel_ml: getalOfNull(ruw.doel_ml) }
}

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; water: WaterView }

export function WaterCockpitKaart() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const [actieFout, setActieFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson('/api/water', leesWater).then((uitkomst) => {
      if (mijn !== generatie.current) return
      setStaat(uitkomst.ok ? { fase: 'ok', water: uitkomst.waarde } : { fase: 'fout', bericht: uitkomst.fout })
    })
  }, [])

  useEffect(() => {
    void laad()
    return () => {
      generatie.current++
    }
  }, [laad])

  const opnieuw = useCallback(() => {
    setStaat({ fase: 'laden' })
    void laad()
  }, [laad])

  const voegToe = useCallback(
    async (ml: number) => {
      if (staat.fase !== 'ok' || bezig) return
      setBezig(true)
      setActieFout(null)

      const voor = staat.water
      // Optimistisch: teller meteen omhoog.
      setStaat({ fase: 'ok', water: { ...voor, vandaag_ml: voor.vandaag_ml + ml } })

      const uitkomst = await haalJson('/api/water', leesNieuwTotaal, {
        method: 'POST',
        body: JSON.stringify({ ml }),
      })
      setBezig(false)

      if (uitkomst.ok) {
        // Verzoen met het echte servertotaal (niet ons optimistische getal).
        setStaat({ fase: 'ok', water: { vandaag_ml: uitkomst.waarde.nieuw_totaal, doel_ml: uitkomst.waarde.doel_ml } })
      } else {
        // Rollback naar de staat van vóór de klik + zichtbare fout.
        setStaat({ fase: 'ok', water: voor })
        setActieFout(uitkomst.fout)
      }
    },
    [staat, bezig],
  )

  return (
    <Kaart titel="Water" vervangt="losse water-tracker">
      {staat.fase === 'laden' ? <Skelet /> : null}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}
      {staat.fase === 'ok' ? (
        <Inhoud water={staat.water} bezig={bezig} actieFout={actieFout} onVoegToe={(ml) => void voegToe(ml)} />
      ) : null}
    </Kaart>
  )
}

interface InhoudProps {
  water: WaterView
  bezig: boolean
  actieFout: string | null
  onVoegToe: (ml: number) => void
}

function Inhoud({ water, bezig, actieFout, onVoegToe }: InhoudProps) {
  const glazen = Math.round((water.vandaag_ml / GLAS_ML) * 10) / 10

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <p className="os-cijfer" style={{ fontSize: 40, fontWeight: 500, color: 'var(--brand)', margin: 0, lineHeight: 0.9 }}>
          {glazen}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-4)', margin: 0 }}>
          {water.vandaag_ml} ml vandaag · 1 glas = {GLAS_ML} ml
        </p>
      </div>

      <VoortgangsBalk label="Inname" gelogd={water.vandaag_ml} doel={water.doel_ml} eenheid="ml" />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Knop variant="primair" disabled={bezig} onClick={() => onVoegToe(GLAS_ML)}>
          <Plus size={14} strokeWidth={2.4} aria-hidden="true" />
          Glas ({GLAS_ML} ml)
        </Knop>
        <Knop disabled={bezig} onClick={() => onVoegToe(FLES_ML)}>
          <GlassWater size={14} strokeWidth={2.2} aria-hidden="true" />
          Fles ({FLES_ML} ml)
        </Knop>
      </div>

      {actieFout ? <Foutmelding bericht={actieFout} /> : null}
    </div>
  )
}

function Skelet() {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gap: 14 }}>
      <div style={{ height: 38, width: '34%', borderRadius: 8, background: 'var(--bg-raised)' }} />
      <div style={{ height: 7, width: '100%', borderRadius: 999, background: 'var(--bg-raised)' }} />
      <div style={{ height: 34, width: '60%', borderRadius: 999, background: 'var(--bg-raised)' }} />
    </div>
  )
}
