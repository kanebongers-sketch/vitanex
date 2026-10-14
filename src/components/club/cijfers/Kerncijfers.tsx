import { eenDecimaal, heel, metTeken, procent } from '@/lib/club/cijfers/opmaak'
import type { CijferContext } from './context'

// De vijf kerncijfers als een editoriale strook: het ledental groot, de rest
// kleiner ernaast, gescheiden door lijnen in plaats van losse kaartjes.

export function Kerncijfers({ c }: { c: CijferContext }) {
  const r = c.rapport
  const groeiKlasse = r.groei > 0 ? 'club-plus' : r.groei < 0 ? 'club-min' : ''
  return (
    <section className="club-cijfers-kern-strook" aria-label="Kerncijfers">
      <div className="club-cijfers-kern-hoofd">
        <span className="club-cijfers-kern-label">Actieve leden</span>
        <strong className="club-cijfers-reus">{heel(r.status.actief)}</strong>
        <span className="club-cijfers-kern-sub">
          <span className={groeiKlasse}>{metTeken(r.groei)}</span> in {c.weken} weken · {heel(r.status.proef)} proef · {heel(r.status.gepauzeerd)} gepauzeerd
        </span>
      </div>
      <dl className="club-cijfers-kern-rest">
        <div>
          <dt>Bezoeken per week</dt>
          <dd>{heel(r.bezoekGemiddeld)}</dd>
          <dd className="club-cijfers-kern-sub">{r.bezoekPerLid === null ? 'geen actieve leden' : `${eenDecimaal(r.bezoekPerLid)} per actief lid`}</dd>
        </div>
        <div>
          <dt>Bezetting lessen</dt>
          <dd>{r.totalen.lessen > 0 ? procent(r.totalen.bezetting) : 'geen data'}</dd>
          <dd className="club-cijfers-kern-sub">{heel(r.totalen.lessen)} lessen geweest</dd>
        </div>
        <div>
          <dt>No-show</dt>
          <dd>{procent(r.totalen.noShowAandeel)}</dd>
          <dd className="club-cijfers-kern-sub">{heel(r.totalen.noShow)} keer niet gekomen</dd>
        </div>
        <div>
          <dt>Leadconversie</dt>
          <dd>{r.leads.totaal.leads > 0 ? procent(r.leads.totaal.conversie) : 'geen data'}</dd>
          <dd className="club-cijfers-kern-sub">
            {heel(r.leads.totaal.lid)} van {heel(r.leads.totaal.leads)} leads werd lid
          </dd>
        </div>
      </dl>
    </section>
  )
}
