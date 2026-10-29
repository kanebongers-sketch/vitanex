import { verdeling } from '@/lib/club/voeding/rekenhulp'
import type { Doelen } from '@/lib/club/voeding/model'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import { VOEDING } from '@/lib/aiyourgym/taal/woorden/club/voeding'

// Het dagdoel: kcal als groot getal, een verdeelbalk en de drie macro's in gram.
// Puur weergave; werkt in Club, op de ledenkaart en in de editor.

interface MacroBordProps {
  doelen: Doelen
  compact?: boolean
  taal: Taal
}

const MACROS = [
  { sleutel: 'eiwit', veld: 'eiwitG', klasse: 'is-eiwit' },
  { sleutel: 'koolhydraten', veld: 'koolhydratenG', klasse: 'is-kh' },
  { sleutel: 'vet', veld: 'vetG', klasse: 'is-vet' },
] as const

export function MacroBord({ doelen, compact, taal }: MacroBordProps) {
  const t = VOEDING[taal]
  const v = verdeling(doelen)
  const omschrijving = t.bord.verdeling(v.eiwit, v.koolhydraten, v.vet)
  return (
    <div className={`club-voeding-bord${compact ? ' club-voeding-bord--compact' : ''}`}>
      <p className="club-voeding-kcal">
        <strong>{formatGetal(doelen.kcal, taal)}</strong>
        <span>{t.bord.perDag}</span>
      </p>
      <div className="club-voeding-balk" role="img" aria-label={omschrijving}>
        {MACROS.map((m) => (v[m.sleutel] > 0 ? <span key={m.sleutel} className={m.klasse} style={{ flexGrow: v[m.sleutel] }} /> : null))}
      </div>
      <dl className="club-voeding-macros">
        {MACROS.map((m) => (
          <div key={m.sleutel} className={`club-voeding-macro ${m.klasse}`}>
            <dt>{t.macro[m.sleutel]}</dt>
            <dd>
              <strong>{doelen[m.veld]}</strong>
              <small>g · {v[m.sleutel]}%</small>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
