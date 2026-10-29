'use client'

import { useState } from 'react'
import Link from 'next/link'
import { stuur } from '@/components/club/leden/stuur'
import { clubPad } from '@/lib/club/kern/vestiging'
import type { Label } from '@/lib/club/lidmaatschappen/model'
import { ledenTekst } from '@/lib/club/lidmaatschappen/tellen'
import { LabelFormulier } from './LabelFormulier'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { LIDMAATSCHAPPEN } from '@/lib/aiyourgym/taal/woorden/club/lidmaatschappen'

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
  const taal = useTaal()
  const tekst = useTekst(LIDMAATSCHAPPEN)
  const t = tekst.label

  async function verwijder(tagsOok: boolean) {
    setBezig(true)
    const uit = await stuur(`/api/club/lidmaatschappen/labels/${l.id}`, 'DELETE', { tagsOok })
    setBezig(false)
    setBevestig(false)
    if (!uit.ok) return onKlaar(uit.fout, false)
    const n = (uit.data as { geraakt?: number } | null)?.geraakt ?? 0
    onKlaar(tagsOok ? t.verwijderdOok(l.naam, ledenTekst(n, taal)) : t.verwijderd(l.naam))
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
          {l.demo && <span className="club-chip club-chip--geen">{tekst.algemeen.demo}</span>}
        </h3>
        {l.omschrijving && <p className="club-lidm-omschrijving">{l.omschrijving}</p>}
      </div>
      <div className="club-lidm-rechts">
        <p className="club-lidm-aantal">
          <strong>{l.leden}</strong>
          <span>{tekst.algemeen.lid(l.leden)}</span>
        </p>
        {vestiging && l.leden > 0 && (
          <Link className="club-lidm-link" href={clubPad('/leden', vestiging, { tag: l.naam })}>
            {tekst.algemeen.naarLijst}<span className="club-sr"> {t.lijstMet(l.naam)}</span>
          </Link>
        )}
        {bevestig ? (
          <div className="club-lidm-bevestig" role="group" aria-label={t.verwijderenLabel(l.naam)}>
            <p>{l.leden > 0 ? t.hebbenTag(ledenTekst(l.leden, taal), l.leden === 1) : t.zeker}</p>
            <div className="club-lidm-knoppen">
              {l.leden > 0 && (
                <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig} onClick={() => void verwijder(true)}>
                  {t.ookLeden}
                </button>
              )}
              <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig} onClick={() => void verwijder(false)}>
                {l.leden > 0 ? t.alleenLabel : tekst.algemeen.jaVerwijderen}
              </button>
              <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBevestig(false)}>
                {tekst.algemeen.annuleren}
              </button>
            </div>
          </div>
        ) : (
          <div className="club-lidm-knoppen">
            <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBewerken(true)} aria-label={t.wijzigenLabel(l.naam)}>
              {tekst.algemeen.wijzigen}
            </button>
            <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBevestig(true)} aria-label={t.verwijderenLabel(l.naam)}>
              {tekst.algemeen.verwijderen}
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
