import { notFound, redirect } from 'next/navigation'
import { lidToegang } from '@/lib/club/ledenlogin/toegang'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { LOGO_FIT_FACTORY } from '@/lib/club/kern/organisatie'
import { naamVan } from '@/lib/club/kern/vestigingen'
import { volledigeNaam } from '@/lib/club/kern/lid'
import { haalLidApp } from '@/lib/club/app/data'
import { qrCheckinAan } from '@/lib/club/kern/org-instellingen'
import { haalBedrijf } from '@/lib/club/bedrijf/opslag'
import { haalBerichtenVoorLid } from '@/lib/club/berichten/data'
import { haalVoortgang } from '@/lib/club/voortgang/data'
import { voortgangVoorLid } from '@/lib/club/voortgang/lid'
import { haalLedenappChallenges } from '@/lib/club/challenges/ledenapp'
import { haalPlan } from '@/lib/club/voeding/lezen'
import { voedingVoorApp } from '@/lib/club/voeding/model'
import { kiesTab, type AppTab } from '@/components/club/app/Toestel'
import { HomeTab } from '@/components/club/app/HomeTab'
import { LessenTab } from '@/components/club/app/LessenTab'
import { SchemaTab } from '@/components/club/app/SchemaTab'
import { ProfielTab } from '@/components/club/app/ProfielTab'
import { LedenApiProvider } from '@/components/club/app/LedenappApi'
import { LedenappAfspraken } from '@/components/club/afspraken/LedenappAfspraken'
import { LedenappVoortgang } from '@/components/club/voortgang/LedenappVoortgang'
import { LedenappChallenges } from '@/components/club/challenges/LedenappChallenges'
import { LedenappVoeding } from '@/components/club/voeding/LedenappVoeding'
import { SluitingenBinnenkort } from '@/components/club/sluiting/SluitingenBinnenkort'
import { LedenappSchil } from '@/components/club/ledenlogin/LedenappSchil'
import { LedenappScherm } from '@/components/club/ledenlogin/LedenappScherm'
import { UitlogKnoppen } from '@/components/club/ledenlogin/UitlogKnoppen'
import { InstalleerHulp } from '@/components/club/ledenapp-pwa/InstalleerHulp'
import { tabsUitVoor } from '@/lib/club/ledenlogin/tabs'
import { lidVoorApp } from '@/lib/club/ledenlogin/lid-voor-app'
import { haalVestigingContact } from '@/lib/club/ledenlogin/vestiging-contact'
import { haalLedenappMeldingen } from '@/lib/club/meldingen/opslag'
import { LedenappMeldingen } from '@/components/club/meldingen/LedenappMeldingen'
import { MeldingenBel } from '@/components/club/ledenlogin/MeldingenBel'
import { HulpSportschool } from '@/components/club/ledenlogin/HulpSportschool'

// /mijn: de ledenapp. Het lid komt uit de eigen sessie; alleen Kane kan met
// ?lid=<id> meekijken als voorvertoning. Wie geen van beide is: met de
// schakelaar aan naar de inlogpagina, anders een gewone 404.
// Alleen wat het lid zelf mag zien gaat naar de app (geen bloeddruk, hartslag,
// notities van trainers of gegevens van andere leden). Componenten krijgen een
// slank LidVoorApp, nooit het volledige Lid.
// ?tab=meldingen opent de meldingen (via de bel in de kop, niet in de onderbalk).

export const dynamic = 'force-dynamic'

type Zoek = Promise<Record<string, string | string[] | undefined>>

