import { tabsUitVoor } from '@/lib/club/ledenlogin/tabs'
import type { Metadata } from 'next'
import { eisModule, type ClubToegang } from '@/lib/club/toegang'
import { LOGO_FIT_FACTORY, moduleAan } from '@/lib/club/kern/organisatie'
import { clubPad, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import Link from 'next/link'
import { Printer, Send, Settings2 } from 'lucide-react'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { instelHref, instelPagina, instelPaginaInTaal, magInstelPagina } from '@/lib/club/kern/instel-paginas'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { APP_PAGINA } from '@/lib/aiyourgym/taal/woorden/club/app-pagina'
import { instelKijker } from '@/lib/club/instel-toegang'
import { magTrainen, volledigeNaam, zoekLeden } from '@/lib/club/kern/lid'
import { haalLidApp } from '@/lib/club/app/data'
import { qrCheckinAan } from '@/lib/club/kern/org-instellingen'
import { AppUitleg } from '@/components/club/app/AppUitleg'
import { HomeTab } from '@/components/club/app/HomeTab'
import { LessenTab } from '@/components/club/app/LessenTab'
import { LidKiezer } from '@/components/club/app/LidKiezer'
import { ProfielTab } from '@/components/club/app/ProfielTab'
import { haalBedrijf } from '@/lib/club/bedrijf/opslag'
import { SchemaTab } from '@/components/club/app/SchemaTab'
import { kiesTab, Toestel, type AppTab } from '@/components/club/app/Toestel'
import '@/components/club/app/app.css'
import { haalBerichtenVoorLid } from '@/lib/club/berichten/data'
import { SluitingenBinnenkort } from '@/components/club/sluiting/SluitingenBinnenkort'
import { haalVoortgang } from '@/lib/club/voortgang/data'
import { LedenappAfspraken } from '@/components/club/afspraken/LedenappAfspraken'
import { voortgangVoorLid } from '@/lib/club/voortgang/lid'
import { LedenappVoortgang } from '@/components/club/voortgang/LedenappVoortgang'
import { haalLedenappChallenges } from '@/lib/club/challenges/ledenapp'
import { LedenappChallenges } from '@/components/club/challenges/LedenappChallenges'
import { haalPlan } from '@/lib/club/voeding/lezen'
import { voedingVoorApp } from '@/lib/club/voeding/model'
import { LedenappVoeding } from '@/components/club/voeding/LedenappVoeding'

// Ledenapp: voorvertoning van de app zoals een lid hem op zijn telefoon ziet.
// Kies een (demo)lid; tabblad en lid staan in de URL. Dit is Ledenapp in de
// hulpbalk onderaan: bovenaan ook de poster met QR-code, leden uitnodigen (de
// activatielink per lid) en de instellingen van de app, voor wie dat mag.

/** De knoppen naar de poster, het uitnodigen en de instellingen; alleen wat deze persoon mag. */
async function LedenappActies({ t, vestiging }: { t: ClubToegang; vestiging: string }) {
  const tekst = await clubTekst(APP_PAGINA)
  const taal = await getTaal()
  const leden = moduleAan(t.organisatie, 'leden') && magOnderdeel(t.onderdelen, 'leden')
  const instel = instelPagina('ledenapp')
  const magInstellen = instel ? magInstelPagina(instel, instelKijker(t)) : false
  if (!leden && !magInstellen) return null
  return (
    <div className="club-acties" aria-label={tekst.acties}>
      {leden && (
        <>
          <Link href={clubPad('/leden/app-poster', vestiging)} className="club-knop club-knop--klein"><Printer size={15} aria-hidden /> {tekst.poster}</Link>
          <Link href={clubPad('/leden', vestiging)} className="club-knop club-knop--klein" title={tekst.uitnodigenUitleg}><Send size={15} aria-hidden /> {tekst.uitnodigen}</Link>
        </>
      )}
      {instel && magInstellen && <Link href={instelHref(instel, vestiging)} className="club-knop club-knop--klein"><Settings2 size={15} aria-hidden /> {instelPaginaInTaal(instel, taal).titel}</Link>}
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(APP_PAGINA)).titel }
}

