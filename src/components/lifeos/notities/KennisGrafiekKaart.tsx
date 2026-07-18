'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Kaart } from '@/components/lifeos/os/Kaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { haalJson } from '@/lib/lifeos/api/http'
import { luisterOpWijziging } from '@/lib/lifeos/events'
import { leesGrafiekAntwoord, type Grafiek } from '@/lib/lifeos/notities/grafiek'
import { KennisGrafiek } from './KennisGrafiek'

// Container om `KennisGrafiek`: haalt de data op, tekent niets zelf.
// (architecture.md — container/presentational gescheiden.)

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; grafiek: Grafiek }

export function KennisGrafiekKaart() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })

  // Generatieteller: zonder deze kan een trage oudere vlucht een verse inhalen,
  // en zet een vlucht die bij unmount nog loopt alsnog state. Zie useBrainDump.
  const generatie = useRef(0)

  const laad = useCallback(() => {
    const mijn = ++generatie.current
    void haalJson('/api/lifeos/notities/grafiek', leesGrafiekAntwoord).then((uitkomst) => {
      if (mijn !== generatie.current) return // ingehaald of ontkoppeld
      setStaat(
        uitkomst.ok
          ? { fase: 'ok', grafiek: uitkomst.waarde }
          : { fase: 'fout', bericht: uitkomst.fout },
      )
    })
  }, [])

  /** Verklaart alles wat nu in de lucht is ongeldig — zelfde patroon als useBrainDump. */
  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    laad()
    return verval
  }, [laad, verval])

  // Herlaad zodra een notitie of [[link]] elders verandert (aanmaken, bewerken,
  // verwijderen). Zonder dit bleef de grafiek staan tot een volledige pagina-
  // herlaad — zie events.ts. `laad` is stabiel en dekt met zijn generatieteller
  // af dat een verse lading een trage oudere inhaalt; `laad` meldt zelf niets,
  // dus dit lust niet. `luisterOpWijziging` geeft de opzeg-functie terug, die
  // hier de effect-cleanup is.
  useEffect(() => luisterOpWijziging('notities', laad), [laad])

  const opnieuw = useCallback(() => {
    setStaat({ fase: 'laden' })
    laad()
  }, [laad])

  return (
    <Kaart titel="Kennis" vervangt="Obsidian">
      {staat.fase === 'laden' ? <Skelet /> : null}

      {/* Fout ≠ leeg: een storing mag nooit als "je hebt nog geen verbanden"
          renderen. Daarom `Foutmelding` en niet de lege staat van de grafiek. */}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}

      {staat.fase === 'ok' ? <KennisGrafiek grafiek={staat.grafiek} /> : null}
    </Kaart>
  )
}

function Skelet() {
  return (
    <div
      aria-hidden="true"
      style={{
        aspectRatio: '1 / 1',
        borderRadius: '50%',
        // Een rustige cirkel op de plek waar de cirkel komt — geen spinner, en
        // geen layout-shift zodra de echte grafiek er is (performance.md, CLS).
        border: '1px solid var(--line)',
        opacity: 0.5,
      }}
    />
  )
}
