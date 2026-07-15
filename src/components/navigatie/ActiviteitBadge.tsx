import { getActiviteit, type ActiviteitKey } from '@/lib/navigatie/activiteiten'
import { ACTIVITEIT_ICOON } from './iconen'

interface ActiviteitBadgeProps {
  activiteit: ActiviteitKey
}

/**
 * Overline-badge boven de titel van een loggings-pagina. Presentational en puur.
 *
 * Was vijf keer gekopieerd met per pagina een eigen kleur uit een regenboog-
 * palet. Nu één component, één merkkleur: cyaan draagt hier geen betekenis
 * (het onderscheid zit in het icoon + het woord), dus zes kleuren waren zowel
 * merk-inbreuk (ui.md) als een toegankelijkheidsval.
 */
export function ActiviteitBadge({ activiteit }: ActiviteitBadgeProps) {
  const { label } = getActiviteit(activiteit)
  const Icon = ACTIVITEIT_ICOON[activiteit]

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <Icon size={13} strokeWidth={2.4} color="var(--brand)" aria-hidden />
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--brand)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}>
        {label}
      </span>
    </span>
  )
}
