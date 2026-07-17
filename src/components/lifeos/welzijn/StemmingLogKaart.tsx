'use client'

import { useCallback } from 'react'
import { Kaart } from '@/components/lifeos/os/Kaart'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { SchaalKiezer, type SchaalWaarde } from './SchaalKiezer'
import { useWelzijnLog, type NieuwsteLog, type WelzijnLog } from './useWelzijnLog'
import { LaatsteLog, LogSkelet } from './LogStaat'
import { isObject, getalOfNull, tekstOfNull } from '@/lib/lifeos/api/http'
import { scoreNiveau, vanSchaal1tot5 } from '@/lib/pijlers/score'
import { vitaEvent } from '@/lib/vita/events'

// ─── Stemming loggen ────────────────────────────────────────────────────────
// Tweelingzus van `StressLogKaart`, en om dezelfde reden: de pijler `stemming`
// hangt volledig aan `stemming_logs` (lib/pijlers/pijlers-server.ts) en de
// cockpit had geen invoerpunt. Zes pijlers, vier meetbaar — dit is de vijfde.
//
// Schrijft naar `POST /api/stemming` (tabel `stemming_logs`) op Kane's gewone
// sessie, net als de /stemming-pagina.
//
// De labels komen van diezelfde pagina (STEMMING_OPTIES), zodat een 4 hier
// hetzelfde heet als daar. Wat NIET meekomt: de emoji's en de mf-kleuren. Emoji
// als icoon is verboden (ui.md), en de zes-kleurenschaal van /stemming is
// MentaForce's palet — LifeOS is navy + cyaan, met status-kleuren voor status.

const STEMMING_SCHAAL: readonly SchaalWaarde[] = [
  { waarde: 1, label: 'Slecht' },
  { waarde: 2, label: 'Matig' },
  { waarde: 3, label: 'Neutraal' },
  { waarde: 4, label: 'Goed' },
  { waarde: 5, label: 'Super' },
]

function labelVan(waarde: number): string {
  return STEMMING_SCHAAL.find((s) => s.waarde === waarde)?.label ?? 'Onbekend'
}

/**
 * Stemming is 1–5 waarbij hoog = goed: dezelfde richting als een pijlerscore.
 * Daarom mág `scoreNiveau` hier wél — via exact de normalisatie die
 * pijlers-server ook op deze kolom loslaat (`vanSchaal1tot5`). Zo kleurt een 4
 * hier hetzelfde als de stemming-ring in de welzijnskaart, in plaats van dat we
 * er een tweede schaal naast zetten.
 */
function stemmingKleur(waarde: number): string {
  return scoreNiveau(vanSchaal1tot5(waarde)).kleur
}

/** Narrowt `GET /api/stemming?limit=1` → `{logs: [...]}`. */
function leesNieuwste(ruw: unknown): NieuwsteLog | null {
  if (!isObject(ruw) || !Array.isArray(ruw.logs)) return null

  const eerste = ruw.logs[0]
  // Lege lijst = nog nooit gelogd. Geldig antwoord, geen storing.
  if (eerste === undefined) return { nieuwste: null }

  const log = leesLog(eerste)
  return log === null ? null : { nieuwste: log }
}

/** Narrowt `POST /api/stemming` → `{log: {...}}`. */
function leesOpgeslagen(ruw: unknown): WelzijnLog | null {
  if (!isObject(ruw)) return null
  return leesLog(ruw.log)
}

function leesLog(ruw: unknown): WelzijnLog | null {
  if (!isObject(ruw)) return null
  const waarde = getalOfNull(ruw.stemming)
  const op = tekstOfNull(ruw.aangemaakt_op)
  if (waarde === null || op === null) return null
  return { waarde, op }
}

export function StemmingLogKaart() {
  // Bewust alleen `stemming`, geen `energie`. De route accepteert energie
  // optioneel, maar een veld dat we niet vragen mogen we niet invullen: dan
  // stond er straks een energie-cijfer in de DB dat Kane nooit heeft gegeven.
  const bouwBody = useCallback((waarde: number) => ({ stemming: waarde }), [])
  const naSucces = useCallback(() => {
    vitaEvent('mood_logged', { kind: 'stemming' })
  }, [])

  const { staat, gekozen, kies, bezig, actieFout, log, opnieuwLaden } = useWelzijnLog({
    pad: '/api/stemming',
    leesNieuwste,
    leesOpgeslagen,
    bouwBody,
    naSucces,
  })

  return (
    <Kaart titel="Stemming" vervangt="losse mood-tracker">
      {staat.fase === 'laden' ? <LogSkelet /> : null}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuwLaden} /> : null}

      {staat.fase === 'ok' ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <LaatsteLog
            laatste={staat.laatste}
            leeg="Je logde nog geen stemming. Zonder deze log blijft de stemming-ring leeg."
            beschrijf={(l) => `${labelVan(l.waarde)} · ${l.waarde}/5`}
            kleurVan={(l) => stemmingKleur(l.waarde)}
          />

          <SchaalKiezer
            legenda="Hoe voel je je nu?"
            naam="stemming"
            waarden={STEMMING_SCHAAL}
            gekozen={gekozen}
            onKies={kies}
            disabled={bezig}
            uiteinden={{ laag: '1 · slecht', hoog: '5 · super' }}
          />

          {gekozen !== null ? (
            <p
              style={{ margin: 0, fontSize: 13, color: stemmingKleur(gekozen), fontWeight: 600 }}
            >
              {labelVan(gekozen)}
            </p>
          ) : null}

          <Knop variant="primair" disabled={gekozen === null || bezig} onClick={() => void log()}>
            {bezig ? 'Bezig met loggen…' : 'Stemming loggen'}
          </Knop>

          {actieFout ? (
            <Foutmelding
              bericht={`${actieFout} Je stemming is niet opgeslagen.`}
              opnieuw={() => void log()}
            />
          ) : null}
        </div>
      ) : null}
    </Kaart>
  )
}
