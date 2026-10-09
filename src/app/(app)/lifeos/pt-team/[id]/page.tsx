import { redirect } from 'next/navigation'
import { PT_APP_BEHEER } from '@/lib/lifeos/pt-dashboard/beheer'

// Eén PT'er staat in de Fit Factory PT-app (/<beheerder>/team/<id>); oude links sturen daarheen.

export default async function PtTeamLidPagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`${PT_APP_BEHEER}/team/${encodeURIComponent(id)}`)
}
