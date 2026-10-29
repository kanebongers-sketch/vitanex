import type { CSSProperties } from 'react'
import { OEFENRENDERS, srcSetVan, type OefenRender } from '@/components/aiyourgym/inhoud/oefenrenders'
import { coachingVoor } from '@/lib/club/training/coaching'
import { formatGetal } from '@/lib/aiyourgym/taal/formaat'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { standaardCoachingIn } from '@/lib/aiyourgym/taal/woorden/club/coaching'
import { PRODUCTSCHERMEN } from '@/lib/aiyourgym/taal/woorden/website/mockups/productschermen'
import { Venster } from '../kaders'
import { PBlok, PCijfer } from './bouwstenen'
import {
  DAG_B,
  UITGELICHT,
  rustTekst,
  schemaBlokken,
  tempoDelen,
  totaalSets,
  volgendeDag,
  type RegelMetRender,
  type SchemaBlok,
} from './schema-dag'

// Een trainingsschema in de schema-editor van Club, statisch en rustig (besluit
// Kane 29-10-2026: niet interactief, wel premium, met de eigen Blender-renders).
// Boven de voortgang van de week, links de dag als blokken (supersets met een
// lijn tussen de codes), elke oefening met een stilstaand beeld van de render,
// sets, kg, RIR, rust en het tempo als balkjes. Rechts een vast paneel: het beeld
// op het zwaarste punt, de kernpunten uit de oefenbibliotheek van Club en de
// zwaarste set met sparklijn. Een nieuwe render verschijnt vanzelf bij dag C.
// Beelden zijn de kleine stilstaande webp's (480 px), lazy geladen; geen video,
// geen JavaScript in de browser.

type Teksten = (typeof PRODUCTSCHERMEN)['nl']['schema']

const WEEK = { nu: 3, totaal: 8 } as const
const DAG_C_TONEN = 4

export async function SchemaScherm() {
  const taal = await getSiteTaal()
  const t = PRODUCTSCHERMEN[taal].schema
  const blokken = schemaBlokken(DAG_B, OEFENRENDERS)
  const aantal = blokken.reduce((s, b) => s + b.regels.length, 0)
  const uitgelicht = blokken.flatMap((b) => b.regels).find((r) => r.slug === UITGELICHT.slug) ?? blokken[0]?.regels[0]
  return (
    <Venster actief="Coaching" hier="Training">
      <div className="aygp aygs">
        <div className="aygp-paginakop">
          <div>
            <p className="aygp-waar">{t.wie}</p>
            <p className="aygp-titel">{t.kop}</p>
          </div>
          <span className="aygp-knop">{t.opslaan}</span>
        </div>
        <Week t={t} dagB={t.dagSamen(aantal, totaalSets(blokken))} volgende={volgendeDag(DAG_B, OEFENRENDERS)} />
        <div className="aygs-raam">
          <div className="aygs-lijst">
            <div className="aygs-kolommen" aria-hidden>
              <span>{t.kolommen.oefening}</span>
              <span>{t.kolommen.sets}</span>
              <span>{t.kolommen.kg}</span>
              <span>{t.kolommen.rir}</span>
              <span>{t.kolommen.rust}</span>
              <span>{t.kolommen.tempo}</span>
            </div>
            {blokken.map((b) => (
              <Blok key={b.letter} blok={b} t={t} taal={taal} />
            ))}
            <p className="aygs-legenda">
              <span data-soort="omlaag">{t.legenda.omlaag}</span>
              <span data-soort="vast">{t.legenda.vast}</span>
              <span data-soort="omhoog">{t.legenda.omhoog}</span>
            </p>
          </div>
          {uitgelicht ? <Paneel regel={uitgelicht} t={t} taal={taal} /> : null}
        </div>
      </div>
    </Venster>
  )
}

