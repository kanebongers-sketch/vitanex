import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { eisBeheerdersBeheer, type ClubToegang } from '@/lib/club/toegang'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { LOGO_FIT_FACTORY, moduleAan, type Organisatie } from '@/lib/club/kern/organisatie'
import { adresVan, sportschoolUrl } from '@/lib/club/kern/subdomein'
import { subdomeinenActief } from '@/lib/aiyourgym/schakelaar'
import { haalInstellingen } from '@/lib/club/instellingen/opslag'
import { heeftEigenOpeningstijden } from '@/lib/club/instellingen/vestigingen-invoer'
import { nlDelen } from '@/lib/club/rooster/tijd'
import { AANTAL_STAPPEN, NIEUWE_START, STAPPEN, aantalAf, isHervatten, moetNaarWizard, nogOpen, startPad, stapNummer, stapUitParam, stappenStand, streefStand, type StapSleutel, type StartFeiten, type StartVoortgang } from '@/lib/club/start/stappen'
import { bewaarStart, haalStart, haalStartFeiten, wizardPoortDicht } from '@/lib/club/start/opslag'
import { voorbeeldLes, voorstelLestypen, type BestaandeVestiging, type SportschoolSoort } from '@/lib/club/start/soorten'
import { ALLE_LESSEN, ALLE_LESTYPEN, VOORBEELD_LESTYPEN } from '@/lib/club/start/voorbeelden'
import { eersteDag, liveActies } from '@/lib/club/start/eerste-dag'
import { StartKader } from '@/components/club/start/StartKader'
import { StartVoet } from '@/components/club/start/StartVoet'
import { StapSoort } from '@/components/club/start/StapSoort'
import { StapHuisstijl } from '@/components/club/start/StapHuisstijl'
import { StapOnderdelen } from '@/components/club/start/StapOnderdelen'
import { StapLessen } from '@/components/club/start/StapLessen'
import { OnderdeelAan } from '@/components/club/start/OnderdeelAan'
import type { HuisstijlWaarden } from '@/components/club/huisstijl/HuisstijlPortaal'
import { StapKlaar, StapLedenInlezen } from '@/components/club/start/StapTeksten'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'
import { StapLive, type LiveAdressen } from '@/components/club/start/StapLive'
import { LedenAfronden } from '@/components/club/start/LedenAfronden'
import { StreefdatumKiezer } from '@/components/club/start/StreefdatumKiezer'
import { GeenVestiging, LaadFout, StapTeam, StapVestigingen, VestigingKeuze } from '@/components/club/start/StapInstellingen'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(START)).meta }
}
export const dynamic = 'force-dynamic'

// /club/start?stap=N: de startwizard van een nieuwe sportschool. Acht
// korte stappen, te hervatten waar je was. De eerste stap (de soort
// sportschool) zet slimme standaarden klaar; elke stap daarna toont meteen de
// ingevulde invoer en stelt zijn deel echt en volledig in (besluit Kane
// 23-10-2026: niets "doe je later"). Alles gaat via dezelfde API's als het
// instellingencentrum, dus wat je hier doet staat daar ook (en andersom).
// Tot de wizard is afgerond is de rest van Club dicht (src/lib/club/start/poort.ts).

type Voet = { stap: number; sleutel: StapSleutel; vestiging: string | null }

interface StapProps {
  t: ClubToegang
  voet: Voet
  soort: SportschoolSoort | null
  afgerond: boolean
  feiten: StartFeiten
  stand: ReturnType<typeof stappenStand>
  /** De voortgang (voor de bevestigingen zoals Ik werk alleen), of null. */
  voortgang: StartVoortgang | null
  /** De gekozen streefdatum voor livegang (YYYY-MM-DD), of null. */
  streefdatum: string | null
  taal: Taal
}

