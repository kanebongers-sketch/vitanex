import Link from 'next/link'
import { Suspense } from 'react'
import type { ClubToegang } from '@/lib/club/toegang'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { volledigeNaam, type Lid } from '@/lib/club/kern/lid'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { dagSleutelNl } from '@/lib/club/kern/datum'
import type { LidKaart } from '@/lib/club/leden/kaart'
import { reserveringStatusTekst } from '@/lib/club/leden/reservering'
import { RESERVERING_CHIP } from '@/lib/club/leden/weergave'
import { haalLessen } from '@/lib/club/rooster/basis-opslag'
import { haalAlleMedewerkers, haalTypen } from '@/lib/club/afspraken/opslag'
import { magGeven } from '@/lib/club/afspraken/regels'
import { haalChallenges, haalInschrijvingen } from '@/lib/club/challenges/lezen'
import { doetMee, statusVan } from '@/lib/club/challenges/periode'
import { BOEK_DAGEN, boekbareLessen, STAAT_IN_LES } from '@/lib/club/leden/hub/planning'
import type { KaartRechten } from '@/lib/club/leden/hub/rechten'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { tekst } from '@/lib/aiyourgym/taal/woordenboek'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { LEDENKAART } from '@/lib/aiyourgym/taal/woorden/club/ledenkaart'
import { AfsprakenVanLid } from '@/components/club/afspraken/AfsprakenVanLid'
import { Reserveringen } from '../Reserveringen'
import { AfspraakPlannen } from './AfspraakPlannen'
import { LesBoeken } from './LesBoeken'
import { LaatsteBezoeken } from './LaatsteBezoeken'
import '@/components/club/afspraken/afspraken.css'

// Tabblad Planning: lessen boeken en annuleren, afspraken bekijken en plannen,
// bezoek en challenges. Elk blok alleen met het recht op dat onderdeel.

interface PlanningTabProps {
  t: ClubToegang
  kaart: LidKaart
  vestiging: Vestiging
  rechten: KaartRechten
  nu: Date
}

const MS_DAG = 86_400_000

async function Lessen({ t, kaart, nu }: Pick<PlanningTabProps, 't' | 'kaart' | 'nu'>) {
  const { lid } = kaart
  const lessen = await haalLessen(t.admin, t.userId, lid.vestiging, nu, new Date(nu.getTime() + BOEK_DAGEN * MS_DAG))
  const alGeboekt = new Set(kaart.aankomend.filter((r) => STAAT_IN_LES.includes(r.status)).map((r) => r.lesId))
  const aankomend = kaart.aankomend
    .filter((r) => !r.lesGeannuleerd && (r.status === 'geboekt' || r.status === 'wachtlijst'))
    .map((r) => ({ id: r.id, lesNaam: r.lesNaam, startOp: r.start.toISOString(), eindOp: r.eind.toISOString(), statusTekst: reserveringStatusTekst(r), chip: RESERVERING_CHIP[r.status] }))
  return <LesBoeken lidId={lid.id} aankomend={aankomend} lessen={lessen ? boekbareLessen(lessen, alGeboekt, nu) : null} />
}

async function Afspraak({ t, lid, nu }: { t: ClubToegang; lid: Lid; nu: Date }) {
  const [typen, medewerkers] = await Promise.all([haalTypen(t.admin, t.userId), haalMedewerkers(t.admin, t.userId, lid.vestiging)])
  const lijst = typen ?? []
  const typeTrainers = Object.fromEntries(lijst.map((ty) => [ty.id, (medewerkers ?? []).filter((m) => magGeven(ty, m, lid.vestiging)).map((m) => m.id)]))
  const geeftIets = new Set(Object.values(typeTrainers).flat())
  const alle = await haalAlleMedewerkers(t.admin, t.userId)
  const trainers = (alle ?? []).filter((m) => geeftIets.has(m.id)).map((m) => ({ id: m.id, naam: m.naam }))
  return (
    <AfspraakPlannen
      lid={{ id: lid.id, naam: volledigeNaam(lid) }}
      vestiging={lid.vestiging}
      typen={lijst.filter((ty) => ty.actief)}
      typeTrainers={typeTrainers}
      trainers={trainers}
      vandaag={dagSleutelNl(nu)}
    />
  )
}

async function Challenges({ t, lid, vestiging, nu }: { t: ClubToegang; lid: Lid; vestiging: Vestiging; nu: Date }) {
  const taal = await getTaal()
  const w = tekst(LEDENKAART, taal).planning
  const [lijst, ingeschreven] = await Promise.all([haalChallenges(t.admin, t.userId), haalInschrijvingen(t.admin, t.userId, lid.id)])
  const vandaag = dagSleutelNl(nu)
  const mee = (lijst ?? []).filter((c) => statusVan(c, vandaag) !== 'afgelopen' && doetMee(c, lid, ingeschreven?.has(c.id) ?? false))
  return (
    <section className="club-kaart" aria-labelledby="challenges-kop">
      <div className="club-sectiekop">
        <h2 id="challenges-kop">{w.challenges}</h2>
        <Link href={clubPad('/challenges', vestiging)}>{tekst(LEDENKAART, taal).overzicht.alles}</Link>
      </div>
      {mee.length === 0 ? <p className="club-hint">{w.geenChallenges}</p> : (
        <ul className="club-lijst">
          {mee.map((c) => (
            <li key={c.id} className="club-rij">
              <span className="club-rij-hoofd">
                <span className="club-rij-titel">{c.titel}</span>
                <span className="club-rij-sub">{w.challengePeriode(formatDatum(c.start, taal, 'kort'), formatDatum(c.eind, taal, 'kort'))}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export async function PlanningTab({ t, kaart, vestiging, rechten, nu }: PlanningTabProps) {
  const w = tekst(LEDENKAART, await getTaal()).planning
  const { lid } = kaart
  return (
    <div className="club-lidhub-tab club-lidhub-twee">
      <div className="club-leden-kolom">
        {rechten.rooster && (
          <Suspense fallback={<div className="club-skelet" style={{ minHeight: 200 }} aria-hidden />}>
            <Lessen t={t} kaart={kaart} nu={nu} />
          </Suspense>
        )}
        <Reserveringen aankomend={kaart.aankomend} recent={kaart.recent} checkins={kaart.bezoeken} nu={nu} metAankomend={!rechten.rooster} />
      </div>
      <div className="club-leden-kolom">
        {rechten.afspraken && (
          <section className="club-lidhub-blok" id="afspraken" aria-label={w.afspraken}>
            <Suspense fallback={null}>
              <Afspraak t={t} lid={lid} nu={nu} />
            </Suspense>
            <Suspense fallback={<div className="club-skelet" style={{ minHeight: 120 }} aria-hidden />}>
              <AfsprakenVanLid lidId={lid.id} vestiging={lid.vestiging} />
            </Suspense>
          </section>
        )}
        <LaatsteBezoeken kaart={kaart} nu={nu} vestigingen={t.vestigingen} />
        {rechten.challenges && (
          <Suspense fallback={null}>
            <Challenges t={t} lid={lid} vestiging={vestiging} nu={nu} />
          </Suspense>
        )}
      </div>
    </div>
  )
}
