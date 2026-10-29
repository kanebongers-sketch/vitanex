import { asSchaal, PATROON_WEKEN, perWeekdag, weekBalken } from '@/lib/club/leden/patroon'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { LEDEN } from '@/lib/aiyourgym/taal/woorden/club/leden'

// Het bezoekpatroon van een lid: 12 staven (per 7 dagen, de laatste eindigt
// vandaag) met een y-as, en een strook per weekdag. Gewone HTML in plaats van
// een geschaalde SVG, zodat de letters ook op een telefoon leesbaar blijven.

interface BezoekpatroonProps {
  bezoeken: Date[]
  nu: Date
}

interface MetTaal extends BezoekpatroonProps {
  taal: Taal
}

function procent(waarde: number, top: number): string {
  return `${(waarde / top) * 100}%`
}

function Balken({ bezoeken, nu, taal }: MetTaal) {
  const t = LEDEN[taal].patroon
  const balken = weekBalken(bezoeken, nu, PATROON_WEKEN, taal)
  const { top, ticks } = asSchaal(Math.max(...balken.map((b) => b.aantal)))
  const totaal = balken.reduce((s, b) => s + b.aantal, 0)
  const omschrijving = t.omschrijving(totaal, balken.map((b) => `${b.huidig ? t.dezeWeek : t.weekVanaf(b.label)}: ${b.aantal}`).join(', '))
  return (
    <figure className="club-leden-patroon">
      <div className="club-leden-grafiek" role="img" aria-label={omschrijving}>
        <div className="club-leden-as" aria-hidden>
          {ticks.map((t) => <span key={t} style={{ bottom: procent(t, top) }}>{t}</span>)}
        </div>
        <div className="club-leden-plot" aria-hidden>
          {ticks.map((t) => <span key={t} className="club-leden-plot-lijn" style={{ bottom: procent(t, top) }} />)}
          <ol className="club-leden-balken">
            {balken.map((b) => (
              <li key={b.label} className={b.huidig ? 'club-leden-balk club-leden-balk--nu' : 'club-leden-balk'} data-leeg={b.aantal === 0 || undefined}>
                <span className="club-leden-balk-staaf" style={{ height: b.aantal ? procent(b.aantal, top) : '2px' }}>
                  {b.aantal ? <span className="club-leden-balk-getal club-getal">{b.aantal}</span> : null}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <ol className="club-leden-xas" aria-hidden>
          {balken.map((b, i) => (
            <li key={b.label} data-om={(balken.length - 1 - i) % 2 === 1 || undefined} className={b.huidig ? 'club-leden-xas--nu' : undefined}>
              {b.huidig ? t.nu : b.label}
            </li>
          ))}
        </ol>
      </div>
      <figcaption className="club-hint">
        {t.bijschrift}
      </figcaption>
    </figure>
  )
}

function Weekdagen({ bezoeken, nu, taal }: MetTaal) {
  const t = LEDEN[taal]
  const telling = perWeekdag(bezoeken, nu)
  const max = Math.max(1, ...telling)
  return (
    <div className="club-leden-weekdagen-wrap">
      <h3 className="club-leden-subkop" id="weekdag-kop">{t.patroon.perWeekdag}</h3>
      <ol className="club-leden-weekdagen" aria-labelledby="weekdag-kop">
        {telling.map((n, i) => (
          <li key={i}>
            <span className="club-leden-weekdag-vak" aria-hidden style={{ opacity: n ? 0.18 + 0.82 * (n / max) : 1 }} data-leeg={n === 0 || undefined} />
            <span className="club-leden-weekdag-naam">{t.tijd.weekdagKort[i]}</span>
            <span className="club-getal">{n}<span className="club-sr"> {t.patroon.bezoeken}</span></span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export async function Bezoekpatroon({ bezoeken, nu }: BezoekpatroonProps) {
  const taal = await getTaal()
  return (
    <div className="club-leden-patroon-wrap">
      <Balken bezoeken={bezoeken} nu={nu} taal={taal} />
      <Weekdagen bezoeken={bezoeken} nu={nu} taal={taal} />
    </div>
  )
}
