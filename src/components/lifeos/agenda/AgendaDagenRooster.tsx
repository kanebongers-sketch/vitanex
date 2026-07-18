'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { haalJson } from '@/lib/lifeos/api/http'
import { leesAgendaDagen, type AgendaDagen } from '@/lib/lifeos/agenda/agenda'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { DagenRoosterGrid } from './DagenRoosterGrid'
import { SECTIE_LABEL } from './RoosterBlok'

// Klein client-eiland dat zijn eigen dagen ophaalt (`/agenda/dagen`), zodat de
// AgendaKaart niet nóg een fetch hoeft te dragen. Zelfde generatie-/verval-patroon
// als de andere kaarten: een vlucht die bij unmount nog loopt, zet straks niets meer.
//
// `herlaadSleutel` is een teller die de AgendaKaart ophoogt na een externe
// wijziging (agenda aan/uit, afspraak toevoegen, focusblok plannen). Verandert die,
// dan herladen we met `no-store` — /dagen cachet 60s en zou de verse cache anders
// kunnen missen (zelfde reden als bij /vandaag).

interface AgendaDagenRoosterProps {
  /** Verhoog om een herlaad te forceren na een externe wijziging. */
  herlaadSleutel?: number
}

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; data: AgendaDagen }

const KEUZES = [1, 3] as const
const STANDAARD_AANTAL = 3

export function AgendaDagenRooster({ herlaadSleutel = 0 }: AgendaDagenRoosterProps) {
  const [aantal, setAantal] = useState<number>(STANDAARD_AANTAL)
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })

  // Generatieteller: `aantal`-wissel en `herlaadSleutel` kunnen elkaar inhalen;
  // zonder deze teller wint de oudste die toevallig als laatste terugkomt.
  const generatie = useRef(0)

  // `laad` is stabiel: het leest `aantalNu` uit het argument, niet uit een closure,
  // zodat één effect met nette deps volstaat en er geen dubbele vlucht ontstaat.
  const laad = useCallback((aantalNu: number, init?: RequestInit): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson(`/api/lifeos/agenda/dagen?aantal=${aantalNu}`, leesAgendaDagen, init).then(
      (uitkomst) => {
        if (mijn !== generatie.current) return // ingehaald of ontkoppeld
        setStaat(
          uitkomst.ok
            ? { fase: 'ok', data: uitkomst.waarde }
            : { fase: 'fout', bericht: uitkomst.fout },
        )
      },
    )
  }, [])

  const verval = useCallback(() => {
    generatie.current++
  }, [])

  // Eerste load gebruikt de gewone cache; élke herlaad daarna (ander aantal, of een
  // opgehoogde herlaadSleutel) bust de 60s met `no-store`.
  const eerste = useRef(true)
  useEffect(() => {
    const init = eerste.current ? undefined : ({ cache: 'no-store' } as RequestInit)
    eerste.current = false
    void laad(aantal, init)
    return verval
  }, [aantal, herlaadSleutel, laad, verval])

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <p style={{ ...SECTIE_LABEL, margin: 0 }}>Vooruitblik</p>
        <DagenSchakelaar aantal={aantal} onKies={setAantal} />
      </div>

      {staat.fase === 'laden' ? <RoosterSkelet /> : null}

      {staat.fase === 'fout' ? (
        <Foutmelding
          bericht={staat.bericht}
          opnieuw={() => {
            setStaat({ fase: 'laden' })
            void laad(aantal, { cache: 'no-store' })
          }}
        />
      ) : null}

      {/* Niet gekoppeld: de AgendaKaart toont de koppel-CTA al; hier niets tonen. */}
      {staat.fase === 'ok' && staat.data.gekoppeld ? (
        <DagenRoosterGrid dagen={staat.data.dagen} />
      ) : null}
    </div>
  )
}

/** Rustig segment-schakelaartje: 1 dag / 3 dagen. Cyaan markeert de keuze. */
function DagenSchakelaar({ aantal, onKies }: { aantal: number; onKies: (n: number) => void }) {
  return (
    <div
      role="group"
      aria-label="Aantal dagen"
      style={{
        display: 'inline-flex',
        gap: 2,
        padding: 2,
        borderRadius: 999,
        border: '1px solid var(--line)',
        background: 'var(--bg-raised)',
      }}
    >
      {KEUZES.map((n) => {
        const actief = aantal === n
        return (
          <button
            key={n}
            type="button"
            aria-pressed={actief}
            onClick={() => onKies(n)}
            style={{
              appearance: 'none',
              cursor: 'pointer',
              border: 'none',
              borderRadius: 999,
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.01em',
              color: actief ? 'var(--bg-app)' : 'var(--text-3)',
              background: actief ? 'var(--brand)' : 'transparent',
              transition: 'color 150ms, background 150ms',
            }}
          >
            {n === 1 ? '1 dag' : `${n} dagen`}
          </button>
        )
      })}
    </div>
  )
}

/** Rustige placeholder in navy. Geen spinner-spektakel. */
function RoosterSkelet() {
  return (
    <div
      aria-hidden="true"
      style={{
        height: 220,
        borderRadius: 'var(--radius-sm, 10px)',
        border: '1px solid var(--line)',
        background: 'var(--bg-raised)',
      }}
    />
  )
}
