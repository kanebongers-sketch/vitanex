'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Kaart } from '@/components/lifeos/os/Kaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { VoortgangsBalk } from './VoortgangsBalk'
import { VoedingToevoegen, type MaaltijdInvoer } from './VoedingToevoegen'
import { haalJson } from '@/lib/lifeos/api/http'
import { isObject, getalOfNull, tekstOfNull, tijdelijkeId } from './lees'

// ─── Voeding — echte MentaForce-data ────────────────────────────────────────
// Leest vandaag via `GET /api/voeding` (tabel voeding_logs) op Kane's gewone
// sessie en schrijft via `POST /api/voeding`. Toont calorie- + macro-voortgang
// (gelogd vs doel) en een snelle handmatige maaltijd-toevoeg.
//
// Eerlijk: een pijler zónder doel krijgt geen 0%-balk maar "geen doel" (zie
// VoortgangsBalk). Toevoegen is optimistisch met rollback + zichtbare fout.

interface Macros {
  eiwit_g: number
  koolhydraten_g: number
  vet_g: number
}

interface DoelenView {
  calorie_doel: number | null
  macros: Macros | null
}

interface VLog {
  id: string
  omschrijving: string
  calorieen: number | null
  eiwitten_g: number | null
  koolhydraten_g: number | null
  vetten_g: number | null
}

interface VoedingView {
  doelen: DoelenView
  logs: VLog[]
}

interface Totalen {
  calorieen: number
  eiwit_g: number
  koolhydraten_g: number
  vet_g: number
}

function leesMacros(ruw: unknown): Macros | null {
  if (!isObject(ruw)) return null
  const e = getalOfNull(ruw.eiwit_g)
  const k = getalOfNull(ruw.koolhydraten_g)
  const v = getalOfNull(ruw.vet_g)
  if (e === null || k === null || v === null) return null
  return { eiwit_g: e, koolhydraten_g: k, vet_g: v }
}

function leesLog(ruw: unknown): VLog | null {
  if (!isObject(ruw)) return null
  const id = tekstOfNull(ruw.id)
  const omschrijving = tekstOfNull(ruw.omschrijving)
  if (id === null || omschrijving === null) return null
  return {
    id,
    omschrijving,
    calorieen: getalOfNull(ruw.calorieen),
    eiwitten_g: getalOfNull(ruw.eiwitten_g),
    koolhydraten_g: getalOfNull(ruw.koolhydraten_g),
    vetten_g: getalOfNull(ruw.vetten_g),
  }
}

/** Narrowt `GET /api/voeding`. `null` = onverwachte vorm → foutstaat. */
function leesVoeding(ruw: unknown): VoedingView | null {
  if (!isObject(ruw) || !Array.isArray(ruw.logs)) return null

  const logs: VLog[] = []
  for (const rij of ruw.logs) {
    const log = leesLog(rij)
    if (log !== null) logs.push(log) // Malformde rij overslaan, niet de kaart breken.
  }

  const doelenRuw = isObject(ruw.doelen) ? ruw.doelen : {}
  return {
    doelen: { calorie_doel: getalOfNull(doelenRuw.calorie_doel), macros: leesMacros(doelenRuw.macros) },
    logs,
  }
}

/** Narrowt `POST /api/voeding` → de echte id van de nieuwe regel. */
function leesNieuweLog(ruw: unknown): { id: string } | null {
  if (!isObject(ruw) || !isObject(ruw.log)) return null
  const id = tekstOfNull(ruw.log.id)
  return id === null ? null : { id }
}

function berekenTotalen(logs: readonly VLog[]): Totalen {
  return logs.reduce<Totalen>(
    (acc, l) => ({
      calorieen: acc.calorieen + (l.calorieen ?? 0),
      eiwit_g: acc.eiwit_g + (l.eiwitten_g ?? 0),
      koolhydraten_g: acc.koolhydraten_g + (l.koolhydraten_g ?? 0),
      vet_g: acc.vet_g + (l.vetten_g ?? 0),
    }),
    { calorieen: 0, eiwit_g: 0, koolhydraten_g: 0, vet_g: 0 },
  )
}

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; view: VoedingView }

/**
 * Een mislukte log, mét de maaltijd die niet werd opgeslagen.
 *
 * De formuliervelden blijven weliswaar staan (`voegToe` geeft false terug), maar
 * dat is een weg terug die je moet raden. `Foutmelding` zonder `opnieuw` is
 * expliciet verboden ("Weglaten = geen weg terug. Doe dat niet.") — dus de
 * invoer gaat mee en de knop doet het echt.
 */
interface ActieFout {
  bericht: string
  invoer: MaaltijdInvoer
}

