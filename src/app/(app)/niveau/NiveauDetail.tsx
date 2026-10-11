// ─── Niveau & XP — de stille onderstroom ──────────────────────────────────────
// Het niveau-detail is bewust gedempt: een compacte ring, één voortgangsbalk,
// feitelijke tellers en een slanke 10-staps strip in plaats van een grote
// game-ladder. XP blijft bestaan als bekrachtiging, niet als hoofdattractie.

import { Card } from '@/components/ui/Card'
import { LEVEL_BG, LEVEL_KLEUREN, type XPData } from '@/lib/xp/xp'
import { Progress } from '@/components/ui/Progress'
import { useVertaling } from '@/lib/i18n/TaalProvider'
import { INTL_LOCALE } from '@/lib/i18n/talen'
import SectieKop from './SectieKop'
import { levelNaam } from './xpTeksten'

interface NiveauDetailProps {
  xpData: XPData
  level: number
  voortgang: { inLevel: number; levelBreedte: number; pct: number; nodig: number }
  /** Waarden pas vullen ná eerste paint, zodat ring en balk zacht inlopen. */
  animKlaar: boolean
}

function NiveauRing({ level, pct, kleur, animKlaar }: { level: number; pct: number; kleur: string; animKlaar: boolean }) {
  const size = 116
  const r = 48
  const circ = 2 * Math.PI * r
  const getoond = animKlaar ? pct : 0
  const { t } = useVertaling()
  return (
    <div
      role="img"
      aria-label={t('voortgang.niveauDetail.ringLabel', { level, naam: levelNaam(level, t), pct: Math.round(pct) })}
      style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false"
        style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
        {/* var() werkt niet in SVG-presentatie-attributen (fill/stroke) — daarom via style. */}
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="8"
          style={{ fill: LEVEL_BG[level] ?? 'var(--bg-subtle)', stroke: 'var(--border)' }} />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="8"
          className="nv-ring-fill"
          strokeLinecap="round" strokeDasharray={`${circ}`}
          strokeDashoffset={`${circ * (1 - getoond / 100)}`}
          style={{ fill: 'none', stroke: kleur }} />
      </svg>
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 1,
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: kleur, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {t('voortgang.niveauDetail.niveau')}
        </span>
        <span style={{ fontSize: 32, fontWeight: 800, color: kleur, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
          {level}
        </span>
      </div>
      <style>{ringStijl}</style>
    </div>
  )
}

function NiveauStrip({ level }: { level: number }) {
  const kleur = LEVEL_KLEUREN[level]
  const { t } = useVertaling()
  return (
    <div style={{ marginTop: 16 }}>
      <div
        role="img"
        aria-label={t('voortgang.niveauDetail.vanTien', { level })}
        style={{ display: 'flex', gap: 3 }}
      >
        {Array.from({ length: 10 }, (_, i) => i + 1).map(l => (
          <div key={l} aria-hidden="true" style={{
            flex: 1, height: 6, borderRadius: 3,
            background: l < level
              ? `color-mix(in srgb, ${kleur} 45%, transparent)`
              : l === level ? kleur : 'var(--bg-subtle)',
            border: l > level ? '1px solid var(--border)' : 'none',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontSize: 10, color: 'var(--text-4)', fontVariantNumeric: 'tabular-nums' }}>
          {t('voortgang.niveauDetail.vanTien', { level })}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-4)' }}>{levelNaam(10, t)}</span>
      </div>
    </div>
  )
}

export default function NiveauDetail({ xpData, level, voortgang, animKlaar }: NiveauDetailProps) {
  const { t, taal } = useVertaling()
  const locale = INTL_LOCALE[taal]
  const kleur = LEVEL_KLEUREN[level]
  const isMax = level >= 10
  const tellers = [
    { label: t('voortgang.niveauDetail.checkins'), waarde: xpData.checkinCount },
    { label: t('voortgang.niveauDetail.doelenBehaald'), waarde: xpData.goalsCompleted },
    { label: t('voortgang.niveauDetail.langsteReeks'), waarde: t('voortgang.niveauDetail.dagenKort', { n: xpData.streakRecord ?? 0 }) },
  ]

  return (
    <Card style={{ padding: '22px 24px', marginBottom: 16 }}>
      <SectieKop>{t('voortgang.niveauDetail.kop')}</SectieKop>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <NiveauRing level={level} pct={isMax ? 100 : voortgang.pct} kleur={kleur} animKlaar={animKlaar} />

        <div style={{ flex: 1, minWidth: 220 }}>
          <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            {levelNaam(level, t)}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1, marginBottom: 12, fontVariantNumeric: 'tabular-nums' }}>
            {t('voortgang.niveauDetail.xpTotaal', { xp: xpData.xp.toLocaleString(locale) })}
          </p>

          <Progress
            value={animKlaar ? (isMax ? 100 : voortgang.pct) : 0}
            ariaLabel={isMax ? t('voortgang.niveauDetail.maxBereikt') : t('voortgang.niveauDetail.voortgangLabel', { level: level + 1, pct: voortgang.pct })}
            color={kleur}
            thickness={8}
            style={{ marginBottom: 8 }}
          />
          <p style={{ fontSize: 12, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
            {isMax
              ? t('voortgang.niveauDetail.hoogste')
              : t('voortgang.niveauDetail.nogNodig', { xp: voortgang.nodig.toLocaleString(locale), level: level + 1, naam: levelNaam(level + 1, t) })}
          </p>

          <div style={{ display: 'flex', gap: 24, marginTop: 14 }}>
            {tellers.map(teller => (
              <div key={teller.label}>
                <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>
                  {teller.waarde}
                </p>
                <p style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 600 }}>{teller.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <NiveauStrip level={level} />
    </Card>
  )
}

const ringStijl = `
.nv-ring-fill { transition: stroke-dashoffset 0.4s var(--ease); }
@media (prefers-reduced-motion: reduce) {
  .nv-ring-fill { transition: none; }
}
`
