'use client'

import type { Openingstijden } from '@/lib/club/rooster/openingstijden'
import type { Beschikbaarheid, Dienst, DienstSoort, PersoneelLid } from '@/lib/club/personeel/typen'
import { UUR_STATUS_LABEL, UURSOORT_LABEL } from '@/lib/club/personeel/typen'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { Paneel } from './Paneel'
import { DienstFormulier, type Start } from './DienstFormulier'
import { DienstActies } from './DienstActies'
import { DienstUren } from './DienstUren'
import { dagVolledig } from './weergave'

// Zijpaneel van een dienst: plannen of wijzigen, ziek melden, ruilen,
// verwijderen, en de uren registreren.

interface Props {
  vestiging: Vestiging
  dienst: Dienst | null
  start: Start
  team: PersoneelLid[]
  soorten: DienstSoort[]
  alle: Dienst[]
  beschikbaarheid: Beschikbaarheid[]
  bemand: Openingstijden
  sluitHref: string
}

export function DienstPaneel({ vestiging, dienst, start, team, soorten, alle, beschikbaarheid, bemand, sluitHref }: Props) {
  const lid = dienst ? (team.find((l) => l.id === dienst.medewerkerId) ?? null) : null
  const titel = dienst ? (lid?.naam ?? 'Open dienst') : 'Nieuwe dienst'
  const sub = dienst ? (
    <span>
      {dagVolledig(dienst.datum)} · {dienst.begin} tot {dienst.eind}
      {dienst.uursoort !== 'werk' && ` · ${UURSOORT_LABEL[dienst.uursoort]}`} · uren {UUR_STATUS_LABEL[dienst.uurStatus].toLowerCase()}
    </span>
  ) : (
    <span>{dagVolledig(start.datum)}</span>
  )
  const opSlot = dienst?.uurStatus === 'verwerkt'
  return (
    <Paneel titel={titel} boventitel={dienst ? 'Dienst' : 'Plannen'} sub={sub} sluitHref={sluitHref}>
      {opSlot && <p className="club-melding">De uren van deze dienst zijn verwerkt door de administratie. Wijzigen kan niet meer.</p>}
      {!opSlot && (
        <DienstFormulier
          vestiging={vestiging}
          dienst={dienst}
          start={start}
          team={team}
          soorten={soorten}
          alle={alle}
          beschikbaarheid={beschikbaarheid}
          bemand={bemand}
          sluitHref={sluitHref}
        />
      )}
      {dienst && dienst.medewerkerId && <DienstUren dienst={dienst} />}
      {dienst && !opSlot && <DienstActies dienst={dienst} alle={alle} team={team} sluitHref={sluitHref} />}
    </Paneel>
  )
}
