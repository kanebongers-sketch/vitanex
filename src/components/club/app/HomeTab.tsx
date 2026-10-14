import Link from 'next/link'
import { CalendarCheck, Flame, QrCode } from 'lucide-react'
import type { Lid } from '@/lib/club/kern/lid'
import type { LidAppData } from '@/lib/club/app/data'
import { dagNaamKort, groet } from '@/lib/club/app/regels'
import { dagLetter, volgendeDag } from '@/lib/club/app/schema'
import { dagSleutel, tijdNl } from '@/lib/club/cijfers/tijd'

// Home in de ledenapp: begroeting, de volgende geboekte les, bezoek en reeks,
// en de check-in QR-code (alleen het token, nooit naam of lidnummer).

interface Props {
  lid: Lid
  data: LidAppData
  nu: Date
  tabPad: (tab: string) => string
}

export function HomeTab({ lid, data, nu, tabPad }: Props) {
  const vandaag = dagSleutel(nu)
  const volgende = data.lessen.find((l) => l.mijn?.status === 'geboekt' && new Date(l.start).getTime() > nu.getTime())
  const schemaDag = data.schema ? volgendeDag(data.schema.dagen, data.logs, data.schema.id) : null
  return (
    <div className="club-lidapp-tab">
      <p className="club-lidapp-groet">{groet(nu)},</p>
      <h2 className="club-lidapp-naam">{lid.voornaam}</h2>

      <Link href={tabPad('lessen')} className="club-lidapp-volgende">
        <span className="club-lidapp-boven">
          <CalendarCheck aria-hidden size={15} /> Volgende les
        </span>
        {volgende ? (
          <>
            <strong>{volgende.naam}</strong>
            <span>
              {dagNaamKort(dagSleutel(new Date(volgende.start)), vandaag)} om {tijdNl(new Date(volgende.start))}
              {volgende.zaal ? ` · ${volgende.zaal}` : ''}
            </span>
          </>
        ) : (
          <>
            <strong>Nog niets geboekt</strong>
            <span>Bekijk de lessen van deze week</span>
          </>
        )}
      </Link>

      <div className="club-lidapp-duo">
        <div>
          <strong>{data.bezoekenMaand}</strong>
          <span>{data.bezoekenMaand === 1 ? 'bezoek' : 'bezoeken'} deze maand</span>
        </div>
        <div>
          <strong>
            {data.wekenOpRij}
            <Flame aria-hidden size={20} />
          </strong>
          <span>{data.wekenOpRij === 1 ? 'week' : 'weken'} op rij</span>
        </div>
      </div>

      {data.schema && schemaDag !== null && (
        <Link href={tabPad('schema')} className="club-lidapp-schemalink">
          <span>Vandaag op het programma</span>
          <strong>
            {data.schema.naam}, dag {dagLetter(schemaDag)}
          </strong>
        </Link>
      )}

      <section className="club-lidapp-qr" aria-labelledby="lidapp-qr">
        <h3 id="lidapp-qr">
          <QrCode aria-hidden size={16} /> Inchecken
        </h3>
        {data.qrBron ? (
          <img src={data.qrBron} alt="Jouw persoonlijke check-in code" width={168} height={168} />
        ) : (
          <p className="club-lidapp-leeg">De code kon niet worden gemaakt.</p>
        )}
        <p>Houd je telefoon bij de scanner bij de ingang.</p>
      </section>
    </div>
  )
}
