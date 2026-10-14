import { asSchaal, perWeekdag, weekBalken, WEEKDAG_KORT } from '@/lib/club/leden/patroon'

// Het bezoekpatroon van een lid: 12 staven (per 7 dagen, de laatste eindigt
// vandaag) met een y-as, en een strook per weekdag. Gewone HTML in plaats van
// een geschaalde SVG, zodat de letters ook op een telefoon leesbaar blijven.

interface BezoekpatroonProps {
  bezoeken: Date[]
  nu: Date
}

function procent(waarde: number, top: number): string {
  return `${(waarde / top) * 100}%`
}

function Balken({ bezoeken, nu }: BezoekpatroonProps) {
  const balken = weekBalken(bezoeken, nu)
  const { top, ticks } = asSchaal(Math.max(...balken.map((b) => b.aantal)))
  const totaal = balken.reduce((s, b) => s + b.aantal, 0)
  const omschrijving = `Bezoeken per week, laatste 12 weken, samen ${totaal}. ${balken.map((b) => `${b.huidig ? 'Deze week' : `Week vanaf ${b.label}`}: ${b.aantal}`).join(', ')}.`
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
              {b.huidig ? 'Nu' : b.label}
            </li>
          ))}
        </ol>
      </div>
      <figcaption className="club-hint">
        Bezoeken per week: een dag met een check-in telt als een bezoek, in alle vestigingen. De laatste staaf zijn de laatste 7 dagen.
      </figcaption>
    </figure>
  )
}

function Weekdagen({ bezoeken, nu }: BezoekpatroonProps) {
  const telling = perWeekdag(bezoeken, nu)
  const max = Math.max(1, ...telling)
  return (
    <div className="club-leden-weekdagen-wrap">
      <h3 className="club-leden-subkop" id="weekdag-kop">Per weekdag</h3>
      <ol className="club-leden-weekdagen" aria-labelledby="weekdag-kop">
        {telling.map((n, i) => (
          <li key={WEEKDAG_KORT[i]}>
            <span className="club-leden-weekdag-vak" aria-hidden style={{ opacity: n ? 0.18 + 0.82 * (n / max) : 1 }} data-leeg={n === 0 || undefined} />
            <span className="club-leden-weekdag-naam">{WEEKDAG_KORT[i]}</span>
            <span className="club-getal">{n}<span className="club-sr"> bezoeken</span></span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function Bezoekpatroon({ bezoeken, nu }: BezoekpatroonProps) {
  return (
    <div className="club-leden-patroon-wrap">
      <Balken bezoeken={bezoeken} nu={nu} />
      <Weekdagen bezoeken={bezoeken} nu={nu} />
    </div>
  )
}
