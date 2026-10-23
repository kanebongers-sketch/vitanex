import type { ClubToegang } from '@/lib/club/toegang'
import { logActie } from '@/lib/club/toegang'
import { haalVoorTrainer } from '@/lib/club/health/trainer'
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
  if (!beeld) {
    return (
      <section className="club-kaart" aria-labelledby="apps-kop">
        <h2 id="apps-kop">Metingen uit apps</h2>
        <p className="club-hint">De metingen konden niet worden geladen.</p>
      </section>
    )
  }
  if (!beeld.heeftToestemming) return null
  await logActie(t, 'Metingen uit apps bekeken', naam, vestiging)
  return (
    <section className="club-kaart" aria-labelledby="apps-kop">
      <h2 id="apps-kop">Metingen uit apps</h2>
      <LaatsteMetingen metingen={beeld.laatste} leeg="Het lid deelt metingen, maar er is nog niets binnengekomen." />
      <p className="club-hint">Gedeeld door het lid zelf. Het lid kan dit altijd uitzetten.</p>
    </section>
  )
}
