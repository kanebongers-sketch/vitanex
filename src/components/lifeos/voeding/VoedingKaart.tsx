'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Kaart, NogNiets } from '@/components/lifeos/os/Kaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { haalJson } from '@/lib/lifeos/api/http'
import { datumSleutel } from '@/lib/lifeos/datum/datum'
import {
  leesVoedingAntwoord,
  leesVoedingLogAntwoord,
  type NieuweVoedingLog,
  type VoedingLog,
} from '@/lib/lifeos/voeding/voeding'
import { momentLabel } from '@/lib/lifeos/voeding/formatteer'
import { VoedingFormulier } from './VoedingFormulier'

// Container voor voeding. Vervangt MyFitnessPal openen.
//
// Er is hier bewust GEEN voedingsdatabase en GEEN barcode-scanner. Die bouwen
// is maanden werk en levert een slechtere MyFitnessPal. Handmatig loggen met
// macro's optioneel is de scope — en genoeg om die app niet meer te openen.
//
// Deze kaart geeft ook geen voedingsadvies. Geen "je eet te weinig eiwit".
// LifeOS is geen diëtist en Kane is geen patiënt: we tonen wat er staat.

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; logs: VoedingLog[] }

export function VoedingKaart() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const [actieFout, setActieFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)

  const dagRef = useRef<string | null>(null)
  const generatie = useRef(0)

  const laad = useCallback((voorDag: string): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson(`/api/lifeos/voeding?datum=${encodeURIComponent(voorDag)}`, leesVoedingAntwoord).then(
      (uitkomst) => {
        if (mijn !== generatie.current) return
        setStaat(
          uitkomst.ok
            ? { fase: 'ok', logs: uitkomst.waarde.logs }
            : { fase: 'fout', bericht: uitkomst.fout },
        )
      },
    )
  }, [])

  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    const dag = datumSleutel(new Date())
    dagRef.current = dag
    void laad(dag)
    return verval
  }, [laad, verval])

  const opnieuw = useCallback(() => {
    const dag = dagRef.current
    if (!dag) return
    setStaat({ fase: 'laden' })
    void laad(dag)
  }, [laad])

  /**
   * Loggen is hier NIET optimistisch, anders dan bij water.
   *
   * Water is één vast getal per tik: dat kun je zonder de server voorspellen.
   * Een voedingslog gaat door validatie (kcal een typefout? macro te groot?) en
   * kan dus terecht geweigerd worden. Een log die verschijnt en een seconde
   * later weer weg is, is verwarrender dan een knop die kort "bezig" staat.
   */
  const voegToe = useCallback(
    async (invoer: Omit<NieuweVoedingLog, 'datum'>): Promise<boolean> => {
      const dag = dagRef.current
      if (staat.fase !== 'ok' || !dag) return false

      setBezig(true)
      setActieFout(null)
      const uitkomst = await haalJson('/api/lifeos/voeding', leesVoedingLogAntwoord, {
        method: 'POST',
        body: JSON.stringify({ ...invoer, datum: dag }),
      })
      setBezig(false)

      if (!uitkomst.ok) {
        setActieFout(uitkomst.fout)
        return false
      }

      const nieuw = uitkomst.waarde
      setStaat((h) => (h.fase === 'ok' ? { fase: 'ok', logs: [...h.logs, nieuw] } : h))
      return true
    },
    [staat],
  )

  return (
    <Kaart titel="Voeding" vervangt="MyFitnessPal">
      {staat.fase === 'laden' ? <Skelet /> : null}

      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}

      {staat.fase === 'ok' ? (
        <div style={{ display: 'grid', gap: 14 }}>
          {staat.logs.length === 0 ? (
            <NogNiets
              wat="Nog niets gelogd vandaag"
              waarom="Alleen de omschrijving is verplicht. Weet je de macro's niet? Laat ze leeg — een halve log is beter dan geen log."
            />
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 2 }}>
              {staat.logs.map((log) => (
                <LogRij key={log.id} log={log} />
              ))}
            </ul>
          )}

          <VoedingFormulier bezig={bezig} onVoegToe={voegToe} />

          {actieFout ? <Foutmelding bericht={actieFout} /> : null}
        </div>
      ) : null}
    </Kaart>
  )
}

/**
 * Eén regel per gelogd ding.
 *
 * Ontbrekende macro's krijgen geen '0' en geen '—' per veld: die zouden de rij
 * vullen met ruis over wat je níét invulde. Wat je wél weet staat er; de rest
 * staat er niet. Hoe onvolledig de dag daarmee is, zegt `MacrosKaart` — dáár
 * telt het, want daar wordt opgeteld.
 */
function LogRij({ log }: { log: VoedingLog }) {
  const delen: string[] = []
  if (log.kcal !== null) delen.push(`${log.kcal} kcal`)
  if (log.eiwitG !== null) delen.push(`${log.eiwitG}g E`)
  if (log.koolhydratenG !== null) delen.push(`${log.koolhydratenG}g K`)
  if (log.vetG !== null) delen.push(`${log.vetG}g V`)

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        padding: '7px 0',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <span style={{ minWidth: 0 }}>
        <span style={{ fontSize: 13, color: 'var(--text-1)' }}>{log.omschrijving}</span>
        {log.moment !== null ? (
          <span style={{ fontSize: 11, color: 'var(--text-4)', marginLeft: 7 }}>
            {momentLabel(log.moment)}
          </span>
        ) : null}
      </span>
      {delen.length > 0 ? (
        <span
          className="os-cijfer"
          style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap', flex: 'none' }}
        >
          {delen.join(' · ')}
        </span>
      ) : (
        // Geen enkel cijfer ingevuld. Dat is een geldige log — zeg dat, in
        // plaats van vier streepjes te tonen alsof er iets stuk is.
        <span style={{ fontSize: 11, color: 'var(--text-4)', whiteSpace: 'nowrap', flex: 'none' }}>
          geen cijfers
        </span>
      )}
    </li>
  )
}

function Skelet() {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gap: 11 }}>
      {[68, 52, 60].map((breedte) => (
        <div
          key={breedte}
          style={{ height: 14, width: `${breedte}%`, borderRadius: 4, background: 'var(--bg-raised)' }}
        />
      ))}
    </div>
  )
}
