import { notFound, redirect } from 'next/navigation'
import { lidToegang } from '@/lib/club/ledenlogin/toegang'
import { pakketZichtbaar } from '@/lib/club/kern/pakketten'
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
import { haalVoedingRegels } from '@/lib/club/voeding/eigen-opslag'
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
import { Dagboek } from '@/components/club/voeding/dagboek/Dagboek'
import { haalDagboekApp } from '@/lib/club/voeding/dagboek/app'
import { aiFuncties } from '@/lib/club/voeding/dagboek/ai/schakelaar'
import { dagSleutelNl } from '@/lib/club/kern/datum'
import { VOEDING_DAGBOEK } from '@/lib/aiyourgym/taal/woorden/club/voeding-dagboek'
import { SluitingenBinnenkort } from '@/components/club/sluiting/SluitingenBinnenkort'
import { LedenappSchil } from '@/components/club/ledenlogin/LedenappSchil'
import { LedenappScherm } from '@/components/club/ledenlogin/LedenappScherm'
import { UitlogKnoppen } from '@/components/club/ledenlogin/UitlogKnoppen'
import { WachtwoordFormulier } from '@/components/club/ledenlogin/WachtwoordFormulier'
import { normaalEmail } from '@/lib/club/kern/wachtwoord-regels'
import { CommunityProfielBlok } from '@/components/club/community/CommunityProfielBlok'
import { KoppelingenProfielLink } from '@/components/club/health/KoppelingenProfielLink'
import { InstalleerHulp } from '@/components/club/ledenapp-pwa/InstalleerHulp'
import { tabsUitVoor } from '@/lib/club/ledenlogin/tabs'
import { lidVoorApp } from '@/lib/club/ledenlogin/lid-voor-app'
import { haalVestigingContact } from '@/lib/club/ledenlogin/vestiging-contact'
import { haalLedenappMeldingen } from '@/lib/club/meldingen/opslag'
import { LedenappMeldingen } from '@/components/club/meldingen/LedenappMeldingen'
import { MeldingenBel } from '@/components/club/ledenlogin/MeldingenBel'
import { HulpSportschool } from '@/components/club/ledenlogin/HulpSportschool'
import { haalKopenVoorLid } from '@/lib/club/betalen/ledenapp'
import { KopenBlok, LedenappKopen } from '@/components/club/betalen/LedenappKopen'
import { PushMeldingen } from '@/components/club/ledenapp-pwa/PushMeldingen'
import { publiekeSleutelVoorApp } from '@/lib/club/push/sleutels'
import { pushSessieMerk } from '@/lib/club/push/sessie-merk'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { LEDENAPP } from '@/lib/aiyourgym/taal/woorden/ledenapp/app'
import { haalFotoInfo, haalMedewerkerKaartje } from '@/lib/club/profielfoto/opslag'
import { WelkomKaarten } from '@/components/club/welkom/WelkomKaarten'
import { WELKOM } from '@/lib/aiyourgym/taal/woorden/club/welkom'
import { ledenWelkomSleutel, uitlegCode } from '@/lib/club/rollen/welkom'
import { haalGezien } from '@/lib/club/uitleg/opslag'
import { haalLaatsteIntake } from '@/lib/club/nieuwe-leden/intake-opslag'
import { IntakeKaart } from '@/components/club/aanmelden/IntakeKaart'

