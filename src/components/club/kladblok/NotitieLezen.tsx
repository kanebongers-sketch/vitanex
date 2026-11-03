'use client'

import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import type { KladNotitie } from '@/lib/club/kladblok/model'
import { useVestigingNaam } from '@/components/club/shell/VestigingenContext'
import { Leesweergave } from './Leesweergave'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { formatDatum, formatTijd } from '@/lib/aiyourgym/taal/formaat'
import { NOTITIES } from '@/lib/aiyourgym/taal/woorden/club/notities'

// Een notitie alleen lezen: voor wie notities mag zien maar niet bewerken
// (rollen v2, niveau zien). Geen invoervelden, geen knoppen die iets opslaan;
// afvinkvakjes zijn zichtbaar maar staan vast.

interface Props {
  notitie: KladNotitie
  vestiging: Vestiging
  onSluit: () => void
  /** Een extra actie (op het Prikbord: de link naar de werkwijze). */
  actie?: ReactNode
}

export function NotitieLezen({ notitie, vestiging, onSluit, actie }: Props) {
  const vestigingNaam = useVestigingNaam(vestiging)
  const taal = useTaal()
  const tekst = useTekst(NOTITIES)
  const t = tekst.editor
  const bijgewerkt = `${formatDatum(notitie.bijgewerktOp, taal, 'dagMaandLang')} ${formatTijd(notitie.bijgewerktOp, taal)}`

  return (
    <article className="kb-notitie">
      <div className="kb-balk">
        <button type="button" className="club-knop club-knop--stil club-knop--klein kb-terug" onClick={onSluit}>
          <ChevronLeft size={16} aria-hidden /> {t.alleNotities}
        </button>
        <p className="club-hint">
          {t.map}: {tekst.map[notitie.map]} · {t.voor}: {notitie.vestiging ? vestigingNaam : t.alleVestigingen}
        </p>
      </div>
      <h2 className="kb-titel">{notitie.titel}</h2>
      {actie ? <div className="kb-werkbalk">{actie}</div> : null}
      <Leesweergave inhoud={notitie.inhoud} onVink={() => undefined} alleenLezen />
      <p className="kb-stand">
        {t.opgeslagen(bijgewerkt)}{notitie.auteur ? ` · ${t.aangemaaktDoor(notitie.auteur)}` : ''}
      </p>
    </article>
  )
}
