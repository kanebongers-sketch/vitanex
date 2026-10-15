import { DEFINITIES } from '@/lib/club/cijfers/definities'
import { vensterNaam } from '@/lib/club/cijfers/maand'
import { aantal, heel, metTeken } from '@/lib/club/cijfers/opmaak'
import type { Kant } from '@/lib/club/cijfers/rapport'
import { tegel, TEGELS, toon, vergelijkTekst, type Tegel } from './kern-tegels'
import type { CijferContext } from './context'

// De kerncijfers van de maand als een editoriale strook: het ledenbestand groot,
// de rest in een raster ernaast. Onder elk cijfer de vergelijking met de vorige
// maand en met dezelfde maand vorig jaar, of eerlijk "geen vergelijking".

const KLASSE = { beter: 'club-plus', slechter: 'club-min', gelijk: '' } as const

function Vergelijkingen({ t, c }: { t: Tegel; c: CijferContext }) {
  const r = c.rapport
  const regels: [string, Kant][] = [
    ['Vorige maand', r.vorige],
    ['Vorig jaar', r.vorigJaar],
  ]
  return (
    <ul className="club-cijfers-vgl">
      {regels.map(([naam, basis]) => {
        const v = vergelijkTekst(t, r.huidig, basis)
        return (
          <li key={naam} data-geen={v.oordeel === null || undefined}>
            <span>{naam}</span> <span className={v.oordeel ? KLASSE[v.oordeel] : ''}>{v.tekst}</span>
          </li>
        )
      })}
    </ul>
  )
}

function Hoofd({ c }: { c: CijferContext }) {
  const h = c.rapport.huidig.cijfers
  const s = c.rapport.status
  const groeiKlasse = h.groei > 0 ? 'club-plus' : h.groei < 0 ? 'club-min' : ''
  return (
    <div className="club-cijfers-kern-hoofd">
      <span className="club-cijfers-kern-label">Ledenbestand {c.rapport.huidig.venster.lopend ? 'vandaag' : 'eind van de maand'}</span>
      <strong className="club-cijfers-reus">{heel(h.bestandEind)}</strong>
      <span className="club-cijfers-kern-sub">
        Begin {heel(h.bestandBegin)}, <span className={groeiKlasse}>{metTeken(h.groei)}</span> deze maand
      </span>
      <Vergelijkingen t={tegel('bestandEind')} c={c} />
      <span className="club-cijfers-kern-sub">
        Nu {aantal(s.actief, 'actief lid', 'actieve leden')}, {aantal(s.proef, 'proeflid', 'proefleden')} en {heel(s.gepauzeerd)} gepauzeerd.
      </span>
    </div>
  )
}

export function Kerncijfers({ c }: { c: CijferContext }) {
  const r = c.rapport
  const rest = TEGELS.filter((t) => t.sleutel !== 'bestandEind')
  return (
    <section className="club-cijfers-kern-strook" aria-labelledby="kern-titel">
      <h2 id="kern-titel" className="club-sr">
        Kerncijfers {vensterNaam(r.huidig.venster)}
      </h2>
      <Hoofd c={c} />
      <dl className="club-cijfers-kern-rest">
        {rest.map((t) => (
          <div key={t.sleutel}>
            <dt>{t.label}</dt>
            <dd className="club-cijfers-kern-getal">{toon(t.waarde(r.huidig.cijfers), t.soort)}</dd>
            <dd>
              <Vergelijkingen t={t} c={c} />
            </dd>
          </div>
        ))}
      </dl>
      <p className="club-cijfers-kern-voet">
        Vergeleken met {vensterNaam(r.vorige.venster)} en {vensterNaam(r.vorigJaar.venster)}. {DEFINITIES.vergelijking}
      </p>
    </section>
  )
}
