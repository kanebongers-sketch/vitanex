'use client'

import { useState } from 'react'
import Link from 'next/link'
import { stuur } from '@/components/club/leden/stuur'
import { clubPad } from '@/lib/club/kern/vestiging'
import type { Label } from '@/lib/club/lidmaatschappen/model'
import { ledenTekst } from '@/lib/club/lidmaatschappen/tellen'
import { LabelFormulier } from './LabelFormulier'

// Een label: de tag in zijn kleur, omschrijving, het aantal leden. Verwijderen
// vraagt eerst of de tag ook bij de leden weg moet.

export type LabelMetAantal = Label & { leden: number }

interface Props {
  label: LabelMetAantal
  vestiging: string | null
  onKlaar: (tekst: string, ok?: boolean) => void
}

export function LabelRegel({ label: l, vestiging, onKlaar }: Props) {
  const [bewerken, setBewerken] = useState(false)
  const [bevestig, setBevestig] = useState(false)
  const [bezig, setBezig] = useState(false)

  async function verwijder(tagsOok: boolean) {
    setBezig(true)
    const uit = await stuur(`/api/club/lidmaatschappen/labels/${l.id}`, 'DELETE', { tagsOok })
    setBezig(false)
    setBevestig(false)
    if (!uit.ok) return onKlaar(uit.fout, false)
    const n = (uit.data as { geraakt?: number } | null)?.geraakt ?? 0
    onKlaar(tagsOok ? `Label ${l.naam} is verwijderd, ook bij ${ledenTekst(n)}.` : `Label ${l.naam} is verwijderd. De tag blijft bij de leden staan.`)
  }

  if (bewerken) {
    return (
      <li className="club-lidm-regel is-bewerken" data-kleur={l.kleur}>
        <LabelFormulier
          begin={l}
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
    <li className="club-lidm-regel club-lidm-regel--label" data-kleur={l.kleur}>
      <div className="club-lidm-inhoud">
        <h3 className="club-lidm-naam">
          <span className="club-lidm-tag">{l.naam}</span>
          {l.demo && <span className="club-chip club-chip--geen">demo</span>}
        </h3>
        {l.omschrijving && <p className="club-lidm-omschrijving">{l.omschrijving}</p>}
      </div>
      <div className="club-lidm-rechts">
        <p className="club-lidm-aantal">
          <strong>{l.leden}</strong>
          <span>{l.leden === 1 ? 'lid' : 'leden'}</span>
        </p>
        {vestiging && l.leden > 0 && (
          <Link className="club-lidm-link" href={clubPad('/leden', vestiging, { tag: l.naam })}>
            Naar de ledenlijst<span className="club-sr"> met label {l.naam}</span>
          </Link>
        )}
        {bevestig ? (
          <div className="club-lidm-bevestig" role="group" aria-label={`Label ${l.naam} verwijderen`}>
            <p>{l.leden > 0 ? `${ledenTekst(l.leden)} ${l.leden === 1 ? 'heeft' : 'hebben'} deze tag. Moet hij daar ook af?` : 'Weet je het zeker?'}</p>
            <div className="club-lidm-knoppen">
              {l.leden > 0 && (
                <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig} onClick={() => void verwijder(true)}>
                  Ook bij de leden weg
                </button>
              )}
              <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig} onClick={() => void verwijder(false)}>
                {l.leden > 0 ? 'Alleen het label' : 'Ja, verwijderen'}
              </button>
              <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBevestig(false)}>
                Annuleren
              </button>
            </div>
          </div>
        ) : (
          <div className="club-lidm-knoppen">
            <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBewerken(true)} aria-label={`Label ${l.naam} wijzigen`}>
              Wijzigen
            </button>
            <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBevestig(true)} aria-label={`Label ${l.naam} verwijderen`}>
              Verwijderen
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
