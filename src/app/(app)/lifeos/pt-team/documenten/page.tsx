import { redirect } from 'next/navigation'
import { PT_APP_BEHEER } from '@/lib/lifeos/pt-dashboard/beheer'

// De PT-documenten beheer je in de Fit Factory PT-app (Beheer); oude links sturen daarheen.

export default function PtDocumentenPagina() {
  redirect(`${PT_APP_BEHEER}/beheer`)
}
