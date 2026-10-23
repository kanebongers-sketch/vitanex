import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ClubToegang } from '@/lib/club/toegang'
import { magBeheerdersBeheren } from '@/lib/club/beheerders/rechten'
import { AANTAL_STAPPEN, aantalAf, minutenOver, minutenTekst, startPad, stappenStand, streefStand, toonStartKaart, volgendeOpen } from '@/lib/club/start/stappen'
import { nlDelen } from '@/lib/club/rooster/tijd'
import { haalStartVoorPagina, haalStartFeiten } from '@/lib/club/start/opslag'
import './start.css'

// Op Vandaag, zolang de startwizard loopt: een opvallende kaart met de stand
// en de volgende open stap, plus de streefdatum als de eigenaar die koos
// ("Live op 1 november, nog 3 stappen"). Alleen voor Kane en de eigenaar.

export async function StartKaart({ t, vestiging }: { t: ClubToegang; vestiging: string | null }) {
  if (!magBeheerdersBeheren(t)) return null
  const gelezen = await haalStartVoorPagina(t)
  if (!gelezen.ok || !toonStartKaart(gelezen.voortgang)) return null
  const stand = stappenStand(gelezen.voortgang, await haalStartFeiten(t))
  const af = aantalAf(stand)
  const volgende = stand[volgendeOpen(stand) - 1]
  const streefdatum = gelezen.voortgang?.streefdatum ?? null
  const streef = streefdatum ? streefStand(streefdatum, nlDelen(new Date()).datum, AANTAL_STAPPEN - af) : null
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
        {streef && (
          <p className="club-startkaart-streef">
            <strong>{streef.kop}</strong>
            <span>{streef.dagen}</span>
          </p>
        )}
        <p className="club-startkaart-tijd">{minutenTekst(minutenOver(stand))}. Wat je al deed, staat er nog.</p>
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