export default async function ClubLedenapp({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('app')
  const zoek = await searchParams
  const vestiging = kiesUit(t.vestigingen, zoek.v)
  if (!vestiging) return <GeenVestigingen />
  const tekst = await clubTekst(APP_PAGINA)
  const appInstellingen = t.organisatie.instellingen.ledenapp
  // Tabbladen die uit staan: zelf uitgezet, het onderdeel staat uit of het pakket is niet afgenomen (zelfde regel als de echte ledenapp).
  const tabsUit: string[] = tabsUitVoor(t.organisatie)
  const gekozenTab = kiesTab(zoek.tab)
  // Een tabblad dat uit staat bestaat niet: dan Home.
  const tab = tabsUit.includes(gekozenTab) ? 'home' : gekozenTab
  const [leden, schemas] = await Promise.all([
    zoekLeden(t.admin, t.userId, vestiging, '', 200),
    t.admin.from('club_schemas').select('lid_id').eq('user_id', t.userId).eq('status', 'actief').not('lid_id', 'is', null).limit(1000),
  ])
  const metSchema = new Set((schemas.data ?? []).map((r: { lid_id: unknown }) => r.lid_id).filter((id): id is string => typeof id === 'string'))
  const kandidaten = (leden ?? []).filter((l) => magTrainen(l.status))
  const opties = [...kandidaten].sort((a, b) => Number(metSchema.has(b.id)) - Number(metSchema.has(a.id)))
  const gevraagd = Array.isArray(zoek.lid) ? zoek.lid[0] : zoek.lid
  const lid = opties.find((l) => l.id === gevraagd) ?? opties[0]

  const kop = (
    <>
    <header className="club-paginakop">
      <div>
        <p className="club-boventitel">{naamVan(t.vestigingen, vestiging)} · {tekst.voorvertoning}</p>
        <h1>{tekst.titel}</h1>
        <p>{tekst.intro}</p>
      </div>
      <LedenappActies t={t} vestiging={vestiging} />
      {lid && (
        <LidKiezer
          opties={opties.map((l) => ({ id: l.id, naam: volledigeNaam(l), heeftSchema: metSchema.has(l.id) }))}
          gekozen={lid.id}
          basisPad={clubPad('/app', vestiging, { tab })}
        />
      )}
    </header>
    </>
  )
  if (!lid) {
    return (
      <>
        {kop}
        <p className="club-leeg">{leden === null ? tekst.ledenFout : tekst.geenLeden}</p>
      </>
    )
  }

  const nu = new Date()
  // Alleen wat het lid zelf mag zien gaat naar de app (geen bloeddruk, hartslag of notities).
  const [data, bedrijf, berichten, ruweVoortgang, challenges, ruwPlan] = await Promise.all([
    haalLidApp(t.admin, t.userId, lid, nu),
    haalBedrijf(t.admin, t.userId),
    haalBerichtenVoorLid(t.admin, t.userId, lid, nu),
    tab === 'voortgang' ? haalVoortgang(t.admin, t.userId, lid.id, nu) : null,
    tab === 'voortgang' ? haalLedenappChallenges(t.admin, t.userId, lid, nu) : null,
    tab === 'voeding' ? haalPlan(t.admin, t.userId, lid.id) : null,
  ])
  const voortgang = ruweVoortgang ? voortgangVoorLid(ruweVoortgang) : null
  const voeding = tab === 'voeding' ? voedingVoorApp(ruwPlan) : null
  const tabPad = (nieuw: AppTab | string) => clubPad('/app', vestiging, { lid: lid.id, tab: nieuw })
  return (
    <>
      {kop}
      {data.meldingen.map((m) => (
        <p key={m} className="club-melding club-melding--fout" role="status">
          {m}
        </p>
      ))}
      <div className="club-lidapp-podium">
        <Toestel
          tab={tab}
          nu={nu}
          tabPad={tabPad}
          merkNaam={t.organisatie.naam}
          fitFactory={t.organisatie.logo === LOGO_FIT_FACTORY}
          merkLogo={t.organisatie.logo && t.organisatie.logo !== LOGO_FIT_FACTORY ? `/api/club/organisatie/logo?pad=${encodeURIComponent(t.organisatie.logo)}` : null}
          tabsUit={tabsUit}
        >
          {tab === 'home' && (
            <>
              <SluitingenBinnenkort admin={t.admin} userId={t.userId} vestiging={lid.vestiging} variant="app" />
              <HomeTab lid={lid} data={data} nu={nu} tabPad={tabPad} instellingen={{ ...appInstellingen, tabsUit: tabsUit as typeof appInstellingen.tabsUit, qr: appInstellingen.qr && qrCheckinAan(t.organisatie.instellingen.checkin) && !t.organisatie.uit.includes('checkin') }} berichten={berichten ?? []} />
            </>
          )}
          {tab === 'lessen' && <LessenTab lidId={lid.id} lessen={data.lessen} regels={data.regels} nu={nu.toISOString()} />}
          {tab === 'schema' && <SchemaTab lidId={lid.id} schema={data.schema} logs={data.logs} historie={data.historie} nu={nu.toISOString()} />}
          {tab === 'voeding' && (
            <div className="club-lidapp-tab">
              {voeding && <LedenappVoeding plan={voeding.staat === 'plan' ? voeding.plan : null} fout={voeding.staat === 'fout'} />}
            </div>
          )}
          {tab === 'afspraken' && (
            <div className="club-lidapp-tab">
              <h2 className="club-lidapp-kop">{tekst.afspraken}</h2>
              <LedenappAfspraken lidId={lid.id} />
            </div>
          )}
          {tab === 'voortgang' && voortgang && (
            <div className="club-lidapp-tab">
              <LedenappVoortgang voortgang={voortgang} nu={nu.toISOString()} />
              {challenges && <LedenappChallenges data={challenges} />}
            </div>
          )}
          {tab === 'profiel' && <ProfielTab lid={lid} vestigingNaam={naamVan(t.vestigingen, lid.vestiging)} teksten={bedrijf?.teksten ?? null} sportschool={t.organisatie.naam} />}
        </Toestel>
        <AppUitleg regels={data.regels} />
      </div>
    </>
  )
}
