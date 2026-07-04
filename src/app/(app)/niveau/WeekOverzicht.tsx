// ─── Weekoverzicht — het rustige startpunt van de voortgangspagina ────────────
// Toont deze week zoals die echt was: actieve dagen (ma–zo), een zachte
// consistentiebalk, een nuchtere week-op-week-zin en de status van de
// wekelijkse check-in. Alles komt uit de al geladen XP-history.

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import SectieKop from './SectieKop'
import { momentumTekst, type WeekActiviteit, type WeekOverzichtData } from './voortgang'

interface WeekOverzichtProps {
  data: WeekOverzichtData
  weken: WeekActiviteit[]
  /** Waarden pas vullen ná eerste paint, zodat balken zacht inlopen. */
  animKlaar: boolean
}

const WEEK_LABELS = ['3 wkn terug', '2 wkn terug', 'vorige week', 'deze week']

function DagStip({ label, actief, isVandaag, inToekomst }: WeekOverzichtData['dagen'][number]) {
  const rand = actief
    ? 'var(--mentaforce-primary)'
    : inToekomst ? 'var(--border)' : 'var(--border-strong)'
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
      opacity: inToekomst ? 0.45 : 1, minWidth: 0,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: actief ? 'var(--mentaforce-primary)' : 'transparent',
        border: `1.5px solid ${rand}`,
        boxShadow: isVandaag ? '0 0 0 3px color-mix(in srgb, var(--mentaforce-primary) 25%, transparent)' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--bg-app)',
      }}>
        {actief && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span style={{
        fontSize: 10, fontWeight: isVandaag ? 700 : 600,
        color: isVandaag ? 'var(--mentaforce-primary)' : 'var(--text-4)',
      }}>
        {label}
      </span>
    </div>
  )
}

function WekenMiniBalk({ weken, animKlaar }: { weken: WeekActiviteit[]; animKlaar: boolean }) {
  const beschrijving = weken
    .map((w, i) => `${WEEK_LABELS[i] ?? w.start}: ${w.actieveDagen}`)
    .join(', ')
  return (
    <div>
      <p className="sr-only">Actieve dagen per week — {beschrijving}</p>
      <div aria-hidden="true" style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
        {weken.map((w, i) => {
          const isNu = i === weken.length - 1
          return (
            <div key={w.start} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                color: isNu ? 'var(--mentaforce-primary)' : 'var(--text-4)',
              }}>
                {w.actieveDagen}
              </span>
              <div style={{
                width: 18, height: 30, borderRadius: 5, overflow: 'hidden',
                background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'flex-end',
              }}>
                <div className="nv-week-vul" style={{
                  width: '100%', height: '100%',
                  background: isNu
                    ? 'var(--mentaforce-primary)'
                    : 'color-mix(in srgb, var(--mentaforce-primary) 45%, transparent)',
                  transformOrigin: 'bottom center',
                  transform: `scaleY(${animKlaar ? w.actieveDagen / 7 : 0})`,
                }} />
              </div>
            </div>
          )
        })}
      </div>
      <style>{balkStijl}</style>
    </div>
  )
}

const balkStijl = `
.nv-week-vul { transition: transform 0.4s var(--ease); }
@media (prefers-reduced-motion: reduce) {
  .nv-week-vul { transition: none; }
}
`

export default function WeekOverzicht({ data, weken, animKlaar }: WeekOverzichtProps) {
  const { dagen, actieveDagen, vorigeWeekActieveDagen, checkinDezeWeek } = data
  const heeftOoitActiviteit = weken.some(w => w.actieveDagen > 0) || actieveDagen > 0
  const dagenTekst = dagen.filter(d => d.actief).map(d => d.label).join(', ')

  return (
    <Card style={{ padding: '22px 24px', marginBottom: 16 }}>
      <SectieKop>Deze week</SectieKop>

      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 300px', minWidth: 260 }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
            {actieveDagen} van de 7 dagen actief
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3, marginBottom: 16 }}>
            {momentumTekst(actieveDagen, vorigeWeekActieveDagen)}
          </p>

          <div
            role="img"
            aria-label={actieveDagen > 0
              ? `Actieve dagen deze week: ${dagenTekst}`
              : 'Nog geen actieve dagen deze week'}
            style={{ display: 'flex', gap: 10, marginBottom: 14 }}
          >
            {dagen.map(dag => <DagStip key={dag.datum} {...dag} />)}
          </div>

          <Progress
            value={animKlaar ? (actieveDagen / 7) * 100 : 0}
            ariaLabel={`Weekconsistentie: ${actieveDagen} van de 7 dagen`}
            thickness={6}
          />
          <p style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 6 }}>
            Een dag telt als actief zodra je iets logt: een check-in, doel of mijlpaal.
          </p>
        </div>

        {heeftOoitActiviteit && (
          <div style={{ flexShrink: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: 8 }}>
              Laatste 4 weken
            </p>
            <WekenMiniBalk weken={weken} animKlaar={animKlaar} />
          </div>
        )}
      </div>

      {/* Check-in status — feitelijk, zonder druk */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        borderTop: '1px solid var(--border)', marginTop: 18, paddingTop: 14,
      }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          style={{ color: checkinDezeWeek ? 'var(--mf-green)' : 'var(--text-4)', flexShrink: 0 }}>
          {checkinDezeWeek
            ? <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>
            : <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>}
        </svg>
        <p style={{ flex: 1, fontSize: 12, color: 'var(--text-2)', minWidth: 0 }}>
          {checkinDezeWeek
            ? 'Je wekelijkse check-in staat — die is voor deze week gedaan.'
            : 'Je wekelijkse check-in staat nog open voor deze week.'}
        </p>
        {!checkinDezeWeek && (
          <Link href="/checkin" className="nv-cta" style={{
            flexShrink: 0, fontSize: 11, fontWeight: 700, textDecoration: 'none',
            color: 'var(--text-1)', border: '1px solid var(--border-strong)',
            borderRadius: 8, padding: '5px 11px', whiteSpace: 'nowrap',
          }}>
            Check-in doen
          </Link>
        )}
      </div>
    </Card>
  )
}
