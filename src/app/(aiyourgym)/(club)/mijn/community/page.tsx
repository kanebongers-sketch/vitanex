import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Lock, Users } from 'lucide-react'
import { lidToegang } from '@/lib/club/ledenlogin/toegang'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { tabsUitVoor } from '@/lib/club/ledenlogin/tabs'
import { LOGO_FIT_FACTORY, isUuid } from '@/lib/club/kern/organisatie'
import { volledigeNaam } from '@/lib/club/kern/lid'
import { haalCommunityOverzicht, haalGroepScherm } from '@/lib/club/community/lezen'
import { communityBasis } from '@/lib/club/community/paden'
import { LedenappSchil } from '@/components/club/ledenlogin/LedenappSchil'
import { LedenappScherm } from '@/components/club/ledenlogin/LedenappScherm'
import { GroepenLijst } from '@/components/club/community/GroepenLijst'
import { Activiteit } from '@/components/club/community/Activiteit'
import { RanglijstKeuze } from '@/components/club/community/RanglijstKeuze'
import { Tijdlijn } from '@/components/club/community/Tijdlijn'
import { GroepRanglijst } from '@/components/club/community/GroepRanglijst'
import { GroepLidKnop } from '@/components/club/community/GroepLidKnop'
import '@/components/club/community/community.css'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { COMMUNITY } from '@/lib/aiyourgym/taal/woorden/club/community'

// /mijn/community: groepen van de sportschool, met per groep een tijdlijn,
// reacties en een ranglijst. Het lid komt uit de eigen sessie; alleen Kane
// kijkt met ?lid=<id> mee (alleen lezen). ?groep=<id> opent een groep.
// Wie de app niet mag gebruiken: zoals /mijn (inloggen of 404).

export const dynamic = 'force-dynamic'
export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(COMMUNITY)).app.titel }
}

type Zoek = Promise<Record<string, string | string[] | undefined>>

function eerste(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

async function Fout() {
  const t = (await clubTekst(COMMUNITY)).app
  return (
    <p className="club-lidapp-bericht club-lidapp-bericht--fout" role="alert">
      {t.laadFout}
    </p>
  )
}

export default async function CommunityPagina({ searchParams }: { searchParams: Zoek }) {
  const zoek = await searchParams
  const l = await lidToegang(eerste(zoek.lid) ?? null)
  if (!l) {
    if (CLUB_LEDEN_LOGIN) redirect('/mijn/inloggen')
    notFound()
  }
  const { organisatie: org, lid } = l
  const basis = communityBasis(l.voorvertoning ? lid.id : null)
  const tabPad = (tab: string) => {
    const vraag = new URLSearchParams(l.voorvertoning ? { lid: lid.id } : {})
    if (tab !== 'home') vraag.set('tab', tab)
    const tekst = vraag.toString()
    return tekst ? `/mijn?${tekst}` : '/mijn'
  }
  const groepId = eerste(zoek.groep)
  const nu = new Date()
  const gevraagd = isUuid(groepId)
  const groep = gevraagd ? await haalGroepScherm(l, groepId, nu) : null
  const overzicht = groep && groep !== 'weg' ? null : await haalCommunityOverzicht(l)
  const tc = await clubTekst(COMMUNITY)
  const t = tc.app

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
        <div className="club-lidapp-tab club-cm">
          {groep && groep !== 'weg' ? (
            <>
              <Link href={basis} className="club-cm-terug" prefetch={false}>
                <ArrowLeft size={18} aria-hidden /> {t.alleGroepen}
              </Link>
              <header className="club-cm-groepkop">
                <p className="club-cm-soort">
                  {groep.groep.toegang === 'besloten' ? <Lock size={13} aria-hidden /> : <Users size={13} aria-hidden />} {tc.toegang[groep.groep.toegang].label} · {tc.leden(groep.leden)}
                </p>
                <h2 className="club-lidapp-kop">{groep.groep.naam}</h2>
                {groep.groep.uitleg && <p className="club-cm-uitleg">{groep.groep.uitleg}</p>}
              </header>
              {!l.voorvertoning && <GroepLidKnop groepId={groep.groep.id} groepNaam={groep.groep.naam} isLid={groep.isLid} terug={basis} besloten={groep.groep.toegang === 'besloten'} />}
              {groep.isLid && groep.ranglijst && <GroepRanglijst ranglijst={groep.ranglijst} />}
              {groep.isLid && (groep.tijdlijn ? <Tijdlijn groepId={groep.groep.id} groepNaam={groep.groep.naam} berichten={groep.tijdlijn} nu={nu.toISOString()} alleenLezen={l.voorvertoning} /> : <Fout />)}
              {!groep.isLid && <p className="club-cm-noot">{t.wordLidOmTeLezen}</p>}
            </>
          ) : (
            <>
              <header className="club-cm-kop">
                <h2 className="club-lidapp-kop">{t.titel}</h2>
                <p className="club-cm-uitleg">{t.uitleg(org.naam)}</p>
              </header>
              {gevraagd && groep === null && <Fout />}
              {groep === 'weg' && (
                <p className="club-lidapp-bericht club-lidapp-bericht--fout" role="status">
                  {t.groepWeg}
                </p>
              )}
              {overzicht ? (
                <>
                  <Activiteit items={overzicht.activiteit} nieuw={overzicht.nieuw} nu={nu.toISOString()} basis={basis} alleenLezen={l.voorvertoning} />
                  {overzicht.groepen.length > 0 ? (
                    <GroepenLijst groepen={overzicht.groepen} basis={basis} alleenLezen={l.voorvertoning} />
                  ) : (
                    <p className="club-cm-leeg">{t.geenGroepen}</p>
                  )}
                  <RanglijstKeuze aan={overzicht.opRanglijst} alleenLezen={l.voorvertoning} />
                  <p className="club-cm-noot">{t.sportief}</p>
                </>
              ) : (
                <Fout />
              )}
            </>
          )}
        </div>
      </LedenappScherm>
    </LedenappSchil>
  )
}