/** De keuze van de streefdatum, met de stand erbij als er al een datum is. */
async function Streef({ streefdatum, stand, taal }: Pick<StapProps, 'streefdatum' | 'stand' | 'taal'>) {
  const vandaag = nlDelen(new Date()).datum
  const open = stand.filter((s) => !s.af).length
  const streef = streefdatum ? streefStand(streefdatum, vandaag, open, taal) : null
  const tekst = streef ? (await clubTekst(START)).streef.stand(streef.kop, streef.dagen) : null
  return <StreefdatumKiezer huidig={streefdatum} vandaag={vandaag} stand={tekst} />
}

function MetVoet({ voet, children }: { voet: Parameters<typeof StartVoet>[0]; children: ReactNode }) {
  return (
    <>
      {children}
      <StartVoet {...voet} />
    </>
  )
}

/** Het geuploade logo als adres; het ingebouwde logo of geen logo = null. */
function logoAdres(org: Organisatie): string | null {
  return org.logo && org.logo !== LOGO_FIT_FACTORY ? `/api/club/organisatie/logo?pad=${encodeURIComponent(org.logo)}` : null
}

/** De echte adressen van deze sportschool, of null als er nog geen eigen adres is. */
function liveAdressen(org: Organisatie): LiveAdressen | null {
  if (!org.slug) return null
  const sub = subdomeinenActief()
  return { basis: adresVan(org.slug, sub), ledenapp: sportschoolUrl(org.slug, sub, '/mijn'), inloggen: sportschoolUrl(org.slug, sub, '/inloggen') }
}

/** Per vestiging of er al zelf gekozen openingstijden zijn, en de namen van de lestypen (voor stap 1). */
async function haalBestaand(t: ClubToegang): Promise<{ vestigingen: BestaandeVestiging[]; lestypen: string[] }> {
  const [vest, typen] = await Promise.all([
    t.admin.from('club_vestigingen').select('vestiging, openingstijden').eq('user_id', t.userId),
    t.admin.from('club_lestypen').select('naam').eq('user_id', t.userId),
  ])
  if (vest.error) console.error('[club-start] vestigingen lezen mislukt', vest.error.message)
  if (typen.error) console.error('[club-start] lestypen lezen mislukt', typen.error.message)
  // De plaatshouder-tijden van een nieuwe vestiging tellen niet: dan zet de gekozen soort zijn eigen tijden neer.
  const tijden = new Map((vest.data ?? []).map((r) => [String(r.vestiging), heeftEigenOpeningstijden(r.openingstijden)]))
  return {
    vestigingen: t.vestigingen.map((v) => ({ sleutel: v.sleutel, heeftTijden: tijden.get(v.sleutel) ?? false })),
    lestypen: (typen.data ?? []).map((r) => String(r.naam)),
  }
}

/** De namen van de actieve lestypen, voor het voorbeeld van de ledenapp. */
async function haalLesNamen(t: ClubToegang): Promise<string[]> {
  const { data, error } = await t.admin.from('club_lestypen').select('naam').eq('user_id', t.userId).eq('actief', true).order('naam')
  if (error) console.error('[club-start] lestypen lezen mislukt', error.message)
  return (data ?? []).map((r) => String((r as { naam: unknown }).naam))
}

interface MedewerkerKort {
  id: string
  naam: string
  rollen: readonly string[]
  vestigingen: readonly string[]
  actief: boolean
}

/** Wie een les kan geven: groepslesinstructeurs en trainers van deze vestiging (zonder die: iedereen hier). */
function instructeursUit(medewerkers: readonly MedewerkerKort[], vestiging: string): { id: string; naam: string }[] {
  const hier = medewerkers.filter((m) => m.actief && m.vestigingen.includes(vestiging))
  const lesgevers = hier.filter((m) => m.rollen.includes('instructeur') || m.rollen.includes('trainer'))
  return (lesgevers.length > 0 ? lesgevers : hier).map((m) => ({ id: m.id, naam: m.naam }))
}

