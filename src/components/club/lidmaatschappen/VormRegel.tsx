'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useVestigingen } from '@/components/club/shell/VestigingenContext'
import { stuur } from '@/components/club/leden/stuur'
import { clubPad } from '@/lib/club/kern/vestiging'
import { naamVan } from '@/lib/club/kern/vestigingen'
import type { Lidmaatschapsvorm } from '@/lib/club/lidmaatschappen/model'
import { regelsTekst } from '@/lib/club/lidmaatschappen/regels'
import { ledenTekst } from '@/lib/club/lidmaatschappen/tellen'
import type { PlanWeergave } from '@/lib/club/betalen/plannen/weergave'
import { PrijsEnContract } from '@/components/club/betalen/plannen/PrijsEnContract'
import { VormFormulier } from './VormFormulier'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { LIDMAATSCHAPPEN } from '@/lib/aiyourgym/taal/woorden/club/lidmaatschappen'

// Een vorm in de lijst: kleurstreep, naam, omschrijving, de regels in het kort
// en rechts groot hoeveel leden hem hebben (met een link naar de ledenlijst).

/** leden = aantal leden met dit abonnement; ledenNaam = hoe het abonnement in de ledenlijst staat (voor het filter). */
export type VormMetAantal = Lidmaatschapsvorm & { leden: number; ledenNaam: string }

interface Props {
  vorm: VormMetAantal
  /** Vestiging voor de link naar de ledenlijst; null = geen link. */
  vestiging: string | null
  onKlaar: (tekst: string, ok?: boolean) => void
  /** Prijs en contract (lidgeld aan): de plannen van deze vorm en vandaag; null = niet tonen. */
  lidgeld?: { plannen: readonly PlanWeergave[]; vandaag: string } | null
}

export function VormRegel({ vorm: v, vestiging, onKlaar, lidgeld = null }: Props) {
  const vestigingen = useVestigingen()
  const [bewerken, setBewerken] = useState(false)
  const [bevestig, setBevestig] = useState(false)
  const [bezig, setBezig] = useState(false)
  const taal = useTaal()
  const tekst = useTekst(LIDMAATSCHAPPEN)
  const t = tekst.vorm

  async function verwijder() {
    setBezig(true)
    const uit = await stuur(`/api/club/lidmaatschappen/vormen/${v.id}`, 'DELETE')
    setBezig(false)
    setBevestig(false)
    onKlaar(uit.ok ? t.verwijderd(v.naam) : uit.fout, uit.ok)
  }

  if (bewerken) {
    return (
      <li className="club-lidm-regel is-bewerken" data-kleur={v.kleur}>
        <VormFormulier
          begin={v}
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
    <li className={`club-lidm-regel${v.actief ? '' : ' is-uit'}`} data-kleur={v.kleur}>
      <div className="club-lidm-inhoud">
        <h3 className="club-lidm-naam">
          {v.naam}
          {!v.actief && <span className="club-chip club-chip--uit club-chip--geen">{t.nietTeKoop}</span>}
          {v.demo && <span className="club-chip club-chip--geen">{tekst.algemeen.demo}</span>}
        </h3>
        {v.omschrijving && <p className="club-lidm-omschrijving">{v.omschrijving}</p>}
        <ul className="club-lidm-regels" aria-label={t.toegang}>
          {regelsTekst(v, (s) => naamVan(vestigingen, s), taal).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
      <div className="club-lidm-rechts">
        <p className="club-lidm-aantal">
          <strong>{v.leden}</strong>
          <span>{tekst.algemeen.lid(v.leden)}</span>
        </p>
        {vestiging && v.leden > 0 && (
          <Link className="club-lidm-link" href={clubPad('/leden', vestiging, { abonnement: v.ledenNaam })}>
            {tekst.algemeen.naarLijst}<span className="club-sr"> {t.lijstMet(v.naam)}</span>
          </Link>
        )}
        <div className="club-lidm-knoppen">
          {bevestig ? (
            <>
              <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig} onClick={() => void verwijder()}>
                {bezig ? tekst.algemeen.bezig : tekst.algemeen.jaVerwijderen}
              </button>
              <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBevestig(false)}>
                {tekst.algemeen.nee}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBewerken(true)} aria-label={t.wijzigenLabel(v.naam)}>
                {tekst.algemeen.wijzigen}
              </button>
              <button type="button" className="club-knop club-knop--klein club-knop--stil" onClick={() => setBevestig(true)} aria-label={t.verwijderenLabel(v.naam)}>
                {tekst.algemeen.verwijderen}
              </button>
            </>
          )}
        </div>
        {bevestig && v.leden > 0 && <p className="club-hint club-lidm-let">{t.houdtAbonnement(ledenTekst(v.leden, taal), v.leden === 1)}</p>}
      </div>
      {lidgeld && <PrijsEnContract vormId={v.id} vormNaam={v.naam} plannen={lidgeld.plannen} vandaag={lidgeld.vandaag} onKlaar={onKlaar} />}
    </li>
  )
}
