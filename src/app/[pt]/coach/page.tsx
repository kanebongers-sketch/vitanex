import { ptSessie } from '@/lib/lifeos/pt-dashboard/sessie'
import { kijktMee } from '@/lib/lifeos/leads/links'
import { huidigeWeek, weekLabel } from '@/lib/lifeos/pt-dashboard/checkin'
import { haalCheckin } from '@/lib/lifeos/pt-dashboard/checkin-opslag'
import { haalOpenPuntenVan } from '@/lib/lifeos/pt-coaching/opslag'
import { CheckinFormulier } from '@/components/lifeos/pt-dashboard/CheckinFormulier'
import { CoachPunten } from '@/components/lifeos/pt-dashboard/CoachPunten'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { EigenaarCoach } from '@/components/lifeos/pt-eigenaar/EigenaarCoach'

// /<naam>/coach — de PT'er bereidt het wekelijkse coachgesprek met Kane voor:
// de open aandachtspunten uit eerdere gesprekken (alleen lezen) en de check-in
// van deze week. De layout regelt de pincode; zonder sessie rendert dit niets.
// Een eigenaar ziet hier de check-ins en open punten van het hele team.

export default async function CoachPagina({ params }: { params: Promise<{ pt: string }> }) {
  const { pt } = await params
  const s = await ptSessie(pt)
  if (!s?.ingelogd) return null
  if (kijktMee(s.link.rol)) return <EigenaarCoach code={s.link.code} beheerder={s.link.rol === 'beheerder'} />

  const week = huidigeWeek(new Date())
  const [checkin, punten] = await Promise.all([
    haalCheckin(s.admin, s.link, week),
    haalOpenPuntenVan(s.admin, s.link.userId, s.link.persoonId),
  ])

  return (
    <>
      <section className="ptd-sectie" aria-labelledby="ptd-checkin-kop">
        <div className="ptd-sectiekop">
          <h2 id="ptd-checkin-kop">Voorbereiding coachgesprek</h2>
          <span>{weekLabel(week)}</span>
        </div>
        <p className="ptd-hint">
          Vul dit in vóór je gesprek met Kane. Kane leest het in het gesprek, en het komt in het verslag. Je kunt het de hele week
          aanpassen; op maandag begint een nieuwe check-in.
        </p>
        {checkin.ok ? (
          <CheckinFormulier code={s.link.code} begin={checkin.waarde} week={week} />
        ) : (
          <Foutmelding bericht="Je check-in kon niet geladen worden. Vernieuw de pagina." />
        )}
      </section>
      {punten.ok ? (
        <CoachPunten punten={punten.waarde} />
      ) : (
        <Foutmelding bericht="De aandachtspunten uit eerdere gesprekken konden niet geladen worden. Vernieuw de pagina." />
      )}
    </>
  )
}
