'use client'

import { regels, type Regel } from '@/lib/club/kladblok/opmaak'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { NOTITIES } from '@/lib/aiyourgym/taal/woorden/club/notities'

// De notitie als nette tekst: tussenkoppen, opsommingen en afvinkvakjes (zie
// opmaak.ts). Vakjes zijn echt aan te klikken; de rest is gewone tekst (geen
// HTML uit de inhoud, dus veilig).

function groepeer(lijst: Regel[]): Regel[][] {
  const uit: Regel[][] = []
  for (const r of lijst) {
    const vorige = uit.at(-1)
    if (vorige && vorige[0].soort === r.soort && (r.soort === 'vink' || r.soort === 'punt')) vorige.push(r)
    else uit.push([r])
  }
  return uit
}

export function Leesweergave({ inhoud, onVink }: { inhoud: string; onVink: (index: number) => void }) {
  const t = useTekst(NOTITIES).lees
  if (!inhoud.trim()) return <p className="club-hint">{t.leeg}</p>
  return (
    <div className="kb-lees">
      {groepeer(regels(inhoud)).map((g) => {
        const eerste = g[0]
        if (eerste.soort === 'vink') {
          return (
            <ul key={eerste.index} className="kb-vinken">
              {g.map((r) =>
                r.soort === 'vink' ? (
                  <li key={r.index}>
                    <label className={r.klaar ? 'kb-vink kb-vink--klaar' : 'kb-vink'}>
                      <input type="checkbox" checked={r.klaar} onChange={() => onVink(r.index)} />
                      <span>{r.tekst || t.leegPunt}</span>
                    </label>
                  </li>
                ) : null,
              )}
            </ul>
          )
        }
        if (eerste.soort === 'punt') return <ul key={eerste.index} className="kb-punten">{g.map((r) => (r.soort === 'punt' ? <li key={r.index}>{r.tekst}</li> : null))}</ul>
        if (eerste.soort === 'kop') return <h3 key={eerste.index} className="kb-kop">{eerste.tekst}</h3>
        if (eerste.soort === 'tekst') return <p key={eerste.index} className="kb-alinea">{eerste.tekst}</p>
        return <div key={eerste.index} className="kb-wit" aria-hidden />
      })}
    </div>
  )
}
