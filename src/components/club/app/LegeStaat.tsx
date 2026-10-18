import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

// Een lege staat in de ledenapp: icoon in een zacht vlak, korte kop en een zin
// uitleg. Rustig en vriendelijk, nooit een kale grijze regel. Puur.

interface LegeStaatProps {
  Icoon: LucideIcon
  titel: string
  children: ReactNode
  /** Een fout in plaats van "nog niets": koraal accent en role="alert". */
  fout?: boolean
}

export function LegeStaat({ Icoon, titel, children, fout = false }: LegeStaatProps) {
  return (
    <div className={`club-lidapp-lege${fout ? ' club-lidapp-lege--fout' : ''}`} role={fout ? 'alert' : undefined}>
      <span className="club-lidapp-lege-icoon" aria-hidden>
        <Icoon size={24} strokeWidth={1.75} />
      </span>
      <strong>{titel}</strong>
      <p>{children}</p>
    </div>
  )
}