async function Lessen({ t, voet, soort, waarden, geenVasteLessen }: Pick<StapProps, 't' | 'voet' | 'soort'> & { waarden: HuisstijlWaarden; geenVasteLessen: boolean }) {
  const vestiging = voet.vestiging
  if (!moduleAan(t.organisatie, 'rooster')) {
    return (
      <MetVoet voet={voet}>
        <OnderdeelAan organisatie={waarden} module="rooster" />
      </MetVoet>
    )
  }
  if (!vestiging) return <MetVoet voet={voet}><GeenVestiging /></MetVoet>
  const data = await haalInstellingen(t.admin, t.userId, vestiging)
  if (!data) return <MetVoet voet={voet}><LaadFout /></MetVoet>
  const passend = soort ? voorstelLestypen(soort) : VOORBEELD_LESTYPEN.slice(0, 6)
  return (
    <>
      <VestigingKeuze t={t} vestiging={vestiging} stap={voet.stap} />
      <StapLessen
        vestiging={vestiging}
        vestigingNaam={naamVan(t.vestigingen, vestiging)}
        soort={soort}
        lestypen={data.lestypen.map((l) => ({ id: l.id, naam: l.naam, omschrijving: l.omschrijving, soort: l.soort, duurMin: l.duurMin, intensiteit: l.intensiteit, actief: l.actief }))}
        series={data.series.filter((s) => s.actief).map((s) => ({ id: s.id, lestypeId: s.lestypeId, zaalId: s.zaalId, instructeurId: s.instructeurId, weekdag: s.weekdag, starttijd: s.starttijd, duurMin: s.duurMin, capaciteit: s.capaciteit }))}
        zalen={data.zalen.filter((z) => z.actief).map((z) => ({ id: z.id, naam: z.naam }))}
        instructeurs={instructeursUit(data.medewerkers, vestiging)}
        vandaag={nlDelen(new Date()).datum}
        passend={passend}
        bibliotheek={ALLE_LESTYPEN}
        voorbeeldLessen={ALLE_LESSEN}
        geenVasteLessen={geenVasteLessen}
        voet={voet}
      />
    </>
  )
}

/** Stappen met eigen invoer brengen hun eigen voet mee; de rest krijgt de standaardvoet. */
async function StapInhoud({ t, voet, soort, afgerond, feiten, stand, streefdatum, voortgang, taal }: StapProps) {
  const bevestigd = voortgang?.bevestigd ?? []
  const org = t.organisatie
  const waarden: HuisstijlWaarden = { naam: org.naam, slogan: org.slogan, kleurAccent: org.kleurAccent, thema: org.thema, uit: org.uit }
  const vestiging = voet.vestiging
  switch (voet.sleutel) {
    case 'soort': {
      const bestaand = await haalBestaand(t)
      return (
        <>
          <Streef streefdatum={streefdatum} stand={stand} taal={taal} />
          <StapSoort key={org.id} gekozen={soort} organisatie={waarden} vestigingen={bestaand.vestigingen} lestypen={bestaand.lestypen} lesVestiging={vestiging ?? t.vestigingen[0]?.sleutel ?? null} voet={voet} />
        </>
      )
    }
    case 'huisstijl': {
      const logoUrl = logoAdres(org)
      const les = voorbeeldLes(await haalLesNamen(t), soort)
      return <StapHuisstijl key={org.id} organisatie={waarden} logoUrl={logoUrl} ingebouwdLogo={org.logo === LOGO_FIT_FACTORY} slug={org.slug} subdomeinen={subdomeinenActief()} voorbeeldLes={les} voet={voet} />
    }
    case 'vestigingen':
      return <StapVestigingen t={t} vestiging={vestiging} soort={soort} voet={voet} />
    case 'onderdelen':
      return <StapOnderdelen key={org.id} organisatie={waarden} soort={soort} voet={voet} />
    case 'lessen':
      return <Lessen t={t} voet={voet} soort={soort} waarden={waarden} geenVasteLessen={bevestigd.includes('geen_vaste_lessen')} />
    case 'team':
      return vestiging ? <StapTeam t={t} vestiging={vestiging} soort={soort} voet={voet} alleen={bevestigd.includes('alleen')} /> : <MetVoet voet={voet}><GeenVestiging /></MetVoet>
    case 'leden': {
      if (!moduleAan(org, 'leden')) {
        return (
          <MetVoet voet={voet}>
            <OnderdeelAan organisatie={waarden} module="leden" />
          </MetVoet>
        )
      }
      if (!vestiging) return <MetVoet voet={voet}><GeenVestiging /></MetVoet>
      return (
        <>
          <VestigingKeuze t={t} vestiging={vestiging} stap={voet.stap} />
          <StapLedenInlezen vestiging={vestiging} vestigingLabel={naamVan(t.vestigingen, vestiging)} verderPad={startPad(stapNummer('klaar'), vestiging)} vandaag={nlDelen(new Date()).datum} />
          <LedenAfronden leden={feiten.leden} zonderLeden={bevestigd.includes('zonder_leden')} voet={voet} />
        </>
      )
    }
    case 'klaar': {
      const open = nogOpen(stand).map((s) => ({ nummer: s.nummer, titel: s.titel, kort: s.kort, pad: startPad(s.nummer, vestiging) }))
      const les = voorbeeldLes(await haalLesNamen(t), soort)
      return (
        <MetVoet voet={{ ...voet, afgerond, kanAfronden: open.length === 0 }}>
          <StapLive
            afgerond={afgerond}
            open={open}
            voorbeeldLes={les}
            af={aantalAf(stand)}
            totaal={AANTAL_STAPPEN}
            adressen={liveAdressen(org)}
            adresKiezenPad={startPad(stapNummer('huisstijl'), vestiging)}
            naam={org.naam}
            kleur={org.kleurAccent}
            thema={org.thema}
            logo={logoAdres(org)}
            acties={liveActies(feiten.uit, vestiging, taal)}
          />
          {!afgerond && <Streef streefdatum={streefdatum} stand={stand} taal={taal} />}
          <StapKlaar punten={eersteDag(feiten, vestiging, afgerond, voortgang, taal)} />
        </MetVoet>
      )
    }
  }
}

