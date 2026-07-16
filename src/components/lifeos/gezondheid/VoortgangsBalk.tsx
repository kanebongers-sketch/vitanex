import type { CSSProperties } from 'react'

// Eén voortgangsbalk: gelogd vs doel. Bewust eerlijk over "geen doel":
//
//   doel === null  → geen balk, geen verzonnen 0%. We tonen het gelogde getal en
//                    zeggen dat er nog geen doel is (een profiel dat leeg is mag
//                    geen 0/0-balk worden die op een meting lijkt).
//   doel > 0       → een balk, gevuld op basis van gelogd/doel.
//
// De vulling animeert via `transform: scaleX` (compositor-vriendelijk), nooit via
// `width` — dat zou layout per frame triggeren. Overschrijd je het doel, dan
// blijft de balk op 100% maar kleurt hij waarschuwend; de echte getallen staan
// er altijd bij, dus we verbergen niets.

interface VoortgangsBalkProps {
  label: string
  gelogd: number
  doel: number | null
  eenheid: string
  /** Kleur van de vulling bij normale voortgang. Default: het merk-accent. */
  kleur?: string
}

export function VoortgangsBalk({ label, gelogd, doel, eenheid, kleur = 'var(--brand)' }: VoortgangsBalkProps) {
  const heeftDoel = doel !== null && doel > 0
  const over = heeftDoel && gelogd > (doel as number)
  const fractie = heeftDoel ? Math.min(1, gelogd / (doel as number)) : 0
  const pct = Math.round(fractie * 100)
  const vulKleur = over ? 'var(--status-warning)' : kleur

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>
        <span className="os-cijfer" style={{ fontSize: 13, color: 'var(--text-3)', flex: 'none' }}>
          <span style={{ color: 'var(--text-1)', fontWeight: 500 }}>{Math.round(gelogd)}</span>
          {heeftDoel ? ` / ${Math.round(doel as number)} ${eenheid}` : ` ${eenheid}`}
        </span>
      </div>

      {heeftDoel ? (
        <div
          style={SPOOR}
          role="progressbar"
          aria-valuenow={Math.round(gelogd)}
          aria-valuemin={0}
          aria-valuemax={Math.round(doel as number)}
          aria-label={`${label}: ${Math.round(gelogd)} van ${Math.round(doel as number)} ${eenheid}${over ? ' — boven doel' : ''}`}
        >
          <div
            style={{
              ...VULLING,
              background: vulKleur,
              transform: `scaleX(${fractie})`,
            }}
          />
        </div>
      ) : (
        // Geen doel ingesteld — geen balk, wél duidelijkheid. Vul je profiel aan
        // in MentaForce, dan verschijnt hier een doel om tegen af te zetten.
        <span style={{ fontSize: 11, color: 'var(--text-4)' }}>Nog geen doel ingesteld</span>
      )}

      {over ? (
        <span style={{ fontSize: 11, color: 'var(--status-warning)' }}>
          {Math.round(gelogd - (doel as number))} {eenheid} boven je doel
        </span>
      ) : null}
    </div>
  )
}

const SPOOR: CSSProperties = {
  height: 7,
  borderRadius: 999,
  background: 'var(--bg-raised)',
  overflow: 'hidden',
}

const VULLING: CSSProperties = {
  height: '100%',
  width: '100%',
  borderRadius: 999,
  transformOrigin: 'left center',
  transition: 'transform 320ms var(--ease)',
}
