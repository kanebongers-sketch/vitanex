'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Minus, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { Kaart, NogNiets } from '@/components/lifeos/os/Kaart'
import { Knop, KnopLink } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { haalJson } from '@/lib/lifeos/api/http'
import { FACTOR_LABEL, leesBerekening, leesRisico, risicoNiveau, type RisicoWeek, type Trend } from './burnout'

// ─── Burn-out-risico ────────────────────────────────────────────────────────
// Deze voorspeller bestond al volledig (`/api/burnout-predictor`, tabel
// `burnout_predictor_scores`) maar had geen enkel scherm. Burn-out vóór zijn is
// de belofte van het product; die lag hier kant-en-klaar te verstoffen.
//
// Drie dingen die je hier goed moet lezen, anders draai je de betekenis om:
//
//   1. HOGER = SLECHTER. Dit is een risico, geen score. Zie `burnout.ts`, waar
//      de omgekeerde bandindeling staat en waarom `scoreNiveau()` hier niet mag.
//   2. `trending: 'stijgend'` betekent dat het RISICO stijgt — dus slechter
//      nieuws. Een pijl omhoog moet hier dus waarschuwend zijn, niet positief.
//   3. GET rékent niet — hij leest alleen opgeslagen rijen. Alleen POST rekent.
//
// ── En daar zit het addertje ────────────────────────────────────────────────
// NIETS in de hele codebase roept die POST aan. Zes routes lézen
// `burnout_predictor_scores` (inzichten, groeiplan, rapport/export,
// achievements/check, manager/team-overzicht, coach/nudges), er is een
// /burnout-pagina, en er is geen cron. Maar geschreven wordt de tabel door
// niemand. De voorspeller is dus niet "leeg omdat je geen check-ins hebt" — hij
// is nog nooit uitgevoerd.
//
// Daarom staat er in de lege staat NIET "nog geen check-ins": dat zou een
// onware verklaring zijn zodra Kane wél check-ins heeft (en die heeft hij). Er
// staat wat er echt aan de hand is, plus een knop die de berekening één keer
// draait. Die POST is een expliciete gebruikersactie, geen bijwerking van het
// openen van een dashboard: hij rekent met je échte check-ins en upsert de rij
// van deze week — hij verzint geen geschiedenis.

type Staat =
  | { fase: 'laden' }
  | { fase: 'fout'; bericht: string }
  | { fase: 'ok'; weken: RisicoWeek[] }

export function BurnoutKaart() {
  const [staat, setStaat] = useState<Staat>({ fase: 'laden' })
  const [bezig, setBezig] = useState(false)
  const [actieFout, setActieFout] = useState<string | null>(null)
  /** True zodra de POST meldde dat er niets te rekenen valt. */
  const [geenCheckins, setGeenCheckins] = useState(false)
  const generatie = useRef(0)

  const laad = useCallback((): Promise<void> => {
    const mijn = ++generatie.current
    return haalJson('/api/burnout-predictor', leesRisico).then((uitkomst) => {
      if (mijn !== generatie.current) return
      setStaat(
        uitkomst.ok ? { fase: 'ok', weken: uitkomst.waarde.weken } : { fase: 'fout', bericht: uitkomst.fout },
      )
    })
  }, [])

  useEffect(() => {
    void laad()
    return () => {
      generatie.current++
    }
  }, [laad])

  const opnieuw = useCallback(() => {
    setStaat({ fase: 'laden' })
    void laad()
  }, [laad])

  /**
   * Rekent het risico van deze week uit. Expliciete actie, geen bijwerking van
   * het laden — dit is de enige plek in de app die deze POST aanroept.
   */
  const bereken = useCallback(async (): Promise<void> => {
    if (bezig) return
    setBezig(true)
    setActieFout(null)

    const uitkomst = await haalJson('/api/burnout-predictor', leesBerekening, { method: 'POST' })

    if (!uitkomst.ok) {
      setBezig(false)
      setActieFout(uitkomst.fout)
      return
    }

    if (uitkomst.waarde.soort === 'geen-checkins') {
      setBezig(false)
      setGeenCheckins(true)
      return
    }

    // Uitgerekend: opnieuw lezen, zodat de historie-strip de verse rij meepakt
    // in plaats van dat we 'm er zelf bij verzinnen.
    await laad()
    setBezig(false)
  }, [bezig, laad])

  return (
    <Kaart titel="Burn-out-risico" vervangt="niets — dit kan alleen met je eigen check-ins">
      {staat.fase === 'laden' ? <Skelet /> : null}
      {staat.fase === 'fout' ? <Foutmelding bericht={staat.bericht} opnieuw={opnieuw} /> : null}
      {staat.fase === 'ok' ? (
        <Inhoud
          weken={staat.weken}
          bezig={bezig}
          actieFout={actieFout}
          geenCheckins={geenCheckins}
          onBereken={() => void bereken()}
        />
      ) : null}
    </Kaart>
  )
}

