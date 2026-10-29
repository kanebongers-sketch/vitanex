import type { LeadCijfers } from '@/lib/club/leads/cijfers'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { LEADS } from '@/lib/aiyourgym/taal/woorden/club/leads'

interface LeadsCijfersProps {
  cijfers: LeadCijfers
}

function procent(p: number | null, nogGeen: string): string {
  return p === null ? nogGeen : `${p}%`
}

// Drie grote getallen en de bronnen als compacte balken. Elke definitie staat
// erbij, zodat niemand hoeft te raden wat "conversie" betekent.
export async function LeadsCijfers({ cijfers }: LeadsCijfersProps) {
  const tekst = await clubTekst(LEADS)
  const t = tekst.cijfers
  const { conversie, perBron } = cijfers
  const grootste = Math.max(1, ...perBron.map((b) => b.leads))
  return (
    <section className="club-leads-cijfers" aria-label={t.label}>
      <div className="club-tegel">
        <span className="club-tegel-label">{t.nieuw}</span>
        <span className="club-tegel-getal">{cijfers.nieuwDezeMaand}</span>
        <span className="club-tegel-sub">{t.dezeMaand}</span>
      </div>
      <div className="club-tegel">
        <span className="club-tegel-label">{t.proeflessen}</span>
        <span className="club-tegel-getal">{cijfers.proeflessenGepland}</span>
        <span className="club-tegel-sub">{t.gepland}</span>
      </div>
      <div className="club-tegel club-leads-conversie">
        <span className="club-tegel-label">{t.naarLid}</span>
        <span className="club-tegel-getal">{procent(conversie.procent, t.nogGeen)}</span>
        <span className="club-tegel-sub">
          {t.vanLeads(conversie.leden, conversie.leads)}
        </span>
        <details className="club-leads-uitleg">
          <summary>{t.hoeTellen}</summary>
          <p>{tekst.conversieUitleg}</p>
        </details>
      </div>
      <div className="club-tegel club-leads-bronnen">
        <span className="club-tegel-label">{t.perBron}</span>
        {perBron.length === 0 ? (
          <span className="club-tegel-sub">{t.geenLeads}</span>
        ) : (
          <ul className="club-leads-bronlijst">
            {perBron.map((b) => (
              <li key={b.bron}>
                <span className="club-leads-bronnaam">{tekst.bron[b.bron]}</span>
                <span className="club-leads-bronbalk" aria-hidden>
                  <span style={{ transform: `scaleX(${b.leads / grootste})` }} />
                </span>
                <span className="club-getal">
                  {b.leads} <span className="club-zacht">· {procent(b.procent, t.nogGeen)} {t.lid}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