// /mijn: de ledenapp. Het lid komt uit de eigen sessie; alleen Kane kan met
// ?lid=<id> meekijken als voorvertoning. Wie geen van beide is: met de
// schakelaar aan naar de inlogpagina, anders een gewone 404.
// Alleen wat het lid zelf mag zien gaat naar de app (geen bloeddruk, hartslag,
// notities van trainers of gegevens van andere leden). Componenten krijgen een
// slank LidVoorApp, nooit het volledige Lid.
// ?tab=meldingen opent de meldingen (via de bel in de kop, niet in de onderbalk):
// de lijst en meldingen op je telefoon aan of uit, op een plek. Een plek per
// ding: kopen via het blok op Home, de community via Profiel, meldingen via de bel.

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
  // ?tab=kopen: betalen in de ledenapp (via het blok op Home, niet in de onderbalk).
  const toonKopen = !toonMeldingen && eerste(zoek.tab) === 'kopen'
  const apart = toonMeldingen || toonKopen
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
  // Alles tegelijk: de basis, de meldingen en wat alleen het open tabblad nodig heeft.
  // voeding: null = leesfout (nette melding), undefined = nog geen plan.
  const [data, bedrijf, berichten, meldingen, ruweVoortgang, challenges, ruwPlan, contact] = await Promise.all([
    haalLidApp(admin, userId, lid, nu),
    haalBedrijf(admin, userId),
    haalBerichtenVoorLid(admin, userId, lid, nu),
    // Meldingen voor de bel (aantal ongelezen) en het meldingenscherm; null bij een leesfout.
    haalLedenappMeldingen(admin, userId, lid.id),
    tab === 'voortgang' ? haalVoortgang(admin, userId, lid.id, nu) : null,
    // Challenges en community horen bij het pakket Groei (kern/pakketten.ts).
    tab === 'voortgang' && pakketZichtbaar(l.organisatie.uit, 'groei') ? haalLedenappChallenges(admin, userId, lid, nu) : null,
    tab === 'voeding' ? haalPlan(admin, userId, lid.id) : null,
    tab === 'profiel' && !apart ? haalVestigingContact(admin, userId, lid.vestiging, vestigingNaam) : null,
  ])
  const voortgang = ruweVoortgang ? voortgangVoorLid(ruweVoortgang) : null
  const voeding = tab === 'voeding' ? voedingVoorApp(ruwPlan) : null
  // Mag het lid het plan van de trainer zelf overschrijven? Bij een leesfout: nee (de server beslist toch).
  const voedingRegels = tab === 'voeding' && !apart ? await haalVoedingRegels(admin, userId) : null
  // Het voedingsdagboek (migratie 466); doelen uit het plan van de coach als dat er is.
  const dagboek = !apart && tab === 'voeding' ? await haalDagboekApp(admin, userId, lid.id, { vandaag: dagSleutelNl(nu), plan: voeding?.staat === 'plan' ? voeding.plan : null, ai: aiFuncties() }) : null
  const ongelezen = (meldingen ?? []).filter((m) => !m.gelezen).length
  // Betalen in de ledenapp (null = uit bij deze sportschool of CLUB_BETALEN_ACTIEF uit).
  const kopen = toonKopen || (!apart && (tab === 'home' || tab === 'lessen')) ? await haalKopenVoorLid(admin, userId, lid, nu) : null
  const metVoor = (pad: string) => (l.voorvertoning ? `${pad}?voor=${encodeURIComponent(lid.id)}` : pad)
  const kopenTerug = eerste(zoek.betaald) === '1' ? 'betaald' : eerste(zoek.geannuleerd) === '1' ? 'geannuleerd' : null
  // Web push: alleen met CLUB_PUSH_ACTIEF=1 en kloppende sleutels, anders geen knop.
  const pushSleutel = publiekeSleutelVoorApp(process.env)
  const pushMerk = pushSessieMerk(l.sessieHash)
  const taal = await getTaal()
  // Eerste-keer-uitleg per account weggeklikt (migratie 476)? Alleen op Home nodig.
  const uitlegGezien = tab === 'home' && !l.voorvertoning ? (await haalGezien(admin, userId, { soort: 'lid', id: lid.id })).includes(uitlegCode('leden')) : false
  const t = LEDENAPP[taal]
  // Profielfoto: zette de sportschool hem (met toestemming), dan zegt het profiel dat.
  const fotoInfo = tab === 'profiel' && lid.foto ? await haalFotoInfo(admin, { userId, soort: 'lid', id: lid.id }) : null
  const coach = !apart && tab === 'home' ? await haalMedewerkerKaartje(admin, userId, lid.coachId) : null
  // Nog geen intake (pakket Training en coaching): op Home de kaart om hem zelf in te vullen.
  const intakeOpen = !apart && tab === 'home' && pakketZichtbaar(org.uit, 'training') ? (await haalLaatsteIntake(admin, userId, lid.id)) === null : false
  const intakePad = l.voorvertoning ? `/mijn/intake?lid=${encodeURIComponent(lid.id)}` : '/mijn/intake'
  const fotoBron = { waar: 'lid' as const, voor: l.voorvertoning ? lid.id : null }

  return (
    <LedenappSchil organisatie={org}>
      <LedenApiProvider voor={l.voorvertoning ? lid.id : null}>
        <LedenappScherm
          tab={apart ? null : tab}
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
              {m}{' '}
              {/* Een gewone link: laadt dit scherm opnieuw, ook in de web-app zonder vernieuwknop. */}
              <a href={tabPad(toonMeldingen ? 'meldingen' : toonKopen ? 'kopen' : tab)} className="club-mijn-opnieuw">
                {t.algemeen.opnieuwLaden}
              </a>
            </p>
          ))}
          {toonMeldingen && (
            <div className="club-lidapp-tab">
              <h2 className="club-lidapp-kop">{t.mijn.meldingen}</h2>
              {/* Alles over meldingen op een plek: de lijst en meldingen op je telefoon aan of uit. */}
              {pushSleutel && (
                <div className="club-mijn-blok">
                  <PushMeldingen sleutel={pushSleutel} merk={pushMerk} variant="profiel" voorvertoning={l.voorvertoning} />
                </div>
              )}
              {meldingen ? (
                <LedenappMeldingen meldingen={meldingen} gelezenUrl={l.voorvertoning ? undefined : '/api/club/lid/meldingen/gelezen'} nu={nu.toISOString()} />
              ) : (
                <p className="club-melding club-melding--fout" role="alert">
                  {t.mijn.meldingenFout}
                </p>
              )}
            </div>
          )}
          {toonKopen &&
            (kopen === 'fout' ? (
              <p className="club-melding club-melding--fout club-mijn-blok" role="alert">{t.mijn.kopenFout}</p>
            ) : kopen ? (
              <LedenappKopen producten={kopen.producten} strippen={kopen.strippen} ptSessies={kopen.ptSessies} open={kopen.open} kopenUrl={metVoor('/api/club/lid/betalen/kopen')} voorvertoning={l.voorvertoning} terug={kopenTerug} sportschool={org.naam} />
            ) : (
              <p className="club-melding club-mijn-blok" role="status">{t.mijn.kopenUit(org.naam)}</p>
            ))}
          {!apart && tab === 'home' && (
            <>
              {/* Eerste keer: drie korte kaarten (Lessen, Schema, Profiel); een tabblad dat uit staat valt weg. */}
              {intakeOpen && <IntakeKaart href={intakePad} taal={taal} />}
              {!uitlegGezien && <WelkomKaarten
                sleutel={ledenWelkomSleutel(lid.id)}
                opslaan={l.voorvertoning ? null : { url: '/api/club/lid/uitleg', code: uitlegCode('leden') }}
                kaarten={(['lessen', 'schema', 'profiel'] as const).flatMap((doel, i) => ((tabsUit as readonly string[]).includes(doel) ? [] : [{ ...WELKOM[taal].leden[i], href: tabPad(doel) }]))}
              />}
              <div className="club-mijn-blok">
                <SluitingenBinnenkort admin={admin} userId={userId} vestiging={lid.vestiging} variant="app" />
              </div>
              {/* Zachte vraag om meldingen, pas na de eerste boeking. */}
              {data.lessen.some((les) => les.mijn !== null) && (
                <div className="club-mijn-blok club-push-blok">
                  <PushMeldingen sleutel={pushSleutel} merk={pushMerk} variant="home" voorvertoning={l.voorvertoning} />
                </div>
              )}
              {kopen && kopen !== 'fout' && <KopenBlok href={tabPad('kopen')} strippen={kopen.strippen} />}
              <HomeTab lid={appLid} data={data} nu={nu} tabPad={tabPad} instellingen={{ ...appInstellingen, tabsUit: tabsUit as typeof appInstellingen.tabsUit, qr: appInstellingen.qr && qrCheckinAan(org.instellingen.checkin) && !org.uit.includes('checkin') }} berichten={berichten ?? []} coach={coach} fotoBron={fotoBron} />
            </>
          )}
          {!apart && tab === 'lessen' && <LessenTab lidId={lid.id} lessen={data.lessen} regels={data.regels} nu={nu.toISOString()} strippenkaart={kopen && kopen !== 'fout' && !l.voorvertoning ? { saldo: kopen.strippen, url: metVoor('/api/club/lid/betalen/strippenkaart') } : undefined} />}
          {!apart && tab === 'schema' && <SchemaTab lidId={lid.id} schema={data.schema} logs={data.logs} historie={data.historie} nu={nu.toISOString()} />}
          {!apart && tab === 'voeding' && voeding && (
            <div className="club-lidapp-tab">
              <LedenappVoeding
                plan={voeding.staat === 'plan' ? voeding.plan : null}
                fout={voeding.staat === 'fout'}
                eigen={{ regels: voedingRegels ?? { ledenOverschrijven: false }, voor: l.voorvertoning ? lid.id : null, alleenLezen: l.voorvertoning }}
                dagboek={
                  dagboek ? (
                    <Dagboek start={dagboek} voor={l.voorvertoning ? lid.id : null} alleenLezen={l.voorvertoning} sportschool={org.naam} />
                  ) : (
                    <p className="club-melding club-melding--fout" role="alert">{VOEDING_DAGBOEK[taal].fout.laden}</p>
                  )
                }
              />
            </div>
          )}
          {!apart && tab === 'afspraken' && (
            <div className="club-lidapp-tab">
              <h2 className="club-lidapp-kop">{t.tabs.afspraken}</h2>
              <LedenappAfspraken lidId={lid.id} />
            </div>
          )}
          {!apart && tab === 'voortgang' && voortgang && (
            <div className="club-lidapp-tab">
              <LedenappVoortgang voortgang={voortgang} nu={nu.toISOString()} />
              {challenges && <LedenappChallenges data={challenges} />}
            </div>
          )}
          {!apart && tab === 'profiel' && (
            <>
              <ProfielTab
                lid={appLid}
                vestigingNaam={vestigingNaam}
                teksten={bedrijf?.teksten ?? null}
                sportschool={org.naam}
                hulp={contact ? <HulpSportschool contact={contact} /> : null}
                pilotNoot={false}
                foto={{ waar: 'lid', voor: l.voorvertoning ? lid.id : null, bewerkbaar: !l.voorvertoning, door: fotoInfo?.bron === 'sportschool' ? fotoInfo.toegevoegdDoor : null }}
              />
              {pakketZichtbaar(l.organisatie.uit, 'groei') && <CommunityProfielBlok admin={admin} userId={userId} lidId={lid.id} voorvertoning={l.voorvertoning} />}
              <KoppelingenProfielLink voorvertoningLid={l.voorvertoning ? lid.id : null} />
              {l.account && !l.account.wachtwoordHash && (
                <section className="club-mijn-blok" aria-labelledby="mijn-wachtwoord">
                  <h3 id="mijn-wachtwoord">{t.profiel.wachtwoordKop}</h3>
                  <p className="club-mijn-veld-hint">{t.profiel.wachtwoordUitleg}</p>
                  <WachtwoordFormulier code={null} standaardEmail={l.account.email ?? normaalEmail(lid.email)} naam={volledigeNaam(lid)} knop={t.profiel.wachtwoordKnop} />
                </section>
              )}
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
