import { ptSessie } from '@/lib/lifeos/pt-dashboard/sessie'
import { kijktMee, zietCoach } from '@/lib/lifeos/leads/links'
import { notFound } from 'next/navigation'
import { haalOpenPuntenVan } from '@/lib/lifeos/pt-coaching/opslag'
import { CoachPunten } from '@/components/lifeos/pt-dashboard/CoachPunten'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { EigenaarCoach } from '@/components/lifeos/pt-eigenaar/EigenaarCoach'

// /<naam>/coach: de PT'er ziet de open aandachtspunten uit eerdere
// coachgesprekken met Kane (alleen lezen). De layout regelt de pincode; zonder
// sessie rendert dit niets. Een eigenaar ziet hier de coachgesprekken van het team.

export default async function CoachPagina({ params }: { params: Promise<{ pt: string }> }) {
  const { pt } = await params
  const s = await ptSessie(pt)
  if (!s?.ingelogd) return null
  // Coachgesprekken zijn tussen Kane en de PT'er: een clubmanager ziet ze niet.
  if (kijktMee(s.link.rol) && !zietCoach(s.link.rol)) notFound()
  if (kijktMee(s.link.rol)) return <><h1 className="sr-only">Coach</h1><EigenaarCoach code={s.link.code} beheerder={s.link.rol === 'beheerder'} /></>

  const punten = await haalOpenPuntenVan(s.admin, s.link.userId, s.link.persoonId)

  return (
    <>
      <h1 className="sr-only">Coach</h1>
      {punten.ok ? (
        <CoachPunten punten={punten.waarde} />
      ) : (
        <Foutmelding bericht="De aandachtspunten uit eerdere gesprekken konden niet geladen worden. Vernieuw de pagina." />
      )}
    </>
  )
}
