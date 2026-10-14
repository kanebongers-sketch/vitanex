import { CONVERSIE_UITLEG, type LeadCijfers } from '@/lib/club/leads/cijfers'
import { LEAD_BRON_LABEL } from '@/lib/club/leads/model'

interface LeadsCijfersProps {
  cijfers: LeadCijfers
}

function procent(p: number | null): string {
  return p === null ? 'nog geen' : `${p}%`
}

// Drie grote getallen en de bronnen als compacte balken. Elke definitie staat
// erbij, zodat niemand hoeft te raden wat "conversie" betekent.
export function LeadsCijfers({ cijfers }: LeadsCijfersProps) {
  const { conversie, perBron } = cijfers
  const grootste = Math.max(1, ...perBron.map((b) => b.leads))
  return (
    <section className="club-leads-cijfers" aria-label="Cijfers">
      <div className="club-tegel">
        <span className="club-tegel-label">Nieuwe leads</span>
        <span className="club-tegel-getal">{cijfers.nieuwDezeMaand}</span>
        <span className="club-tegel-sub">deze maand</span>
      </div>
      <div className="club-tegel">
        <span className="club-tegel-label">Proeflessen</span>
        <span className="club-tegel-getal">{cijfers.proeflessenGepland}</span>
        <span className="club-tegel-sub">gepland, nog te komen</span>
      </div>
      <div className="club-tegel club-leads-conversie">
        <span className="club-tegel-label">Lead naar lid</span>
        <span className="club-tegel-getal">{procent(conversie.procent)}</span>
        <span className="club-tegel-sub">
          {conversie.leden} van {conversie.leads} leads, laatste 90 dagen
        </span>
        <details className="club-leads-uitleg">
          <summary>Hoe tellen we dit?</summary>
          <p>{CONVERSIE_UITLEG}</p>
        </details>
      </div>
      <div className="club-tegel club-leads-bronnen">
        <span className="club-tegel-label">Per bron, 90 dagen</span>
        {perBron.length === 0 ? (
          <span className="club-tegel-sub">Nog geen leads in deze periode.</span>
        ) : (
          <ul className="club-leads-bronlijst">
            {perBron.map((b) => (
              <li key={b.bron}>
                <span className="club-leads-bronnaam">{LEAD_BRON_LABEL[b.bron]}</span>
                <span className="club-leads-bronbalk" aria-hidden>
                  <span style={{ transform: `scaleX(${b.leads / grootste})` }} />
                </span>
                <span className="club-getal">
                  {b.leads} <span className="club-zacht">· {procent(b.procent)} lid</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
