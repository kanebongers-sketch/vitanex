import { AygSymboolPaden } from './AygSymbool'

// Woordmerk: beeldmerk plus "AI Your Gym" in de kopletter (Bricolage Grotesque,
// smal en zwaar). De tekst volgt currentColor.

interface Props {
  opDonker?: boolean
  className?: string
}

export function AygLogo({ opDonker = false, className }: Props) {
  return (
    <svg viewBox="0 0 172 32" className={className} role="img" aria-label="AI Your Gym" focusable="false" overflow="visible">
      <title>AI Your Gym</title>
      <AygSymboolPaden opDonker={opDonker} />
      <text
        x="42"
        y="23"
        fill="currentColor"
        fontFamily="var(--ayg-font-kop)"
        fontSize="21"
        fontWeight="700"
        letterSpacing="-0.7"
        style={{ fontVariationSettings: "'wdth' 84, 'opsz' 32" }}
      >
        AI Your Gym
      </text>
    </svg>
  )
}
