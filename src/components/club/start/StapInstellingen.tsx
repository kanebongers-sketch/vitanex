import Link from 'next/link'
import type { ClubToegang } from '@/lib/club/toegang'
import { naamVan } from '@/lib/club/kern/vestigingen'
import { medewerkerUitRij, type Medewerker } from '@/lib/club/kern/medewerker'
import { haalInstellingen } from '@/lib/club/instellingen/opslag'
import { SOORT_INFO, rechtenTekst, type SportschoolSoort } from '@/lib/club/start/soorten'
import { startPad } from '@/lib/club/start/stappen'
import { Klaargezet } from './Klaargezet'
import { StapVestiging } from './StapVestiging'
import { TeamFormulier } from './TeamFormulier'
import type { StartVoetProps } from './StartVoet'

// Stap 3 (vestiging: adres en openingstijden) en stap 6 (het team): de data
// van de server, de invoer in kleine client-onderdelen.

type Voet = Omit<StartVoetProps, 'voorVerder' | 'primair'>

interface StapMetVestigingProps {
  t: ClubToegang
  vestiging: string | null
  soort: SportschoolSoort | null
  voet: Voet
}

export function GeenVestiging() {
  return (
    <p className="club-melding">
      Voeg eerst een vestiging toe in de stap <Link href={startPad(3, null)}>Vestiging</Link>.
    </p>
  )
}

export function LaadFout() {
  return <p className="club-melding club-melding--fout" role="alert">Dit kon niet worden geladen. Ververs de pagina om het opnieuw te proberen.</p>
}

/** "Voor een yoga en pilates studio", of null zonder soort. */
export function bronVan(soort: SportschoolSoort | null): string | null {
  return soort ? `Voor een ${SOORT_INFO[soort].titel.toLowerCase()}` : null
}

/** Wissel van vestiging binnen de stap (alleen als er meer dan een is). */
export function VestigingKeuze({ t, vestiging, stap }: { t: ClubToegang; vestiging: string; stap: number }) {
  if (t.vestigingen.length < 2) return null
  return (
    <nav className="club-segment club-start-vestkeuze" aria-label="Kies een vestiging">
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

export async function StapVestigingen({ t, vestiging, soort, voet }: StapMetVestigingProps) {
  if (!vestiging) return <GeenVestiging />
  const [adres, data] = await Promise.all([haalAdres(t, vestiging), haalInstellingen(t.admin, t.userId, vestiging)])
  if (!data) return <LaadFout />
  return (
    <>
      <VestigingKeuze t={t} vestiging={vestiging} stap={voet.stap} />
      <StapVestiging key={vestiging} sleutel={vestiging} naam={naamVan(t.vestigingen, vestiging)} adres={adres} week={data.openingstijden} regels={data.regels} bron={bronVan(soort)} voet={voet} />
    </>
  )
}

/** Alle actieve medewerkers van de sportschool, op naam. */
async function haalTeam(t: ClubToegang): Promise<Medewerker[]> {
  const { data, error } = await t.admin.from('club_medewerkers').select('id, naam, email, rollen, vestigingen, actief').eq('user_id', t.userId).eq('actief', true).order('naam')
  if (error) console.error('[club-start] team lezen mislukt', error.message)
  return (data ?? []).map(medewerkerUitRij).filter((m): m is Medewerker => m !== null)
}

export async function StapTeam({ t, vestiging, soort, voet }: StapMetVestigingProps) {
  if (!vestiging) return <GeenVestiging />
  const team = await haalTeam(t)
  return (
    <div className="club-start-stapel">
      <TeamFormulier
        vestigingen={t.vestigingen.map((v) => ({ sleutel: v.sleutel, naam: v.naam }))}
        vestiging={vestiging}
        team={team.map((m) => ({ id: m.id, naam: m.naam, email: m.email, rollen: m.rollen }))}
      />
      <Klaargezet
        bron={bronVan(soort)}
        gang={voet}
        aanpassenHref="/clubkane/beheer/rechten"
        regels={[{ titel: 'Wat elke rol ziet', tekst: rechtenTekst(t.organisatie.instellingen.rechten) }]}
      />
    </div>
  )
}