function Week({ t, dagB, volgende }: { t: Teksten; dagB: string; volgende: readonly OefenRender[] }) {
  const extra = volgende.length - DAG_C_TONEN
  return (
    <div className="aygs-week">
      <div className="aygs-week-stand">
        <span className="aygp-stat-label">{t.week(WEEK.nu, WEEK.totaal)}</span>
        <span className="aygs-week-balk" role="meter" aria-label={t.weekLabel(WEEK.nu, WEEK.totaal)} aria-valuemin={0} aria-valuemax={WEEK.totaal} aria-valuenow={WEEK.nu}>
          {Array.from({ length: WEEK.totaal }, (_, i) => (
            <i key={i} data-gedaan={i < WEEK.nu - 1 || undefined} data-nu={i === WEEK.nu - 1 || undefined} />
          ))}
        </span>
      </div>
      <ol className="aygs-dagen">
        {t.dagen.map((d, i) => (
          <li key={d.naam} data-stand={['gedaan', 'nu', 'volgt'][i]}>
            <span className="aygs-dag-kop">
              <small>{d.dag}</small>
              <b>{d.naam}</b>
              <span className="aygs-dag-stand">{d.stand}</span>
            </span>
            {i === 1 ? <span className="aygs-dag-sub">{dagB}</span> : null}
            {i === 2 && volgende.length > 0 ? (
              <span className="aygs-dag-duimen" role="img" aria-label={t.verderOpDagC}>
                {volgende.slice(0, DAG_C_TONEN).map((r) => (
                  <img key={r.slug} src={r.beginKlein.src} alt="" width={r.beginKlein.breedte} height={r.beginKlein.hoogte} loading="lazy" decoding="async" />
                ))}
                {extra > 0 ? <span className="aygs-dag-meer">+{extra}</span> : null}
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  )
}

function Blok({ blok, t, taal }: { blok: SchemaBlok; t: Teksten; taal: Taal }) {
  const superset = blok.regels.length > 1
  return (
    <section className="aygs-blok" data-superset={superset || undefined} aria-label={superset ? `${t.superset} ${blok.letter}` : undefined}>
      {superset ? <span className="aygs-blok-label">{t.superset}</span> : null}
      <ol>
        {blok.regels.map((r) => (
          <Rij key={r.code} r={r} t={t} taal={taal} />
        ))}
      </ol>
    </section>
  )
}

function Rij({ r, t, taal }: { r: RegelMetRender; t: Teksten; taal: Taal }) {
  const naam = t.naam(r.slug, r.render.naam)
  const beeld = r.render.piekKlein
  return (
    <li className="aygs-rij">
      <span className="aygs-code">{r.code}</span>
      <span className="aygs-duim">
        <img src={beeld.src} alt="" width={beeld.breedte} height={beeld.hoogte} loading="lazy" decoding="async" />
      </span>
      <span className="aygs-naam">
        <b>{naam}</b>
      </span>
      <span className="aygs-cellen">
        <Cel label={t.kolommen.sets} waarde={r.opTijd ? t.setsTijd(r.sets, r.doel) : t.setsTekst(r.sets, r.doel)} sub={r.perKant ? t.perKant : undefined} sterk />
        <Cel label={t.kolommen.kg} waarde={r.kg === null ? (r.opTijd ? null : t.eigenGewicht) : formatGetal(r.kg, taal)} zacht={r.kg === null} />
        <Cel label={t.kolommen.rir} waarde={r.rir === null ? null : String(r.rir)} />
        <Cel label={t.kolommen.rust} waarde={r.rustSec === 0 ? t.direct : rustTekst(r.rustSec)} zacht={r.rustSec === 0} />
      </span>
      <Tempo tempo={r.tempo} t={t} />
    </li>
  )
}

interface CelProps {
  label: string
  waarde: string | null
  sub?: string
  sterk?: boolean
  zacht?: boolean
}

function Cel({ label, waarde, sub, sterk, zacht }: CelProps) {
  return (
    <span className="aygs-cel" data-leeg={waarde === null || undefined} data-sterk={sterk || undefined} data-zacht={zacht || undefined}>
      <small>{label}</small>
      <span>
        {waarde}
        {sub ? <em>{sub}</em> : null}
      </span>
    </span>
  )
}

function Tempo({ tempo, t }: { tempo: string | null; t: Teksten }) {
  const delen = tempoDelen(tempo)
  if (!tempo || !delen) {
    return (
      <span className="aygs-tempo" data-vast>
        <small>{t.kolommen.tempo}</small>
        <span className="aygs-tempo-houd">{t.vasthouden}</span>
      </span>
    )
  }
  const omlaag = delen.find((d) => d.soort === 'omlaag')?.sec ?? 0
  const omhoog = delen.find((d) => d.soort === 'omhoog')?.sec ?? 0
  return (
    <span className="aygs-tempo" role="img" aria-label={t.tempoLabel(tempo, omlaag, omhoog)}>
      <small>{t.kolommen.tempo}</small>
      <span className="aygs-tempo-balk">
        {delen.map((d, i) => (
          <i key={`${d.soort}-${i}`} data-soort={d.soort} style={{ '--sec': d.sec } as CSSProperties} />
        ))}
      </span>
      <b>{tempo}</b>
    </span>
  )
}

function Paneel({ regel, t, taal }: { regel: RegelMetRender; t: Teksten; taal: Taal }) {
  const naam = t.naam(regel.slug, regel.render.naam)
  const coaching = standaardCoachingIn(regel.render.naam, coachingVoor(regel.render.naam), taal)
  const zwaarste = UITGELICHT.zwaarste
  const nu = zwaarste[zwaarste.length - 1]
  const beeld = regel.render.piek
  return (
    <aside className="aygs-paneel">
      <figure className="aygs-uit">
        <img
          src={regel.render.piekKlein.src}
          srcSet={srcSetVan([regel.render.piekKlein, beeld])}
          sizes="(max-width: 900px) 60vw, 300px"
          alt={t.beeld(naam)}
          width={beeld.breedte}
          height={beeld.hoogte}
          loading="lazy"
          decoding="async"
        />
        <figcaption>
          <span className="aygs-code">{regel.code}</span>
          <b>{naam}</b>
        </figcaption>
      </figure>
      <div className="aygs-paneel-tekst">
        {coaching ? (
          <PBlok titel={t.coaching} className="aygp-blok--verhoogd">
            <ol className="aygs-punten">
              {coaching.kernpunten.slice(0, 3).map((k) => (
                <li key={k.punt}>
                  <b>{k.punt}</b>
                  <small>{k.uitleg}</small>
                </li>
              ))}
            </ol>
            {coaching.fouten[0] ? (
              <p className="aygs-fout">
                <small>{t.fout}</small>
                <b>{coaching.fouten[0].fout}</b>
                <span>{coaching.fouten[0].beter}</span>
              </p>
            ) : null}
          </PBlok>
        ) : null}
        <PCijfer
          label={t.zwaarste}
          waarde={formatGetal(nu, taal)}
          eenheid="kg"
          verschil={t.zwaarsteVerschil(formatGetal(nu - zwaarste[0], taal))}
          sub={t.progressie(formatGetal(nu + 2.5, taal))}
          trend={{ waarden: zwaarste, label: t.zwaarsteTrend(naam) }}
        />
      </div>
    </aside>
  )
}
