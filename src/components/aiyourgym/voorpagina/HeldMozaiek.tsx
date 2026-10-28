import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PROEFDAGEN } from '@/lib/aiyourgym/pakketten'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { VOORPAGINA } from '@/lib/aiyourgym/taal/woorden/website/voorpagina'
import { SITE_PADEN } from '../site/paden'

// Hoofdstuk 1 (creme): de held. Bovenaan een mozaiek zonder voegen waarin de vier
// letters van het embleem (A, I, Y, G) als volle merkvlakken staan, met daartussen
// echte schermen van Kernhal (voorbeeld). Onder de band de titel op de as van 42%
// en links de uitleg met de twee knoppen. De titel komt regel voor regel achter zijn
// basislijn vandaan (alleen CSS, zie voorpagina.css; zonder beweging staat hij er).

const LETTERS = [
  { letter: 'A', vlak: 'racegroen' },
  { letter: 'I', vlak: 'salie' },
  { letter: 'Y', vlak: 'fles' },
  { letter: 'G', vlak: 'inkt' },
] as const

function Letter({ letter, vlak }: (typeof LETTERS)[number]) {
  return (
    <div className={`vp-tegel vp-letter vp-vlak-${vlak} vp-letter-${letter.toLowerCase()}`} aria-hidden>
      <span>{letter}</span>
    </div>
  )
}

export async function HeldMozaiek() {
  const t = VOORPAGINA[await getSiteTaal()].held
  const [a, i, y, g] = LETTERS
  return (
    <section className="vp-held" aria-labelledby="vp-held-titel">
      <div className="vp-mozaiek" role="img" aria-label={t.mozaiekLabel}>
        <Letter {...a} />
        <div className="vp-tegel vp-ui vp-ui-vandaag" data-ui>
          <p className="vp-ui-kop">{t.vandaag}</p>
          <p className="vp-ui-klein">{t.waar}</p>
          <ul className="vp-ui-tegels">
            {t.tegels.map((tg) => (
              <li key={tg.naam}>
                <span>{tg.naam}</span>
                <strong>{tg.waarde}</strong>
              </li>
            ))}
          </ul>
        </div>
        <Letter {...i} />
        <div className="vp-tegel vp-ui vp-ui-qr" data-ui>
          <p className="vp-ui-sterk">{t.inchecken}</p>
          <div className="vp-qr">
            <QrTeken />
          </div>
          <p className="vp-ui-klein">{t.laatZien}</p>
        </div>
        <Letter {...g} />
        <div className="vp-tegel vp-ui vp-ui-check" data-ui>
          <p className="vp-ui-klein">{t.ingecheckt}</p>
          <p className="vp-ui-kop">{t.lid}</p>
          <p className="vp-ui-klein">{t.eerste}</p>
        </div>
        <div className="vp-tegel vp-ui vp-ui-lessen" data-ui>
          <p className="vp-ui-sterk">{t.lessenKop}</p>
          <ul>
            {t.lessen.map((l, n) => (
              <li key={l.tijd} data-vol={n === t.lessen.length - 1 ? '' : undefined}>
                <strong>{l.tijd}</strong>
                <span>{l.naam}</span>
                <em>{l.bezet}</em>
              </li>
            ))}
          </ul>
        </div>
        <Letter {...y} />
        <div className="vp-tegel vp-ui vp-ui-schema" data-ui>
          <p className="vp-ui-klein">{t.dagA}</p>
          <p className="vp-ui-sterk">{t.oefening}</p>
          <p className="vp-ui-klein">{t.sets}</p>
          <ol>
            {t.punten.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="vp-held-onder">
        <h1 id="vp-held-titel" className="vp-held-titel">
          {t.titel.map((regel) => (
            <span key={regel} className="vp-regel">
              <span>{regel}</span>
            </span>
          ))}
        </h1>
        <div className="vp-held-uitleg">
          <p className="vp-held-lead">{t.lead}</p>
          <div className="vp-knoppen">
            <Link href={SITE_PADEN.AANMELDEN} className="vp-knop vp-knop-vol">
              {t.probeer(PROEFDAGEN)} <ArrowRight size={18} aria-hidden />
            </Link>
            <Link href={SITE_PADEN.DEMO} className="vp-knop vp-knop-zacht">
              {t.demo}
            </Link>
          </div>
        </div>
        <p className="vp-held-voorbeeld">{t.voorbeeld}</p>
      </div>
    </section>
  )
}

/** Een vaste QR-achtige tekening (geen echte code): 7 bij 7 blokjes met drie hoekmerken. */
function QrTeken() {
  const vol = [
    '1110111', '1010101', '1110011', '0001100', '1101011', '1010110', '1110101',
  ]
  return (
    <svg viewBox="0 0 7 7" aria-hidden shapeRendering="crispEdges">
      {vol.flatMap((rij, y) =>
        [...rij].map((c, x) => (c === '1' ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" /> : null)),
      )}
    </svg>
  )
}
