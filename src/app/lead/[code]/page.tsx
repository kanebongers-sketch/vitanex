import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { CODE_PATROON } from '@/lib/lifeos/leads/leads'
import { haalLeadsVan, sessieGeldig, vindLink } from '@/lib/lifeos/leads/opslag'
import { sessieCookieNaam } from '@/lib/lifeos/leads/pin'
import { LeadTracker } from '@/components/lifeos/leads/LeadTracker'
import { PinPoort } from '@/components/lifeos/leads/PinPoort'

// /lead/<naam> — de eigen lead tracker van één PT'er (bv. /lead/joey). De naam
// is te raden, dus de leads zitten achter een pincode die de PT'er zelf kiest en
// Kane goedkeurt (migratie 351). Alles server-side gelezen: er gaat nooit een
// user_id, persoon_id of pin-hash naar de browser.

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Lead tracker',
  description: 'Houd bij met wie je gesproken hebt.',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

interface Props {
  params: Promise<{ code: string }>
}

export default async function LeadPagina({ params }: Props) {
  const { code } = await params
  if (!CODE_PATROON.test(code)) notFound()
  const admin = createLifeosAdminClient()
  const link = await vindLink(admin, code)
  if (!link) notFound()

  const token = (await cookies()).get(sessieCookieNaam(link.code))?.value
  const ingelogd = await sessieGeldig(admin, link, token, new Date())
  const leads = ingelogd ? await haalLeadsVan(admin, link) : null

  return (
    <main className="lifeos-root" style={{ minHeight: '100vh', background: 'var(--bg-app)', padding: '28px 16px 64px' }}>
      {leads ? (
        <LeadTracker code={link.code} naam={link.naam} begin={leads.ok ? leads.waarde : []} leesFout={!leads.ok} />
      ) : (
        <PinPoort code={link.code} naam={link.naam} pinStatus={link.pinStatus} />
      )}
    </main>
  )
}
