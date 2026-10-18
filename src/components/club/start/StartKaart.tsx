import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ClubToegang } from '@/lib/club/toegang'
import { magBeheerdersBeheren } from '@/lib/club/beheerders/rechten'
import { AANTAL_STAPPEN, aantalAf, startPad, stappenStand, toonStartKaart, volgendeOpen } from '@/lib/club/start/stappen'
import { haalStart, haalStartFeiten } from '@/lib/club/start/opslag'
import './start.css'

// Op Vandaag, zolang de startwizard loopt: een opvallende kaart met de stand
// en de volgende open stap. Alleen voor Kane en de eigenaar.

export async function StartKaart({ t, vestiging }: { t: ClubToegang; vestiging: string | null }) {
  if (!magBeheerdersBeheren(t)) return null
  const gelezen = await haalStart(t)
  if (!gelezen.ok || !toonStartKaart(gelezen.voortgang)) return null
  const stand = stappenStand(gelezen.voortgang, await haalStartFeiten(t))
  const af = aantalAf(stand)
  const volgende = stand[volgendeOpen(stand) - 1]
  return (
    <section className="club-startkaart" aria-labelledby="startkaart-kop">
      <div className="club-startkaart-tekst">
        <p className="club-boventitel">Startwizard</p>
        <h2 id="startkaart-kop">
          Maak je sportschool af <span className="club-startkaart-stand">({af} van {AANTAL_STAPPEN})</span>
        </h2>
        <p>
          Volgende stap: <strong>{volgende.titel}</strong>. {volgende.kort}.
        </p>
      </div>
      <div className="club-startkaart-balk" role="progressbar" aria-label="Voortgang startwizard" aria-valuemin={0} aria-valuemax={AANTAL_STAPPEN} aria-valuenow={af}>
        {stand.map((s) => (
          <span key={s.sleutel} data-af={s.af || undefined} />
        ))}
      </div>
      <Link href={startPad(volgende.nummer, vestiging)} className="club-knop club-knop--primair club-knop--groot">
        Verder met stap {volgende.nummer} <ArrowRight aria-hidden size={18} />
      </Link>
    </section>
  )
}
