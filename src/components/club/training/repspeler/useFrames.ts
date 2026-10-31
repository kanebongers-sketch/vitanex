'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { frameSrc, type RepMaat, type RepRender } from './render-bron'
import { VOORRAAD, haalBestanden, pakUit, wachtOpPoster, type Frame, type Uitgepakt } from './frame-laden'

// Laadt de frames van een render op een maat en wacht tot ze allemaal
// uitgepakt zijn: pas dan start de speler, zodat het beeld nooit hapert of
// zichtbaar laadt. Tot die tijd staat het stilstaande beginbeeld (poster) er;
// de frames laden pas als dat beeld er is.
// Geheugen (zie geheugen.ts): uitgepakte frames leven alleen zolang een speler
// ze gebruikt, de ingepakte bestanden blijven voor de laatste 2 oefeningen.
// De volgende set van dezelfde oefening is dus direct; terug naar een eerdere
// oefening pakt alleen opnieuw uit (geen nieuwe download).

export interface FrameStaat {
  /** Alle frames uitgepakt en klaar om te tekenen. */
  klaar: boolean
  /** 0 tot 1. */
  deel: number
  /** De beelden op index, of leeg zolang niet alles klaar is. */
  beelden: readonly Frame[]
  fout: boolean
}

/** Even wachten met vrijgeven: zo kost een speler die meteen terugkomt (zelfde oefening) geen nieuw werk. */
const VRIJGEVEN_NA_MS = 2000

/** Een lopende laadklus per sleutel, gedeeld door spelers die hetzelfde laden. */
interface Klus {
  belofte: Promise<Uitgepakt | null>
  luisteraars: Set<(deel: number) => void>
}
const BEZIG = new Map<string, Klus>()

async function laadReeks(sleutel: string, render: RepRender, maat: RepMaat, meld: (deel: number) => void): Promise<Uitgepakt | null> {
  const n = render.frames
  // Twee stappen per frame (ophalen en uitpakken); bewaarde bestanden tellen meteen mee.
  let stappen = 0
  const stap = () => {
    stappen += 1
    if (stappen % 8 === 0 || stappen === 2 * n) meld(stappen / (2 * n))
  }
  let bestanden = VOORRAAD.ruw(sleutel)
  if (!bestanden) {
    await wachtOpPoster(render.poster)
    const adressen = Array.from({ length: n }, (_, i) => frameSrc(render, maat, i))
    bestanden = await haalBestanden(adressen, stap)
    if (!VOORRAAD.zetRuw(sleutel, bestanden)) return null
  } else {
    stappen = n
  }
  // Niemand kijkt meer: niet uitpakken, de bestanden blijven bewaard.
  if (!VOORRAAD.inGebruik(sleutel)) return null
  const uitgepakt = await pakUit(bestanden, stap)
  return VOORRAAD.zetKlaar(sleutel, uitgepakt) ? uitgepakt : null
}

function startKlus(sleutel: string, render: RepRender, maat: RepMaat): Klus {
  const bekend = BEZIG.get(sleutel)
  if (bekend) return bekend
  const luisteraars = new Set<(deel: number) => void>()
  const belofte = laadReeks(sleutel, render, maat, (d) => luisteraars.forEach((l) => l(d))).finally(() => BEZIG.delete(sleutel))
  const klus = { belofte, luisteraars }
  BEZIG.set(sleutel, klus)
  return klus
}

const LEEG: FrameStaat = { klaar: false, deel: 0, beelden: [], fout: false }

/** Laadt de frames; met `actief` false (minder beweging) laadt hij niets. */
export function useFrames(render: RepRender, maat: RepMaat | null, actief: boolean): FrameStaat {
  const [staat, setStaat] = useState<{ sleutel: string; staat: FrameStaat }>({ sleutel: '', staat: LEEG })
  const sleutel = maat && actief ? `${render.slug}|${render.versie}|${maat.breedte}` : ''

  useEffect(() => {
    if (!maat || !sleutel) return
    let weg = false
    VOORRAAD.pak(sleutel)
    const toon = (u: Uitgepakt) => setStaat({ sleutel, staat: { klaar: true, deel: 1, beelden: u.beelden, fout: false } })
    // Al uitgepakt: de render leest hem rechtstreeks uit de voorraad (zie onder).
    if (!VOORRAAD.klaar(sleutel)) {
      const luister = (deel: number) => !weg && setStaat({ sleutel, staat: { ...LEEG, deel } })
      const volg = (klus: Klus, opnieuw: boolean) => {
        klus.luisteraars.add(luister)
        klus.belofte.then(
          (u) => {
            klus.luisteraars.delete(luister)
            // Deelde een andere speler de klus, dan staat het resultaat in de voorraad.
            const klaar = u ?? VOORRAAD.klaar(sleutel)
            if (weg) return
            if (klaar) toon(klaar)
            // De klus van een speler die al weg was stopte voor het uitpakken: nu zelf afmaken.
            else if (opnieuw) volg(startKlus(sleutel, render, maat), false)
          },
          () => {
            klus.luisteraars.delete(luister)
            if (!weg) setStaat({ sleutel, staat: { ...LEEG, fout: true } })
          },
        )
      }
      volg(startKlus(sleutel, render, maat), true)
    }
    return () => {
      weg = true
      setTimeout(() => VOORRAAD.laatGaan(sleutel), VRIJGEVEN_NA_MS)
    }
  }, [render, maat, sleutel])

  if (!sleutel || staat.sleutel !== sleutel) {
    // Al uitgepakt (een andere speler of net terug): meteen tekenen, geen enkele render met de poster.
    const bekend = sleutel ? VOORRAAD.klaar(sleutel) : null
    return bekend ? { klaar: true, deel: 1, beelden: bekend.beelden, fout: false } : LEEG
  }
  return staat.staat
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
