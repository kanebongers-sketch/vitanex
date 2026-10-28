import type { HoofdstukSleutel } from '@/components/aiyourgym/inhoud/functies'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { FUNCTIES_SCHERMEN } from '@/lib/aiyourgym/taal/woorden/website/functies-schermen'

// Een echt schermfragment per hoofdstuk, in HTML (data-ui), met voorbeeldgegevens
// van Kernhal. Geen apparaatlijst en geen grijze balken: echte labels en getallen
// die kloppen. De grafiek van Groei leest zijn hoogtes uit dezelfde getallen.

type T = (typeof FUNCTIES_SCHERMEN)['nl']

function Beheer({ t }: { t: T['beheer'] }) {
  return (
    <>
      <Kop kop={t.kop} waar={t.waar} />
      <ul className="fp-lijst">
        {t.rijen.map((r) => (
          <li key={r.naam} data-fout={r.goed ? undefined : ''}>
            <strong>{r.naam}</strong>
            <span className="fp-tijd">{r.tijd}</span>
            <span className="fp-status">{r.status}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

function Coaching({ t }: { t: T['coaching'] }) {
  return (
    <>
      <Kop kop={t.kop} waar={t.waar} />
      <div className="fp-coach">
        <div>
          <p className="fp-sub">{t.kernpuntenKop}</p>
          <ol className="fp-punten">
            {t.kernpunten.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ol>
        </div>
        <dl className="fp-feiten">
          <div>
            <dt>{t.tempoKop}</dt>
            <dd>{t.tempo}</dd>
          </div>
          <div>
            <dt>{t.ademKop}</dt>
            <dd>{t.adem}</dd>
          </div>
        </dl>
      </div>
    </>
  )
}

function Planning({ t }: { t: T['planning'] }) {
  return (
    <>
      <Kop kop={t.kop} waar={t.waar} />
      <div className="fp-week">
        {t.dagen.map((d) => (
          <div key={d.dag} className="fp-dag">
            <p className="fp-sub">{d.dag}</p>
            <ul>
              {d.lessen.map((l) => (
                <li key={l.tijd + l.naam} data-vol={l.vol ? '' : undefined} title={l.vol ? t.volUitleg : undefined}>
                  <strong>{l.tijd}</strong>
                  <span>{l.naam}</span>
                  <em>{l.bezet}</em>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="fp-legenda">
        <span className="fp-blokje" aria-hidden /> {t.volUitleg}
      </p>
    </>
  )
}

function Groei({ t }: { t: T['groei'] }) {
  const hoogste = Math.max(...t.maanden.map((m) => m.waarde))
  return (
    <>
      <Kop kop={t.kop} waar={t.waar} />
      <p className="fp-vondst">{t.vondst}</p>
      <div className="fp-staven" role="img" aria-label={t.grafiekLabel}>
        {t.maanden.map((m, i) => (
          <div key={m.maand} className="fp-staaf" data-laatste={i === t.maanden.length - 1 ? '' : undefined}>
            <span className="fp-staaf-getal">{m.waarde}</span>
            <span className="fp-staaf-balk" style={{ height: `${(m.waarde / hoogste) * 100}%` }} />
            <span className="fp-staaf-maand">{m.maand}</span>
          </div>
        ))}
      </div>
    </>
  )
}

function Betrokkenheid({ t }: { t: T['betrokkenheid'] }) {
  return (
    <div className="fp-app">
      <p className="fp-klein">{t.waar}</p>
      <p className="fp-groet">{t.groet}</p>
      <div className="fp-app-kaart">
        <p className="fp-sub">{t.volgendeKop}</p>
        <p>{t.volgende}</p>
      </div>
      <div className="fp-app-kaart">
        <p className="fp-sub">{t.challengeKop}</p>
        <p>
          {t.challenge} · {t.stand}
        </p>
        <span className="fp-voortgang" aria-hidden>
          <span style={{ transform: 'scaleX(0.75)' }} />
        </span>
      </div>
      <p className="fp-app-knop">{t.inchecken}</p>
    </div>
  )
}

function Kop({ kop, waar }: { kop: string; waar: string }) {
  return (
    <div className="fp-scherm-kop">
      <p className="fp-scherm-titel">{kop}</p>
      <p className="fp-klein">{waar}</p>
    </div>
  )
}

export function Scherm({ sleutel, taal, label }: { sleutel: HoofdstukSleutel; taal: Taal; label: string }) {
  const t = FUNCTIES_SCHERMEN[taal]
  const inhoud = {
    beheer: <Beheer t={t.beheer} />,
    coaching: <Coaching t={t.coaching} />,
    planning: <Planning t={t.planning} />,
    groei: <Groei t={t.groei} />,
    betrokkenheid: <Betrokkenheid t={t.betrokkenheid} />,
  }[sleutel]
  return (
    <figure className={`fp-scherm fp-scherm-${sleutel}`} data-ui aria-label={label}>
      {inhoud}
    </figure>
  )
}
