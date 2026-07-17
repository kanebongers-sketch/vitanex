'use client'

import { useCallback } from 'react'
import { Kaart } from '@/components/lifeos/os/Kaart'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { SchaalKiezer, type SchaalWaarde } from './SchaalKiezer'
import { useWelzijnLog, type NieuwsteLog, type WelzijnLog } from './useWelzijnLog'
import { LaatsteLog, LogSkelet } from './LogStaat'
import { isObject, getalOfNull, tekstOfNull } from '@/lib/lifeos/api/http'
import { vitaEvent } from '@/lib/vita/events'

// ─── Stress loggen ──────────────────────────────────────────────────────────
// De pijler `stress` wordt UITSLUITEND gevoed door `stress_logs`
// (lib/pijlers/pijlers-server.ts). De cockpit logde alleen voeding, water en
// workout — er was dus geen enkel invoerpunt, en die ring stond daarom altijd op
// een streepje. Niet omdat Kane geen stress heeft, maar omdat de app er niet
// naar vroeg. Deze kaart is dat invoerpunt.
//
// Schrijft naar `POST /api/stress` (tabel `stress_logs`) op Kane's gewone
// sessie, net als de /stress-pagina. Geen tweede database, geen dubbele cijfers.
//
// Kiezen-dan-loggen, niet loggen-op-klik. Water is optellend (een misklik kost je
// 250 ml), stress is een toestand: een misklik zet een onwaar cijfer in je
// historie, en er is geen DELETE op deze route om het terug te nemen. Eén klik
// extra is de goedkoopste van de twee.

const STRESS_SCHAAL: readonly SchaalWaarde[] = [
  { waarde: 1, label: 'Heel rustig' },
  { waarde: 2, label: 'Rustig' },
  { waarde: 3, label: 'Ontspannen' },
  { waarde: 4, label: 'Licht gespannen' },
  { waarde: 5, label: 'Merkbaar gespannen' },
  { waarde: 6, label: 'Gespannen' },
  { waarde: 7, label: 'Behoorlijk gespannen' },
  { waarde: 8, label: 'Veel stress' },
  { waarde: 9, label: 'Zeer veel stress' },
  { waarde: 10, label: 'Extreem gespannen' },
]

/**
 * De bandindeling van de /stress-pagina (≤3 rustig · ≤6 midden · >6 hoog),
 * hier in LifeOS-tokens. Let op de richting: bij stress is HOOG slecht — precies
 * andersom dan bij een pijlerscore. Daarom niet `scoreNiveau()` hergebruiken:
 * die zou een 9 als "goed" tekenen.
 */
function stressKleur(niveau: number): string {
  if (niveau <= 3) return 'var(--status-goed)'
  if (niveau <= 6) return 'var(--status-aandacht)'
  return 'var(--status-laag)'
}

function labelVan(niveau: number): string {
  return STRESS_SCHAAL.find((s) => s.waarde === niveau)?.label ?? 'Onbekend'
}

/** Narrowt `GET /api/stress?limit=1` → `{logs: [...]}`. */
function leesNieuwste(ruw: unknown): NieuwsteLog | null {
  if (!isObject(ruw) || !Array.isArray(ruw.logs)) return null

  const eerste = ruw.logs[0]
  // Lege lijst = je logde nog nooit. Geldig antwoord, geen storing.
  if (eerste === undefined) return { nieuwste: null }

  const log = leesLog(eerste)
  return log === null ? null : { nieuwste: log }
}

/** Narrowt `POST /api/stress` → `{log: {...}}`. */
function leesOpgeslagen(ruw: unknown): WelzijnLog | null {
  if (!isObject(ruw)) return null
  return leesLog(ruw.log)
}

function leesLog(ruw: unknown): WelzijnLog | null {
  if (!isObject(ruw)) return null
  const waarde = getalOfNull(ruw.stress_niveau)
  const op = tekstOfNull(ruw.aangemaakt_op)
  if (waarde === null || op === null) return null
  return { waarde, op }
}

export function StressLogKaart() {
  const bouwBody = useCallback((waarde: number) => ({ stress_niveau: waarde }), [])
  const naSucces = useCallback(() => {
    // Voedt de retentie-loop, net als de andere logkaarten.
    vitaEvent('data_logged', { kind: 'stress' })
  }, [])

  const { staat, gekozen, kies, bezig, actieFout, log, opnieuwLaden } = useWelzijnLog({
    pad: '/api/stress',
    leesNieuwste,
    leesOpgeslagen,
    bouwBody,
    naSucces,
  })

  return (
    <Kaart titel="Stress" vervangt="losse stress-tracker">
      {staat.fase === 'laden' ? <LogSkelet /> : null}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuwLaden} /> : null}

      {staat.fase === 'ok' ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <LaatsteLog
            laatste={staat.laatste}
            leeg="Je logde nog geen stress. Zonder deze log blijft de stress-ring leeg."
            beschrijf={(l) => `${labelVan(l.waarde)} · ${l.waarde}/10`}
            kleurVan={(l) => stressKleur(l.waarde)}
          />

          <SchaalKiezer
            legenda="Hoe gespannen ben je nu?"
            naam="stress"
            waarden={STRESS_SCHAAL}
            gekozen={gekozen}
            onKies={kies}
            disabled={bezig}
            uiteinden={{ laag: '1 · heel rustig', hoog: '10 · extreem' }}
          />

          {/* De gekozen waarde in woorden. Een cijfer alleen is geen betekenis —
              en de kleur alleen mag het ook niet dragen (WCAG 1.4.1). */}
          {gekozen !== null ? (
            <p style={{ margin: 0, fontSize: 13, color: stressKleur(gekozen), fontWeight: 600 }}>
              {labelVan(gekozen)}
            </p>
          ) : null}

          <Knop variant="primair" disabled={gekozen === null || bezig} onClick={() => void log()}>
            {bezig ? 'Bezig met loggen…' : 'Stress loggen'}
          </Knop>

          {actieFout ? (
            <Foutmelding
              bericht={`${actieFout} Je stressniveau is niet opgeslagen.`}
              opnieuw={() => void log()}
            />
          ) : null}
        </div>
      ) : null}
    </Kaart>
  )
}
