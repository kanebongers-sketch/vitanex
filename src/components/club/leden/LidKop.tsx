import Link from 'next/link'
import { CalendarClock, CalendarPlus, ClipboardPlus, Dumbbell, StickyNote } from 'lucide-react'
import { ClubKruimel } from '@/components/club/shell/ClubKruimel'
import { initialen, lidStatusLabel, volledigeNaam, type Lid } from '@/lib/club/kern/lid'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { STATUS_CHIP } from '@/lib/club/leden/weergave'
import { lidKaartPad, metVanLid } from '@/lib/club/leden/hub/tabs'
import type { KaartRechten } from '@/lib/club/leden/hub/rechten'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { tekst } from '@/lib/aiyourgym/taal/woordenboek'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { LEDENKAART } from '@/lib/aiyourgym/taal/woorden/club/ledenkaart'
import { InCheckKnop } from './hub/InCheckKnop'
import { Avatar } from '@/components/club/ontwerp/Avatar'

// De kop van de ledenkaart: wie is dit, wat voor lid, en de acties die je het
// vaakst vanuit het lid start (besluit Kane 27-10-2026: alles vanuit het lid).
// Alleen knoppen naar onderdelen die aan staan en die deze persoon mag zien.

interface LidKopProps {
  lid: Lid
  vestiging: Vestiging
  /** De naam van de vestiging van het lid. */
  vestigingNaam: string
  coachNaam: string | null
  rechten: KaartRechten
}

function Feit({ label, waarde, onbekend }: { label: string; waarde: string | null; onbekend: string }) {
  return (
    <div className="club-leden-feit">
      <dt>{label}</dt>
      <dd className={waarde ? 'club-getal' : 'club-zacht'}>{waarde ?? onbekend}</dd>
    </div>
  )
}

export async function LidKop({ lid, vestiging, vestigingNaam, coachNaam, rechten }: LidKopProps) {
  const taal = await getTaal()
  const w = tekst(LEDENKAART, taal).kop
  const datum = (d: string | null) => (d ? formatDatum(d, taal, 'kort') : null)
  const naam = volledigeNaam(lid)
  return (
    <header className="club-leden-kop">
      <ClubKruimel stappen={[{ label: w.leden, href: clubPad('/leden', vestiging) }]} huidig={naam} />
      <div className="club-leden-kop-hoofd">
        <Avatar naam={naam} initialen={initialen(lid)} foto={{ soort: 'lid', id: lid.id, versie: lid.foto }} maat={76} vasteMaat={false} className="club-avatar club-avatar--groot club-leden-kop-avatar" />
        <div className="club-leden-kop-naam">
          <p className="club-boventitel">{vestigingNaam}{lid.demo ? ` · ${w.voorbeeldlid}` : ''}</p>
          <h1>{naam}</h1>
          <div className="club-leden-kop-chips">
            <span className={`club-chip ${STATUS_CHIP[lid.status]}`}>{lidStatusLabel(lid.status, taal)}</span>
            {rechten.lidmaatschap ? (
              <Link href={lidKaartPad(lid.id, vestiging, 'lidmaatschap')} className="club-chip club-chip--geen club-lidhub-chiplink">
                {lid.abonnement ?? w.geenVorm}
              </Link>
            ) : lid.abonnement ? (
              <span className="club-chip club-chip--geen">{lid.abonnement}</span>
            ) : null}
            {coachNaam ? <span className="club-chip club-chip--geen">{w.coach(coachNaam)}</span> : null}
            {lid.einddatum ? <span className="club-chip club-chip--let-op">{w.tot(datum(lid.einddatum) ?? '')}</span> : null}
          </div>
        </div>
        <nav className="club-leden-kop-acties club-lidhub-acties" aria-label={w.acties}>
          {rechten.training && (
            <Link href={metVanLid(clubPad('/training/intake', vestiging, { lid: lid.id }))} className="club-knop club-knop--primair">
              <ClipboardPlus aria-hidden size={16} /> {w.intakeStarten}
            </Link>
          )}
          {rechten.training && (
            <Link href={`${lidKaartPad(lid.id, vestiging, 'training')}&maak=schema`} className="club-knop">
              <Dumbbell aria-hidden size={16} /> {w.schemaMaken}
            </Link>
          )}
          {rechten.rooster && (
            <Link href={`${lidKaartPad(lid.id, vestiging, 'planning')}#les-boeken`} className="club-knop">
              <CalendarPlus aria-hidden size={16} /> {w.lesBoeken}
            </Link>
          )}
          {rechten.afspraken && (
            <Link href={`${lidKaartPad(lid.id, vestiging, 'planning')}#afspraken`} className="club-knop">
              <CalendarClock aria-hidden size={16} /> {w.afspraak}
            </Link>
          )}
          <Link href={`${lidKaartPad(lid.id, vestiging, 'contact')}#notities`} className="club-knop">
            <StickyNote aria-hidden size={16} /> {w.notitie}
          </Link>
          {rechten.checkin && <InCheckKnop lidId={lid.id} voornaam={lid.voornaam} vestiging={vestiging} />}
        </nav>
      </div>
      <dl className="club-leden-feiten">
        <Feit label={w.lidSinds} waarde={datum(lid.lidSinds)} onbekend={w.onbekend} />
        <Feit label={w.lidnummer} waarde={lid.lidnummer} onbekend={w.onbekend} />
        {lid.sportivityId ? <Feit label={w.extern} waarde={lid.sportivityId} onbekend={w.onbekend} /> : null}
        <div className="club-leden-feit club-leden-feit--sportivity">
          <dt>{w.geld}</dt>
          <dd>{rechten.betalen ? <Link href={lidKaartPad(lid.id, vestiging, 'lidmaatschap')}>{w.geldHier}</Link> : w.geldElders}</dd>
        </div>
      </dl>
    </header>
  )
}
