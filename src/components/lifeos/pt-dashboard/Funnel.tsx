import type { FunnelStap } from '@/lib/lifeos/pt-dashboard/analyse'

// Van gesprek naar klant: drie horizontale balken, elk als aandeel van alle
// gesproken leads. Puur weergave; de cijfers komen uit `funnel` (analyse.ts).
// Balkbreedte is decoratief — aantal en percentage staan er altijd als tekst bij.

export function Funnel({ stappen, kop = 'Van gesprek naar klant' }: { stappen: readonly FunnelStap[]; kop?: string }) {
  const leeg = stappen.length === 0 || stappen[0].aantal === 0
  return (
    <div className="ptd-an-blok">
      <div className="ptd-an-blokkop">
        <h3>{kop}</h3>
        <span>alle leads</span>
      </div>
      {leeg ? (
        <p className="ptd-leeg">Nog geen leads, dus nog geen funnel. Die bouwt zich vanzelf op zodra je leads invult.</p>
      ) : (
        <>
          <ol className="ptd-an-funnel">
            {stappen.map((s) => (
              <li key={s.sleutel} className={s.sleutel === 'klant' ? 'ptd-an-trede ptd-an-trede--klant' : 'ptd-an-trede'}>
                <div className="ptd-an-trede-kop">
                  <span>{s.label}</span>
                  <span className="ptd-an-trede-getal">
                    {s.aantal}
                    {s.pct === null || s.sleutel === 'gesproken' ? null : <small> · {s.pct}%</small>}
                  </span>
                </div>
                <div className="ptd-an-balk" aria-hidden="true">
                  <span style={{ width: `${s.pct ?? 0}%` }} />
                </div>
              </li>
            ))}
          </ol>
          <p className="ptd-hint">Op basis van de huidige status van elke lead. Bij weinig leads schommelen percentages sterk.</p>
        </>
      )}
    </div>
  )
}
