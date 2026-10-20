import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { eisBeheerdersBeheer, type ClubToegang } from '@/lib/club/toegang'
import type { ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { LOGO_FIT_FACTORY, moduleAan } from '@/lib/club/kern/organisatie'
import { haalInstellingen } from '@/lib/club/instellingen/opslag'
import { openingstijdenUitJson } from '@/lib/club/rooster/openingstijden'
import { nlDelen } from '@/lib/club/rooster/tijd'
import { NIEUWE_START, STAPPEN, moetNaarWizard, stapUitParam, stappenStand, type StapSleutel, type StartFeiten } from '@/lib/club/start/stappen'
import { bewaarStart, haalStart, haalStartFeiten } from '@/lib/club/start/opslag'
import { pakketVoor, type BestaandeVestiging, type SportschoolSoort } from '@/lib/club/start/soorten'
import { ALLE_LESSEN, VOORBEELD_LESTYPEN } from '@/lib/club/start/voorbeelden'
import { eersteDag } from '@/lib/club/start/eerste-dag'
import { StartKader } from '@/components/club/start/StartKader'
import { StartVoet } from '@/components/club/start/StartVoet'
import { StapSoort } from '@/components/club/start/StapSoort'
import { StapHuisstijl } from '@/components/club/start/StapHuisstijl'
import { StapOnderdelen } from '@/components/club/start/StapOnderdelen'
import { StapLessen } from '@/components/club/start/StapLessen'
import { Klaargezet } from '@/components/club/start/Klaargezet'
import { STAP_INTRO, StapKlaar, StapLedenInlezen } from '@/components/club/start/StapTeksten'
import { GeenVestiging, LaadFout, StapTeam, StapVestigingen, VestigingKeuze, bronVan } from '@/components/club/start/StapInstellingen'

export const metadata: Metadata = { title: 'Start' }
export const dynamic = 'force-dynamic'

// /clubkane/start?stap=N: de startwizard van een nieuwe sportschool. Acht
// korte stappen, elk over te slaan en later te hervatten. De eerste stap (de
// soort sportschool) zet slimme standaarden klaar; de stappen daarna tonen
// wat er al staat met Klopt of Aanpassen. Alles gaat via dezelfde API's als
// het instellingencentrum, dus wat je hier doet staat daar ook (en andersom).

type Voet = { stap: number; sleutel: StapSleutel; vestiging: string | null }

interface StapProps {
  t: ClubToegang
  voet: Voet
  soort: SportschoolSoort | null
  afgerond: boolean
  feiten: StartFeiten
  stand: ReturnType<typeof stappenStand>
}

function MetVoet({ voet, children }: { voet: Parameters<typeof StartVoet>[0]; children: ReactNode }) {
  return (
    <>
      {children}
      <StartVoet {...voet} />
    </>
  )
}

/** Per vestiging of er al openingstijden zijn, en de namen van de lestypen (voor stap 1). */
async function haalBestaand(t: ClubToegang): Promise<{ vestigingen: BestaandeVestiging[]; lestypen: string[] }> {
  const [vest, typen] = await Promise.all([
    t.admin.from('club_vestigingen').select('vestiging, openingstijden').eq('user_id', t.userId),
    t.admin.from('club_lestypen').select('naam').eq('user_id', t.userId),
  ])
  if (vest.error) console.error('[club-start] vestigingen lezen mislukt', vest.error.message)
  if (typen.error) console.error('[club-start] lestypen lezen mislukt', typen.error.message)
  const tijden = new Map((vest.data ?? []).map((r) => [String(r.vestiging), openingstijdenUitJson(r.openingstijden).some((d) => d !== null)]))
  return {
    vestigingen: t.vestigingen.map((v) => ({ sleutel: v.sleutel, heeftTijden: tijden.get(v.sleutel) ?? false })),
    lestypen: (typen.data ?? []).map((r) => String(r.naam)),
  }
}

async function Lessen({ t, voet, soort }: Pick<StapProps, 't' | 'voet' | 'soort'>) {
  const vestiging = voet.vestiging
  if (!moduleAan(t.organisatie, 'rooster')) {
    return <p className="club-melding">Groepslessen staan uit. Deze stap kun je overslaan; zet Groepslessen aan bij Onderdelen als je ze toch wilt.</p>
  }
  if (!vestiging) return <GeenVestiging />
  const data = await haalInstellingen(t.admin, t.userId, vestiging)
  if (!data) return <LaadFout />
  const naam = naamVan(t.vestigingen, vestiging)
  const lessen = data.series.filter((s) => s.actief)
  const eigen = soort ? pakketVoor(soort).lestypen : []
  const invoer = (
    <StapLessen
      vestiging={vestiging}
      vestigingNaam={naam}
      lestypen={data.lestypen.map((l) => ({ id: l.id, naam: l.naam, duurMin: l.duurMin }))}
      lessen={lessen.map((s) => ({ lestypeId: s.lestypeId, weekdag: s.weekdag, starttijd: s.starttijd }))}
      vandaag={nlDelen(new Date()).datum}
      voorbeelden={eigen.length > 0 ? eigen : VOORBEELD_LESTYPEN}
      voorbeeldLessen={ALLE_LESSEN}
    />
  )
  return (
    <>
      <VestigingKeuze t={t} vestiging={vestiging} stap={voet.stap} />
      {data.lestypen.length === 0 ? (
        invoer
      ) : (
        <Klaargezet
          bron={bronVan(soort)}
          gang={voet}
          regels={[
            { titel: 'Lestypen', tekst: data.lestypen.map((l) => l.naam).join(', ') },
            { titel: `Vaste lessen in ${naam}`, tekst: lessen.length > 0 ? `${lessen.length} per week` : 'Nog geen. Kies Aanpassen voor een voorstel voor je week.' },
          ]}
        >
          {invoer}
        </Klaargezet>
      )}
    </>
  )
}

/** Stappen met eigen invoer brengen hun eigen voet mee; de rest krijgt de standaardvoet. */
async function StapInhoud({ t, voet, soort, afgerond, feiten, stand }: StapProps) {
  const org = t.organisatie
  const waarden = { naam: org.naam, slogan: org.slogan, kleurAccent: org.kleurAccent, thema: org.thema, uit: org.uit }
  const vestiging = voet.vestiging
  switch (voet.sleutel) {
    case 'soort': {
      const bestaand = await haalBestaand(t)
      return <StapSoort key={org.id} gekozen={soort} organisatie={waarden} vestigingen={bestaand.vestigingen} lestypen={bestaand.lestypen} lesVestiging={vestiging ?? t.vestigingen[0]?.sleutel ?? null} voet={voet} />
    }
    case 'huisstijl': {
      const logoUrl = org.logo && org.logo !== LOGO_FIT_FACTORY ? `/api/club/organisatie/logo?pad=${encodeURIComponent(org.logo)}` : null
      return <StapHuisstijl key={org.id} organisatie={waarden} logoUrl={logoUrl} ingebouwdLogo={org.logo === LOGO_FIT_FACTORY} voet={voet} />
    }
    case 'vestigingen':
      return <StapVestigingen t={t} vestiging={vestiging} soort={soort} voet={voet} />
    case 'onderdelen':
      return <StapOnderdelen key={org.id} organisatie={waarden} bron={bronVan(soort)} voet={voet} />
    case 'lessen':
      return <MetVoet voet={voet}><Lessen t={t} voet={voet} soort={soort} /></MetVoet>
    case 'team':
      return <MetVoet voet={voet}><StapTeam t={t} vestiging={vestiging} soort={soort} voet={voet} /></MetVoet>
    case 'leden': {
      const importPad = vestiging && moduleAan(org, 'leden') ? `/clubkane/leden/importeren?v=${encodeURIComponent(vestiging)}` : null
      return <MetVoet voet={voet}><StapLedenInlezen importPad={importPad} vandaag={nlDelen(new Date()).datum} /></MetVoet>
    }
    case 'klaar':
      return <MetVoet voet={{ ...voet, afgerond }}><StapKlaar punten={eersteDag(feiten, vestiging)} stand={stand} vestiging={vestiging} /></MetVoet>
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
  const huidig = stapUitParam(params.stap) ?? voortgang?.stap ?? 1
  const sleutel = STAPPEN[huidig - 1].sleutel
  const vestiging = kiesUit(t.vestigingen, params.v)
  return (
    <StartKader sportschool={t.organisatie.naam} stand={stand} huidig={huidig} vestiging={vestiging} intro={STAP_INTRO[sleutel]}>
      {!gelezen.ok && <p className="club-melding club-melding--fout" role="alert">Je voortgang kon niet worden gelezen. Je kunt gewoon verder; probeer het later opnieuw als iets niet wordt bewaard.</p>}
      <StapInhoud
        key={`${sleutel}-${vestiging ?? ''}`}
        t={t}
        voet={{ stap: huidig, sleutel, vestiging }}
        soort={voortgang?.soort ?? null}
        afgerond={Boolean(voortgang?.afgerondOp)}
        feiten={feiten}
        stand={stand}
      />
    </StartKader>
  )
}
