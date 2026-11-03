import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowUpRight, CalendarCheck, ChevronRight, Dumbbell, Flame, MapPin } from 'lucide-react'
import type { LidVoorApp } from '@/lib/club/ledenlogin/lid-voor-app'
import type { AppLes, LidAppData } from '@/lib/club/app/data'
import { dagNaamKort, groet } from '@/lib/club/app/regels'
import { dagLetter, volgendeDag } from '@/lib/club/app/schema'
import { dagSleutel, tijdNl } from '@/lib/club/cijfers/tijd'
import type { LedenappInstellingen } from '@/lib/club/kern/org-instellingen'
import type { Bericht } from '@/lib/club/berichten/model'
import { BerichtenOpHome } from './BerichtenOpHome'
import { CheckinQr } from './CheckinQr'
import { WeekRing } from './WeekRing'
import { DiepteKaart } from '@/components/club/ontwerp/DiepteKaart'
import { rondeDezeWeek } from '@/lib/club/ontwerp/reeks'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { LEDENAPP } from '@/lib/aiyourgym/taal/woorden/ledenapp/app'
import { ONTWERP } from '@/lib/aiyourgym/taal/woorden/club/ontwerp'
import { PROFIELFOTO } from '@/lib/aiyourgym/taal/woorden/club/profielfoto'
import { Avatar } from '@/components/club/ontwerp/Avatar'
import type { Kaartje } from '@/lib/club/profielfoto/opslag'

// Home in de ledenapp (EENVOUD-10-MINUTEN.md, hoofdstuk 5). Bij de deur is
// inchecken de enige taak, dus een vaste volgorde: een korte begroeting met de
// coach als kleine regel, dan meteen de QR-code (een tik geeft hem op volledig
// scherm, zie CheckinQr), de volgende les, deze week (ring en reeks in een
// blok), hoogstens een kaart "te doen" (de pagina kiest hem met homeVolgorde)
// en het nieuwste bericht met "Alle berichten". Kopen staat op Profiel.
// Alleen echte cijfers.

interface Props {
  /** Alleen wat de app toont (in de voorvertoning mag ook een volledig Lid). */
  lid: Pick<LidVoorApp, 'id' | 'voornaam' | 'achternaam' | 'foto'>
  data: LidAppData
  nu: Date
  tabPad: (tab: string) => string
  /** Wat de sportschool heeft ingesteld voor de app (welkom, tabbladen, QR). QR alleen als de check-in methode QR toelaat. */
  instellingen: LedenappInstellingen
  /** Nieuws en acties van de sportschool voor dit lid. */
  berichten: readonly Bericht[]
  /** De coach van het lid (naam en foto), of null. */
  coach?: Kaartje | null
  /** Waar de foto's vandaan komen: club = voorvertoning in Club, lid = de ledenapp (voor = ?voor= van Kane). */
  fotoBron?: { waar: 'club' | 'lid'; voor: string | null }
  /** De ene kaart "te doen" (homeVolgorde): intake, sluiting, eerste keer of meldingen. */
  children?: ReactNode
}

function VolgendeLes({ les, vandaag, href, taal }: { les: AppLes | undefined; vandaag: string; href: string; taal: Taal }) {
  const t = LEDENAPP[taal].home
  if (!les) {
    return (
      <Link href={href} className="club-lidapp-volgende club-lidapp-volgende--leeg">
        <span className="club-lidapp-boven">
          <CalendarCheck aria-hidden size={15} /> {t.volgendeLes}
        </span>
        <strong>{t.nogNiets}</strong>
        <span className="club-lidapp-volgende-wanneer">{t.bekijkLessen}</span>
        <span className="club-lidapp-volgende-pijl" aria-hidden>
          <ArrowUpRight size={20} />
        </span>
      </Link>
    )
  }
  const start = new Date(les.start)
  return (
    <Link href={href} className="club-lidapp-volgende">
      <span className="club-lidapp-boven">
        <CalendarCheck aria-hidden size={15} /> {t.volgendeLes}
      </span>
      <strong>{les.naam}</strong>
      <span className="club-lidapp-volgende-wanneer">
        <span className="club-lidapp-volgende-tijd">
          {t.om(dagNaamKort(dagSleutel(start), vandaag, taal), tijdNl(start))}
        </span>
        {les.zaal ? (
          <span className="club-lidapp-volgende-zaal">
            <MapPin aria-hidden size={14} /> {les.zaal}
          </span>
        ) : null}
      </span>
      <span className="club-lidapp-volgende-pijl" aria-hidden>
        <ArrowUpRight size={20} />
      </span>
    </Link>
  )
}

type LedenappTeksten = (typeof ONTWERP)['nl']['ledenapp']

interface DezeWeekProps {
  data: LidAppData
  /** Het schema telt mee (tabblad Schema staat aan en er zijn trainingsdagen). */
  metSchema: boolean
  nu: Date
  w: LedenappTeksten
  /** De training van vandaag als link naar Schema, of null. */
  vandaag: { href: string; boven: string; tekst: string } | null
}

