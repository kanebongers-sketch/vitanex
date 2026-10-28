import { AANTAL_STAPPEN } from '@/lib/club/start/stappen'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { TALEN } from '@/lib/aiyourgym/taal/taal'
import { VOORPAGINA } from '@/lib/aiyourgym/taal/woorden/website/voorpagina'

// Een rustige band met alleen feiten uit het product, geen klantaantallen of
// reviews. Waar elk feit staat:
// - stappen: AANTAL_STAPPEN in src/lib/club/start/stappen.ts (de startwizard)
// - plekken: balie, vloer, trainer, eigenaar en lid werken in dezelfde Club
//   (werkvloer, ledenkaart, rechten per rol, ledenapp; .claude/CLAUDE.md)
// - talen: TALEN in src/lib/aiyourgym/taal/taal.ts (website, Club, ledenapp en mails)
// - EU: database en server in Frankfurt (Supabase eu-central-1, Render Frankfurt;
//   zie ook PRIVACY_BEVEILIGING en inhoud/vertrouwen.ts)

const PLEKKEN = 5

export async function Feiten() {
  const t = VOORPAGINA[await getSiteTaal()].feiten
  const feiten = [
    { waarde: String(AANTAL_STAPPEN), tekst: t.stappen },
    { waarde: String(PLEKKEN), tekst: t.plekken },
    { waarde: String(TALEN.length), tekst: t.talen },
    { waarde: 'EU', tekst: t.eu },
  ]
  return (
    <section className="vp-feiten" aria-labelledby="vp-feiten-titel">
      <h2 id="vp-feiten-titel" className="ayg-sr">
        {t.titel}
      </h2>
      <dl className="vp-feiten-rij vp-onthul">
        {feiten.map((f) => (
          <div key={f.tekst} className="vp-feit">
            <dt>{f.waarde}</dt>
            <dd>{f.tekst}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
