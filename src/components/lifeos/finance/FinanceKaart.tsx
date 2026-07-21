'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Kaart, NogNiets } from '@/components/lifeos/os/Kaart'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { haalJson } from '@/lib/lifeos/api/http'
import { huidigeMaand, leesOverzicht, type FinanceOverzicht } from './finance'
import { KernCijfers } from './KernCijfers'
import { MiniTrend } from './MiniTrend'
import { SnelToevoegen } from './SnelToevoegen'
import { FIN_CSS } from './stijl'

// ─── LifeOS-cockpit — Geld ──────────────────────────────────────────────────
// Het geld-overzicht van deze maand: omzet, kosten, winst en openstaand, met een
// rustige winst-trend en één snel-toevoegen. Container: haalt `/finance/overzicht`
// bij mount op, tekent zelf niets (architecture.md — container/presentational).
//
// Handmatig-eerst en eerlijk: cijfers verschijnen pas als er data is. Geen
// transacties → een eerlijke lege staat met de capture prominent, nooit een
// verzonnen getal. Fout ≠ leeg: een storing toont `Foutmelding`, niet "nog geen
// cijfers".

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; overzicht: FinanceOverzicht }

export function FinanceKaart() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })

  // Generatieteller: een trage oudere vlucht (of één die na unmount terugkomt)
  // mag een verse stand niet overschrijven. Zelfde patroon als de andere kaarten.
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    const pad = `/api/lifeos/finance/overzicht?maand=${huidigeMaand()}`
    return haalJson(pad, leesOverzicht).then((uitkomst) => {
      if (mijn !== generatie.current) return // ingehaald of ontkoppeld
      setStaat(
        uitkomst.ok
          ? { fase: 'ok', overzicht: uitkomst.waarde }
          : { fase: 'fout', bericht: uitkomst.fout },
      )
    })
  }, [])

  /** Verklaart alles wat nu in de lucht is ongeldig — stabiele cleanup-ref. */
  const verval = useCallback(() => {
    generatie.current++
  }, [])

  useEffect(() => {
    void laad()
    return verval
  }, [laad, verval])

  const opnieuw = useCallback(() => {
    setStaat({ fase: 'laden' })
    void laad()
  }, [laad])

  return (
    <Kaart titel="Geld" vervangt="Excel">
      <style href="fin" precedence="medium">
        {FIN_CSS}
      </style>

      {staat.fase === 'laden' ? <FinanceSkelet /> : null}
      {/* Fout ≠ leeg: een storing mag nooit als "nog geen cijfers" renderen. */}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}
      {/* Na een geslaagde POST vernieuwt de capture de cijfers via een stille
          herlaad (geen skelet-flits): `laad` zet alleen ok/fout, niet 'laden'. */}
      {staat.fase === 'ok' ? (
        <FinanceInhoud overzicht={staat.overzicht} onVernieuw={() => void laad()} />
      ) : null}
    </Kaart>
  )
}

interface FinanceInhoudProps {
  overzicht: FinanceOverzicht
  onVernieuw: () => void
}

function FinanceInhoud({ overzicht, onVernieuw }: FinanceInhoudProps) {
  const leeg = overzicht.aantalTransacties === 0

  return (
    <div className="fin">
      {leeg ? (
        <NogNiets
          wat="Nog geen cijfers"
          waarom="Log je eerste omzet of kosten, dan verschijnt je geldoverzicht hier."
        />
      ) : (
        <>
          <KernCijfers overzicht={overzicht} />
          {/* Eerlijk: de trend pas vanaf 2 maanden data — één punt is geen lijn. */}
          {overzicht.trend.length >= 2 ? (
            <MiniTrend trend={overzicht.trend} huidigeMaand={overzicht.maand} />
          ) : null}
        </>
      )}
      <SnelToevoegen onToegevoegd={onVernieuw} prominent={leeg} />
    </div>
  )
}

/** Rustige navy-placeholder: vier tegels + de trend-band. Geen spinner. */
function FinanceSkelet() {
  return (
    <div className="fin__skelet" aria-hidden="true">
      <div className="fin__skelet-rij">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="fin__skelet-blok" />
        ))}
      </div>
      <div className="fin__skelet-balk" />
    </div>
  )
}
