// ─── Voeding — ringen & badges ──────────────────────────────────────────────
// Pure presentatie-componenten (SVG), geëxtraheerd uit de voeding-pagina.
// Props in → UI uit, geen state. Kleur-tokens uit het thema, nooit hardcoded hex.

export function CalorieRing({ gegeten, doel, kleur }: { gegeten: number; doel: number; kleur: string }) {
  const r = 70, circ = 2 * Math.PI * r
  const pct = Math.min(1, gegeten / doel)
  const over = gegeten > doel
  const ariaLabel = over
    ? `${gegeten} van ${doel} kcal gegeten, ${gegeten - doel} kcal over het doel`
    : `${gegeten} van ${doel} kcal gegeten, ${doel - gegeten} kcal resterend`
  return (
    <svg width="180" height="180" viewBox="0 0 180 180" style={{ display: 'block' }} role="img" aria-label={ariaLabel}>
      <circle cx="90" cy="90" r={r} fill="none" style={{ stroke: 'var(--bg-subtle)' }} strokeWidth="12" />
      <circle cx="90" cy="90" r={r} fill="none"
        style={{ stroke: over ? 'var(--mf-red)' : kleur, transition: 'stroke-dasharray 1s ease' }} strokeWidth="12"
        strokeDasharray={`${pct * circ} ${circ}`}
        strokeLinecap="round" transform="rotate(-90 90 90)" />
      <text x="90" y="82" textAnchor="middle" fontSize="28" fontWeight="900" style={{ fill: over ? 'var(--mf-red)' : 'var(--text-1)' }}>{gegeten}</text>
      <text x="90" y="100" textAnchor="middle" fontSize="12" style={{ fill: 'var(--text-4)' }} fontWeight="600">kcal</text>
      <text x="90" y="116" textAnchor="middle" fontSize="11" style={{ fill: over ? 'var(--mf-red)' : 'var(--mf-green)' }} fontWeight="700">
        {over ? `+${gegeten - doel} over` : `${doel - gegeten} resterend`}
      </text>
    </svg>
  )
}

export function MacroRing({ waarde, max, kleur, label, eenheid }: { waarde: number; max: number; kleur: string; label: string; eenheid: string }) {
  const r = 26, circ = 2 * Math.PI * r
  const pct = Math.min(1, waarde / max)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width="68" height="68" viewBox="0 0 68 68" role="img" aria-label={`${label}: ${waarde.toFixed(0)}${eenheid} van ${max.toFixed(0)}${eenheid}`}>
        <circle cx="34" cy="34" r={r} fill="none" style={{ stroke: 'var(--bg-subtle)' }} strokeWidth="6" />
        <circle cx="34" cy="34" r={r} fill="none" style={{ stroke: kleur, transition: 'stroke-dasharray 1s ease' }} strokeWidth="6"
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 34 34)" />
        <text x="34" y="37" textAnchor="middle" fontSize="11" fontWeight="800" style={{ fill: kleur }}>{waarde.toFixed(0)}{eenheid}</text>
      </svg>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)' }}>{label}</span>
    </div>
  )
}

export function RdiBalk({ label, waarde, eenheid, rdi, kleur = 'var(--mentaforce-primary)', sub = false }: {
  label: string; waarde: number; eenheid: string; rdi: number; kleur?: string; sub?: boolean
}) {
  const pctRaw = Math.round((waarde / rdi) * 100)
  const pct = Math.min(100, pctRaw)
  const overRdi = pctRaw > 100
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: sub ? 'var(--text-4)' : 'var(--text-2)', fontWeight: sub ? 400 : 600 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: sub ? 'var(--text-4)' : 'var(--text-2)' }}>{waarde.toFixed(1)} {eenheid}</span>
          <span style={{
            fontSize: 10, fontWeight: 800, borderRadius: 20, padding: '2px 7px',
            background: overRdi ? 'var(--mf-red-light)' : pct >= 50 ? 'var(--mf-green-light)' : 'var(--mf-amber-light)',
            color: overRdi ? 'var(--mf-red)' : pct >= 50 ? 'var(--mentaforce-primary)' : 'var(--mf-amber)',
          }}>{pctRaw}%</span>
        </div>
      </div>
      <div role="img" aria-label={`${label}: ${waarde.toFixed(1)} ${eenheid}, ${pctRaw}% van de dagelijkse behoefte`}
        style={{ height: 4, borderRadius: 9999, background: 'var(--bg-subtle)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 9999, width: '100%',
          transform: `scaleX(${Math.min(100, pct) / 100})`,
          transformOrigin: 'left center',
          background: overRdi ? 'var(--mf-red)' : kleur,
          transition: 'transform 0.8s var(--ease)',
        }} />
      </div>
    </div>
  )
}

export function GezondheidBadge({ score }: { score: number }) {
  const kleur = score >= 7 ? 'var(--mf-green)' : score >= 4 ? 'var(--mf-amber)' : 'var(--mf-red)'
  const bg    = score >= 7 ? 'var(--mf-green-light)' : score >= 4 ? 'var(--mf-amber-light)' : 'var(--mf-red-light)'
  const label = score >= 7 ? 'Gezond' : score >= 4 ? 'Matig' : 'Ongezond'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, color: kleur, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
      {score}/10 · {label}
    </span>
  )
}
