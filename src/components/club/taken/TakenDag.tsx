import Link from 'next/link'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { weekParam } from '@/lib/club/rooster/tijd'
import { alleenActief, haalAfsluitrondes, haalAfvinkingen, haalNotities, haalTaken } from '@/lib/club/taken/opslag'
import { takenHref } from '@/lib/club/taken/url'
import { weekContext } from '@/lib/club/taken/week'
import { AfvinkProvider } from './AfvinkContext'
import { DagAfsluiten } from './DagAfsluiten'
import { DagNotities } from './DagNotities'
import { PersoonKiezer } from './PersoonKiezer'
import { TakenRaster } from './TakenRaster'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { TAKEN } from '@/lib/aiyourgym/taal/woorden/club/taken'

// De taken van een dag in de Excel-weergave (besluit Kane: dezelfde tabel als
// de week, met een kolom): wie vinkt af, de lijsten, het notitieveld en op de
// dag zelf de afsluitronde. Gedeeld door de takenpagina (/club/taken, bladeren
// per dag) en de sectie Taken op Vandaag. Laadt zelf, zodat Vandaag hem in een
// Suspense kan zetten.

interface Props {
  admin: SupabaseClient
  userId: string
  vestiging: Vestiging
  /** De dag die je ziet (jjjj-mm-dd). */
  dag: string
  /** Vandaag (jjjj-mm-dd): alleen dan staat de afsluitronde erbij. */
  vandaag: string
}

export async function TakenDag({ admin, userId, vestiging, dag, vandaag }: Props) {
  const w = weekContext(weekParam(dag), vandaag)
  const [data, afvinkingen, notities, rondes, medewerkers] = await Promise.all([
    haalTaken(admin, userId, vestiging),
    haalAfvinkingen(admin, userId, vestiging, w.maandag, w.zondag),
    haalNotities(admin, userId, vestiging, dag, dag),
    haalAfsluitrondes(admin, userId, vestiging, dag, dag),
    haalMedewerkers(admin, userId, vestiging),
  ])
  const actief = data ? alleenActief(data) : null
  const tekst = (await clubTekst(TAKEN)).dag

  if (!actief || !afvinkingen || !notities || !rondes) {
    return (
      <p className="club-melding club-melding--fout" role="alert">
        {tekst.fout}
      </p>
    )
  }
  if (actief.lijsten.length === 0) {
    return (
      <div className="club-leeg">
        <p>{tekst.geenLijsten}</p>
        <Link className="club-knop club-knop--primair" href={takenHref('beheer', vestiging)}>
          {tekst.lijstenMaken}
        </Link>
      </div>
    )
  }
  return (
    <AfvinkProvider
      key={`${vestiging}-${dag}`}
      vestiging={vestiging}
      vandaag={vandaag}
      medewerkers={(medewerkers ?? []).map((m) => ({ id: m.id, naam: m.naam }))}
      begin={afvinkingen}
    >
      <PersoonKiezer />
      {actief.lijsten.map((l) => (
        <TakenRaster key={l.id} lijst={l} taken={actief.taken.filter((x) => x.lijstId === l.id)} dagen={[dag]} />
      ))}
      <DagNotities datum={dag} begin={notities} />
      {dag === vandaag && <DagAfsluiten lijsten={actief.lijsten} taken={actief.taken} dagen={w.dagen} ronde={rondes[0] ?? null} />}
    </AfvinkProvider>
  )
}
