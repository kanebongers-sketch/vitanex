import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { takenHref } from '@/lib/club/taken/url'
import type { Persoon } from '@/lib/club/taken/invoer'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { VANDAAG_SECTIES } from '@/lib/aiyourgym/taal/woorden/club/vandaag'
import { TakenDag } from '@/components/club/taken/TakenDag'
import { SectieKop } from './SectieKop'
import '@/components/club/taken/taken.css'

// De taken van vandaag op Vandaag: dezelfde Dag-tabel als bij Taken (afvinken,
// notitie, afsluitronde). De week, het overzicht en het beheer van de lijsten
// zijn volledige schermen, bereikbaar via de kop. Is er nog geen takenlijst
// (ontwerp 03-11-2026), dan alleen een regel met de knop Takenlijst maken, en
// niets voor wie geen lijst mag maken.

interface Props {
  admin: SupabaseClient
  userId: string
  vestiging: Vestiging
  /** Vandaag (jjjj-mm-dd). */
  vandaag: string
  /** De ingelogde medewerker: vinkt meteen af onder de eigen naam. */
  ik?: Persoon | null
  /** Heeft deze vestiging een actieve takenlijst? null = onbekend (leesfout): toon gewoon de tabel. */
  heeftLijst?: boolean | null
  /** Mag deze persoon takenlijsten maken (Taken beheren)? */
  magMaken?: boolean
}

export async function TakenSectie({ admin, userId, vestiging, vandaag, ik = null, heeftLijst = null, magMaken = false }: Props) {
  const w = (await clubTekst(VANDAAG_SECTIES)).taken
  if (heeftLijst === false) {
    if (!magMaken) return null
    return (
      <section id="taken" className="club-vandaag-sectie club-vandaag-taken" aria-labelledby="vandaag-taken">
        <div className="club-vandaag-leeg-actie">
          <div>
            <h2 id="vandaag-taken">{w.titel}</h2>
            <p>{w.geenLijst}</p>
          </div>
          <Link href={takenHref('beheer', vestiging)} className="club-knop">
            <Plus aria-hidden size={16} /> {w.maken}
          </Link>
        </div>
      </section>
    )
  }
  const links = [
    { href: takenHref('week', vestiging), label: w.week },
    { href: takenHref('overzicht', vestiging), label: w.overzicht },
    { href: takenHref('beheer', vestiging), label: w.beheer },
  ]
  return (
    <section id="taken" className="club-vandaag-sectie club-vandaag-taken" aria-labelledby="vandaag-taken">
      <SectieKop id="vandaag-taken" titel={w.titel} sub={w.sub} links={links} />
      <Suspense fallback={<div className="club-skelet" style={{ minHeight: 220 }} aria-hidden />}>
        <TakenDag admin={admin} userId={userId} vestiging={vestiging} dag={vandaag} vandaag={vandaag} ik={ik} />
      </Suspense>
    </section>
  )
}
