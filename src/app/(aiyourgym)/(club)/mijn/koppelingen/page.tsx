import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { lidToegang } from '@/lib/club/ledenlogin/toegang'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { tabsUitVoor } from '@/lib/club/ledenlogin/tabs'
import { LOGO_FIT_FACTORY } from '@/lib/club/kern/organisatie'
import { volledigeNaam } from '@/lib/club/kern/lid'
import { healthActief } from '@/lib/club/health/schakelaar'
import { haalKoppelingenPubliek, haalMetingen, haalToestemming } from '@/lib/club/health/opslag'
import { providerKaarten, VIA_TELEFOON } from '@/lib/club/health/providers'
import { TOESTEMMING_TEKST, TOESTEMMING_VERSIE } from '@/lib/club/health/toestemming'
import { laatstePerSoort } from '@/lib/club/health/metingen'
import { isBronId } from '@/lib/club/health/typen'
import { LedenappSchil } from '@/components/club/ledenlogin/LedenappSchil'
import { LedenappScherm } from '@/components/club/ledenlogin/LedenappScherm'
import { KoppelingenScherm } from '@/components/club/health/KoppelingenScherm'

// /mijn/koppelingen: weegschalen, horloges en sportapps koppelen, de
// toestemming per soort en de laatste metingen. Het lid komt uit de eigen
// sessie; alleen Kane kijkt met ?lid=<id> mee (alleen lezen). Met
// CLUB_HEALTH_ACTIEF uit bestaat de pagina niet (404).

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Koppelingen', robots: { index: false, follow: false } }

type Zoek = Promise<Record<string, string | string[] | undefined>>

function eerste(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export default async function KoppelingenPagina({ searchParams }: { searchParams: Zoek }) {
  if (!healthActief()) notFound()
  const zoek = await searchParams
  const l = await lidToegang(eerste(zoek.lid) ?? null)
  if (!l) {
    if (CLUB_LEDEN_LOGIN) redirect('/mijn/inloggen')
    notFound()
  }
  const { organisatie: org, lid } = l
  const voor = l.voorvertoning ? lid.id : null
  const tabPad = (tab: string) => {
    const vraag = new URLSearchParams(voor ? { lid: voor } : {})
    if (tab !== 'home') vraag.set('tab', tab)
    const tekst = vraag.toString()
    return tekst ? `/mijn?${tekst}` : '/mijn'
  }
  const [koppelingen, toestemming, metingen] = await Promise.all([
    haalKoppelingenPubliek(l.admin, l.userId, lid.id),
    haalToestemming(l.admin, l.userId, lid.id),
    haalMetingen(l.admin, l.userId, lid.id, { limiet: 300 }),
  ])
  const gekoppeld = eerste(zoek.gekoppeld)
  const fout = eerste(zoek.fout)

  return (
    <LedenappSchil organisatie={org}>
      <LedenappScherm
        tab={null}
        tabPad={tabPad}
        merkNaam={org.naam}
        merkLogo={l.merk.logoUrl}
        fitFactory={org.logo === LOGO_FIT_FACTORY}
        tabsUit={tabsUitVoor(org)}
        voorvertoningNaam={l.voorvertoning ? volledigeNaam(lid) : null}
      >
        <div className="club-lidapp-tab">
          <Link href={tabPad('profiel')} className="club-lidapp-knop club-lidapp-knop--stil" prefetch={false}>
            <ArrowLeft size={18} aria-hidden /> Profiel
          </Link>
        </div>
        {koppelingen && toestemming && metingen ? (
          <KoppelingenScherm
            data={{ providers: providerKaarten(), koppelingen, toestemming, tekst: { versie: TOESTEMMING_VERSIE, regels: TOESTEMMING_TEKST }, laatste: laatstePerSoort(metingen), viaTelefoon: VIA_TELEFOON }}
            sportschool={org.naam}
            voor={voor}
            alleenLezen={l.voorvertoning}
            melding={{ gekoppeld: isBronId(gekoppeld) ? gekoppeld : null, fout: typeof fout === 'string' && fout.length <= 30 ? fout : null }}
          />
        ) : (
          <p className="club-lidapp-bericht club-lidapp-bericht--fout" role="alert">
            Je koppelingen konden niet worden geladen. Probeer het straks opnieuw.
          </p>
        )}
      </LedenappScherm>
    </LedenappSchil>
  )
}
