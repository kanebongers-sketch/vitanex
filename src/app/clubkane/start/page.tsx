import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { eisBeheerdersBeheer, type ClubToegang } from '@/lib/club/toegang'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { LOGO_FIT_FACTORY, moduleAan } from '@/lib/club/kern/organisatie'
import { haalInstellingen } from '@/lib/club/instellingen/opslag'
import { nlDelen } from '@/lib/club/rooster/tijd'
import { NIEUWE_START, STAPPEN, moetNaarWizard, stapUitParam, stappenStand, type StapSleutel } from '@/lib/club/start/stappen'
import { bewaarStart, haalStart, haalStartFeiten } from '@/lib/club/start/opslag'
import { StartKader } from '@/components/club/start/StartKader'
import { StartVoet } from '@/components/club/start/StartVoet'
import { StapHuisstijl } from '@/components/club/start/StapHuisstijl'
import { StapOnderdelen } from '@/components/club/start/StapOnderdelen'
import { StapLessen } from '@/components/club/start/StapLessen'
import { STAP_INTRO, StapKlaar, StapLedenInlezen, StapLedenapp, StapWelkom } from '@/components/club/start/StapTeksten'
import { GeenVestiging, StapTeam, StapVestigingen } from '@/components/club/start/StapInstellingen'

export const metadata: Metadata = { title: 'Start' }
export const dynamic = 'force-dynamic'

// /clubkane/start?stap=N: de startwizard van een nieuwe sportschool. Negen
// stappen, elk over te slaan en later te hervatten. De stappen hergebruiken de
// onderdelen van het huisstijl-portaal en Instellingen, zodat alles wat je
// hier doet ook daar staat (en andersom).

interface StapProps {
  t: ClubToegang
  sleutel: StapSleutel
  stap: number
  vestiging: string | null
  afgerond: boolean
  stand: ReturnType<typeof stappenStand>
}

/** Stappen met eigen invoer brengen hun eigen voet mee; de rest krijgt de standaardvoet. */
async function StapInhoud({ t, sleutel, stap, vestiging, afgerond, stand }: StapProps) {
  const org = t.organisatie
  const voet = { stap, sleutel, vestiging }
  const waarden = { naam: org.naam, slogan: org.slogan, kleurAccent: org.kleurAccent, thema: org.thema, uit: org.uit }
  switch (sleutel) {
    case 'huisstijl': {
      const logoUrl = org.logo && org.logo !== LOGO_FIT_FACTORY ? `/api/club/organisatie/logo?pad=${encodeURIComponent(org.logo)}` : null
      return <StapHuisstijl key={org.id} organisatie={waarden} logoUrl={logoUrl} ingebouwdLogo={org.logo === LOGO_FIT_FACTORY} voet={voet} />
    }
    case 'onderdelen':
      return <StapOnderdelen key={org.id} organisatie={waarden} voet={voet} />
    case 'welkom':
      return <MetVoet voet={voet} primair="Beginnen"><StapWelkom /></MetVoet>
    case 'vestigingen':
      return <MetVoet voet={voet}><StapVestigingen t={t} vestiging={vestiging} /></MetVoet>
    case 'lessen':
      return <MetVoet voet={voet}><Lessen t={t} vestiging={vestiging} /></MetVoet>
    case 'team':
      return <MetVoet voet={voet}><StapTeam t={t} vestiging={vestiging} /></MetVoet>
    case 'leden': {
      const importPad = vestiging && moduleAan(org, 'leden') ? `/clubkane/leden/importeren?v=${encodeURIComponent(vestiging)}` : null
      return <MetVoet voet={voet}><StapLedenInlezen importPad={importPad} /></MetVoet>
    }
    case 'ledenapp':
      return <MetVoet voet={voet}><StapLedenapp appAan={moduleAan(org, 'app')} checkinAan={moduleAan(org, 'checkin')} /></MetVoet>
    case 'klaar':
      return <MetVoet voet={{ ...voet, afgerond }}><StapKlaar stand={stand} vestiging={vestiging} /></MetVoet>
  }
}

function MetVoet({ voet, primair, children }: { voet: Parameters<typeof StartVoet>[0]; primair?: string; children: ReactNode }) {
  return (
    <>
      {children}
      <StartVoet {...voet} primair={primair} />
    </>
  )
}

async function Lessen({ t, vestiging }: { t: ClubToegang; vestiging: string | null }) {
  if (!moduleAan(t.organisatie, 'rooster')) {
    return <p className="club-melding">Groepslessen staan uit. Deze stap kun je overslaan; zet Groepslessen aan bij Onderdelen als je ze toch wilt.</p>
  }
  if (!vestiging) return <GeenVestiging />
  const data = await haalInstellingen(t.admin, t.userId, vestiging)
  if (!data) return <p className="club-melding club-melding--fout" role="alert">De lessen konden niet worden geladen. Ververs de pagina om het opnieuw te proberen.</p>
  return (
    <StapLessen
      vestiging={vestiging}
      vestigingNaam={naamVan(t.vestigingen, vestiging)}
      lestypen={data.lestypen.map((l) => ({ id: l.id, naam: l.naam, duurMin: l.duurMin }))}
      lessen={data.series.filter((s) => s.actief).map((s) => ({ lestypeId: s.lestypeId, weekdag: s.weekdag, starttijd: s.starttijd }))}
      vandaag={nlDelen(new Date()).datum}
    />
  )
}

export default async function StartPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisBeheerdersBeheer()
  const params = await searchParams
  const gelezen = await haalStart(t)
  let voortgang = gelezen.ok ? gelezen.voortgang : null
  // Een nieuwe sportschool: de voortgang meteen vastleggen, zodat Vandaag daarna de kaart toont in plaats van hierheen te sturen.
  if (gelezen.ok && moetNaarWizard(t.organisatie, t.beheerderId, voortgang) && (await bewaarStart(t, NIEUWE_START))) voortgang = NIEUWE_START
  const stand = stappenStand(voortgang, await haalStartFeiten(t))
  const huidig = stapUitParam(params.stap) ?? voortgang?.stap ?? 1
  const sleutel = STAPPEN[huidig - 1].sleutel
  const vestiging = kiesUit(t.vestigingen, params.v)
  return (
    <StartKader sportschool={t.organisatie.naam} stand={stand} huidig={huidig} vestiging={vestiging} intro={STAP_INTRO[sleutel]}>
      {!gelezen.ok && <p className="club-melding club-melding--fout" role="alert">Je voortgang kon niet worden gelezen. Je kunt gewoon verder; probeer het later opnieuw als iets niet wordt bewaard.</p>}
      <StapInhoud key={`${sleutel}-${vestiging ?? ''}`} t={t} sleutel={sleutel} stap={huidig} vestiging={vestiging} afgerond={Boolean(voortgang?.afgerondOp)} stand={stand} />
    </StartKader>
  )
}
