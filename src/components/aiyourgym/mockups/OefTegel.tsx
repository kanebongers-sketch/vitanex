// Een klein vierkant met de beginletters van een oefening, voor lijsten in de
// productbeelden (schema, editor, ledenapp). Een 3D-doek per regel is te zwaar;
// het grote 3D-beeld staat bij de geopende oefening.

const VULWOORDEN = new Set(['met', 'op', 'de', 'het', 'een'])

/** "Roemeense deadlift met dumbbells" wordt "RD". */
export function beginletters(naam: string): string {
  return naam
    .split(/\s+/)
    .filter((w) => w && !VULWOORDEN.has(w.toLowerCase()))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

interface OefTegelProps {
  naam: string
  /** Breedte en hoogte in pixels; zonder maat bepaalt de CSS het formaat. */
  maat?: number
  className?: string
}

export function OefTegel({ naam, maat, className }: OefTegelProps) {
  return (
    <span
      className={className ? `aygm-oef-tegel ${className}` : 'aygm-oef-tegel'}
      style={maat ? { width: maat, height: maat, fontSize: Math.max(10, Math.round(maat * 0.3)) } : undefined}
      aria-hidden
    >
      {beginletters(naam)}
    </span>
  )
}
