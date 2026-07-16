import {
  Clock,
  Moon,
  CalendarClock,
  ListChecks,
  Footprints,
  type LucideIcon,
} from 'lucide-react'
import type { Signaal, SignaalSoort } from '@/lib/lifeos/vita/signalen'

// Puur presentational: props in → UI uit. Geen fetch, geen state. Zo blijft de
// staat-logica op één plek (VitaKaart) en is deze regel los te bekijken.

const ICONEN: Readonly<Record<SignaalSoort, LucideIcon>> = {
  'afspraak-nabij': Clock,
  'korte-slaap-training': Moon,
  'volle-dag-training': CalendarClock,
  'top3-open': ListChecks,
  'geen-beweging': Footprints,
}

interface SignaalRegelProps {
  signaal: Signaal
  /**
   * Het urgentste signaal draagt de kaart en krijgt schaal en accent; de rest
   * ondersteunt. Drie regels op precies dezelfde toon is een lijst, geen advies.
   */
  lead?: boolean
}

export function SignaalRegel({ signaal, lead = false }: SignaalRegelProps) {
  const Icoon = ICONEN[signaal.soort]

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: lead ? 13 : 11,
        // Ritme, geen uniforme padding: de lead ademt, de rest sluit aan.
        padding: lead ? '0 0 16px' : '9px 0 0',
        borderBottom: lead ? '1px solid var(--line)' : undefined,
        marginBottom: lead ? 4 : 0,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'grid',
          placeItems: 'center',
          flex: 'none',
          width: lead ? 30 : 22,
          height: lead ? 30 : 22,
          borderRadius: 8,
          // Accent alleen op de lead: cyaan is geen vlakvuller.
          background: lead ? 'var(--brand-soft)' : 'transparent',
          border: lead ? '1px solid var(--brand)' : '1px solid var(--line)',
          color: lead ? 'var(--brand)' : 'var(--text-4)',
          marginTop: lead ? 1 : 0,
        }}
      >
        <Icoon size={lead ? 15 : 12} strokeWidth={2.1} />
      </span>

      <p
        style={{
          margin: 0,
          fontSize: lead ? 16 : 13,
          lineHeight: lead ? 1.45 : 1.5,
          letterSpacing: lead ? '-0.01em' : undefined,
          fontWeight: lead ? 500 : 400,
          color: lead ? 'var(--text-1)' : 'var(--text-3)',
        }}
      >
        {signaal.tekst}
      </p>
    </li>
  )
}