export function VoedingCockpitKaart() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const [actieFout, setActieFout] = useState<ActieFout | null>(null)
  const [bezig, setBezig] = useState(false)
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson('/api/voeding', leesVoeding).then((uitkomst) => {
      if (mijn !== generatie.current) return
      setStaat(uitkomst.ok ? { fase: 'ok', view: uitkomst.waarde } : { fase: 'fout', bericht: uitkomst.fout })
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
    async (invoer: MaaltijdInvoer): Promise<boolean> => {
      if (staat.fase !== 'ok' || bezig) return false
      setBezig(true)
      setActieFout(null)

      const voor = staat.view
      const tijdId = tijdelijkeId()
      const optimistisch: VLog = {
        id: tijdId,
        omschrijving: invoer.omschrijving,
        calorieen: invoer.calorieen,
        eiwitten_g: invoer.eiwitten_g,
        koolhydraten_g: invoer.koolhydraten_g,
        vetten_g: invoer.vetten_g,
      }
      // Optimistisch: nieuwe maaltijd meteen in de lijst + tellingen.
      setStaat({ fase: 'ok', view: { ...voor, logs: [...voor.logs, optimistisch] } })

      const uitkomst = await haalJson('/api/voeding', leesNieuweLog, {
        method: 'POST',
        body: JSON.stringify(invoer),
      })
      setBezig(false)

      if (uitkomst.ok) {
        // Tijdelijke id vervangen door de echte, zodat latere acties kloppen.
        setStaat((s) =>
          s.fase === 'ok'
            ? { fase: 'ok', view: { ...s.view, logs: s.view.logs.map((l) => (l.id === tijdId ? { ...l, id: uitkomst.waarde.id } : l)) } }
            : s,
        )
        return true
      }

      // Rollback: de optimistische regel eruit + zichtbare fout. De velden in het
      // formulier blijven staan (we geven false terug), zodat niets verloren gaat.
      setStaat((s) => (s.fase === 'ok' ? { fase: 'ok', view: { ...s.view, logs: s.view.logs.filter((l) => l.id !== tijdId) } } : s))
      setActieFout({ bericht: uitkomst.fout, invoer })
      return false
    },
    [staat, bezig],
  )

  return (
    <Kaart titel="Voeding" vervangt="MyFitnessPal">
      {staat.fase === 'laden' ? <Skelet /> : null}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}
      {staat.fase === 'ok' ? (
        <Inhoud view={staat.view} bezig={bezig} actieFout={actieFout} onToevoeg={voegToe} />
      ) : null}
    </Kaart>
  )
}

interface InhoudProps {
  view: VoedingView
  bezig: boolean
  actieFout: ActieFout | null
  onToevoeg: (invoer: MaaltijdInvoer) => Promise<boolean>
}

function Inhoud({ view, bezig, actieFout, onToevoeg }: InhoudProps) {
  const totalen = berekenTotalen(view.logs)
  const { doelen } = view

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <VoortgangsBalk label="Calorieën" gelogd={totalen.calorieen} doel={doelen.calorie_doel} eenheid="kcal" />
        <VoortgangsBalk label="Eiwitten" gelogd={totalen.eiwit_g} doel={doelen.macros?.eiwit_g ?? null} eenheid="g" />
        <VoortgangsBalk label="Koolhydraten" gelogd={totalen.koolhydraten_g} doel={doelen.macros?.koolhydraten_g ?? null} eenheid="g" />
        <VoortgangsBalk label="Vetten" gelogd={totalen.vet_g} doel={doelen.macros?.vet_g ?? null} eenheid="g" />
      </div>

      {view.logs.length > 0 ? (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 2 }}>
          {view.logs.map((log) => (
            <li
              key={log.id}
              style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '7px 0', borderBottom: '1px solid var(--line)' }}
            >
              <span style={{ fontSize: 13, color: 'var(--text-2)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {log.omschrijving}
              </span>
              <span className="os-cijfer" style={{ fontSize: 13, color: 'var(--text-4)', flex: 'none' }}>
                {log.calorieen !== null ? `${Math.round(log.calorieen)} kcal` : '—'}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-4)' }}>Nog niets gelogd vandaag.</p>
      )}

      <VoedingToevoegen bezig={bezig} onToevoeg={onToevoeg} />

      {actieFout ? (
        <Foutmelding
          bericht={`${actieFout.bericht} "${actieFout.invoer.omschrijving}" is niet opgeslagen.`}
          opnieuw={() => {
            void onToevoeg(actieFout.invoer)
          }}
        />
      ) : null}
    </div>
  )
}

function Skelet() {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gap: 12 }}>
      {[80, 62, 70, 54].map((breedte, i) => (
        <div key={i} style={{ display: 'grid', gap: 6 }}>
          <div style={{ height: 12, width: `${breedte}%`, borderRadius: 4, background: 'var(--bg-raised)' }} />
          <div style={{ height: 7, width: '100%', borderRadius: 999, background: 'var(--bg-raised)' }} />
        </div>
      ))}
    </div>
  )
}
