import { Suspense, type ReactNode } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { haalAlleMedewerkers, haalOpenTaken, haalRegels, zorgVoorRondeVanVandaag } from '@/lib/club/automatisering/opslag'
import { groepeerPerRegel } from '@/lib/club/automatisering/taken'
import { naarGroepen, type Context } from '@/lib/club/automatisering/weergave'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { VANDAAG_SECTIES } from '@/lib/aiyourgym/taal/woorden/club/vandaag'
import { Opvolglijst } from '@/components/club/automatisering/Opvolglijst'
import { SectieKop, type SectieLink } from './SectieKop'
import '@/components/club/automatisering/automatisering.css'

// Wie je vandaag belt of aanspreekt, op Vandaag: links de opvolglijst van de
// leden (per regel, met Gedaan en Overslaan), rechts de leads die vandaag aan
// de beurt zijn en wie er jarig is (children). De ronde van vandaag draait hier
// alleen als die vandaag nog niet draaide, zodat Vandaag snel blijft. De
// volledige lijst met "recent afgehandeld" blijft op /club/opvolgen.

interface Props {
  admin: SupabaseClient
  userId: string
  vestiging: Vestiging
  vestigingNaam: string
  /** Mag deze persoon Opvolgen (leden)? Zonder: alleen de rechterkolom. */
  magLeden: boolean
  /** Mag deze persoon de opvolgregels instellen? */
  magRegels: boolean
  /** Leads opvolgen en Jarig, al gefilterd op de rechten. */
  children?: ReactNode
}

async function LedenOpvolgen({ admin, userId, vestiging, vestigingNaam }: Pick<Props, 'admin' | 'userId' | 'vestiging' | 'vestigingNaam'>) {
  const w = (await clubTekst(VANDAAG_SECTIES)).opvolgen
  await zorgVoorRondeVanVandaag(admin, userId, vestiging, new Date())
  const [open, regels, medewerkers] = await Promise.all([haalOpenTaken(admin, userId, vestiging), haalRegels(admin, userId), haalAlleMedewerkers(admin, userId)])
  if (open === null) return <p className="club-melding club-melding--fout" role="status">{w.fout}</p>
  const ctx: Context = { vestigingNaam, regels: regels ?? [], medewerkers: new Map((medewerkers ?? []).map((m) => [m.id, m.naam])) }
  const groepen = naarGroepen(groepeerPerRegel(open), ctx)
  const ledenkaarten = Object.fromEntries(open.map((taak) => [taak.lidId, clubPad(`/leden/${taak.lidId}`, vestiging)]))
  const allesUit = regels !== null && regels.every((r) => !r.aan)
  return (
    <>
      {allesUit && <p className="club-melding" role="status">{w.allesUit}</p>}
      <Opvolglijst groepen={groepen} ledenkaarten={ledenkaarten} kop="h3" />
    </>
  )
}

export async function OpvolgSectie({ admin, userId, vestiging, vestigingNaam, magLeden, magRegels, children }: Props) {
  const w = (await clubTekst(VANDAAG_SECTIES)).opvolgen
  const links: SectieLink[] = [
    ...(magLeden ? [{ href: clubPad('/opvolgen', vestiging), label: w.lijst }] : []),
    ...(magLeden && magRegels ? [{ href: '/club/beheer/automatiseringen', label: w.regels }] : []),
  ]
  return (
    <section id="opvolgen" className="club-vandaag-sectie" aria-labelledby="vandaag-opvolgen">
      <SectieKop id="vandaag-opvolgen" titel={w.titel} sub={w.sub} links={links} />
      <div className="club-vandaag-opvolgen" data-alleen-rechts={!magLeden || undefined}>
        {magLeden && (
          <div className="club-vandaag-opvolg-leden">
            <Suspense fallback={<div className="club-skelet" style={{ minHeight: 160 }} aria-hidden />}>
              <LedenOpvolgen admin={admin} userId={userId} vestiging={vestiging} vestigingNaam={vestigingNaam} />
            </Suspense>
          </div>
        )}
        {children && <div className="club-vandaag-stapel club-vandaag-opvolg-rechts">{children}</div>}
      </div>
    </section>
  )
}
