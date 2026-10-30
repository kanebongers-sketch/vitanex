import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { VOEDING } from '@/lib/aiyourgym/taal/woorden/club/voeding'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { eisClubToegang } from '@/lib/club/toegang'
import { clubPad } from '@/lib/club/kern/vestiging'
import { naamVan } from '@/lib/club/kern/vestigingen'
import { volledigeNaam } from '@/lib/club/kern/lid'
import { nlDelen } from '@/lib/club/rooster/tijd'
import { haalVoortgang } from '@/lib/club/voortgang/data'
import { haalEigenLid, haalPlan, haalSjablonen } from '@/lib/club/voeding/lezen'
import { startVelden } from '@/lib/club/voeding/startwaarden'
import { PlanEditor } from '@/components/club/voeding/PlanEditor'
import { PlanBron } from '@/components/club/voeding/PlanBron'
import { ClubKruimel, stappenNaarLid } from '@/components/club/shell/ClubKruimel'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { moduleAan } from '@/lib/club/kern/organisatie'
import { lidKaartPad } from '@/lib/club/leden/hub/tabs'
import '@/components/club/voeding/voeding.css'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(VOEDING)).pagina.plan }
}

// Het voedingsplan van een lid maken of bewerken. Alleen voor een lid van deze
// sportschool in een van haar eigen vestigingen; anders een gewone 404.

export default async function VoedingLidPagina({ params }: { params: Promise<{ id: string }> }) {
  const t = await eisClubToegang()
  const { id } = await params
  const lid = await haalEigenLid(t.admin, t.userId, t.vestigingen, id)
  if (!lid) notFound()
  const nu = new Date()
  const [plan, sjablonen, voortgang] = await Promise.all([haalPlan(t.admin, t.userId, lid.id), haalSjablonen(t.admin, t.userId), haalVoortgang(t.admin, t.userId, lid.id, nu)])
  const naam = volledigeNaam(lid)
  const magLeden = moduleAan(t.organisatie, 'leden') && magOnderdeel(t.onderdelen, 'leden')
  const naarLid = stappenNaarLid(magLeden, { id: lid.id, naam }, lid.vestiging, await getTaal())
  const tv = await clubTekst(VOEDING)
  const tp = tv.pagina
  const kruimel = naarLid.length ? naarLid : [{ label: tp.titel, href: clubPad('/voeding', lid.vestiging) }]

  return (
    <>
      <ClubKruimel stappen={kruimel} huidig={plan ? tp.plan : tp.nieuwPlan} />
      <section className="club-paginakop">
        <div>
          <p className="club-boventitel">{tp.planBoventitel(naamVan(t.vestigingen, lid.vestiging))}</p>
          <h1>{plan ? tp.plan : tp.nieuwPlan}</h1>
          <p>{tp.planIntro}</p>
        </div>
      </section>
      {plan === null && <p className="club-melding club-melding--fout" role="alert">{tp.planFout}</p>}
      {sjablonen === null && <p className="club-melding club-melding--fout" role="status">{tp.sjablonenNietGeladen}</p>}
      {plan && (plan.bron === 'lid' || plan.voorstel) && (
        <div className="club-kaart">
          <PlanBron lidId={lid.id} bron={plan.bron} huidig={plan} voorstel={plan.voorstel} voorstelOp={plan.voorstelOp} metGegevens={plan.bron === 'lid' && plan.lidToestemmingOp !== null && plan.berekening !== null} />
        </div>
      )}
      {plan !== null && (
        <PlanEditor
          lidId={lid.id}
          lidNaam={lid.voornaam}
          plan={plan}
          sjablonen={sjablonen ?? []}
          beginVelden={startVelden(plan, lid, voortgang.punten, nlDelen(nu).datum)}
          terugHref={magLeden ? lidKaartPad(lid.id, lid.vestiging, 'training') : clubPad('/voeding', lid.vestiging)}
          sjablonenHref={clubPad('/voeding', lid.vestiging, { tab: 'sjablonen' })}
        />
      )}
    </>
  )
}
