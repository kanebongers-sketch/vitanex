import type { CSSProperties } from 'react'
import type { Vandaag } from '@/lib/club/cijfers/haal-vandaag'
import { BINNEN_MINUTEN } from '@/lib/club/cijfers/vandaag'
import { metTeken } from '@/lib/club/cijfers/opmaak'
import { tijdNl, weekdagNaam, weekdagVan } from '@/lib/club/cijfers/tijd'
import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { VANDAAG } from '@/lib/aiyourgym/taal/woorden/club/vandaag-scherm'
import { ONTWERP } from '@/lib/aiyourgym/taal/woorden/club/ontwerp'

// De bovenkant van Vandaag: een reuzencijfer voor wie er nu is, en daarnaast
// drie feiten in een rustige kolom. Bewust geen rij gelijke tegels. Onder de
// check-ins een vergelijkbalk: vandaag tegen dezelfde tijd vorige week, op een
// schaal (alleen als er vorige week iets te vergelijken is).

interface Props {
  data: Vandaag
}

function VerschilTekst({ data, taal }: Props & { taal: Taal }) {
  const t = VANDAAG[taal].hero
  const dag = weekdagNaam(weekdagVan(data.vandaag), taal)
  if (data.verschil === null) {
    return <span className="club-vandaag-feit-sub">{t.geenVergelijking(dag)}</span>
  }
  const { verschil, richting } = data.verschil
  if (richting === 'gelijk') return <span className="club-vandaag-feit-sub">{t.evenVeel(dag, data.checkinsVorigeWeek)}</span>
  return (
    <span className="club-vandaag-feit-sub">
      <span className={richting === 'meer' ? 'club-plus' : 'club-min'}>{metTeken(verschil)}</span>{t.tenOpzichte(dag, data.checkinsVorigeWeek)}
    </span>
  )
}

interface VergelijkTeksten {
  vandaag: string
  vorige: string
  label: string
}

function VergelijkBalk({ vandaag, vorige, w }: { vandaag: number; vorige: number; w: VergelijkTeksten }) {
  const top = Math.max(vandaag, vorige, 1)
  const rijen: [string, number][] = [
    [w.vandaag, vandaag],
    [w.vorige, vorige],
  ]
  return (
    <ul className="club-vgl" aria-label={w.label}>
      {rijen.map(([naam, n]) => (
        <li key={naam}>
          <span>{naam}</span>
          <span className="club-vgl-balk" aria-hidden>
            <span style={{ '--deel': n / top } as CSSProperties} />
          </span>
          <span className="club-vgl-getal">{n}</span>
        </li>
      ))}
    </ul>
  )
}

function proefTekst(data: Vandaag, taal: Taal): string {
  if (data.proeflessen.length === 0) return VANDAAG[taal].hero.geenProef
  return data.proeflessen.map((p) => `${p.naam.split(' ')[0]}${p.proeflesOp ? ` ${tijdNl(p.proeflesOp)}` : ''}`).join(', ')
}

export async function VandaagHero({ data }: Props) {
  const w = (await clubTekst(ONTWERP)).vandaag
  const taal = await getTaal()
  const t = VANDAAG[taal].hero
  const lessen = data.lessen.filter((l) => !l.geannuleerd)
  const nogTeGaan = lessen.filter((l) => l.start.getTime() > data.nu.getTime()).length
  return (
    <section className="club-vandaag-hero" aria-label={t.label}>
      <div className="club-vandaag-nu">
        <span className="club-vandaag-label">{t.nuBinnen}</span>
        <strong className="club-vandaag-reus">{data.nuBinnen}</strong>
        <span className="club-vandaag-nu-sub">
          {t.nuSub(data.nuBinnen, BINNEN_MINUTEN)}
        </span>
      </div>
      <dl className="club-vandaag-feiten">
        <div className="club-vandaag-feit">
          <dt>{t.checkins}</dt>
          <dd>
            <strong>{data.checkinsVandaag}</strong>
            <VerschilTekst data={data} taal={taal} />
            {data.verschil !== null && <VergelijkBalk vandaag={data.checkinsVandaag} vorige={data.checkinsVorigeWeek} w={{ vandaag: w.vandaag, vorige: w.vorige, label: w.vergelijkLabel }} />}
          </dd>
        </div>
        <div className="club-vandaag-feit">
          <dt>{t.lessen}</dt>
          <dd>
            <strong>{lessen.length}</strong>
            <span className="club-vandaag-feit-sub">{lessen.length === 0 ? t.geenLessen : nogTeGaan === 0 ? t.allesBegonnen : t.nogTeGaan(nogTeGaan)}</span>
          </dd>
        </div>
        <div className="club-vandaag-feit">
          <dt>{t.proeflessen}</dt>
          <dd>
            <strong>{data.proeflessen.length}</strong>
            <span className="club-vandaag-feit-sub">{proefTekst(data, taal)}</span>
          </dd>
        </div>
      </dl>
    </section>
  )
}
