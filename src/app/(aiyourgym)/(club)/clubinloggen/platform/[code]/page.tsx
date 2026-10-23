import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { clubDatabase } from '@/lib/club/kern/database'
import { linkStand } from '@/lib/club/platform-login/platform'
import { vindPlatformAccount } from '@/lib/club/platform-login/opslag'
import { PlatformInlog } from '@/components/club/inloggen/PlatformInlog'
import '@/app/(aiyourgym)/(club)/club/club.css'
import '@/components/club/inloggen/inloggen.css'

// /clubinloggen/platform/<code>: de startlink van de platform-eigenaar (master
// account van Kane). Een keer, binnen 24 uur, een wachtwoord kiezen; daarna is
// de link weg en log je in op /inloggen met e-mailadres en wachtwoord. Een
// onbekende, gebruikte of te oude link: een gewone 404. De code staat in de URL,
// dus nooit een referrer en nooit in zoekmachines. Een nieuwe link maakt alleen
// de SQL-functie club_platform_startlink (migratie 458).

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Inloggen',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

interface PaginaProps {
  params: Promise<{ code: string }>
}

async function accountVoor(code: string) {
  try {
    return await vindPlatformAccount(clubDatabase(), code)
  } catch {
    return null
  }
}

export default async function PlatformInloggenPagina({ params }: PaginaProps) {
  const { code } = await params
  const account = await accountVoor(code)
  if (!account) notFound()
  if (linkStand(account, new Date()) === 'verlopen') notFound()

  return (
    <div className="club-app club-inlog" data-thema="donker">
      <main className="club-inlog-vlak">
        <PlatformInlog code={code} />
      </main>
    </div>
  )
}
