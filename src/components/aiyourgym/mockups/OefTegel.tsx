import { renderVoor } from '@/components/aiyourgym/inhoud/oefenrenders'

// Een klein vierkant bij een oefening in lijsten van de productbeelden (schema,
// editor, ledenapp). Heeft de oefening een eigen render, dan het stilstaande
// kleine beginbeeld daarvan (480 px, 10 tot 21 KB, pas geladen als het in beeld komt); anders de
// beginletters. Een 3D-doek per regel is te zwaar; het bewegende beeld staat bij
// de geopende oefening.

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
  const render = renderVoor(naam)
  if (render) {
    const b = render.beginKlein
    return (
      <span
        className={className ? `aygm-oef-tegel aygm-oef-tegel--beeld ${className}` : 'aygm-oef-tegel aygm-oef-tegel--beeld'}
        style={maat ? { width: maat, height: maat } : undefined}
        aria-hidden
      >
        <img src={b.src} width={b.breedte} height={b.hoogte} alt="" loading="lazy" decoding="async" />
      </span>
    )
  }
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
