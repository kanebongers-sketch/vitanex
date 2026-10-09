import { redirect } from 'next/navigation'
import { PT_APP_BEHEER } from '@/lib/lifeos/pt-dashboard/beheer'

// Het PT-team staat in de Fit Factory PT-app; oude links sturen daarheen.

export default function PtTeamPagina() {
  redirect(PT_APP_BEHEER)
}
