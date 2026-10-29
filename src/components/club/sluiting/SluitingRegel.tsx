'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useVestigingen } from '@/components/club/shell/VestigingenContext'
import { stuur } from '@/components/club/leden/stuur'
import { naamVan } from '@/lib/club/kern/vestigingen'
import { isoWeekdag } from '@/lib/club/rooster/tijd'
import type { Sluiting } from '@/lib/club/sluiting/model'
import { datumLang, soortTekst } from '@/lib/club/sluiting/weergave'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { SLUITING } from '@/lib/aiyourgym/taal/woorden/club/sluiting'
import { SluitingFormulier } from './SluitingFormulier'

// Een regel in het jaaroverzicht: de dag, de reden, voor wie, dicht of open,
// en (als er nog lessen staan die niet door kunnen gaan) een waarschuwing.

interface Props {
  sluiting: Sluiting
  /** Geplande lessen die door deze regel niet door kunnen gaan. */
  geraakt: number
  verleden: boolean
  onKlaar: (tekst: string, ok?: boolean) => void
}

export function SluitingRegel({ sluiting: s, geraakt, verleden, onKlaar }: Props) {
  const vestigingen = useVestigingen()
  const taal = useTaal()
  const t = useTekst(SLUITING).regel
  const lessenTekst = t.lessen
  const [bewerken, setBewerken] = useState(false)
  const [bevestig, setBevestig] = useState<'verwijder' | 'lessen' | null>(null)
  const [bezig, setBezig] = useState(false)

  async function verwijder() {
    setBezig(true)
    const uit = await stuur(`/api/club/sluiting/${s.id}`, 'DELETE')
    setBezig(false)
    setBevestig(null)
    onKlaar(uit.ok ? t.verwijderd(s.reden) : uit.fout, uit.ok)
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
    onKlaar(mis > 0 ? `${t.geannuleerd(lessenTekst(n))} ${t.mislukt(lessenTekst(mis))}` : t.geannuleerd(lessenTekst(n)), mis === 0)
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
        <span className="club-sluiting-weekdag">{t.dagKort[isoWeekdag(s.datum) - 1]}</span>
      </div>
      <div className="club-sluiting-inhoud">
        <p className="club-sluiting-reden">
          <span className="club-sr">{`${datumLang(s.datum, taal)}: `}</span>
          {s.reden}
        </p>
        <p className="club-sluiting-wie">
          {s.vestiging ? naamVan(vestigingen, s.vestiging) : t.alleVestigingen}
          {s.demo && <span className="club-chip club-chip--geen">{t.demo}</span>}
        </p>
        {geraakt > 0 && !verleden && (
          <div className="club-sluiting-waarschuwing">
            <AlertTriangle size={15} aria-hidden />
            <span>{t.waarschuwing(geraakt, lessenTekst(geraakt))}</span>
            {bevestig === 'lessen' ? (
              <>
                <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig} onClick={() => void annuleerLessen()}>
                  {bezig ? t.bezig : t.jaAnnuleren(lessenTekst(geraakt))}
                </button>
                <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBevestig(null)}>
                  {t.nee}
                </button>
              </>
            ) : (
              <button type="button" className="club-knop club-knop--klein" onClick={() => setBevestig('lessen')}>
                {t.lessenAnnuleren}
              </button>
            )}
          </div>
        )}
      </div>
      <div className="club-sluiting-rechts">
        <span className={`club-chip ${s.soort === 'gesloten' ? 'club-chip--let-op' : 'club-chip--info'}`}>{soortTekst(s, taal)}</span>
        <div className="club-sluiting-knoppen">
          {bevestig === 'verwijder' ? (
            <>
              <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig} onClick={() => void verwijder()}>
                {bezig ? t.bezig : t.jaVerwijderen}
              </button>
              <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBevestig(null)}>
                {t.nee}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBewerken(true)} aria-label={t.wijzigenLabel(s.reden)}>
                {t.wijzigen}
              </button>
              <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBevestig('verwijder')} aria-label={t.verwijderenLabel(s.reden)}>
                {t.verwijderen}
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  )
}
