import { vensterNaam } from '@/lib/club/cijfers/maand'
import { heel, metTeken } from '@/lib/club/cijfers/opmaak'
import type { Kant } from '@/lib/club/cijfers/rapport'
import { reeksVan, tegel, tegelLabel, TEGELS, toon, vergelijkTekst, type Tegel } from './kern-tegels'
import { Sparklijn } from '@/components/club/ontwerp/Sparklijn'
import { ONTWERP } from '@/lib/aiyourgym/taal/woorden/club/ontwerp'
import { tekstVan, type CijferContext } from './context'

// De kerncijfers van de maand als een editoriale strook: het ledenbestand groot,
// de rest in een raster ernaast. Onder elk cijfer de vergelijking met de vorige
// maand en met dezelfde maand vorig jaar, of eerlijk "geen vergelijking".

const KLASSE = { beter: 'club-plus', slechter: 'club-min', gelijk: '' } as const

function Vergelijkingen({ t, c }: { t: Tegel; c: CijferContext }) {
  const r = c.rapport
  const w = tekstVan(c).vergelijking
  const regels: [string, Kant][] = [
    [w.vorigeMaand, r.vorige],
    [w.vorigJaar, r.vorigJaar],
  ]
  return (
    <ul className="club-cijfers-vgl">
      {regels.map(([naam, basis]) => {
        const v = vergelijkTekst(t, r.huidig, basis, c.taal)
        return (
          <li key={naam} data-geen={v.oordeel === null || undefined}>
            <span>{naam}</span> <span className={v.oordeel ? KLASSE[v.oordeel] : ''}>{v.tekst}</span>
          </li>
        )
      })}
    </ul>
  )
}

function Trend({ t, c, label, groot = false }: { t: Tegel; c: CijferContext; label: (naam: string) => string; groot?: boolean }) {
  const waarden = reeksVan(t, c.rapport)
  if (waarden.filter((w) => w !== null).length < 2) return null
  return (
    <span className={groot ? 'club-cijfers-trend club-cijfers-trend--groot club-spark--data' : 'club-cijfers-trend'}>
      <Sparklijn waarden={waarden} label={label(tegelLabel(t, c.taal))} lopend={c.rapport.huidig.venster.lopend} breedte={groot ? 220 : 120} hoogte={groot ? 48 : 28} />
    </span>
  )
}

function Hoofd({ c, trendLabel }: { c: CijferContext; trendLabel: (naam: string) => string }) {
  const k = tekstVan(c).kern
  const h = c.rapport.huidig.cijfers
  const s = c.rapport.status
  const groeiKlasse = h.groei > 0 ? 'club-plus' : h.groei < 0 ? 'club-min' : ''
  const begin = k.begin(heel(h.bestandBegin, c.taal), metTeken(h.groei, c.taal))
  return (
    <div className="club-cijfers-kern-hoofd">
      <span className="club-cijfers-kern-label">{c.rapport.huidig.venster.lopend ? k.bestandVandaag : k.bestandEind}</span>
      <strong className="club-cijfers-reus">{heel(h.bestandEind, c.taal)}</strong>
      <Trend t={tegel('bestandEind')} c={c} label={trendLabel} groot />
      <span className="club-cijfers-kern-sub">
        {begin.voor}
        <span className={groeiKlasse}>{begin.groei}</span>
        {begin.na}
      </span>
      <Vergelijkingen t={tegel('bestandEind')} c={c} />
      <span className="club-cijfers-kern-sub">{k.nu(s.actief, s.proef, heel(s.gepauzeerd, c.taal))}</span>
    </div>
  )
}

export function Kerncijfers({ c }: { c: CijferContext }) {
  const w = ONTWERP[c.taal].cijfers
  const tk = tekstVan(c)
  const r = c.rapport
  const rest = TEGELS.filter((t) => t.sleutel !== 'bestandEind')
  return (
    <section className="club-cijfers-kern-strook" aria-labelledby="kern-titel">
      <h2 id="kern-titel" className="club-sr">
        {tk.kern.titel(vensterNaam(r.huidig.venster, c.taal))}
      </h2>
      <Hoofd c={c} trendLabel={w.trendLabel} />
      <dl className="club-cijfers-kern-rest">
        {rest.map((t) => (
          <div key={t.sleutel}>
            <dt>{tegelLabel(t, c.taal)}</dt>
            <dd className="club-cijfers-kern-getal">{toon(t.waarde(r.huidig.cijfers), t.soort, c.taal)}</dd>
            <dd>
              <Trend t={t} c={c} label={w.trendLabel} />
            </dd>
            <dd>
              <Vergelijkingen t={t} c={c} />
            </dd>
          </div>
        ))}
      </dl>
      <p className="club-cijfers-kern-voet">
        {tk.kern.voet(vensterNaam(r.vorige.venster, c.taal), vensterNaam(r.vorigJaar.venster, c.taal))} {tk.definities.vergelijking}
      </p>
    </section>
  )
}
