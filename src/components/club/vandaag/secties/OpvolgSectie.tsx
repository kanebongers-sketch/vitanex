import { Suspense, type ReactNode } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { haalAlleMedewerkers, haalOpenTaken, haalRegels, zorgVoorRondeVanVandaag } from '@/lib/club/automatisering/opslag'
import { groepeerPerRegel, type Taak } from '@/lib/club/automatisering/taken'
import { maakBelijst } from '@/lib/club/automatisering/belijst'
import { naarGroepen, type Context } from '@/lib/club/automatisering/weergave'
import type { VandaagLead } from '@/lib/club/cijfers/haal-vandaag'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { VANDAAG_SECTIES } from '@/lib/aiyourgym/taal/woorden/club/vandaag'
import { Opvolglijst } from '@/components/club/automatisering/Opvolglijst'
import { LeadsOpvolgen } from '../Opvolgen'
import { SectieKop, type SectieLink } from './SectieKop'
import '@/components/club/automatisering/automatisering.css'

// Bellen vandaag (ontwerp 03-11-2026; anker #opvolgen blijft). Behapbaar
// (opdracht Kane 03-11-2026): hoogstens vijf gesprekken, op volgorde van belang
// (belijst.ts): leads met een proefles, dan leden (proeflid, opzegging, risico,
// lang niet gezien, ...), dan de andere leads. Links de leden (met Gedaan en
// Overslaan), rechts de leads en wie er jarig is (children). De rest staat in
// de volledige lijst: "Alle n bekijken" (Leden · Leads, tabblad Opvolgen). De
// ronde van vandaag draait hier alleen als die vandaag nog niet draaide.

interface Props {
  admin: SupabaseClient
  userId: string
  vestiging: Vestiging
  vestigingNaam: string
  /** YYYY-MM-DD in Nederland. */
  vandaag: string
  /** Mag deze persoon Opvolgen (leden)? Zonder: alleen leads en jarigen. */
  magLeden: boolean
  /** Mag deze persoon taken afhandelen (bewerken)? Zonder: alleen lezen. */
  magBewerken?: boolean
  /** Mag deze persoon de opvolgregels instellen? */
  magRegels: boolean
  /** Leads die aan de beurt zijn (eerste deel), of null als deze persoon Leads niet ziet. */
  leads: readonly VandaagLead[] | null
  /** Het echte aantal leads dat aan de beurt is. */
  leadsTotaal: number
  /** Wie er jarig is, al gefilterd op de rechten. */
  children?: ReactNode
}

type Basis = Omit<Props, 'children' | 'magRegels'> & { jarig?: ReactNode; regelsLink: SectieLink | null }

async function ledenTaken({ admin, userId, vestiging }: Pick<Props, 'admin' | 'userId' | 'vestiging'>): Promise<Taak[] | null> {
  await zorgVoorRondeVanVandaag(admin, userId, vestiging, new Date())
  return haalOpenTaken(admin, userId, vestiging)
}

async function Belijst({ admin, userId, vestiging, vestigingNaam, vandaag, magLeden, magBewerken = true, leads, leadsTotaal, jarig, regelsLink }: Basis) {
  const w = (await clubTekst(VANDAAG_SECTIES)).opvolgen
  const [open, regels, medewerkers] = await Promise.all([
    magLeden ? ledenTaken({ admin, userId, vestiging }) : Promise.resolve([] as Taak[]),
    magLeden ? haalRegels(admin, userId) : Promise.resolve(null),
    magLeden ? haalAlleMedewerkers(admin, userId) : Promise.resolve(null),
  ])
  const lijst = maakBelijst(open ?? [], leads ?? [], vandaag, leads ? leadsTotaal : 0)
  const ledenOpLijst = lijst.items.flatMap((i) => (i.soort === 'lid' ? [i.taak] : []))
  const leadsOpLijst = lijst.items.flatMap((i) => (i.soort === 'lead' ? [i.lead] : []))
  const meer = lijst.totaal > lijst.items.length
  const volledig = magLeden ? clubPad('/opvolgen', vestiging) : clubPad('/leads', vestiging)
  const links: SectieLink[] = [{ href: volledig, label: meer ? w.alle(lijst.totaal) : w.lijst }, ...(regelsLink ? [regelsLink] : [])]
  const ctx: Context = { vestigingNaam, regels: regels ?? [], medewerkers: new Map((medewerkers ?? []).map((m) => [m.id, m.naam])) }
  const groepen = naarGroepen(groepeerPerRegel(ledenOpLijst), ctx, await getTaal())
  const ledenkaarten = Object.fromEntries(ledenOpLijst.map((taak) => [taak.lidId, clubPad(`/leden/${taak.lidId}`, vestiging)]))
  const allesUit = regels !== null && regels.every((r) => !r.aan)
  const rechts = [leadsOpLijst.length > 0 && <LeadsOpvolgen key="leads" leads={[...leadsOpLijst]} totaal={leadsOpLijst.length} vandaag={vandaag} vestiging={vestiging} />, jarig].filter(Boolean)
  const toonLeden = magLeden && (ledenOpLijst.length > 0 || rechts.length === 0)
  return (
    <>
      <SectieKop id="vandaag-opvolgen" titel={w.titel} sub={meer ? w.subMeer(lijst.items.length, lijst.totaal) : w.sub} links={links} />
      {open === null && <p className="club-melding club-melding--fout" role="status">{w.fout}</p>}
      {allesUit && <p className="club-melding" role="status">{w.allesUit}</p>}
      <div className="club-vandaag-opvolgen" data-alleen-rechts={!toonLeden || undefined}>
        {toonLeden && (
          <div className="club-vandaag-opvolg-leden">
            <Opvolglijst groepen={groepen} ledenkaarten={ledenkaarten} kop="h3" bewerken={magBewerken} />
          </div>
        )}
        {rechts.length > 0 && <div className="club-vandaag-stapel club-vandaag-opvolg-rechts">{rechts}</div>}
      </div>
    </>
  )
}

export async function OpvolgSectie({ magRegels, children, ...rest }: Props) {
  if (!rest.magLeden && !(rest.leads && rest.leads.length > 0) && !children) return null
  const w = (await clubTekst(VANDAAG_SECTIES)).opvolgen
  const regelsLink = rest.magLeden && magRegels ? { href: '/club/beheer/automatiseringen', label: w.regels } : null
  return (
    <section id="opvolgen" className="club-vandaag-sectie" aria-labelledby="vandaag-opvolgen">
      <Suspense
        fallback={
          <>
            <SectieKop id="vandaag-opvolgen" titel={w.titel} sub={w.sub} links={[]} />
            <div className="club-skelet" style={{ minHeight: 160 }} aria-hidden />
          </>
        }
      >
        <Belijst {...rest} jarig={children} regelsLink={regelsLink} />
      </Suspense>
    </section>
  )
}
