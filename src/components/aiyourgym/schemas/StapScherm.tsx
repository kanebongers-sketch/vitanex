'use client'

import { useId, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { SCHEMA_SCHERMEN } from '@/lib/aiyourgym/taal/woorden/website/schemas'

// Het scherm bij een stap op /trainingsschemas. Op de telefoon ingeklapt achter
// een knop, zodat de pagina kort blijft (de oefening zelf staat al bovenaan in
// de demo); vanaf 768px staat het scherm er altijd, zonder knop (schemas.css).

interface StapSchermProps {
  /** Waar het scherm over gaat, al in de taal van de pagina: "het intakescherm". */
  naam: string
  children: ReactNode
}

export function StapScherm({ naam, children }: StapSchermProps) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const t = useTekst(SCHEMA_SCHERMEN).stap
  return (
    <div className="ayg-ss-scherm" data-open={open ? '' : undefined}>
      <button type="button" className="ayg-ss-scherm-knop" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <span>{open ? t.verberg(naam) : t.bekijk(naam)}</span>
        <ChevronDown size={18} aria-hidden />
      </button>
      <div id={id} className="ayg-ss-scherm-inhoud">
        {children}
      </div>
    </div>
  )
}
