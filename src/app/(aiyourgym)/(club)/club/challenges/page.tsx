import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { eisClubToegang } from '@/lib/club/toegang'
import { clubPad, type ZoekParams } from '@/lib/club/kern/vestiging'
import { kiesUit } from '@/lib/club/kern/vestigingen'
import { nlDelen } from '@/lib/club/rooster/tijd'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { haalChallenges, haalStand } from '@/lib/club/challenges/lezen'
import { groepeer, statusVan } from '@/lib/club/challenges/periode'
import { ChallengeLijst } from '@/components/club/challenges/ChallengeLijst'
import { ChallengeDetail } from '@/components/club/challenges/ChallengeDetail'
import { ChallengeFormulier } from '@/components/club/challenges/ChallengeFormulier'
import '@/components/club/challenges/challenges.css'

export const metadata: Metadata = { title: 'Challenges' }

// Challenges voor leden: links lopend, gepland en afgelopen; rechts de gekozen
// challenge met de stand (?c=<id>), of het formulier (?nieuw=1 of ?wijzig=1).

function eerste(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

function maandVan(vandaag: string): { start: string; eind: string } {
  const [j, m] = vandaag.split('-').map(Number)
  const laatste = new Date(Date.UTC(j, m, 0)).getUTCDate()
  const mm = String(m).padStart(2, '0')
  return { start: `${j}-${mm}-01`, eind: `${j}-${mm}-${String(laatste).padStart(2, '0')}` }
}

export default async function ChallengesPagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const zoek = await searchParams
  const vestiging = kiesUit(t.vestigingen, zoek.v)
  if (!vestiging) return <GeenVestigingen />
  const vandaag = nlDelen(new Date()).datum
  const lijst = await haalChallenges(t.admin, t.userId)
  const groepen = groepeer(lijst ?? [], vandaag)
  const terug = clubPad('/challenges', vestiging)

  const nieuw = eerste(zoek.nieuw) === '1'
  const gevraagd = eerste(zoek.c)
  const gekozen = (lijst ?? []).find((c) => c.id === gevraagd) ?? (nieuw ? undefined : (groepen.lopend[0] ?? groepen.gepland[0] ?? groepen.afgelopen[0]))
  const status = gekozen ? statusVan(gekozen, vandaag) : null
  const wijzig = gekozen && status !== 'afgelopen' && eerste(zoek.wijzig) === '1'
  const stand = gekozen && status !== 'gepland' && !wijzig ? await haalStand(t.admin, t.userId, gekozen) : null
  const maand = maandVan(vandaag)

  return (
    <>
      <section className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>Challenges</h1>
          <p>Doelen voor je leden, zoals 12 keer trainen in een maand. Voortgang en badges rekent Club uit bezoeken, trainingen en groepslessen. Puur erkenning: er hoort geen prijs bij.</p>
        </div>
        <div className="club-acties">
          <Link href={clubPad('/challenges', vestiging, { nieuw: '1' })} scroll={false} className="club-knop club-knop--primair">
            <Plus size={16} aria-hidden /> Nieuwe challenge
          </Link>
        </div>
      </section>

      {lijst === null && <p className="club-melding club-melding--fout" role="status">De challenges konden niet worden geladen. Ververs de pagina of probeer het later opnieuw.</p>}

      <div className="club-challenges-werkvlak">
        <ChallengeLijst groepen={groepen} vandaag={vandaag} gekozen={nieuw ? null : (gekozen?.id ?? null)} vestiging={vestiging} vestigingen={t.vestigingen} />
        <div className="club-challenges-zij">
          {nieuw ? (
            <ChallengeFormulier key="nieuw" standaardStart={maand.start} standaardEind={maand.eind} terugHref={terug} />
          ) : wijzig && gekozen ? (
            <ChallengeFormulier key={gekozen.id} begin={gekozen} standaardStart={maand.start} standaardEind={maand.eind} terugHref={terug} />
          ) : gekozen && status ? (
            <ChallengeDetail c={gekozen} status={status} stand={stand} vandaag={vandaag} vestiging={vestiging} vestigingen={t.vestigingen} />
          ) : (
            <p className="club-challenges-leeg">Nog geen challenges. Maak er een, bijvoorbeeld 12 keer trainen deze maand.</p>
          )}
        </div>
      </div>
    </>
  )
}
