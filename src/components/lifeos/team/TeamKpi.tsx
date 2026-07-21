import { Users, Award } from 'lucide-react'
import { TEAM_KPI, TEAM_TOTAAL, type TrainerKpi } from '@/lib/lifeos/team/team-data'
import { getalTekst } from '@/lib/lifeos/format/getal'
import { TEAM_STYLE } from './team-style'

// Team-KPI — hoe presteren Kane's trainers? Statische MOMENTOPNAME uit de Fit
// Factory-import (zie `team-data.ts`); deze component leest en toont alleen, geen
// fetch. Server-component: geen state, geen interactie — de client-grens blijft
// laag (de founder-gate eromheen is de enige client-laag). Leeft op /team-kpi;
// /team is de bestaande B2B HR-route.

// Euro in NL-notatie via de gedeelde formatter: € 4.815. De waarden zijn altijd
// eindige gehele getallen, dus de null-tak van getalTekst wordt nooit geraakt.
function euro(bedrag: number): string {
  return `€ ${getalTekst(bedrag) ?? bedrag.toString()}`
}

interface TrainerRijProps {
  trainer: TrainerKpi
  rang: number
  koploper: boolean
  laagste: boolean
}

function TrainerRij({ trainer, rang, koploper, laagste }: TrainerRijProps) {
  const klasse = koploper ? 'team-rij team-rij--top' : laagste ? 'team-rij team-rij--laag' : 'team-rij'
  return (
    <tr className={klasse}>
      <th scope="row">
        <div className="team-trainer">
          <span className="team-rang" aria-hidden="true">{rang}</span>
          <span className="team-trainer-body">
            <span className="team-naam-rij">
              <span className="team-naam">{trainer.naam}</span>
              {koploper && (
                <span className="team-badge">
                  <Award size={11} strokeWidth={2.4} aria-hidden="true" /> Koploper
                </span>
              )}
            </span>
            <span className="team-vest">
              {trainer.vestigingen.map((v) => (
                <span key={v} className="team-chip">{v}</span>
              ))}
            </span>
          </span>
        </div>
      </th>
      <td className="team-num">{trainer.klanten}</td>
      <td className="team-omzet-cel">
        <span className="team-omzet">{euro(trainer.omzet)}</span>
        <span className="team-gem">{euro(trainer.gemPerKlant)} gem. p.p.</span>
      </td>
    </tr>
  )
}

export function TeamKpi() {
  const laatste = TEAM_KPI.length - 1
  return (
    <section className="team" aria-labelledby="team-titel">
      <header className="team-kop">
        <p className="team-eyebrow">
          <Users size={14} strokeWidth={2.2} aria-hidden="true" /> Team · Fit Factory
        </p>
        <h1 className="team-titel" id="team-titel">Hoe presteert je team?</h1>
        <p className="team-bron">
          Momentopname op basis van je <b>Fit Factory-import</b> — {TEAM_TOTAAL.trainers} trainers,{' '}
          {TEAM_TOTAAL.klanten} actieve klanten. Omzet is de som van de lopende maand-trajecten.
        </p>
      </header>

      <dl className="team-stats">
        <div className="team-stat">
          <dt>Trainers</dt>
          <dd>{TEAM_TOTAAL.trainers}</dd>
        </div>
        <div className="team-stat">
          <dt>Actieve klanten</dt>
          <dd>{TEAM_TOTAAL.klanten}</dd>
        </div>
        <div className="team-stat team-stat--brand">
          <dt>Omzet / maand</dt>
          <dd>{euro(TEAM_TOTAAL.omzet)}</dd>
        </div>
      </dl>

      <div className="team-tablewrap" tabIndex={0} role="region" aria-label="Trainers op omzet">
        <table className="team-table">
          <caption className="team-sr">
            Trainers gesorteerd op omzet per maand, hoogste eerst.
          </caption>
          <thead>
            <tr>
              <th scope="col">Trainer</th>
              <th scope="col" className="team-th-num">Klanten</th>
              <th scope="col" className="team-th-num">Omzet / mnd</th>
            </tr>
          </thead>
          <tbody>
            {TEAM_KPI.map((trainer, i) => (
              <TrainerRij
                key={trainer.naam}
                trainer={trainer}
                rang={i + 1}
                koploper={i === 0}
                laagste={i === laatste}
              />
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="team-foot-label">Totaal</th>
              <td className="team-num">{TEAM_TOTAAL.klanten}</td>
              <td className="team-num">{euro(TEAM_TOTAAL.omzet)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <style>{TEAM_STYLE}</style>
    </section>
  )
}
