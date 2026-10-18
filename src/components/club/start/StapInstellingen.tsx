import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { ClubToegang } from '@/lib/club/toegang'
import { naamVan } from '@/lib/club/kern/vestigingen'
import { adresVan } from '@/lib/club/kern/subdomein'
import { haalInstellingen } from '@/lib/club/instellingen/opslag'
import { haalMedewerkerLogins } from '@/lib/club/medewerker-login/opslag'
import { magMedewerkerLoginsBeheren } from '@/lib/club/medewerker-login/rechten'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'
import { startPad } from '@/lib/club/start/stappen'
import { VestigingenBeheer, type VestigingContact } from '@/components/club/instellingen/VestigingenBeheer'
import { RegelsFormulier } from '@/components/club/instellingen/RegelsFormulier'
import { MedewerkersBeheer, RollenUitleg, type LoginBeheer } from '@/components/club/instellingen/MedewerkersBeheer'

// Stap 3 (vestigingen met adres en openingstijden) en stap 6 (het team): de
// bestaande onderdelen van Instellingen, met de wizard eromheen.

interface StapMetVestigingProps {
  t: ClubToegang
  vestiging: string | null
}

export function GeenVestiging() {
  return (
    <p className="club-melding">
      Voeg eerst een vestiging toe in de stap <Link href={startPad(3, null)}>Vestigingen</Link>.
    </p>
  )
}

function LaadFout() {
  return <p className="club-melding club-melding--fout" role="alert">Dit kon niet worden geladen. Ververs de pagina om het opnieuw te proberen.</p>
}

/** Adres, telefoon en e-mail van de vestigingen van deze sportschool. */
async function haalContact(t: ClubToegang): Promise<VestigingContact> {
  const { data, error } = await t.admin.from('club_vestigingen').select('vestiging, adres, telefoon, email').eq('user_id', t.userId)
  if (error) console.error('[club-start] contact vestigingen lezen mislukt', error.message)
  const tekst = (v: unknown) => (typeof v === 'string' && v.trim() ? v : null)
  return Object.fromEntries((data ?? []).map((r) => [String(r.vestiging), { adres: tekst(r.adres), telefoon: tekst(r.telefoon), email: tekst(r.email) }]))
}

/** Wissel van vestiging binnen de stap (alleen als er meer dan een is). */
function VestigingKeuze({ t, vestiging, stap }: { t: ClubToegang; vestiging: string; stap: number }) {
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

export async function StapVestigingen({ t, vestiging }: StapMetVestigingProps) {
  const [contact, data] = await Promise.all([haalContact(t), vestiging ? haalInstellingen(t.admin, t.userId, vestiging) : null])
  return (
    <div className="club-start-stapel">
      <section className="club-start-sectie" aria-labelledby="start-vest-kop">
        <h2 id="start-vest-kop" className="club-start-sectiekop">Je vestigingen</h2>
        <p className="club-hint">Klik op Contact om het adres, telefoonnummer en e-mailadres in te vullen.</p>
        <VestigingenBeheer vestigingen={t.vestigingen} contact={contact} />
      </section>
      {vestiging && (
        <section className="club-start-sectie" aria-labelledby="start-open-kop">
          <div className="club-start-blokkop">
            <h2 id="start-open-kop" className="club-start-sectiekop">Openingstijden van {naamVan(t.vestigingen, vestiging)}</h2>
            <VestigingKeuze t={t} vestiging={vestiging} stap={3} />
          </div>
          <p className="club-hint">De regels voor reserveren staan al op een gangbare stand. Pas ze aan als je wilt; anders is alleen de openingstijd genoeg.</p>
          {data ? <RegelsFormulier key={vestiging} vestiging={vestiging} regels={data.regels} openingstijden={data.openingstijden} /> : <LaadFout />}
        </section>
      )}
    </div>
  )
}

async function haalLoginBeheer(t: ClubToegang): Promise<LoginBeheer | null> {
  if (!magMedewerkerLoginsBeheren(t)) return null
  const subdomeinen = process.env.CLUB_SUBDOMEINEN_ACTIEF === '1'
  return {
    logins: await haalMedewerkerLogins(t.admin, t.userId),
    linkBasis: subdomeinen && t.organisatie.slug ? `https://${adresVan(t.organisatie.slug)}` : null,
    loginAan: CLUB_EIGEN_LOGIN,
  }
}

export async function StapTeam({ t, vestiging }: StapMetVestigingProps) {
  if (!vestiging) return <GeenVestiging />
  const [data, login] = await Promise.all([haalInstellingen(t.admin, t.userId, vestiging), haalLoginBeheer(t)])
  if (!data) return <LaadFout />
  return (
    <div className="club-start-stapel">
      <div className="club-start-blokkop">
        <p className="club-hint club-start-teamuitleg">
          Voeg iemand toe met naam, rol en vestiging. Open daarna de medewerker voor de persoonlijke inloglink: die deel je zelf, bijvoorbeeld via WhatsApp of mail. Met die link kiest je medewerker een pincode die jij goedkeurt.
        </p>
        <VestigingKeuze t={t} vestiging={vestiging} stap={6} />
      </div>
      <MedewerkersBeheer medewerkers={data.medewerkers} vestiging={vestiging} login={login} ikZelf={null} />
      <RollenUitleg />
      <Link href="/clubkane/beheer/rechten" className="club-start-link">
        Rechten per rol aanpassen <ArrowRight aria-hidden size={14} />
      </Link>
    </div>
  )
}
