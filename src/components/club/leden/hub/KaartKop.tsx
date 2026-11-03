import Link from 'next/link'
import { CalendarClock, CalendarPlus, ClipboardPlus, Dumbbell, PencilLine, StickyNote, type LucideIcon } from 'lucide-react'
import { ClubKruimel } from '@/components/club/shell/ClubKruimel'
import { initialen, lidStatusLabel, volledigeNaam, type Lid } from '@/lib/club/kern/lid'
import { clubPad, type Vestiging } from '@/lib/club/kern/vestiging'
import { STATUS_CHIP } from '@/lib/club/leden/weergave'
import { lidKaartPad, metVanLid, type KaartTab } from '@/lib/club/leden/hub/tabs'
import { kaartActies, type KaartActie, type KaartRechten } from '@/lib/club/leden/hub/rechten'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { tekst } from '@/lib/aiyourgym/taal/woordenboek'
import { formatDatum } from '@/lib/aiyourgym/taal/formaat'
import { LEDENKAART } from '@/lib/aiyourgym/taal/woorden/club/ledenkaart'
import { NIEUWE_LEDEN } from '@/lib/aiyourgym/taal/woorden/club/nieuwe-leden'
import { Avatar } from '@/components/club/ontwerp/Avatar'
import { InCheckKnop } from './InCheckKnop'
import { MeerActies } from './MeerActies'

// De kop van de ledenkaart (EENVOUD-10-MINUTEN.md, hoofdstuk 4): foto, naam,
// status, lidmaatschap en coach. Rechts een hoofdactie per tabblad, de rest
// onder Meer acties. Op de telefoon staat de hoofdactie als vaste knop
// onderaan (hub.css). Alleen acties die deze persoon mag (kaartActies).

interface KaartKopProps {
  lid: Lid
  vestiging: Vestiging
  vestigingNaam: string
  coachNaam: string | null
  rechten: KaartRechten
  tab: KaartTab
  /** Heeft het lid al een intake? Zonder is de hoofdactie op Training "Intake starten". */
  heeftIntake: boolean
  /** Zelf aangemeld via een aanmeldlink van de sportschool: wanneer (migratie 480). */
  aangemeldOp?: string | null
}

type KopTekst = (typeof LEDENKAART)['nl']['kop']

interface ActieLink {
  href: string
  label: string
  Icoon: LucideIcon
}

function linkVoor(actie: Exclude<KaartActie, 'inchecken'>, lid: Lid, vestiging: Vestiging, w: KopTekst): ActieLink {
  switch (actie) {
    case 'notitie':
      return { href: lidKaartPad(lid.id, vestiging, 'overzicht', 'notities'), label: w.notitieToevoegen, Icoon: StickyNote }
    case 'lesBoeken':
      return { href: lidKaartPad(lid.id, vestiging, 'overzicht', 'les-boeken'), label: w.lesBoeken, Icoon: CalendarPlus }
    case 'afspraak':
      return { href: lidKaartPad(lid.id, vestiging, 'overzicht', 'afspraken'), label: w.afspraak, Icoon: CalendarClock }
    case 'intake':
      return { href: metVanLid(clubPad('/training/intake', vestiging, { lid: lid.id })), label: w.intakeStarten, Icoon: ClipboardPlus }
    case 'schema':
      return { href: `${lidKaartPad(lid.id, vestiging, 'training')}&maak=schema`, label: w.schemaMaken, Icoon: Dumbbell }
    case 'lidmaatschap':
      return { href: lidKaartPad(lid.id, vestiging, 'lidmaatschap', 'lidmaatschap'), label: w.lidmaatschapWijzigen, Icoon: PencilLine }
  }
}

export async function KaartKop({ lid, vestiging, vestigingNaam, coachNaam, rechten, tab, heeftIntake, aangemeldOp = null }: KaartKopProps) {
  const taal = await getTaal()
  const w = tekst(LEDENKAART, taal).kop
  const naam = volledigeNaam(lid)
  const { hoofd, meer } = kaartActies(rechten, tab, heeftIntake)
  const hoofdLink = hoofd && hoofd !== 'inchecken' ? linkVoor(hoofd, lid, vestiging, w) : null
  return (
    <header className="club-leden-kop club-lidhub-kop">
      <ClubKruimel stappen={[{ label: w.leden, href: clubPad('/leden', vestiging) }]} huidig={naam} />
      <div className="club-leden-kop-hoofd club-lidhub-kop-hoofd">
        <Avatar naam={naam} initialen={initialen(lid)} foto={{ soort: 'lid', id: lid.id, versie: lid.foto }} maat={76} vasteMaat={false} className="club-avatar club-avatar--groot club-leden-kop-avatar" />
        <div className="club-leden-kop-naam">
          <p className="club-boventitel">{vestigingNaam}{lid.demo ? ` · ${w.voorbeeldlid}` : ''}</p>
          <h1>{naam}</h1>
          <div className="club-leden-kop-chips">
            <span className={`club-chip ${STATUS_CHIP[lid.status]}`}>{lidStatusLabel(lid.status, taal)}</span>
            {lid.abonnement || rechten.lidmaatschap ? (
              <Link href={lidKaartPad(lid.id, vestiging, 'lidmaatschap')} className="club-chip club-chip--geen club-lidhub-chiplink">
                {lid.abonnement ?? w.geenVorm}
              </Link>
            ) : null}
            {coachNaam ? <span className="club-chip club-chip--geen">{w.coach(coachNaam)}</span> : null}
            {aangemeldOp ? <span className="club-chip club-chip--info">{tekst(NIEUWE_LEDEN, taal).kaart.aangemeld(formatDatum(aangemeldOp, taal, 'kort'))}</span> : null}
            {lid.einddatum ? <span className="club-chip club-chip--let-op">{w.tot(formatDatum(lid.einddatum, taal, 'kort'))}</span> : null}
            {!rechten.bewerk.leden ? <span className="club-chip club-chip--geen">{w.leesmodus}</span> : null}
          </div>
        </div>
        {(hoofdLink || meer.length > 0) && (
          <div className="club-lidhub-kop-acties" role="group" aria-label={w.acties}>
            {meer.length > 0 && (
              <MeerActies label={w.meerActies}>
                {meer.map((actie) => {
                  if (actie === 'inchecken') return <InCheckKnop key={actie} lidId={lid.id} voornaam={lid.voornaam} vestiging={vestiging} />
                  const { href, label, Icoon } = linkVoor(actie, lid, vestiging, w)
                  return (
                    <Link key={actie} href={href} className="club-lidhub-meer-item">
                      <Icoon aria-hidden size={16} /> {label}
                    </Link>
                  )
                })}
              </MeerActies>
            )}
            {hoofdLink && (
              <Link href={hoofdLink.href} className="club-knop club-knop--primair club-lidhub-hoofdactie">
                <hoofdLink.Icoon aria-hidden size={16} /> {hoofdLink.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
