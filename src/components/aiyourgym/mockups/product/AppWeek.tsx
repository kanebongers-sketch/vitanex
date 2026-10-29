import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { PRODUCTSCHERMEN } from '@/lib/aiyourgym/taal/woorden/website/mockups/productschermen'
import { APP_LID, QrBeeld } from '../AppSchermen'
import { Avatar } from '../Avatar'
import { LES } from '../voorbeeld'
import { PSpark } from './bouwstenen'
import { WeekRing } from './WeekRing'

// Home van de ledenapp in de nieuwe stijl, voor in het telefoonkader: de weekring
// (3D waar het kan), de volgende les, twee cijfers met verloop en de QR-code om in
// te checken. Dezelfde voorbeeldweek als de ledenkaart: 2 van 3 trainingen.

const WEEK = { gedaan: 2, totaal: 3 } as const
const PER_WEEK = [2, 3, 1, 2, 3, 3, 2, 2] as const

export async function AppWeek() {
  const t = PRODUCTSCHERMEN[await getSiteTaal()].app
  return (
    <div className="aygp aygp-app">
      <div className="aygm-app-groet">
        <p className="aygp-hallo">{t.hallo('Sanne')}</p>
        <Avatar naam={APP_LID} maat={30} />
      </div>
      <div className="aygp-app-week">
        <WeekRing gedaan={WEEK.gedaan} totaal={WEEK.totaal} maat={112} onder={t.week} />
        <div>
          <p className="aygp-groot">{t.weekStand(WEEK.gedaan, WEEK.totaal)}</p>
          <p className="aygp-klein">{t.weekNog}</p>
        </div>
      </div>
      <div className="aygp-app-volgende">
        <span>{t.volgende}</span>
        <b>{LES.barbell}</b>
        <span>{t.volgendeWanneer}</span>
      </div>
      <div className="aygp-app-duo">
        <div className="aygp-app-cijfer">
          <span className="aygp-stat-label">{t.bezoeken}</span>
          <span className="aygp-stat-rij">
            <strong className="aygp-stat-waarde">9</strong>
            <PSpark waarden={PER_WEEK} label={t.bezoekenTrend} breedte={56} hoogte={24} />
          </span>
          <span className="aygp-stat-sub">{t.bezoekenSub}</span>
        </div>
        <div className="aygp-app-cijfer">
          <span className="aygp-stat-label">{t.opRij}</span>
          <strong className="aygp-stat-waarde">6</strong>
          <span className="aygp-stat-sub">{t.opRijSub}</span>
        </div>
      </div>
      <div className="aygp-app-qr">
        <QrBeeld />
        <div>
          <b>{t.inchecken}</b>
          <span>{t.laatZien}</span>
        </div>
      </div>
    </div>
  )
}
