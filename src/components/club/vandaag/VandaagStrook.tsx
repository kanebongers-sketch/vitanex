import { Suspense } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import type { VandaagLes } from '@/lib/club/cijfers/haal-vandaag'
import { alleenActief, haalAfvinkingen, haalTaken } from '@/lib/club/taken/opslag'
import { takenVanVandaag } from '@/lib/club/taken/voortgang'
import { weekContext } from '@/lib/club/taken/week'
import { takenHref } from '@/lib/club/taken/url'
import { weekParam } from '@/lib/club/rooster/tijd'
import { bezettingVan } from '@/lib/club/ontwerp/reeks'
import { procent } from '@/lib/club/cijfers/opmaak'
import { clubPad } from '@/lib/club/kern/vestiging'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { ONTWERP } from '@/lib/aiyourgym/taal/woorden/club/ontwerp'
import { CijferStrook, CijferTegel } from '@/components/club/ontwerp/CijferTegel'

// De strook bovenaan Vandaag: hoe ver de taken van vandaag zijn (met een link
// naar het takenscherm, besluit Kane 28-10-2026) en hoe vol de lessen zitten.
// Alleen echte cijfers: verplichte taken van vandaag (zoals de Dag-tabel ze
// telt) en de geboekte plekken van de lessen die doorgaan.

interface TakenTegelProps {
  admin: SupabaseClient
  userId: string
  vestiging: Vestiging
  vandaag: string
}

async function TakenTegel({ admin, userId, vestiging, vandaag }: TakenTegelProps) {
  const w = (await clubTekst(ONTWERP)).vandaag
  const href = takenHref('', vestiging)
  const week = weekContext(weekParam(vandaag), vandaag)
  const [data, afvinkingen] = await Promise.all([haalTaken(admin, userId, vestiging), haalAfvinkingen(admin, userId, vestiging, week.maandag, week.zondag)])
  if (!data || !afvinkingen) return <CijferTegel label={w.taken} waarde="" leeg sub={w.takenFout} href={href} />
  const actief = alleenActief(data)
  if (actief.lijsten.length === 0) return <CijferTegel label={w.taken} waarde="" leeg sub={w.takenLeeg} href={href} />
  const verplicht = takenVanVandaag(actief.taken, afvinkingen, week.dagen, vandaag).filter((t) => t.soort === 'verplicht')
  const gedaan = verplicht.filter((t) => t.afgevinkt).length
  if (verplicht.length === 0) return <CijferTegel label={w.taken} waarde="0" sub={w.takenGeen} href={href} />
  return (
    <CijferTegel
      label={w.taken}
      waarde={String(gedaan)}
      eenheid={w.takenVan(verplicht.length)}
      meter={{ deel: gedaan / verplicht.length, label: w.takenMeter }}
      sub={w.takenOpen(verplicht.length - gedaan)}
      href={href}
    />
  )
}

interface VandaagStrookProps extends TakenTegelProps {
  lessen: readonly VandaagLes[]
  /** Mag deze persoon Taken (recht en onderdeel aan)? */
  taken: boolean
  /** Mag deze persoon het rooster zien? */
  rooster: boolean
}

export async function VandaagStrook({ admin, userId, vestiging, vandaag, lessen, taken, rooster }: VandaagStrookProps) {
  if (!taken && !rooster) return null
  const w = (await clubTekst(ONTWERP)).vandaag
  const bezetting = bezettingVan(lessen)
  const doorgaan = lessen.filter((l) => !l.geannuleerd).length
  return (
    <CijferStrook label={w.strook} kolommen={taken && rooster ? 2 : 1}>
      {taken && (
        <Suspense fallback={<div className="club-stat" aria-hidden><span className="club-skelet" style={{ display: 'block', minHeight: 64 }} /></div>}>
          <TakenTegel admin={admin} userId={userId} vestiging={vestiging} vandaag={vandaag} />
        </Suspense>
      )}
      {rooster && (
        <CijferTegel
          label={w.bezettingLabel}
          waarde={bezetting === null ? '' : procent(bezetting)}
          leeg={bezetting === null}
          meter={bezetting === null ? null : { deel: bezetting, label: w.bezettingLabel }}
          sub={bezetting === null ? w.geenPlekken : `${w.lessen}: ${doorgaan}`}
          href={clubPad('/rooster', vestiging)}
        />
      )}
    </CijferStrook>
  )
}
