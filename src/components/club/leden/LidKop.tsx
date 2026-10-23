import Link from 'next/link'
import { CalendarDays, Dumbbell } from 'lucide-react'
import { ClubKruimel } from '@/components/club/shell/ClubKruimel'
import { initialen, LID_STATUS_LABEL, volledigeNaam, type Lid } from '@/lib/club/kern/lid'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { datumUitSleutel } from '@/lib/club/leden/tijd'
import { STATUS_CHIP } from '@/lib/club/leden/weergave'

// De kop van de ledenkaart: wie is dit, wat voor lid, en waar de rest staat.
// Geen bedragen: "Geld en contract: in Sportivity".

interface LidKopProps {
  lid: Lid
  vestiging: Vestiging
  /** De naam van de vestiging van het lid. */
  vestigingNaam: string
  coachNaam: string | null
  /** Knoppen alleen naar onderdelen die aan staan en die deze persoon mag zien (geen dode links). */
  naar?: { training: boolean; rooster: boolean }
}

function Feit({ label, waarde }: { label: string; waarde: string | null }) {
  return (
    <div className="club-leden-feit">
      <dt>{label}</dt>
      <dd className={waarde ? 'club-getal' : 'club-zacht'}>{waarde ?? 'Onbekend'}</dd>
    </div>
  )
}

export function LidKop({ lid, vestiging, vestigingNaam, coachNaam, naar = { training: true, rooster: true } }: LidKopProps) {
  return (
    <header className="club-leden-kop">
      <ClubKruimel stappen={[{ label: 'Leden', href: clubPad('/leden', vestiging) }]} huidig={volledigeNaam(lid)} />
      <div className="club-leden-kop-hoofd">
        <span className="club-avatar club-avatar--groot club-leden-kop-avatar" aria-hidden>{initialen(lid)}</span>
        <div className="club-leden-kop-naam">
          <p className="club-boventitel">{vestigingNaam}{lid.demo ? ' · voorbeeldlid' : ''}</p>
          <h1>{volledigeNaam(lid)}</h1>
          <div className="club-leden-kop-chips">
            <span className={`club-chip ${STATUS_CHIP[lid.status]}`}>{LID_STATUS_LABEL[lid.status]}</span>
            {lid.abonnement ? <span className="club-chip club-chip--geen">{lid.abonnement}</span> : null}
            {coachNaam ? <span className="club-chip club-chip--geen">Coach {coachNaam}</span> : null}
            {lid.einddatum ? <span className="club-chip club-chip--let-op">Tot {datumUitSleutel(lid.einddatum)}</span> : null}
          </div>
        </div>
        {(naar.training || naar.rooster) && (
          <nav className="club-leden-kop-acties" aria-label="Naar andere onderdelen">
            {naar.training && (
              <Link href={clubPad('/training', vestiging, { lid: lid.id })} className="club-knop">
                <Dumbbell aria-hidden size={16} /> Training
              </Link>
            )}
            {naar.rooster && (
              <Link href={clubPad('/rooster', vestiging)} className="club-knop">
                <CalendarDays aria-hidden size={16} /> Rooster
              </Link>
            )}
          </nav>
        )}
      </div>
      <dl className="club-leden-feiten">
        <Feit label="Lid sinds" waarde={datumUitSleutel(lid.lidSinds)} />
        <Feit label="Lidnummer" waarde={lid.lidnummer} />
        {lid.sportivityId ? <Feit label="Extern klantnummer" waarde={lid.sportivityId} /> : null}
        <div className="club-leden-feit club-leden-feit--sportivity">
          <dt>Geld en contract</dt>
          <dd>In je ledenadministratie</dd>
        </div>
      </dl>
    </header>
  )
}
