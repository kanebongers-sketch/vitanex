import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { lidToegang } from '@/lib/club/ledenlogin/toegang'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { pakketZichtbaar } from '@/lib/club/kern/pakketten'
import { tabsUitVoor } from '@/lib/club/ledenlogin/tabs'
import { LedenappSchil } from '@/components/club/ledenlogin/LedenappSchil'
import { IntakeFlow } from '@/components/club/aanmelden/IntakeFlow'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { LID_INTAKE } from '@/lib/aiyourgym/taal/woorden/ledenapp/lid-intake'

// /mijn/intake: de korte intake die het lid zelf invult (besluit Kane
// 30-10-2026), meteen na het aanmelden en via de kaart op Home. Hoogstens
// vier schermen. Hoort bij het pakket Training en coaching; zonder dat pakket
// gewoon naar de app. Het lid komt altijd uit de sessie; Kane kan met ?lid=
// meekijken (dan wordt niets opgeslagen).

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return { title: LID_INTAKE[await getTaal()].titel, robots: { index: false, follow: false } }
}

type Zoek = Promise<Record<string, string | string[] | undefined>>

export default async function MijnIntake({ searchParams }: { searchParams: Zoek }) {
  const zoek = await searchParams
  const voor = typeof zoek.lid === 'string' ? zoek.lid : null
  const l = await lidToegang(voor)
  if (!l) {
    if (CLUB_LEDEN_LOGIN) redirect('/mijn/inloggen')
    notFound()
  }
  const terug = l.voorvertoning ? `/mijn?lid=${encodeURIComponent(l.lid.id)}` : '/mijn'
  if (!pakketZichtbaar(l.organisatie.uit, 'training')) redirect(terug)
  const schemaKan = !tabsUitVoor(l.organisatie).includes('schema')
  return (
    <LedenappSchil organisatie={l.organisatie}>
      <main className="club-mijn-inlog club-in-pagina">
        <IntakeFlow voornaam={l.lid.voornaam} schemaKan={schemaKan} terug={terug} api={l.voorvertoning ? `/api/club/lid/intake?voor=${encodeURIComponent(l.lid.id)}` : '/api/club/lid/intake'} />
      </main>
    </LedenappSchil>
  )
}
