import { permanentRedirect } from 'next/navigation'
import { CODE_PATROON } from '@/lib/lifeos/leads/leads'

// Oude links (/lead/joey) zijn al gedeeld: die sturen door naar /joey/lead.

export default async function OudeLeadLink({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  permanentRedirect(CODE_PATROON.test(code) ? `/${code}/lead` : '/lead')
}
