import { regelTeksten, type AppRegels } from '@/lib/club/app/regels'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { LEDENAPP } from '@/lib/aiyourgym/taal/woorden/ledenapp/app'

// De uitleg naast het telefoonframe: wat een lid kan, welke regels hij ziet en
// wat er nog moet gebeuren voor de pilot. Eerlijk over wat er nu wel en niet is.

export async function AppUitleg({ regels }: { regels: AppRegels }) {
  const taal = await getTaal()
  const t = LEDENAPP[taal].uitleg
  return (
    <aside className="club-lidapp-uitleg" aria-label={t.label}>
      <ol className="club-lidapp-punten">
        {t.kan.map(({ titel, tekst }, i) => (
          <li key={titel}>
            <span aria-hidden>{String(i + 1).padStart(2, '0')}</span>
            <div>
              <strong>{titel}</strong>
              <p>{tekst}</p>
            </div>
          </li>
        ))}
      </ol>
      <section className="club-lidapp-uitleg-regels">
        <h2>{t.regels}</h2>
        <ul>
          {regelTeksten(regels, taal).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="club-hint">{t.regelsBron}</p>
      </section>
      <p className="club-melding">{t.voorvertoning}</p>
    </aside>
  )
}
