import { deelVanDoel, resterend } from '@/lib/club/voeding/dagboek/berekeningen'
import type { Macros } from '@/lib/club/voeding/dagboek/model'
import type { VoedingDagboekTekst } from '@/lib/aiyourgym/taal/woorden/club/voeding-dagboek'

// Ringen van het dagboek, geporteerd uit MentaForce (components/voeding/Ringen.tsx):
// een grote kcal-ring en drie macroringen ten opzichte van het doel. Puur SVG,
// kleuren uit de huisstijl van de sportschool (--club-data en tokens), nooit vast.
// Over het doel: de ring blijft vol en de tekst zegt hoeveel erover.

const R_GROOT = 44
const OMTREK_GROOT = 2 * Math.PI * R_GROOT
const R_KLEIN = 40
const OMTREK_KLEIN = 2 * Math.PI * R_KLEIN

interface RingenProps {
  totaal: Macros
  doel: Macros | null
  t: VoedingDagboekTekst
}

export function KcalRing({ totaal, doel, t }: RingenProps) {
  const deel = doel ? deelVanDoel(totaal.kcal, doel.kcal) : 0
  const rest = doel ? resterend(totaal.kcal, doel.kcal) : 0
  const over = doel !== null && rest < 0
  return (
    <div className={`club-vd-ring club-vd-ring--groot${over ? ' is-over' : ''}`} role="img" aria-label={doel ? t.ring.label(totaal.kcal, doel.kcal) : t.ring.zonderDoel(totaal.kcal)}>
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle className="club-vd-ring-spoor" cx="50" cy="50" r={R_GROOT} />
        {deel > 0 && <circle className="club-vd-ring-boog" cx="50" cy="50" r={R_GROOT} strokeDasharray={`${OMTREK_GROOT * deel} ${OMTREK_GROOT}`} />}
      </svg>
      <span className="club-vd-ring-midden" aria-hidden>
        <strong>{totaal.kcal}</strong>
        <span>{doel ? `/ ${doel.kcal} ${t.macro.kcal}` : t.macro.kcal}</span>
        {doel && <em>{over ? t.ring.over(-rest) : t.ring.rest(rest)}</em>}
      </span>
    </div>
  )
}

const MACROS = [
  { veld: 'eiwitG', naam: 'eiwit', klasse: 'is-eiwit' },
  { veld: 'koolhydratenG', naam: 'koolhydraten', klasse: 'is-kh' },
  { veld: 'vetG', naam: 'vet', klasse: 'is-vet' },
] as const

export function MacroRingen({ totaal, doel, t }: RingenProps) {
  return (
    <ul className="club-vd-macros">
      {MACROS.map((m) => {
        const waarde = Math.round(totaal[m.veld])
        const max = doel ? doel[m.veld] : 0
        const deel = doel ? deelVanDoel(waarde, max) : 0
        const naam = t.macro[m.naam]
        return (
          <li key={m.veld} className={`club-vd-macro ${m.klasse}${doel && waarde > max ? ' is-over' : ''}`}>
            <div className="club-vd-ring club-vd-ring--klein" role="img" aria-label={doel ? t.ring.macroLabel(naam, waarde, max) : `${naam}: ${t.ring.gram(waarde)}`}>
              <svg viewBox="0 0 100 100" aria-hidden>
                <circle className="club-vd-ring-spoor" cx="50" cy="50" r={R_KLEIN} />
                {deel > 0 && <circle className="club-vd-ring-boog" cx="50" cy="50" r={R_KLEIN} strokeDasharray={`${OMTREK_KLEIN * deel} ${OMTREK_KLEIN}`} />}
              </svg>
              <span className="club-vd-ring-midden" aria-hidden>
                <strong>{waarde}</strong>
              </span>
            </div>
            <span className="club-vd-macro-naam">{naam}</span>
            {doel && <span className="club-vd-macro-doel">{t.ring.vanGram(max)}</span>}
          </li>
        )
      })}
    </ul>
  )
}
