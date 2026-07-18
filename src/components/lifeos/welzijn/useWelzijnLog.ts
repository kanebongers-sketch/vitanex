'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { haalJson } from '@/lib/lifeos/api/http'
import { meldWijziging } from '@/lib/lifeos/events'

// ─── Quick-loggen van één welzijnswaarde ────────────────────────────────────
// Stress en stemming doen precies hetzelfde: laatste log ophalen, een waarde
// kiezen, posten, optimistisch tonen, terugrollen als het misgaat. Alleen de
// route en de veldnamen verschillen. Dit is die logica, één keer.
//
// Waarom dit bestaat: zonder deze hook staan er twee kaarten van ~200 regels die
// voor 90% identiek zijn — en dan krijgt er één een bugfix en de ander niet.
//
// Optimistisch mét rollback, naar het patroon van `WaterCockpitKaart`. Een fout
// is hier nooit stil: hij komt terug als `actieFout` mét een weg terug (`log`
// opnieuw aanroepen), want `gekozen` blijft staan als het mislukt.

export interface WelzijnLog {
  waarde: number
  /** ISO-tijdstip van de log. */
  op: string
}

export type WelzijnStaat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  /** `laatste: null` = je logde nog nooit. Een lege staat, geen fout. */
  | { fase: 'ok'; laatste: WelzijnLog | null }

/**
 * Het GET-antwoord, ingepakt.
 *
 * Niet zomaar `WelzijnLog | null`: `haalJson` leest een `null` uit een
 * lees-functie als "onverwacht antwoord" → foutstaat. En "je logde nog nooit"
 * is geen storing. Door de log in een object te zetten kan `null` binnenín
 * "leeg" betekenen, terwijl `null` erbuiten "kapot" blijft betekenen.
 */
export interface NieuwsteLog {
  nieuwste: WelzijnLog | null
}

interface Opties {
  /** Bijv. `/api/stress`. GET voor de historie, POST om te loggen. */
  pad: string
  /** Narrowt `GET {pad}?limit=1`. `null` = onverwachte vorm → foutstaat. */
  leesNieuwste: (ruw: unknown) => NieuwsteLog | null
  /** Narrowt het POST-antwoord naar de zojuist opgeslagen log. */
  leesOpgeslagen: (ruw: unknown) => WelzijnLog | null
  /** Bouwt de POST-body voor een gekozen waarde. */
  bouwBody: (waarde: number) => Record<string, unknown>
  /** Loopt ná een geslaagde log. Voor `vitaEvent` e.d. */
  naSucces?: () => void
}

export function useWelzijnLog({ pad, leesNieuwste, leesOpgeslagen, bouwBody, naSucces }: Opties) {
  const [staat, setStaat] = useState<WelzijnStaat>({ fase: 'laden' })
  const [gekozen, setGekozen] = useState<number | null>(null)
  const [actieFout, setActieFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson(`${pad}?limit=1`, leesNieuwste).then((uitkomst) => {
      if (mijn !== generatie.current) return
      setStaat(
        uitkomst.ok
          ? { fase: 'ok', laatste: uitkomst.waarde.nieuwste }
          : { fase: 'fout', bericht: uitkomst.fout },
      )
    })
  }, [pad, leesNieuwste])

  useEffect(() => {
    void laad()
    return () => {
      // Verhoog de generatie bij unmount: een antwoord dat daarna binnenkomt
      // hoort bij een kaart die er niet meer is.
      generatie.current++
    }
  }, [laad])

  const opnieuwLaden = useCallback(() => {
    setStaat({ fase: 'laden' })
    void laad()
  }, [laad])

  /**
   * Een waarde kiezen wist een openstaande foutmelding.
   *
   * Anders blijft "je 8 is niet opgeslagen" staan terwijl je inmiddels een 3
   * hebt aangeklikt — en dan zegt de knop "Opnieuw proberen" bij een fout die
   * over een andere waarde ging.
   */
  const kies = useCallback((waarde: number) => {
    setGekozen(waarde)
    setActieFout(null)
  }, [])

  const log = useCallback(async (): Promise<void> => {
    if (staat.fase !== 'ok' || gekozen === null || bezig) return
    setBezig(true)
    setActieFout(null)

    const voor = staat.laatste
    // Optimistisch: de nieuwe waarde staat er meteen. De tijd is hier onze eigen
    // klok; de server stuurt zijn echte tijdstip terug en die wint hieronder.
    setStaat({ fase: 'ok', laatste: { waarde: gekozen, op: new Date().toISOString() } })

    const uitkomst = await haalJson(pad, leesOpgeslagen, {
      method: 'POST',
      body: JSON.stringify(bouwBody(gekozen)),
    })
    setBezig(false)

    if (uitkomst.ok) {
      // Verzoen met wat de server écht opsloeg, niet met ons optimistische gok.
      setStaat({ fase: 'ok', laatste: uitkomst.waarde })
      setGekozen(null)
      // Meld de wijziging op het welzijn-kanaal zodat de welzijnsscore-kaart
      // opnieuw laadt. Zonder dit blijft "x van 6 gemeten" achter terwijl de
      // log server-side wél geschreven is. Ná de geslaagde schrijf, nooit
      // optimistisch — en deze hook leest zelf niet mee, dus geen herlaad-lus.
      meldWijziging('welzijn')
      naSucces?.()
      return
    }

    // Rollback + zichtbare fout. `gekozen` blijft staan, zodat "Opnieuw
    // proberen" precies dit nog eens kan doen.
    setStaat({ fase: 'ok', laatste: voor })
    setActieFout(uitkomst.fout)
  }, [staat, gekozen, bezig, pad, leesOpgeslagen, bouwBody, naSucces])

  return { staat, gekozen, kies, bezig, actieFout, log, opnieuwLaden }
}