export default async function StartPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisBeheerdersBeheer()
  const params = await searchParams
  const gelezen = await haalStart(t)
  let voortgang = gelezen.ok ? gelezen.voortgang : null
  // Een nieuwe sportschool: de voortgang meteen vastleggen, zodat Vandaag daarna de kaart toont in plaats van hierheen te sturen.
  if (gelezen.ok && moetNaarWizard(t.organisatie, t.beheerderId, voortgang) && (await bewaarStart(t, NIEUWE_START))) voortgang = NIEUWE_START
  const feiten = await haalStartFeiten(t)
  const taal = await getTaal()
  const tekst = await clubTekst(START)
  const stand = stappenStand(voortgang, feiten, taal)
  const stapInUrl = stapUitParam(params.stap)
  const huidig = stapInUrl ?? voortgang?.stap ?? 1
  const sleutel = STAPPEN[huidig - 1].sleutel
  const vestiging = kiesUit(t.vestigingen, params.v)
  // Het kruimelpad wijst naar Instellingen: alleen als die open zijn (het master account ziet altijd alles).
  const kruimel = !(await wizardPoortDicht(t))
  return (
    <StartKader t={t} kruimel={kruimel} sportschool={t.organisatie.naam} stand={stand} huidig={huidig} vestiging={vestiging} intro={tekst.intro[sleutel]} welkomTerug={isHervatten(voortgang, stapInUrl)}>
      {!gelezen.ok && <p className="club-melding club-melding--fout" role="alert">{tekst.paginaFout}</p>}
      <StapInhoud
        key={`${sleutel}-${vestiging ?? ''}`}
        t={t}
        voet={{ stap: huidig, sleutel, vestiging }}
        soort={voortgang?.soort ?? null}
        afgerond={Boolean(voortgang?.afgerondOp)}
        feiten={feiten}
        stand={stand}
        streefdatum={voortgang?.streefdatum ?? null}
        voortgang={voortgang}
        taal={taal}
      />
    </StartKader>
  )
}