interface InhoudProps {
  weken: RisicoWeek[]
  bezig: boolean
  actieFout: string | null
  geenCheckins: boolean
  onBereken: () => void
}

function Inhoud({ weken, bezig, actieFout, geenCheckins, onBereken }: InhoudProps) {
  const huidig = weken[0]

  if (huidig === undefined) {
    return (
      <NooitGerekend
        bezig={bezig}
        actieFout={actieFout}
        geenCheckins={geenCheckins}
        onBereken={onBereken}
      />
    )
  }

  const niveau = risicoNiveau(huidig.risico)

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
        <p
          className="os-cijfer"
          style={{ fontSize: 44, fontWeight: 500, color: niveau.kleur, margin: 0, lineHeight: 0.9 }}
        >
          {huidig.risico}
        </p>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 2px' }}>
            Risico · {niveau.label}
          </p>
          {/* Zeggen wat de schaal is. "63" zonder "van 100, hoger is meer
              risico" is een cijfer waar je alles in kunt lezen. */}
          <p style={{ fontSize: 12, color: 'var(--text-4)', margin: 0 }}>
            van 100 — hoger betekent meer risico
          </p>
        </div>
      </div>

      <TrendRegel trend={huidig.trend} weken={weken.length} />

      {huidig.factor ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
          Grootste bijdrage nu:{' '}
          <strong style={{ color: 'var(--text-1)', fontWeight: 600 }}>
            {FACTOR_LABEL[huidig.factor] ?? huidig.factor}
          </strong>
          .
        </p>
      ) : null}

      {weken.length > 1 ? <Historie weken={weken} /> : null}

      {/* Opnieuw uitrekenen: de score van deze week wordt ge-upsert, dus dit
          verdubbelt geen rijen. Nodig omdat niets dit automatisch bijwerkt na
          een nieuwe check-in. */}
      <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
        <Knop disabled={bezig} onClick={onBereken}>
          <RefreshCw size={14} strokeWidth={2.2} aria-hidden="true" />
          {bezig ? 'Bezig met rekenen…' : 'Opnieuw uitrekenen'}
        </Knop>
        {actieFout ? <Foutmelding bericht={actieFout} opnieuw={onBereken} /> : null}
      </div>
    </div>
  )
}

/**
 * De lege staat — en de belangrijkste tekst van deze kaart.
 *
 * Hier stond eerst "Nog geen check-ins". Dat was een gok die niet klopte: de
 * tabel is leeg omdat niets de berekening ooit aanroept, niet omdat er geen
 * check-ins zijn. Die twee door elkaar halen zou Kane vertellen dat hij iets
 * niet gedaan heeft wat hij wél deed — precies de soort onwaarheid die deze app
 * niet mag vertellen. Dus: pas ná de POST weten we welke van de twee het is, en
 * pas dan zeggen we het.
 */
