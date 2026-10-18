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

// Home in de ledenapp. Een duidelijke volgorde: begroeting, dan de grote focus
// (de volgende geboekte les), dan inchecken met de QR-code (wisselt elke 30
// seconden, zie CheckinQr), daarna bezoek en reeks, het schema van vandaag en
// als laatste het nieuws van de sportschool.

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

export function HomeTab({ lid, data, nu, tabPad, instellingen, berichten }: Props) {
  const lessenAan = !instellingen.tabsUit.includes('lessen')
  const schemaAan = !instellingen.tabsUit.includes('schema')
  const vandaag = dagSleutel(nu)
  const volgende = data.lessen.find((l) => l.mijn?.status === 'geboekt' && new Date(l.start).getTime() > nu.getTime())
  const schemaDag = data.schema ? volgendeDag(data.schema.dagen, data.logs, data.schema.id) : null
  return (
    <div className="club-lidapp-tab club-lidapp-home">
      <header className="club-lidapp-welkomkop">
        <p className="club-lidapp-groet">{groet(nu)},</p>
        <h2 className="club-lidapp-naam">{lid.voornaam}</h2>
        {instellingen.welkom && <p className="club-lidapp-welkom">{instellingen.welkom}</p>}
      </header>

      {lessenAan && <VolgendeLes les={volgende} vandaag={vandaag} href={tabPad('lessen')} />}

      {instellingen.qr && <CheckinQr lidId={lid.id} />}

      <div className="club-lidapp-duo">
        <div>
          <span className="club-lidapp-duo-label">Deze maand</span>
          <strong>{data.bezoekenMaand}</strong>
          <span>{data.bezoekenMaand === 1 ? 'bezoek' : 'bezoeken'}</span>
        </div>
        <div data-actief={data.wekenOpRij > 0 || undefined}>
          <span className="club-lidapp-duo-label">
            Reeks <Flame aria-hidden size={14} />
          </span>
          <strong>{data.wekenOpRij}</strong>
          <span>{data.wekenOpRij === 1 ? 'week' : 'weken'} op rij</span>
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
