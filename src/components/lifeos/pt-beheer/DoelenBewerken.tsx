'use client'

import { useRouter } from 'next/navigation'
import type { Lead } from '@/lib/lifeos/leads/leads'
import type { PtKlant } from '@/lib/lifeos/pt-dashboard/abonnementen'
import type { PtDoelen } from '@/lib/lifeos/pt-dashboard/doelen'
import { DoelenSectie } from '@/components/lifeos/pt-team/DoelenFormulier'

// De doelen van één PT'er zetten (beheerder). Na opslaan ververst de pagina,
// zodat de voortgang overal klopt.

interface Props {
  persoonId: string
  naam: string
  doelen: PtDoelen | null
  leads: readonly Lead[]
  klanten: readonly PtKlant[]
  vandaag: string
}

export function DoelenBewerken(props: Props) {
  const router = useRouter()
  return <DoelenSectie {...props} onOpgeslagen={() => router.refresh()} />
}
