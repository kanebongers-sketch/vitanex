import type { CSSProperties } from 'react'
import { WEEKDAG_KORT, WEEKDAG_LABEL } from '@/lib/club/rooster/openingstijden'
import { groepeerPerDag, rasterPlek, verdeelBanen, type LesOverzicht } from '@/lib/club/rooster/raster'
import { minutenNaarTijd } from '@/lib/club/rooster/tijd'
import { roosterHref, type RoosterStaat } from '@/lib/club/rooster/url'
import { LesBlok } from './LesBlok'

// Het weekraster: dagen als kolommen over de volle breedte, tijd van boven naar
// beneden. Op de pc het raster, op de telefoon de daglijst (beide in de HTML,
// CSS kiest). Lessen die tegelijk lopen staan naast elkaar.

interface Props {
  dagen: readonly string[]
  lessen: readonly LesOverzicht[]
  bereik: { van: number; tot: number }
  vandaag: string
  nuMinuten: number
  nuMs: number
  staat: RoosterStaat
}

const MAAND = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'UTC' })

function dagNummer(datum: string): string {
  return String(Number(datum.slice(8, 10)))
}

function DagKolom({ datum, lessen, bereik, isVandaag, nuMinuten, nuMs, staat }: { datum: string; lessen: readonly LesOverzicht[]; isVandaag: boolean } & Omit<Props, 'dagen' | 'lessen' | 'vandaag'>) {
  const plekken = lessen.map((l) => ({ les: l, ...rasterPlek(l) }))
  const banen = verdeelBanen(plekken.map((p) => ({ id: p.les.id, van: p.van, tot: p.tot })))
  const nuStijl = { '--van': nuMinuten - bereik.van } as CSSProperties
  return (
    <div className="club-rooster-dag" data-vandaag={isVandaag || undefined} role="listitem" aria-label={datum}>
      {plekken.map(({ les, van, tot }) => {
        const b = banen.get(les.id) ?? { baan: 0, banen: 1 }
        return (
          <LesBlok
            key={les.id}
            les={les}
            href={roosterHref(staat, { les: les.id })}
            tijd={minutenNaarTijd(van)}
            isVoorbij={Date.parse(les.eindOp) < nuMs}
            isGeopend={staat.les === les.id}
            plek={{ van: van - bereik.van, duur: tot - van, baan: b.baan, banen: b.banen }}
          />
        )
      })}
      {isVandaag && nuMinuten >= bereik.van && nuMinuten <= bereik.tot && <span className="club-rooster-nu" style={nuStijl} aria-hidden />}
    </div>
  )
}

export function WeekRaster({ dagen, lessen, bereik, vandaag, nuMinuten, nuMs, staat }: Props) {
  const perDag = groepeerPerDag(lessen, dagen)
  const uren = Array.from({ length: (bereik.tot - bereik.van) / 60 }, (_, i) => bereik.van + i * 60)
  const stijl = { '--uren': uren.length } as CSSProperties
  return (
    <section className="club-rooster-raster" style={stijl} aria-label="Weekrooster">
      <div className="club-rooster-kolomkoppen" aria-hidden>
        <span />
        {dagen.map((d, i) => (
          <span key={d} className="club-rooster-kolomkop" data-vandaag={d === vandaag || undefined}>
            <span className="club-rooster-kolomkop-dag">{WEEKDAG_KORT[i]}</span>
            <span className="club-rooster-kolomkop-nr club-getal">{dagNummer(d)}</span>
            <span className="club-rooster-kolomkop-telling">{perDag[d].filter((l) => !l.geannuleerd).length} lessen</span>
          </span>
        ))}
      </div>
      <div className="club-rooster-rooster">
        <div className="club-rooster-uren" aria-hidden>
          {uren.map((u) => (
            <span key={u}>{minutenNaarTijd(u)}</span>
          ))}
        </div>
        <div className="club-rooster-dagen" role="list">
          {dagen.map((d, i) => (
            <DagKolom
              key={d}
              datum={`${WEEKDAG_LABEL[i]} ${MAAND.format(new Date(`${d}T12:00:00Z`))}`}
              lessen={perDag[d]}
              bereik={bereik}
              isVandaag={d === vandaag}
              nuMinuten={nuMinuten}
              nuMs={nuMs}
              staat={staat}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/** Anker van een dag in de daglijst, voor de dagkiezer. */
function dagAnker(datum: string): string {
  return `club-rooster-dag-${datum}`
}

export function DagLijst({ dagen, lessen, vandaag, nuMs, staat }: Omit<Props, 'bereik' | 'nuMinuten'>) {
  const perDag = groepeerPerDag(lessen, dagen)
  return (
    <section className="club-rooster-daglijst" aria-label="Lessen per dag">
      <nav className="club-rooster-dagkiezer" aria-label="Naar een dag">
        {dagen.map((d, i) => {
          const aantal = perDag[d].filter((l) => !l.geannuleerd).length
          return (
            <a key={d} href={`#${dagAnker(d)}`} data-vandaag={d === vandaag || undefined} data-leeg={aantal === 0 || undefined}>
              <span>{WEEKDAG_KORT[i]}</span>
              <strong className="club-getal">{dagNummer(d)}</strong>
              <small>{aantal === 0 ? 'geen' : aantal === 1 ? '1 les' : `${aantal} lessen`}</small>
            </a>
          )
        })}
      </nav>
      {dagen.map((d, i) => (
        <section key={d} id={dagAnker(d)} className="club-rooster-daglijst-dag" data-vandaag={d === vandaag || undefined}>
          <h2>
            {WEEKDAG_LABEL[i]} <span className="club-zacht">{MAAND.format(new Date(`${d}T12:00:00Z`))}</span>
            {d === vandaag && <span className="club-chip club-chip--merk">Vandaag</span>}
          </h2>
          {perDag[d].length === 0 ? (
            <p className="club-rooster-daglijst-leeg">Geen lessen</p>
          ) : (
            <div className="club-rooster-daglijst-rijen">
              {perDag[d].map((les) => (
                <LesBlok
                  key={les.id}
                  les={les}
                  href={roosterHref(staat, { les: les.id })}
                  tijd={minutenNaarTijd(rasterPlek(les).van)}
                  isVoorbij={Date.parse(les.eindOp) < nuMs}
                  isGeopend={staat.les === les.id}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </section>
  )
}
