// Het volgnummer van een oefening in de lijsten van de productbeelden (schema,
// editor, ledenapp, demo). Oefenbeelden staan alleen achter het inloggen
// (besluit Kane 27-10-2026); op de website staat hier het nummer in de volgorde
// van het schema, in de kleur van de sportschool.

interface OefNrProps {
  nr: number
  /** Breedte en hoogte in pixels; zonder maat bepaalt de CSS het formaat. */
  maat?: number
  className?: string
}

export function OefNr({ nr, maat, className }: OefNrProps) {
  return (
    <span
      className={className ? `aygm-oef-nr ${className}` : 'aygm-oef-nr'}
      style={maat ? { width: maat, height: maat, fontSize: Math.max(11, Math.round(maat * 0.36)) } : undefined}
      aria-hidden
    >
      {nr}
    </span>
  )
}
