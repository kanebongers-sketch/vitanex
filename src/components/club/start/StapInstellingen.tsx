import Link from 'next/link'
import type { ClubToegang } from '@/lib/club/toegang'
import { naamVan } from '@/lib/club/kern/vestigingen'
import { medewerkerUitRij, type Medewerker } from '@/lib/club/kern/medewerker'
import { haalInstellingen } from '@/lib/club/instellingen/opslag'
import { heeftEigenOpeningstijden } from '@/lib/club/instellingen/vestigingen-invoer'
import { openingstijdenNaarJson } from '@/lib/club/rooster/openingstijden'
import { haalMedewerkerLogins } from '@/lib/club/medewerker-login/opslag'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'
import { sportschoolUrl } from '@/lib/club/kern/subdomein'
import { subdomeinenActief } from '@/lib/club/kern/adres-verzoek'
import { moduleAan } from '@/lib/club/kern/organisatie'
import { startPad, stapNummer } from '@/lib/club/start/stappen'
import { rechtenGroepen } from '@/components/club/beheer/rechten-groepen'
import { StapVestiging } from './StapVestiging'
import { StapTeamInvoer } from './StapTeamInvoer'
import type { StartVoetProps } from './StartVoet'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'
import { rollenV2Aan } from '@/lib/club/rollen/schakelaar'
import { rolrechtenVan } from '@/lib/club/rollen/profiel'

// De stappen Vestiging (adres, openingstijden en reserveren) en Team (het team
// en wat elke rol ziet): de data van de server, de invoer in kleine
// client-onderdelen. Alles wordt hier ingesteld, niets elders.

type Voet = Omit<StartVoetProps, 'voorVerder' | 'primair'>

interface StapMetVestigingProps {
  t: ClubToegang
  vestiging: string | null
  voet: Voet
}

export async function GeenVestiging() {
  const t = (await clubTekst(START)).instellingen
  return (
    <p className="club-melding">
      {t.geenVestigingVoor} <Link href={startPad(stapNummer('vestigingen'), null)}>{t.geenVestigingLink}</Link>.
    </p>
  )
}

export async function LaadFout() {
  const t = (await clubTekst(START)).instellingen
  return <p className="club-melding club-melding--fout" role="alert">{t.laadFout}</p>
}

/** Wissel van vestiging binnen de stap (alleen als er meer dan een is). */
export async function VestigingKeuze({ t, vestiging, stap }: { t: ClubToegang; vestiging: string; stap: number }) {
  if (t.vestigingen.length < 2) return null
  const tekst = (await clubTekst(START)).instellingen
  return (
    <nav className="club-segment club-start-vestkeuze" aria-label={tekst.kiesVestiging}>
      {t.vestigingen.map((v) => (
        <Link key={v.sleutel} href={startPad(stap, v.sleutel)} aria-current={v.sleutel === vestiging ? 'page' : undefined} scroll={false}>
          {v.naam}
        </Link>
      ))}
    </nav>
  )
}

async function haalAdres(t: ClubToegang, vestiging: string): Promise<string | null> {
  const { data, error } = await t.admin.from('club_vestigingen').select('adres').eq('user_id', t.userId).eq('vestiging', vestiging).maybeSingle()
  if (error) console.error('[club-start] adres lezen mislukt', error.message)
  const adres: unknown = (data as { adres?: unknown } | null)?.adres
  return typeof adres === 'string' && adres.trim() ? adres : null
}

export async function StapVestigingen({ t, vestiging, voet }: StapMetVestigingProps) {
  if (!vestiging) return <GeenVestiging />
  const [adres, data] = await Promise.all([haalAdres(t, vestiging), haalInstellingen(t.admin, t.userId, vestiging)])
  if (!data) return <LaadFout />
  return (
    <>
      <VestigingKeuze t={t} vestiging={vestiging} stap={voet.stap} />
      <StapVestiging key={vestiging} sleutel={vestiging} naam={naamVan(t.vestigingen, vestiging)} adres={adres} week={data.openingstijden} regels={data.regels} eigenTijden={heeftEigenOpeningstijden(openingstijdenNaarJson(data.openingstijden))} roosterAan={moduleAan(t.organisatie, 'rooster')} voet={voet} />
    </>
  )
}

/** Alle actieve medewerkers van de sportschool, op naam. */
async function haalTeam(t: ClubToegang): Promise<Medewerker[]> {
  const { data, error } = await t.admin.from('club_medewerkers').select('id, naam, email, rollen, vestigingen, actief').eq('user_id', t.userId).eq('actief', true).order('naam')
  if (error) console.error('[club-start] team lezen mislukt', error.message)
  return (data ?? []).map(medewerkerUitRij).filter((m): m is Medewerker => m !== null)
}

export async function StapTeam({ t, vestiging, voet, alleen }: StapMetVestigingProps & { alleen: boolean }) {
  if (!vestiging) return <GeenVestiging />
  const [team, logins] = await Promise.all([haalTeam(t), haalMedewerkerLogins(t.admin, t.userId)])
  const loginVan = new Map((logins ?? []).map((l) => [l.medewerkerId, l.staat]))
  const linkBasis = t.organisatie.slug ? sportschoolUrl(t.organisatie.slug, subdomeinenActief()) : null
  return (
    <StapTeamInvoer
      vestigingen={t.vestigingen.map((v) => ({ sleutel: v.sleutel, naam: v.naam }))}
      vestiging={vestiging}
      team={team.map((m) => ({ id: m.id, naam: m.naam, email: m.email, rollen: m.rollen, vestigingen: m.vestigingen, login: loginVan.get(m.id) ?? 'geen' }))}
      loginAan={CLUB_EIGEN_LOGIN}
      linkBasis={linkBasis}
      rechten={t.organisatie.instellingen.rechten}
      groepen={rechtenGroepen(t.organisatie.uit, await getTaal())}
      alleen={alleen}
      loginsFout={logins === null}
      voet={voet}
      v2={rollenV2Aan(t.organisatie.id) ? { rolrechten: rolrechtenVan(t.organisatie), uit: t.organisatie.uit, profiel: t.profiel?.id ? { id: t.profiel.id, rollen: t.profiel.rollen } : null } : null}
    />
  )
}
