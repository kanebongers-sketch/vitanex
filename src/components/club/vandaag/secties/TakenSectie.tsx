import { Suspense } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { takenHref } from '@/lib/club/taken/url'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { VANDAAG_SECTIES } from '@/lib/aiyourgym/taal/woorden/club/vandaag'
import { TakenDag } from '@/components/club/taken/TakenDag'
import { SectieKop } from './SectieKop'
import '@/components/club/taken/taken.css'

// De taken van vandaag op Vandaag: dezelfde Dag-tabel als bij Taken (afvinken,
// notitie, afsluitronde). De week, het overzicht en het beheer van de lijsten
// zijn volledige schermen, bereikbaar via de kop.

interface Props {
  admin: SupabaseClient
  userId: string
  vestiging: Vestiging
  /** Vandaag (jjjj-mm-dd). */
  vandaag: string
}

export async function TakenSectie({ admin, userId, vestiging, vandaag }: Props) {
  const w = (await clubTekst(VANDAAG_SECTIES)).taken
  const links = [
    { href: takenHref('week', vestiging), label: w.week },
    { href: takenHref('overzicht', vestiging), label: w.overzicht },
    { href: takenHref('beheer', vestiging), label: w.beheer },
  ]
  return (
    <section id="taken" className="club-vandaag-sectie club-vandaag-taken" aria-labelledby="vandaag-taken">
      <SectieKop id="vandaag-taken" titel={w.titel} sub={w.sub} links={links} />
      <Suspense fallback={<div className="club-skelet" style={{ minHeight: 220 }} aria-hidden />}>
        <TakenDag admin={admin} userId={userId} vestiging={vestiging} dag={vandaag} vandaag={vandaag} />
      </Suspense>
    </section>
  )
}
