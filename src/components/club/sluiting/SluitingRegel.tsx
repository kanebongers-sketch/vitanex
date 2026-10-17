'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useVestigingen } from '@/components/club/shell/VestigingenContext'
import { stuur } from '@/components/club/leden/stuur'
import { naamVan } from '@/lib/club/kern/vestigingen'
import { isoWeekdag } from '@/lib/club/rooster/tijd'
import type { Sluiting } from '@/lib/club/sluiting/model'
import { datumLang, lessenTekst, soortTekst } from '@/lib/club/sluiting/weergave'
import { SluitingFormulier } from './SluitingFormulier'

// Een regel in het jaaroverzicht: de dag, de reden, voor wie, dicht of open,
// en (als er nog lessen staan die niet door kunnen gaan) een waarschuwing.

const DAG_KORT = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'] as const

interface Props {
  sluiting: Sluiting
  /** Geplande lessen die door deze regel niet door kunnen gaan. */
  geraakt: number
  verleden: boolean
  onKlaar: (tekst: string, ok?: boolean) => void
}

export function SluitingRegel({ sluiting: s, geraakt, verleden, onKlaar }: Props) {
  const vestigingen = useVestigingen()
  const [bewerken, setBewerken] = useState(false)
  const [bevestig, setBevestig] = useState<'verwijder' | 'lessen' | null>(null)
  const [bezig, setBezig] = useState(false)

  async function verwijder() {
    setBezig(true)
    const uit = await stuur(`/api/club/sluiting/${s.id}`, 'DELETE')
    setBezig(false)
    setBevestig(null)
    onKlaar(uit.ok ? `${s.reden} is verwijderd.` : uit.fout, uit.ok)
  }

  async function annuleerLessen() {
    setBezig(true)
    const uit = await stuur(`/api/club/sluiting/${s.id}/lessen`, 'POST')
    setBezig(false)
    setBevestig(null)
    if (!uit.ok) return onKlaar(uit.fout, false)
    const d = uit.data as { geannuleerd?: number; mislukt?: number } | null
    const n = d?.geannuleerd ?? 0
    const mis = d?.mislukt ?? 0
    onKlaar(`${lessenTekst(n)} geannuleerd; de reserveringen zijn vervallen.${mis > 0 ? ` ${lessenTekst(mis)} lukte niet, probeer het opnieuw.` : ''}`, mis === 0)
  }

  if (bewerken) {
    return (
      <li className="club-sluiting-regel is-bewerken">
        <SluitingFormulier
          begin={s}
          standaardDatum={s.datum}
          onAnnuleer={() => setBewerken(false)}
          onKlaar={(tekst) => {
            setBewerken(false)
            onKlaar(tekst)
          }}
        />
      </li>
    )
  }

  return (
    <li className={`club-sluiting-regel${verleden ? ' is-verleden' : ''}`}>
      <div className="club-sluiting-dag" aria-hidden>
        <span className="club-sluiting-dagnr">{Number(s.datum.slice(8, 10))}</span>
        <span className="club-sluiting-weekdag">{DAG_KORT[isoWeekdag(s.datum) - 1]}</span>
      </div>
      <div className="club-sluiting-inhoud">
        <p className="club-sluiting-reden">
          <span className="club-sr">{datumLang(s.datum)}: </span>
          {s.reden}
        </p>
        <p className="club-sluiting-wie">
          {s.vestiging ? naamVan(vestigingen, s.vestiging) : 'Alle vestigingen'}
          {s.demo && <span className="club-chip club-chip--geen">demo</span>}
        </p>
        {geraakt > 0 && !verleden && (
          <div className="club-sluiting-waarschuwing">
            <AlertTriangle size={15} aria-hidden />
            <span>Er {geraakt === 1 ? 'staat' : 'staan'} nog {lessenTekst(geraakt)} gepland die dan niet door {geraakt === 1 ? 'kan' : 'kunnen'} gaan.</span>
            {bevestig === 'lessen' ? (
              <>
                <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig} onClick={() => void annuleerLessen()}>
                  {bezig ? 'Bezig...' : `Ja, ${lessenTekst(geraakt)} annuleren`}
                </button>
                <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBevestig(null)}>
                  Nee
                </button>
              </>
            ) : (
              <button type="button" className="club-knop club-knop--klein" onClick={() => setBevestig('lessen')}>
                Lessen annuleren
              </button>
            )}
          </div>
        )}
      </div>
      <div className="club-sluiting-rechts">
        <span className={`club-chip ${s.soort === 'gesloten' ? 'club-chip--let-op' : 'club-chip--info'}`}>{soortTekst(s)}</span>
        <div className="club-sluiting-knoppen">
          {bevestig === 'verwijder' ? (
            <>
              <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig} onClick={() => void verwijder()}>
                {bezig ? 'Bezig...' : 'Ja, verwijderen'}
              </button>
              <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBevestig(null)}>
                Nee
              </button>
            </>
          ) : (
            <>
              <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBewerken(true)} aria-label={`${s.reden} wijzigen`}>
                Wijzigen
              </button>
              <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBevestig('verwijder')} aria-label={`${s.reden} verwijderen`}>
                Verwijderen
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  )
}
