import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { clubDatabase } from '@/lib/club/kern/database'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { TWEESTAPS } from '@/lib/aiyourgym/taal/woorden/club/tweestaps'
import { vindWacht } from '@/lib/club/tweestaps/opslag'
import { wachtCookie } from '@/lib/club/tweestaps/cookie'
import { TweestapsInlog } from '@/components/club/inloggen/TweestapsInlog'
import '@/app/(aiyourgym)/(club)/club/club.css'
import '@/components/club/inloggen/inloggen.css'

// /clubinloggen/tweestaps: de tweede inlogstap van het master account, na een
// goed wachtwoord (wachtcookie, vijf minuten). Zonder geldige wachtstap: terug
// naar inloggen. Nooit in zoekmachines.

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: (await clubTekst(TWEESTAPS)).inlog.titel,
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
  }
}

async function wachtGeldig(): Promise<boolean> {
  try {
    return (await vindWacht(clubDatabase(), (await cookies()).get(wachtCookie())?.value, new Date())) !== null
  } catch {
    return false
  }
}

export default async function TweestapsPagina() {
  const geldig = await wachtGeldig()
  return (
    <div className="club-app club-inlog" data-thema="donker">
      <main className="club-inlog-vlak">
        <TweestapsInlog geldig={geldig} />
      </main>
    </div>
  )
}