function eerste(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export default async function MijnLedenapp({ searchParams }: { searchParams: Zoek }) {
  const zoek = await searchParams
  const l = await lidToegang(eerste(zoek.lid) ?? null)
  if (!l) {
    if (CLUB_LEDEN_LOGIN) redirect('/mijn/inloggen')
    notFound()
  }
  const { admin, userId, organisatie: org, lid } = l
  const appInstellingen = org.instellingen.ledenapp
  const tabsUit = tabsUitVoor(org)
  const gekozen = kiesTab(zoek.tab)
  const tab: AppTab = tabsUit.includes(gekozen) ? 'home' : gekozen
  const toonMeldingen = eerste(zoek.tab) === 'meldingen'
  const appLid = lidVoorApp(lid)
  const vestigingNaam = naamVan(l.vestigingen, lid.vestiging)
  // In de voorvertoning blijft het lid in elke link staan; voor een lid nooit.
  const tabPad = (nieuw: AppTab | string) => {
    const vraag = new URLSearchParams(l.voorvertoning ? { lid: lid.id } : {})
    if (nieuw !== 'home') vraag.set('tab', nieuw)
    const tekst = vraag.toString()
    return tekst ? `/mijn?${tekst}` : '/mijn'
  }

  const nu = new Date()
  const [data, bedrijf, berichten] = await Promise.all([haalLidApp(admin, userId, lid, nu), haalBedrijf(admin, userId), haalBerichtenVoorLid(admin, userId, lid, nu)])
  const voortgang = tab === 'voortgang' ? voortgangVoorLid(await haalVoortgang(admin, userId, lid.id, nu)) : null
  const challenges = tab === 'voortgang' ? await haalLedenappChallenges(admin, userId, lid, nu) : null
  // null = leesfout (nette melding), undefined = nog geen plan.
  const voeding = tab === 'voeding' ? voedingVoorApp(await haalPlan(admin, userId, lid.id)) : null
  // Meldingen voor de bel (aantal ongelezen) en het meldingenscherm; null bij een leesfout.
  const meldingen = await haalLedenappMeldingen(admin, userId, lid.id)
  const ongelezen = (meldingen ?? []).filter((m) => !m.gelezen).length
  const contact = tab === 'profiel' && !toonMeldingen ? await haalVestigingContact(admin, userId, lid.vestiging, vestigingNaam) : null

  return (
    <LedenappSchil organisatie={org}>
      <LedenApiProvider voor={l.voorvertoning ? lid.id : null}>
        <LedenappScherm
          tab={toonMeldingen ? null : tab}
          tabPad={tabPad}
          merkNaam={org.naam}
          merkLogo={l.merk.logoUrl}
          fitFactory={org.logo === LOGO_FIT_FACTORY}
          tabsUit={tabsUit}
          voorvertoningNaam={l.voorvertoning ? volledigeNaam(lid) : null}
          kopActie={<MeldingenBel href={tabPad('meldingen')} ongelezen={toonMeldingen ? 0 : ongelezen} open={toonMeldingen} />}
        >
          {data.meldingen.map((m) => (
            <p key={m} className="club-melding club-melding--fout club-mijn-blok" role="status">
              {m}
            </p>
          ))}
          {toonMeldingen && (
            <div className="club-lidapp-tab">
              <h2 className="club-lidapp-kop">Meldingen</h2>
              {meldingen ? (
                <LedenappMeldingen meldingen={meldingen} gelezenUrl={l.voorvertoning ? undefined : '/api/club/lid/meldingen/gelezen'} nu={nu.toISOString()} />
              ) : (
                <p className="club-melding club-melding--fout" role="alert">
                  De meldingen konden niet worden geladen. Probeer het straks opnieuw.
                </p>
              )}
            </div>
          )}
          {!toonMeldingen && tab === 'home' && (
            <>
              <div className="club-mijn-blok">
                <SluitingenBinnenkort admin={admin} userId={userId} vestiging={lid.vestiging} variant="app" />
              </div>
              <HomeTab lid={appLid} data={data} nu={nu} tabPad={tabPad} instellingen={{ ...appInstellingen, tabsUit: tabsUit as typeof appInstellingen.tabsUit, qr: appInstellingen.qr && qrCheckinAan(org.instellingen.checkin) }} berichten={berichten ?? []} />
            </>
          )}
          {!toonMeldingen && tab === 'lessen' && <LessenTab lidId={lid.id} lessen={data.lessen} regels={data.regels} nu={nu.toISOString()} />}
          {!toonMeldingen && tab === 'schema' && <SchemaTab lidId={lid.id} schema={data.schema} logs={data.logs} nu={nu.toISOString()} />}
          {!toonMeldingen && tab === 'voeding' && voeding && (
            <div className="club-lidapp-tab">
              <LedenappVoeding plan={voeding.staat === 'plan' ? voeding.plan : null} fout={voeding.staat === 'fout'} />
            </div>
          )}
          {!toonMeldingen && tab === 'afspraken' && (
            <div className="club-lidapp-tab">
              <h2 className="club-lidapp-kop">Afspraken</h2>
              <LedenappAfspraken lidId={lid.id} />
            </div>
          )}
          {!toonMeldingen && tab === 'voortgang' && voortgang && (
            <div className="club-lidapp-tab">
              <h2 className="club-lidapp-kop">Voortgang</h2>
              <LedenappVoortgang voortgang={voortgang} nu={nu.toISOString()} />
              {challenges && <LedenappChallenges data={challenges} />}
            </div>
          )}
          {!toonMeldingen && tab === 'profiel' && (
            <>
              <ProfielTab
                lid={appLid}
                vestigingNaam={vestigingNaam}
                teksten={bedrijf?.teksten ?? null}
                sportschool={org.naam}
                hulp={contact ? <HulpSportschool contact={contact} /> : null}
              />
              {!l.voorvertoning && (
                <div className="club-mijn-blok">
                  <UitlogKnoppen />
                </div>
              )}
            </>
          )}
        </LedenappScherm>
        {!l.voorvertoning && <InstalleerHulp naam={org.naam} />}
      </LedenApiProvider>
    </LedenappSchil>
  )
}
