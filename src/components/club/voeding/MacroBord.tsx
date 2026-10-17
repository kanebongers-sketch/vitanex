import { verdeling } from '@/lib/club/voeding/rekenhulp'
import type { Doelen } from '@/lib/club/voeding/model'

// Het dagdoel: kcal als groot getal, een verdeelbalk en de drie macro's in gram.
// Puur weergave; werkt in Club, op de ledenkaart en in de editor.

interface MacroBordProps {
  doelen: Doelen
  compact?: boolean
}

const MACROS = [
  { sleutel: 'eiwit', label: 'Eiwit', veld: 'eiwitG', klasse: 'is-eiwit' },
  { sleutel: 'koolhydraten', label: 'Koolhydraten', veld: 'koolhydratenG', klasse: 'is-kh' },
  { sleutel: 'vet', label: 'Vet', veld: 'vetG', klasse: 'is-vet' },
] as const

export function MacroBord({ doelen, compact }: MacroBordProps) {
  const v = verdeling(doelen)
  const omschrijving = `Verdeling van de kcal: eiwit ${v.eiwit}%, koolhydraten ${v.koolhydraten}%, vet ${v.vet}%`
  return (
    <div className={`club-voeding-bord${compact ? ' club-voeding-bord--compact' : ''}`}>
      <p className="club-voeding-kcal">
        <strong>{doelen.kcal.toLocaleString('nl-NL')}</strong>
        <span>kcal per dag</span>
      </p>
      <div className="club-voeding-balk" role="img" aria-label={omschrijving}>
        {MACROS.map((m) => (v[m.sleutel] > 0 ? <span key={m.sleutel} className={m.klasse} style={{ flexGrow: v[m.sleutel] }} /> : null))}
      </div>
      <dl className="club-voeding-macros">
        {MACROS.map((m) => (
          <div key={m.sleutel} className={`club-voeding-macro ${m.klasse}`}>
            <dt>{m.label}</dt>
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
