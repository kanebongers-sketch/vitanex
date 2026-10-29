'use client'

import type { Openingstijden } from '@/lib/club/rooster/openingstijden'
import type { Beschikbaarheid, Dienst, DienstSoort, PersoneelLid } from '@/lib/club/personeel/typen'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { Paneel } from './Paneel'
import { DienstFormulier, type Start } from './DienstFormulier'
import { DienstActies } from './DienstActies'
import { DienstUren } from './DienstUren'
import { dagVolledig } from './weergave'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { PERSONEEL } from '@/lib/aiyourgym/taal/woorden/club/personeel'

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
  /** Wat deze persoon met de uren mag (zie uren-rechten.ts). */
  uren: { goedkeuren: boolean; wijzigen: boolean }
}

export function DienstPaneel({ vestiging, dienst, start, team, soorten, alle, beschikbaarheid, bemand, sluitHref, uren }: Props) {
  const taal = useTaal()
  const alles = useTekst(PERSONEEL)
  const tk = alles.paneel
  const lid = dienst ? (team.find((l) => l.id === dienst.medewerkerId) ?? null) : null
  const titel = dienst ? (lid?.naam ?? alles.algemeen.openDienst) : tk.nieuweDienst
  const sub = dienst ? (
    <span>
      {dagVolledig(dienst.datum, taal)} · {alles.algemeen.vanTot(dienst.begin, dienst.eind)}
      {dienst.uursoort !== 'werk' && ` · ${alles.labels.uursoort[dienst.uursoort]}`} · {tk.uren(alles.labels.uurStatus[dienst.uurStatus].toLowerCase())}
    </span>
  ) : (
    <span>{dagVolledig(start.datum, taal)}</span>
  )
  const opSlot = dienst?.uurStatus === 'verwerkt'
  return (
    <Paneel titel={titel} boventitel={dienst ? tk.dienst : tk.plannen} sub={sub} sluitHref={sluitHref}>
      {opSlot && <p className="club-melding">{tk.opSlot}</p>}
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
      {dienst && dienst.medewerkerId && <DienstUren dienst={dienst} magGoedkeuren={uren.goedkeuren} magWijzigen={uren.wijzigen} />}
      {dienst && !opSlot && <DienstActies dienst={dienst} alle={alle} team={team} sluitHref={sluitHref} />}
    </Paneel>
  )
}
