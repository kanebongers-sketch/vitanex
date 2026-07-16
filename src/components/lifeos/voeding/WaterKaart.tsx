'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CupSoda, Milk } from 'lucide-react'
import { Kaart, NogNiets } from '@/components/lifeos/os/Kaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { Knop } from '@/components/lifeos/os/Knop'
import { haalJson } from '@/lib/lifeos/api/http'
import { datumSleutel } from '@/lib/lifeos/datum/datum'
import {
  FLES_ML,
  GLAS_ML,
  leesWaterAntwoord,
  leesWaterLogAntwoord,
  type WaterLog,
} from '@/lib/lifeos/voeding/voeding'
import { waterTotaalMl, waterVoortgang } from '@/lib/lifeos/voeding/totalen'
import { waterTekst } from '@/lib/lifeos/voeding/formatteer'
import { WaterVoortgang } from './WaterVoortgang'

// Container voor water. Vervangt de water-tracker.
//
// Het hele punt is TWEE TIKKEN: vaste knoppen, geen formulier. Wie eerst een
// getal moet typen, logt zijn derde glas niet meer — en dan meet je niet je
// water maar je motivatie.
//
// Loggen is optimistisch: het glas telt meteen mee. Mislukt het, dan draaien we
// terug ÉN zeggen we het. Stil terugdraaien is erger dan geen optimistische
// update: dan zie je je glas spontaan verdwijnen zonder reden.

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; logs: WaterLog[]; doelMl: number | null }

export function WaterKaart() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const [actieFout, setActieFout] = useState<string | null>(null)

  // De dag in een ref, niet in state: hij stuurt geen render aan, hij bepaalt
  // alleen wát we ophalen. En hij wordt pas ná mount bepaald — `new Date()`
  // tijdens render geeft op de server de servertijd en in de browser de jouwe.
  const dagRef = useRef<string | null>(null)

  // Generatieteller: zonder deze kunnen twee vluchten elkaar inhalen en wint de
  // oudste die toevallig als laatste terugkomt. De cleanup hoogt 'm op, zodat
  // een vlucht die bij unmount nog loopt niets meer zet. Zie Top3Kaart.
  const generatie = useRef(0)
  /** Teller voor tijdelijke id's van optimistische logs. */
  const tijdelijk = useRef(0)

  const laad = useCallback((voorDag: string): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson(
      `/api/lifeos/voeding/water?datum=${encodeURIComponent(voorDag)}`,
      leesWaterAntwoord,
    ).then((uitkomst) => {
      if (mijn !== generatie.current) return
      setStaat(
        uitkomst.ok
          ? { fase: 'ok', logs: uitkomst.waarde.logs, doelMl: uitkomst.waarde.doelMl }
          : { fase: 'fout', bericht: uitkomst.fout },
      )
    })
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

  const drink = useCallback(
    async (ml: number) => {
      const dag = dagRef.current
      if (staat.fase !== 'ok' || !dag) return

      // Een eigen id per tik, geen snapshot van de hele lijst. Wie twee keer
      // snel tikt, mag niet zijn eerste glas verliezen doordat de tweede
      // terugdraait naar een lijst van vóór de eerste.
      const tijdelijkId = `tijdelijk-${++tijdelijk.current}`
      const optimistisch: WaterLog = {
        id: tijdelijkId,
        datum: dag,
        ml,
        aangemaaktOp: new Date().toISOString(),
      }

      setActieFout(null)
      setStaat((h) => (h.fase === 'ok' ? { ...h, logs: [...h.logs, optimistisch] } : h))

      const uitkomst = await haalJson('/api/lifeos/voeding/water', leesWaterLogAntwoord, {
        method: 'POST',
        body: JSON.stringify({ datum: dag, ml }),
      })

      if (!uitkomst.ok) {
        // Terugdraaien én zeggen. Nooit stil.
        setStaat((h) =>
          h.fase === 'ok' ? { ...h, logs: h.logs.filter((l) => l.id !== tijdelijkId) } : h,
        )
        setActieFout(`${uitkomst.fout} Dit glas is niet opgeslagen.`)
        return
      }

      // De server is de waarheid: het echte id en moment komen daarvandaan.
      const bevestigd = uitkomst.waarde
      setStaat((h) =>
        h.fase === 'ok'
          ? { ...h, logs: h.logs.map((l) => (l.id === tijdelijkId ? bevestigd : l)) }
          : h,
      )
    },
    [staat],
  )

  return (
    <Kaart titel="Water" vervangt="water-tracker">
      {staat.fase === 'laden' ? <Skelet /> : null}

      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}

      {staat.fase === 'ok' ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <Vandaag logs={staat.logs} doelMl={staat.doelMl} />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Knop variant="primair" onClick={() => void drink(GLAS_ML)}>
              <CupSoda size={14} strokeWidth={2.2} aria-hidden="true" />
              Glas · {GLAS_ML} ml
            </Knop>
            <Knop onClick={() => void drink(FLES_ML)}>
              <Milk size={14} strokeWidth={2.2} aria-hidden="true" />
              Fles · {FLES_ML} ml
            </Knop>
          </div>

          {actieFout ? <Foutmelding bericht={actieFout} /> : null}
        </div>
      ) : null}
    </Kaart>
  )
}

/**
 * Het totaal van vandaag.
 *
 * Drie staten, en het verschil ertussen is de hele eerlijkheidsvraag van deze
 * kaart:
 *
 *   niets gelogd  → geen 0 ml, maar "nog niets gelogd". 0 zou beweren dat je
 *                   niets dronk; je logde alleen niets.
 *   geen doel     → alleen het totaal. GEEN verzonnen 2 liter als norm — dat
 *                   zou een claim zijn over Kane's lichaam die niemand hier
 *                   gemeten heeft.
 *   mét doel      → totaal + voortgang, want dán is er iets om tegen af te
 *                   zetten: iets dat hij zelf koos.
 */
function Vandaag({ logs, doelMl }: { logs: readonly WaterLog[]; doelMl: number | null }) {
  const totaalMl = waterTotaalMl(logs)
  const tekst = waterTekst(totaalMl)

  if (totaalMl === null || tekst === null) {
    return (
      <NogNiets
        wat="Nog niets gelogd vandaag"
        waarom="Eén tik op een glas of fles hieronder, dan hoef je je water-app niet meer te openen."
      />
    )
  }

  const voortgang = waterVoortgang(totaalMl, doelMl)

  return (
    <div>
      <p
        className="os-cijfer"
        style={{ fontSize: 38, fontWeight: 500, color: 'var(--brand)', margin: '0 0 4px', lineHeight: 1 }}
      >
        {tekst}
      </p>
      {voortgang === null ? (
        // Zonder doel: alleen het feit. Geen percentage, geen balk, geen oordeel.
        <p style={{ fontSize: 12, color: 'var(--text-4)', margin: 0, lineHeight: 1.5 }}>
          vandaag · {logs.length}× gelogd
        </p>
      ) : (
        <WaterVoortgang voortgang={voortgang} />
      )}
    </div>
  )
}

function Skelet() {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gap: 12 }}>
      <div style={{ height: 34, width: '42%', borderRadius: 6, background: 'var(--bg-raised)' }} />
      <div style={{ height: 12, width: '58%', borderRadius: 4, background: 'var(--bg-raised)' }} />
    </div>
  )
}