function NooitGerekend({ bezig, actieFout, geenCheckins, onBereken }: Omit<InhoudProps, 'weken'>) {
  if (geenCheckins) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <NogNiets
          wat="Nog geen check-ins"
          waarom="We hebben het net geprobeerd: er staan geen check-ins om mee te rekenen. Doe er één, dan kan deze voorspelling wél iets zeggen."
        />
        <KnopLink href="/checkin">Check-in doen</KnopLink>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <NogNiets
        wat="Nog niet uitgerekend"
        waarom="Deze voorspelling leest je wekelijkse check-ins, maar hij draait niet vanzelf — niets in de app roept hem aan. Reken hem één keer uit, dan staat je risico hier."
      />
      <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
        <Knop variant="primair" disabled={bezig} onClick={onBereken}>
          {bezig ? 'Bezig met rekenen…' : 'Risico uitrekenen'}
        </Knop>
        {actieFout ? <Foutmelding bericht={actieFout} opnieuw={onBereken} /> : null}
      </div>
    </div>
  )
}

/**
 * De trend in woorden én icoon.
 *
 * Let op de omkering: 'stijgend' = het risico loopt op = slecht nieuws, dus een
 * waarschuwende pijl omhoog. Precies andersom dan bij een pijlerscore, waar
 * omhoog juist het merk-accent krijgt.
 */
function TrendRegel({ trend, weken }: { trend: Trend; weken: number }) {
  if (weken < 2) {
    return (
      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-4)', lineHeight: 1.5 }}>
        Eén check-in gemeten — nog te weinig voor een trend.
      </p>
    )
  }

  const kaart = {
    stijgend: { Icoon: TrendingUp, kleur: 'var(--status-laag)', tekst: 'Je risico loopt op t.o.v. de vorige check-in.' },
    dalend: { Icoon: TrendingDown, kleur: 'var(--status-goed)', tekst: 'Je risico daalt t.o.v. de vorige check-in.' },
    stabiel: { Icoon: Minus, kleur: 'var(--text-4)', tekst: 'Je risico is stabiel t.o.v. de vorige check-in.' },
  }[trend]

  return (
    <p style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: 13, color: 'var(--text-2)' }}>
      <kaart.Icoon size={15} strokeWidth={2.4} aria-hidden="true" style={{ color: kaart.kleur, flex: 'none' }} />
      {kaart.tekst}
    </p>
  )
}

/**
 * De opgeslagen weken, oudste links. Balkjes op basis van het risico.
 *
 * Bewust géén lijn die gaten interpoleert: sloeg je een week over, dan staat die
 * week er niet — en dan mag er ook geen lijn doorheen die suggereert dat we
 * weten hoe het toen ging.
 */
function Historie({ weken }: { weken: RisicoWeek[] }) {
  const oudsteEerst = [...weken].reverse()

  return (
    <div>
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--text-4)',
          margin: '0 0 10px',
        }}
      >
        Gemeten check-ins
      </p>
      <ol
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gridAutoFlow: 'column',
          gridAutoColumns: 'minmax(0, 1fr)',
          gap: 5,
          alignItems: 'end',
          height: 48,
        }}
      >
        {oudsteEerst.map((week) => (
          <li
            key={week.weekStart}
            style={{ display: 'grid', alignItems: 'end', height: '100%' }}
            aria-label={`Week van ${week.weekStart}: risico ${week.risico} van 100`}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'block',
                // Minimaal 4% zodat een risico van 0 nog steeds een balkje is —
                // anders lijkt "gemeten, risico nul" op "niet gemeten".
                height: `${Math.max(4, week.risico)}%`,
                borderRadius: 3,
                background: risicoNiveau(week.risico).kleur,
                opacity: 0.85,
              }}
            />
          </li>
        ))}
      </ol>
    </div>
  )
}

function Skelet() {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gap: 14 }}>
      <div style={{ height: 40, width: '44%', borderRadius: 8, background: 'var(--bg-raised)' }} />
      <div style={{ height: 13, width: '68%', borderRadius: 4, background: 'var(--bg-raised)' }} />
      <div style={{ height: 48, width: '100%', borderRadius: 6, background: 'var(--bg-raised)' }} />
    </div>
  )
}
