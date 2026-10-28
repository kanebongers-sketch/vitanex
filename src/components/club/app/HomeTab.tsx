import Link from 'next/link'
import { ArrowUpRight, CalendarCheck, ChevronRight, Dumbbell, Flame, MapPin } from 'lucide-react'
import type { LidVoorApp } from '@/lib/club/ledenlogin/lid-voor-app'
import type { AppLes, LidAppData } from '@/lib/club/app/data'
import { dagNaamKort, groet } from '@/lib/club/app/regels'
import { dagLetter, volgendeDag } from '@/lib/club/app/schema'
import { dagSleutel, tijdNl } from '@/lib/club/cijfers/tijd'
import type { LedenappInstellingen } from '@/lib/club/kern/org-instellingen'
import type { Bericht } from '@/lib/club/berichten/model'
import { LedenappBerichten } from '@/components/club/berichten/LedenappBerichten'
import { CheckinQr } from './CheckinQr'
import { WeekRing } from './drie/WeekRing'
import { DiepteKaart } from '@/components/club/ontwerp/DiepteKaart'
import { rondeDezeWeek } from '@/lib/club/ontwerp/reeks'
import type { AppSchema } from '@/lib/club/app/data'
import type { AppLog } from '@/lib/club/app/schema'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { ONTWERP } from '@/lib/aiyourgym/taal/woorden/club/ontwerp'

// Home in de ledenapp. Een duidelijke volgorde: begroeting, dan de grote focus
// (de volgende geboekte les), dan inchecken met de QR-code (wisselt elke 30
// seconden, zie CheckinQr), daarna de week van het schema als ring (3D waar het
// kan, zie drie/WeekRing), bezoek en reeks, het schema van vandaag en als
// laatste het nieuws van de sportschool. Alleen echte cijfers.

interface Props {
  /** Alleen wat de app toont (in de voorvertoning mag ook een volledig Lid). */
  lid: Pick<LidVoorApp, 'id' | 'voornaam'>
  data: LidAppData
  nu: Date
  tabPad: (tab: string) => string
  /** Wat de sportschool heeft ingesteld voor de app (welkom, tabbladen, QR). QR alleen als de check-in methode QR toelaat. */
  instellingen: LedenappInstellingen
  /** Nieuws en acties van de sportschool voor dit lid. */
  berichten: readonly Bericht[]
}

function VolgendeLes({ les, vandaag, href }: { les: AppLes | undefined; vandaag: string; href: string }) {
  if (!les) {
    return (
      <Link href={href} className="club-lidapp-volgende club-lidapp-volgende--leeg">
        <span className="club-lidapp-boven">
          <CalendarCheck aria-hidden size={15} /> Volgende les
        </span>
        <strong>Nog niets geboekt</strong>
        <span className="club-lidapp-volgende-wanneer">Bekijk de lessen van deze week</span>
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
        <CalendarCheck aria-hidden size={15} /> Volgende les
      </span>
      <strong>{les.naam}</strong>
      <span className="club-lidapp-volgende-wanneer">
        <span className="club-lidapp-volgende-tijd">
          {dagNaamKort(dagSleutel(start), vandaag)} om {tijdNl(start)}
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

function WeekBlok({ schema, logs, nu, w }: { schema: AppSchema; logs: readonly AppLog[]; nu: Date; w: LedenappTeksten }) {
  const ronde = rondeDezeWeek(schema.dagen, logs, schema.id, nu)
  if (ronde.totaal === 0) return null
  const open = ronde.dagen.filter((d) => !d.gedaan).map((d) => dagLetter(d.dag)).join(', ')
  return (
    <section className="club-lidapp-week" aria-label={w.week}>
      <WeekRing gedaan={ronde.gedaan} totaal={ronde.totaal} label={w.rondeAria(ronde.gedaan, ronde.totaal)} maat={132} />
      <div className="club-lidapp-week-tekst">
        <span className="club-lidapp-duo-label">{w.week}</span>
        <strong>{w.ronde(ronde.gedaan, ronde.totaal)}</strong>
        <span>{ronde.gedaan >= ronde.totaal ? w.rondeKlaar : w.rondeNog(open)}</span>
        <ul className="club-ronde">
          {ronde.dagen.map((d) => (
            <li key={d.dag} data-gedaan={d.gedaan || undefined}>
              {w.dag(dagLetter(d.dag))}
              <span className="club-sr">, {d.gedaan ? w.gedaan : w.open}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export async function HomeTab({ lid, data, nu, tabPad, instellingen, berichten }: Props) {
  const lessenAan = !instellingen.tabsUit.includes('lessen')
  const schemaAan = !instellingen.tabsUit.includes('schema')
  const vandaag = dagSleutel(nu)
  const volgende = data.lessen.find((l) => l.mijn?.status === 'geboekt' && new Date(l.start).getTime() > nu.getTime())
  const schemaDag = data.schema ? volgendeDag(data.schema.dagen, data.logs, data.schema.id) : null
  const w = (await clubTekst(ONTWERP)).ledenapp
  return (
    <div className="club-lidapp-tab club-lidapp-home">
      <header className="club-lidapp-welkomkop">
        <p className="club-lidapp-groet">{groet(nu)},</p>
        <h2 className="club-lidapp-naam">{lid.voornaam}</h2>
        {instellingen.welkom && <p className="club-lidapp-welkom">{instellingen.welkom}</p>}
      </header>

      {lessenAan && (
        <DiepteKaart className="club-lidapp-licht">
          <VolgendeLes les={volgende} vandaag={vandaag} href={tabPad('lessen')} />
        </DiepteKaart>
      )}

      {instellingen.qr && <CheckinQr lidId={lid.id} />}

      {schemaAan && data.schema && data.schema.dagen.length > 0 && <WeekBlok schema={data.schema} logs={data.logs} nu={nu} w={w} />}

      <div className="club-lidapp-duo">
        <div>
          <span className="club-lidapp-duo-label">{w.bezoekMaand}</span>
          <strong>{data.bezoekenMaand}</strong>
          <span>{w.bezoek(data.bezoekenMaand)}</span>
        </div>
        <div data-actief={data.wekenOpRij > 0 || undefined}>
          <span className="club-lidapp-duo-label">
            {w.reeks} <Flame aria-hidden size={14} />
          </span>
          <strong>{data.wekenOpRij}</strong>
          <span>{w.weken(data.wekenOpRij)}</span>
        </div>
      </div>

      {schemaAan && data.schema && schemaDag !== null && (
        <Link href={tabPad('schema')} className="club-lidapp-schemalink">
          <span className="club-lidapp-schemalink-icoon" aria-hidden>
            <Dumbbell size={20} />
          </span>
          <span className="club-lidapp-schemalink-tekst">
            <span>Vandaag op het programma</span>
            <strong>
              {data.schema.naam}, dag {dagLetter(schemaDag)}
            </strong>
          </span>
          <ChevronRight aria-hidden size={20} className="club-lidapp-schemalink-pijl" />
        </Link>
      )}

      {berichten.length > 0 && <LedenappBerichten berichten={berichten} nu={nu} />}
    </div>
  )
}
