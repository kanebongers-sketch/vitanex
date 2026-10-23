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
import { AANTAL_STAPPEN, NIEUWE_START, STAPPEN, aantalAf, isHervatten, moetNaarWizard, startPad, stapNummer, stapUitParam, stappenStand, streefStand, type StapSleutel, type StartFeiten } from '@/lib/club/start/stappen'
import { bewaarStart, haalStart, haalStartFeiten } from '@/lib/club/start/opslag'
import { voorstelLestypen, type BestaandeVestiging, type SportschoolSoort } from '@/lib/club/start/soorten'
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
import { STAP_INTRO, StapKlaar, StapLedenInlezen } from '@/components/club/start/StapTeksten'
import { StapLive, type LiveAdressen } from '@/components/club/start/StapLive'
import { StreefdatumKiezer } from '@/components/club/start/StreefdatumKiezer'
import { GeenVestiging, LaadFout, StapTeam, StapVestigingen, VestigingKeuze } from '@/components/club/start/StapInstellingen'

export const metadata: Metadata = { title: 'Startwizard' }
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
  /** De gekozen streefdatum voor livegang (YYYY-MM-DD), of null. */
  streefdatum: string | null
}

/** De keuze van de streefdatum, met de stand erbij als er al een datum is. */
function Streef({ streefdatum, stand }: Pick<StapProps, 'streefdatum' | 'stand'>) {
  const vandaag = nlDelen(new Date()).datum
  const open = stand.filter((s) => !s.af).length
  const streef = streefdatum ? streefStand(streefdatum, vandaag, open) : null
  const tekst = streef ? `${streef.kop}. ${streef.dagen}.` : null
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

async function Lessen({ t, voet, soort, waarden }: Pick<StapProps, 't' | 'voet' | 'soort'> & { waarden: HuisstijlWaarden }) {
  const vestiging = voet.vestiging
  if (!moduleAan(t.organisatie, 'rooster')) {
    return (
      <MetVoet voet={voet}>
        <OnderdeelAan organisatie={waarden} module="rooster" tekst="Groepslessen staan uit, dus er zijn geen lessen om in te stellen." knop="Groepslessen aanzetten" />
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
        voet={voet}
      />
    </>
  )
}

/** Stappen met eigen invoer brengen hun eigen voet mee; de rest krijgt de standaardvoet. */
async function StapInhoud({ t, voet, soort, afgerond, feiten, stand, streefdatum }: StapProps) {
  const org = t.organisatie
  const waarden: HuisstijlWaarden = { naam: org.naam, slogan: org.slogan, kleurAccent: org.kleurAccent, thema: org.thema, uit: org.uit }
  const vestiging = voet.vestiging
  switch (voet.sleutel) {
    case 'soort': {
      const bestaand = await haalBestaand(t)
      return (
        <>
          <Streef streefdatum={streefdatum} stand={stand} />
          <StapSoort key={org.id} gekozen={soort} organisatie={waarden} vestigingen={bestaand.vestigingen} lestypen={bestaand.lestypen} lesVestiging={vestiging ?? t.vestigingen[0]?.sleutel ?? null} voet={voet} />
        </>
      )
    }
    case 'huisstijl': {
      const logoUrl = logoAdres(org)
      return <StapHuisstijl key={org.id} organisatie={waarden} logoUrl={logoUrl} ingebouwdLogo={org.logo === LOGO_FIT_FACTORY} slug={org.slug} subdomeinen={subdomeinenActief()} voet={voet} />
    }
    case 'vestigingen':
      return <StapVestigingen t={t} vestiging={vestiging} soort={soort} voet={voet} />
    case 'onderdelen':
      return <StapOnderdelen key={org.id} organisatie={waarden} soort={soort} voet={voet} />
    case 'lessen':
      return <Lessen t={t} voet={voet} soort={soort} waarden={waarden} />
    case 'team':
      return <MetVoet voet={voet}><StapTeam t={t} vestiging={vestiging} soort={soort} /></MetVoet>
    case 'leden': {
      if (!moduleAan(org, 'leden')) {
        return (
          <MetVoet voet={voet}>
            <OnderdeelAan organisatie={waarden} module="leden" tekst="Leden staat uit, dus er is geen ledenbestand om in te lezen." knop="Leden aanzetten" />
          </MetVoet>
        )
      }
      if (!vestiging) return <MetVoet voet={voet}><GeenVestiging /></MetVoet>
      return (
        <MetVoet voet={voet}>
          <VestigingKeuze t={t} vestiging={vestiging} stap={voet.stap} />
          <StapLedenInlezen vestiging={vestiging} vestigingLabel={naamVan(t.vestigingen, vestiging)} verderPad={startPad(stapNummer('klaar'), vestiging)} vandaag={nlDelen(new Date()).datum} />
        </MetVoet>
      )
    }
    case 'klaar':
      return (
        <MetVoet voet={{ ...voet, afgerond }}>
          <StapLive
            afgerond={afgerond}
            af={aantalAf(stand)}
            totaal={AANTAL_STAPPEN}
            adressen={liveAdressen(org)}
            adresKiezenPad={startPad(stapNummer('huisstijl'), vestiging)}
            naam={org.naam}
            kleur={org.kleurAccent}
            thema={org.thema}
            logo={logoAdres(org)}
            acties={liveActies(feiten.uit, vestiging)}
          />
          {!afgerond && <Streef streefdatum={streefdatum} stand={stand} />}
          <StapKlaar punten={eersteDag(feiten, vestiging, afgerond)} stand={stand} vestiging={vestiging} />
        </MetVoet>
      )
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
  const stand = stappenStand(voortgang, feiten)
  const stapInUrl = stapUitParam(params.stap)
  const huidig = stapInUrl ?? voortgang?.stap ?? 1
  const sleutel = STAPPEN[huidig - 1].sleutel
  const vestiging = kiesUit(t.vestigingen, params.v)
  return (
    <StartKader t={t} kruimel={Boolean(voortgang?.afgerondOp)} sportschool={t.organisatie.naam} stand={stand} huidig={huidig} vestiging={vestiging} intro={STAP_INTRO[sleutel]} welkomTerug={isHervatten(voortgang, stapInUrl)}>
      {!gelezen.ok && <p className="club-melding club-melding--fout" role="alert">Je voortgang kon niet worden gelezen. Je kunt gewoon verder; probeer het later opnieuw als iets niet wordt bewaard.</p>}
      <StapInhoud
        key={`${sleutel}-${vestiging ?? ''}`}
        t={t}
        voet={{ stap: huidig, sleutel, vestiging }}
        soort={voortgang?.soort ?? null}
        afgerond={Boolean(voortgang?.afgerondOp)}
        feiten={feiten}
        stand={stand}
        streefdatum={voortgang?.streefdatum ?? null}
      />
    </StartKader>
  )
}
