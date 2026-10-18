'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MEDEWERKER_ROLLEN, ROL_LABEL, type MedewerkerRol } from '@/lib/club/kern/medewerker'
import { standaardRechten, type Rechten } from '@/lib/club/kern/org-instellingen'
import { stuur } from '@/components/club/leden/stuur'

// Rechten per rol: per onderdeel aanvinken welke rol het ziet. De eigenaar en
// clubmanagers met beheerrechten zien altijd alles; dit gaat over medewerkers.

interface Onderdeel {
  sleutel: string
  label: string
  uitleg: string
}

export interface RechtenGroep {
  label: string
  onderdelen: Onderdeel[]
}

interface RechtenMatrixProps {
  begin: Rechten
  /** Per groep uit het menu, plus Instellingen; elk onderdeel een keer. */
  groepen: RechtenGroep[]
}

export function RechtenMatrix({ begin, groepen }: RechtenMatrixProps) {
  const router = useRouter()
  const [rechten, setRechten] = useState<Rechten>(begin)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)

  function wissel(rol: MedewerkerRol, sleutel: string) {
    setMelding(null)
    setRechten((r) => ({ ...r, [rol]: r[rol].includes(sleutel) ? r[rol].filter((x) => x !== sleutel) : [...r[rol], sleutel] }))
  }

  async function bewaar(nieuw: Rechten) {
    setBezig(true)
    setMelding(null)
    const uit = await stuur('/api/club/organisatie/instellingen', 'PATCH', { rechten: nieuw })
    setBezig(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    setMelding({ ok: true, tekst: 'Rechten opgeslagen.' })
    router.refresh()
  }

  return (
    <div className="club-beheer-formulier" style={{ maxWidth: 'none' }}>
      <div className="club-beheer-matrix-wrap">
        <table className="club-beheer-matrix">
          <caption className="club-sr">Welke rol welk onderdeel ziet</caption>
          <thead>
            <tr>
              <th scope="col" style={{ textAlign: 'left' }}>Onderdeel</th>
              {MEDEWERKER_ROLLEN.map((rol) => (
                <th key={rol} scope="col">{ROL_LABEL[rol]}</th>
              ))}
            </tr>
          </thead>
          {groepen.map((g) => (
          <tbody key={g.label}>
            <tr className="club-beheer-matrix-groep">
              <th scope="colgroup" colSpan={MEDEWERKER_ROLLEN.length + 1}>{g.label}</th>
            </tr>
            {g.onderdelen.map((o) => (
              <tr key={o.sleutel}>
                <th scope="row">
                  {o.label}
                  <small>{o.uitleg}</small>
                </th>
                {MEDEWERKER_ROLLEN.map((rol) => (
                  <td key={rol}>
                    <input
                      type="checkbox"
                      aria-label={`${ROL_LABEL[rol]} ziet ${o.label}`}
                      checked={rechten[rol].includes(o.sleutel)}
                      onChange={() => wissel(rol, o.sleutel)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          ))}
        </table>
      </div>
      <div className="club-beheer-acties">
        <button type="button" className="club-knop club-knop--primair" disabled={bezig} onClick={() => void bewaar(rechten)}>
          {bezig ? 'Opslaan...' : 'Opslaan'}
        </button>
        <button
          type="button"
          className="club-knop club-knop--stil"
          disabled={bezig}
          onClick={() => {
            const standaard = standaardRechten()
            setRechten(standaard)
            void bewaar(standaard)
          }}
        >
          Terug naar de standaard
        </button>
        <div role="status" aria-live="polite">
          {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
        </div>
      </div>
    </div>
  )
}
