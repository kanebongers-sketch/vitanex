'use client'

import { useEffect } from 'react'
import { registreerAlsToegestaan } from '@/lib/push/client'

// Registreert bij het opstarten stil het apparaat-token — maar alléén als de
// gebruiker eerder al toestemming gaf. Zo verschijnt er nooit een ongevraagde
// systeem-pop-up; het aanvragen gebeurt bewust vanuit de instellingen.
export default function PushRegistration() {
  useEffect(() => {
    void registreerAlsToegestaan()
  }, [])
  return null
}