/** Ring en reeks in een blok: de week van het schema, bezoek deze maand en weken op rij. */
function DezeWeek({ data, metSchema, nu, w, vandaag }: DezeWeekProps) {
  const schema = metSchema ? data.schema : null
  const ronde = schema ? rondeDezeWeek(schema.dagen, data.logs, schema.id, nu) : null
  const metRing = ronde !== null && ronde.totaal > 0
  return (
    <section className="club-lidapp-week" data-ring={metRing || undefined} aria-label={w.week}>
      {metRing && ronde && (
        <>
          <WeekRing gedaan={ronde.gedaan} totaal={ronde.totaal} label={w.rondeAria(ronde.gedaan, ronde.totaal)} maat={112} />
          <div className="club-lidapp-week-tekst">
            <span className="club-lidapp-duo-label">{w.week}</span>
            <strong>{w.ronde(ronde.gedaan, ronde.totaal)}</strong>
            <span>{ronde.gedaan >= ronde.totaal ? w.rondeKlaar : w.rondeNog(ronde.dagen.filter((d) => !d.gedaan).map((d) => dagLetter(d.dag)).join(', '))}</span>
            <ul className="club-ronde">
              {ronde.dagen.map((d) => (
                <li key={d.dag} data-gedaan={d.gedaan || undefined}>
                  {w.dag(dagLetter(d.dag))}
                  <span className="club-sr">, {d.gedaan ? w.gedaan : w.open}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
      <dl className="club-lidapp-week-cijfers">
        <div>
          <dt>{w.bezoekMaand}</dt>
          <dd><strong>{data.bezoekenMaand}</strong> {w.bezoek(data.bezoekenMaand)}</dd>
        </div>
        <div data-actief={data.wekenOpRij > 0 || undefined}>
          <dt>{w.reeks} <Flame aria-hidden size={13} /></dt>
          <dd><strong>{data.wekenOpRij}</strong> {w.weken(data.wekenOpRij)}</dd>
        </div>
      </dl>
      {metRing && vandaag && (
        <Link href={vandaag.href} className="club-lidapp-week-vandaag">
          <Dumbbell aria-hidden size={18} />
          <span>
            <span>{vandaag.boven}</span>
            <strong>{vandaag.tekst}</strong>
          </span>
          <ChevronRight aria-hidden size={18} />
        </Link>
      )}
    </section>
  )
}

export async function HomeTab({ lid, data, nu, tabPad, instellingen, berichten, coach = null, fotoBron = { waar: 'club', voor: null }, children }: Props) {
  const lessenAan = !instellingen.tabsUit.includes('lessen')
  const schemaAan = !instellingen.tabsUit.includes('schema')
  const vandaag = dagSleutel(nu)
  const volgende = data.lessen.find((l) => l.mijn?.status === 'geboekt' && new Date(l.start).getTime() > nu.getTime())
  const schemaDag = data.schema ? volgendeDag(data.schema.dagen, data.logs, data.schema.id) : null
  const w = (await clubTekst(ONTWERP)).ledenapp
  const taal = await getTaal()
  const t = LEDENAPP[taal].home
  return (
    <div className="club-lidapp-tab club-lidapp-home">
      <header className="club-lidapp-welkomkop club-lidapp-welkomkop--kort">
        <div className="club-lidapp-welkomrij">
          <Avatar naam={`${lid.voornaam} ${lid.achternaam}`} foto={{ soort: 'lid', id: lid.id, versie: lid.foto }} maat={44} waar={fotoBron.waar} voor={fotoBron.voor} className="club-avatar club-lidapp-welkomfoto" />
          <div>
            <p className="club-lidapp-groet">{groet(nu, taal)},</p>
            <h2 className="club-lidapp-naam">{lid.voornaam}</h2>
          </div>
        </div>
        {coach && (
          <p className="club-lidapp-coach">
            <Avatar naam={coach.naam} foto={{ soort: 'mw', id: coach.id, versie: coach.foto }} maat={22} waar={fotoBron.waar} voor={fotoBron.voor} />
            <span>
              <span className="club-lidapp-coach-label">{PROFIELFOTO[taal].jeCoach}</span> {coach.naam}
            </span>
          </p>
        )}
        {instellingen.welkom && <p className="club-lidapp-welkom">{instellingen.welkom}</p>}
      </header>

      {instellingen.qr && <CheckinQr lidId={lid.id} />}

      {lessenAan && (
        <DiepteKaart className="club-lidapp-licht">
          <VolgendeLes les={volgende} vandaag={vandaag} href={tabPad('lessen')} taal={taal} />
        </DiepteKaart>
      )}

      <DezeWeek
        data={data}
        metSchema={schemaAan}
        nu={nu}
        w={w}
        vandaag={data.schema && schemaDag !== null ? { href: tabPad('schema'), boven: t.vandaagProgramma, tekst: t.schemaDag(data.schema.naam, dagLetter(schemaDag)) } : null}
      />

      {children}

      <BerichtenOpHome berichten={berichten} nu={nu} fotoBron={fotoBron} alleLabel={t.alleBerichten(berichten.length)} />
    </div>
  )
}
