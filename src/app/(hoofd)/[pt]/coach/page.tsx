import { notFound } from 'next/navigation'
import { ptSessie } from '@/lib/lifeos/pt-dashboard/sessie'
import { zietCoach } from '@/lib/lifeos/leads/links'
import { EigenaarCoach } from '@/components/lifeos/pt-eigenaar/EigenaarCoach'

// /<naam>/coach: de coachgesprekken van het team, alleen voor eigenaren en de
// beheerder. Een PT'er ziet NIETS van de coachgesprekken: geen verslag, geen
// feedback en ook geen aandachtspunten (besluit Kane 23-11-2026: "Dit is NOOIT de
// bedoeling"). Een PT'er of clubmanager krijgt een 404. De layout regelt de pincode.

export default async function CoachPagina({ params }: { params: Promise<{ pt: string }> }) {
  const { pt } = await params
  const s = await ptSessie(pt)
  if (!s?.ingelogd) return null
  if (!zietCoach(s.link.rol)) notFound()
  return <><h1 className="sr-only">Coach</h1><EigenaarCoach code={s.link.code} beheerder={s.link.rol === 'beheerder'} /></>
}
