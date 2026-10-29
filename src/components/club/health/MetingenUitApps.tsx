import type { ClubToegang } from '@/lib/club/toegang'
import { logActie } from '@/lib/club/toegang'
import { haalVoorTrainer } from '@/lib/club/health/trainer'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { HEALTH } from '@/lib/aiyourgym/taal/woorden/ledenapp/health'
import { LaatsteMetingen } from './LaatsteMetingen'
import './health.css'

// Ledenkaart: "Metingen uit apps". Alleen wat het lid trainers laat zien
// (toestemming per soort, Strava apart). Zonder toestemming staat er niets,
// ook geen lege kaart: de sportschool ziet niet eens of er iets gekoppeld is.
// De inzage wordt gelogd (AVG: wie keek bij wie).

interface MetingenUitAppsProps {
  t: ClubToegang
  lidId: string
  naam: string
  vestiging: string | null
}

export async function MetingenUitApps({ t, lidId, naam, vestiging }: MetingenUitAppsProps) {
  const beeld = await haalVoorTrainer(t.admin, t.userId, lidId)
  const taal = await getTaal()
  const tekst = HEALTH[taal].ledenkaart
  if (!beeld) {
    return (
      <section className="club-kaart" aria-labelledby="apps-kop">
        <h2 id="apps-kop">{tekst.titel}</h2>
        <p className="club-hint">{tekst.laadFout}</p>
      </section>
    )
  }
  if (!beeld.heeftToestemming) return null
  await logActie(t, 'Metingen uit apps bekeken', naam, vestiging)
  return (
    <section className="club-kaart" aria-labelledby="apps-kop">
      <h2 id="apps-kop">{tekst.titel}</h2>
      <LaatsteMetingen metingen={beeld.laatste} leeg={tekst.leeg} taal={taal} />
      <p className="club-hint">{tekst.hint}</p>
    </section>
  )
}
