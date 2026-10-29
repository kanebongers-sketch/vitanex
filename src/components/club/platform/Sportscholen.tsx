import type { SportschoolRegel } from '@/lib/club/platform/opslag'
import { STATUS_WEERGAVE, type StartStand } from '@/lib/club/platform/tellingen'
import { vindPakket } from '@/lib/aiyourgym/pakketten'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { PLATFORM } from '@/lib/aiyourgym/taal/woorden/club/platform'
import { OpenKnop } from './OpenKnop'
import { nlDatum, nlMoment } from './datum'
import { adresVan } from '@/lib/club/kern/subdomein'
import { subdomeinenActief } from '@/lib/club/kern/adres-verzoek'

interface SportscholenProps {
  sportscholen: SportschoolRegel[]
  maand: string
  afgekapt: boolean
}

function getal(n: number | null, taal: Taal): string {
  return n === null ? '?' : formatGetal(n, taal)
}

function startTekst(s: StartStand | null, taal: Taal): string {
  const t = PLATFORM[taal].scholen
  if (!s) return t.nietTeLezen
  if (s.soort === 'af') return t.afgerond(nlDatum(s.afgerondOp, taal))
  if (s.soort === 'niet') return t.nietGestart
  return t.stappen(s.klaar, s.totaal)
}

function Startwizard({ start, taal }: { start: StartStand | null; taal: Taal }) {
  const t = PLATFORM[taal].scholen
  const deel = start ? (start.soort === 'af' ? 1 : start.klaar / start.totaal) : 0
  return (
    <div className="club-platform-start">
      <span className="club-platform-klein">{t.startwizard}</span>
      <span
        className="club-platform-meter"
        role="meter"
        aria-label={t.voortgang}
        aria-valuemin={0}
        aria-valuemax={start?.totaal ?? 9}
        aria-valuenow={start ? (start.soort === 'af' ? start.totaal : start.klaar) : 0}
        aria-valuetext={startTekst(start, taal)}
        data-af={start?.soort === 'af' || undefined}
      >
        <span style={{ transform: `scaleX(${deel})` }} />
      </span>
      <span className="club-platform-sub">{startTekst(start, taal)}</span>
    </div>
  )
}

function Abonnement({ s, taal }: { s: SportschoolRegel; taal: Taal }) {
  const p = PLATFORM[taal]
  const t = p.scholen
  const a = s.aanmelding
  if (!a) return <span className="club-platform-sub">{s.eigen ? t.eigenGeenAbo : t.geenAanmelding}</span>
  const w = STATUS_WEERGAVE[a.status]
  return (
    <>
      <span>
        <span className={`club-chip club-chip--${w.toon}`}>{p.status[a.status]}</span> <span className="club-platform-pakket">{vindPakket(a.pakket)?.naam ?? (a.pakket || p.onbekend)}</span>
      </span>
      <span className="club-platform-sub">
        {typeof s.proefTot === 'string' ? t.proefTot(nlDatum(s.proefTot, taal)) : s.proefTot === undefined ? t.proefFout : t.sinds(nlDatum(a.aangemaaktOp, taal))}
      </span>
    </>
  )
}

function Regel({ s, maand, taal }: { s: SportschoolRegel; maand: string; taal: Taal }) {
  const t = PLATFORM[taal].scholen
  const cijfers: [string, number | null][] = [
    [t.vestigingen, s.vestigingen],
    [t.leden, s.leden],
    [t.medewerkers, s.medewerkers],
    [t.checkins(maand), s.checkins],
  ]
  return (
    <li className="club-platform-school" aria-current={s.actief ? 'true' : undefined}>
      <div className="club-platform-naam">
        <h3>{s.naam}</h3>
        <p className="club-platform-sub">
          {s.slug ? <span className="club-platform-adres">{adresVan(s.slug, subdomeinenActief())}</span> : t.geenAdres}
        </p>
        <p className="club-platform-chips">
          {s.eigen && <span className="club-chip club-chip--merk">{t.eigen}</span>}
          {s.demo && <span className="club-chip club-chip--info">{t.demo}</span>}
          {s.aanmelding?.status === 'test' && <span className="club-chip club-chip--info">{t.test}</span>}
          {s.actief && <span className="club-chip club-chip--ok">{t.staatOpen}</span>}
        </p>
      </div>
      <dl className="club-platform-cijfers">
        {cijfers.map(([label, n]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{getal(n, taal)}</dd>
          </div>
        ))}
      </dl>
      <Startwizard start={s.start} taal={taal} />
      <div className="club-platform-info">
        <span className="club-platform-klein">{t.abonnement}</span>
        <Abonnement s={s} taal={taal} />
      </div>
      <div className="club-platform-info">
        <span className="club-platform-klein">{t.laatste}</span>
        {s.laatste === undefined ? (
          <span className="club-platform-sub">{t.nietTeLezen}</span>
        ) : s.laatste === null ? (
          <span className="club-platform-sub">{t.geenLogboek}</span>
        ) : (
          <>
            <span className="club-platform-actie">{s.laatste.actie}</span>
            <span className="club-platform-sub">
              <time dateTime={s.laatste.op}>{nlMoment(s.laatste.op, taal)}</time>
              {s.laatste.wie ? ` · ${s.laatste.wie}` : ''}
            </span>
          </>
        )}
      </div>
      <OpenKnop id={s.id} naam={s.naam} actief={s.actief} />
    </li>
  )
}

// Alle sportscholen van Kane, elk als een regel met tellingen, voortgang,
// abonnement en laatste activiteit. Op de pc een strakke rij, op de telefoon een kaart.
export async function Sportscholen({ sportscholen, maand, afgekapt }: SportscholenProps) {
  const taal = await getTaal()
  const t = PLATFORM[taal].scholen
  return (
    <section aria-labelledby="platform-scholen-kop">
      <div className="club-sectiekop">
        <h2 id="platform-scholen-kop">{t.kop}</h2>
        <span>{t.telling(sportscholen.length, afgekapt)}</span>
      </div>
      {sportscholen.length === 0 ? (
        <p className="club-leeg">{t.leeg}</p>
      ) : (
        <ul className="club-platform-scholen">
          {sportscholen.map((s) => (
            <Regel key={s.id} s={s} maand={maand} taal={taal} />
          ))}
        </ul>
      )}
    </section>
  )
}
