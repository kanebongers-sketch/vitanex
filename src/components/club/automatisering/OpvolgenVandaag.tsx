import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { REGEL_DEFINITIES } from '@/lib/club/automatisering/regels'
import { telOpenPerRegel, zorgVoorRondeVanVandaag } from '@/lib/club/automatisering/opslag'

// Voor Club Vandaag: hoeveel leden er open staan per regel, met een link naar
// de groep op de opvolglijst. De ronde van vandaag draait hier alleen als die
// vandaag nog niet draaide, zodat Vandaag snel blijft.

interface Props {
  admin: SupabaseClient
  userId: string
  vestiging: Vestiging
}

export async function OpvolgenVandaag({ admin, userId, vestiging }: Props) {
  await zorgVoorRondeVanVandaag(admin, userId, vestiging, new Date())
  const perRegel = await telOpenPerRegel(admin, userId, vestiging)
  const totaal = (perRegel ?? []).reduce((s, r) => s + r.aantal, 0)
  const pad = (anker?: string) => `${clubPad('/opvolgen', vestiging)}${anker ? `#regel-${anker}` : ''}`

  return (
    <section className="club-kaart club-vandaag-kaart" aria-labelledby="vandaag-opvolgen">
      <header className="club-sectiekop club-vandaag-sectiekop">
        <h2 id="vandaag-opvolgen">Leden opvolgen</h2>
        <Link href={pad()} className="club-vandaag-meer">
          {totaal > 0 ? `Alle ${totaal}` : 'Naar opvolgen'} <ArrowUpRight aria-hidden size={14} />
        </Link>
      </header>
      {perRegel === null ? (
        <p className="club-melding club-melding--fout">De opvolglijst kon niet worden geladen.</p>
      ) : perRegel.length === 0 ? (
        <p className="club-leeg">Niemand hoeft vandaag opgevolgd te worden.</p>
      ) : (
        <ul className="club-lijst">
          {perRegel.map((r) => (
            <li key={r.regel}>
              <Link href={pad(r.regel)} className="club-rij club-vandaag-rijlink">
                <span className="club-rij-hoofd">
                  <span className="club-rij-titel">{REGEL_DEFINITIES[r.regel].titel}</span>
                </span>
                <span className="club-chip club-chip--merk">{r.aantal}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
