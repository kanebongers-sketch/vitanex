import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Ring } from '@/components/ui/Ring'
import { scoreNiveau, type Wellbeing } from '@/lib/pijlers/score'

interface WellbeingHeroProps {
  /** Voluit: "Goedemorgen, Kane". */
  groet: string
  /** Reeds geformatteerde datum. */
  datum: string
  wellbeing: Wellbeing
}

/**
 * De slimme kop van Home: de overall Wellbeing Score in één oogopslag.
 * Eerlijk bij weinig data — toont "x/6 gemeten" en nooit een verzonnen getal.
 */
export function WellbeingHero({ groet, datum, wellbeing }: WellbeingHeroProps) {
  const { score, gemeten, totaal } = wellbeing
  const niveau = scoreNiveau(score)
  const heeftData = score !== null

  return (
    <section style={{ marginBottom: 24 }}>
      <p style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: 'var(--text-4)', margin: '0 0 6px',
      }}>
        {datum}
      </p>
      <h1 style={{
        fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 700, letterSpacing: '-0.03em',
        color: 'var(--text-1)', margin: '0 0 18px', lineHeight: 1.1,
      }}>
        {groet}
      </h1>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 22,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)',
        padding: '22px 24px',
      }}>
        <Ring
          value={score ?? 0}
          ariaLabel={heeftData ? `Wellbeing-score ${score} van 100 — ${niveau.label}` : 'Wellbeing-score: nog geen data'}
          size={132}
          thickness={11}
          color={heeftData ? niveau.kleur : 'var(--border-strong)'}
        >
          {heeftData ? (
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
              <span style={{ fontSize: 34, fontWeight: 700, color: niveau.kleur, letterSpacing: '-0.03em' }}>{score}</span>
              <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-4)', marginTop: 3 }}>/ 100</span>
            </span>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-4)', textAlign: 'center', padding: '0 10px' }}>Nog geen score</span>
          )}
        </Ring>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-4)', margin: '0 0 5px' }}>
            Wellbeing
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: heeftData ? niveau.kleur : 'var(--text-3)', margin: '0 0 8px' }}>
            {heeftData ? niveau.label : 'Begin met meten'}
          </p>
          {heeftData ? (
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0, lineHeight: 1.5 }}>
              {gemeten} van {totaal} pijlers gemeten deze week.
              {gemeten < totaal ? ' Meet de rest voor een completer beeld.' : ' Volledig beeld — mooi.'}
            </p>
          ) : (
            <Link href="/checkin" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600, color: 'var(--brand)', textDecoration: 'none',
            }}>
              Doe je eerste check-in <ChevronRight size={15} strokeWidth={2.2} aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
