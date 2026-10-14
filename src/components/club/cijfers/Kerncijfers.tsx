import { aantal, eenDecimaal, heel, metTeken, procent } from '@/lib/club/cijfers/opmaak'
import type { CijferContext } from './context'

// De vijf kerncijfers als een editoriale strook: het ledental groot, de rest
// kleiner ernaast, gescheiden door lijnen in plaats van losse kaartjes. Bij
// elk getal staat wat erin zit, zodat het klopt met de ledenlijst.

export function Kerncijfers({ c }: { c: CijferContext }) {
  const r = c.rapport
  const groeiKlasse = r.groei > 0 ? 'club-plus' : r.groei < 0 ? 'club-min' : ''
  return (
    <section className="club-cijfers-kern-strook" aria-label="Kerncijfers">
      <div className="club-cijfers-kern-hoofd">
        <span className="club-cijfers-kern-label">Actieve leden</span>
        <strong className="club-cijfers-reus">{heel(r.status.actief)}</strong>
        <span className="club-cijfers-kern-sub">
          {r.status.opgezegdLopend > 0 ? `Waarvan ${aantal(r.status.opgezegdLopend, 'opgezegd lid', 'opgezegde leden')} tot de einddatum. ` : ''}
          Plus {aantal(r.status.proef, 'proeflid', 'proefleden')} en {heel(r.status.gepauzeerd)} gepauzeerd.
        </span>
        <span className="club-cijfers-kern-sub">
          Ledenbestand <span className={groeiKlasse}>{metTeken(r.groei)}</span> in {c.weken} weken
        </span>
      </div>
      <dl className="club-cijfers-kern-rest">
        <div>
          <dt>Bezoek per week</dt>
          <dd>{heel(r.bezoekGemiddeld)}</dd>
          <dd className="club-cijfers-kern-sub">{r.bezoekPerLid === null ? 'Geen actieve leden' : `${eenDecimaal(r.bezoekPerLid)} per actief lid, complete weken`}</dd>
        </div>
        <div>
          <dt>Bezetting lessen</dt>
          <dd>{r.totalen.lessen > 0 ? procent(r.totalen.bezetting) : 'Geen'}</dd>
          <dd className="club-cijfers-kern-sub">{r.totalen.lessen > 0 ? `${aantal(r.totalen.lessen, 'les', 'lessen')} geweest` : 'Nog geen lessen geweest'}</dd>
        </div>
        <div>
          <dt>No-show</dt>
          <dd>{r.totalen.noShowAandeel === null ? 'Geen' : procent(r.totalen.noShowAandeel)}</dd>
          <dd className="club-cijfers-kern-sub">{r.totalen.noShowAandeel === null ? 'Nog geen reserveringen afgerond' : `${heel(r.totalen.noShow)} keer niet gekomen`}</dd>
        </div>
        <div>
          <dt>Leadconversie</dt>
          <dd>{r.leads.totaal.leads > 0 ? procent(r.leads.totaal.conversie) : 'Geen'}</dd>
          <dd className="club-cijfers-kern-sub">
            {r.leads.totaal.leads > 0 ? `${heel(r.leads.totaal.lid)} van ${aantal(r.leads.totaal.leads, 'lead', 'leads')} werd lid` : 'Geen leads in deze periode'}
          </dd>
        </div>
      </dl>
    </section>
  )
}
