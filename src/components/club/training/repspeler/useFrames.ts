'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { frameSrc, type RepMaat, type RepRender } from './render-bron'

// Laadt alle losse frames van een render op een maat en wacht tot ze gedecodeerd
// zijn: pas dan start de speler, zodat het beeld nooit hapert of zichtbaar laadt.
// Eenmaal geladen blijven de beelden in het geheugen (per adres), dus een
// oefening opnieuw openen of de volgende set is direct.

export interface FrameStaat {
  /** Alle frames gedecodeerd en klaar om te tekenen. */
  klaar: boolean
  /** 0 tot 1. */
  deel: number
  /** De beelden op index, of leeg zolang niet alles klaar is. */
  beelden: readonly HTMLImageElement[]
  fout: boolean
}

const GELADEN = new Map<string, Promise<HTMLImageElement>>()
/** Complete reeksen die al klaar zijn: meteen tekenen, geen enkele render met de poster. */
const REEKSEN = new Map<string, readonly HTMLImageElement[]>()

function laad(src: string): Promise<HTMLImageElement> {
  const bekend = GELADEN.get(src)
  if (bekend) return bekend
  const belofte = new Promise<HTMLImageElement>((klaar, mis) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      img.decode().then(() => klaar(img), () => klaar(img))
    }
    img.onerror = () => {
      GELADEN.delete(src)
      mis(new Error(`frame load failed: ${src}`))
    }
    img.src = src
  })
  GELADEN.set(src, belofte)
  return belofte
}

const LEEG: FrameStaat = { klaar: false, deel: 0, beelden: [], fout: false }

/** Laadt de frames; met `actief` false (minder beweging) laadt hij niets. */
export function useFrames(render: RepRender, maat: RepMaat | null, actief: boolean): FrameStaat {
  const [staat, setStaat] = useState<{ sleutel: string; staat: FrameStaat }>({ sleutel: '', staat: LEEG })
  const sleutel = maat && actief ? `${render.slug}|${render.versie}|${maat.breedte}` : ''

  useEffect(() => {
    if (!maat || !actief || REEKSEN.has(sleutel)) return
    let weg = false
    let geteld = 0
    const adressen = Array.from({ length: render.frames }, (_, i) => frameSrc(render, maat, i))
    const beloftes = adressen.map((src) =>
      laad(src).then((img) => {
        geteld += 1
        // Voortgang hooguit elke 8 frames doorgeven: genoeg voor een balk, geen render per beeld.
        if (!weg && (geteld % 8 === 0 || geteld === adressen.length)) {
          setStaat({ sleutel, staat: { ...LEEG, deel: geteld / adressen.length } })
        }
        return img
      }),
    )
    Promise.all(beloftes).then(
      (beelden) => {
        REEKSEN.set(sleutel, beelden)
        if (!weg) setStaat({ sleutel, staat: { klaar: true, deel: 1, beelden, fout: false } })
      },
      () => !weg && setStaat({ sleutel, staat: { ...LEEG, fout: true } }),
    )
    return () => {
      weg = true
    }
  }, [render, maat, actief, sleutel])

  const bekend = sleutel ? REEKSEN.get(sleutel) : undefined
  if (bekend) return { klaar: true, deel: 1, beelden: bekend, fout: false }
  return staat.sleutel === sleutel ? staat.staat : LEEG
}

function abonneerBeweging(melding: () => void): () => void {
  const m = window.matchMedia('(prefers-reduced-motion: reduce)')
  m.addEventListener('change', melding)
  return () => m.removeEventListener('change', melding)
}

/** prefers-reduced-motion: reduce. Op de server false. */
export function useMinderBeweging(): boolean {
  return useSyncExternalStore(
    abonneerBeweging,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  )
}
