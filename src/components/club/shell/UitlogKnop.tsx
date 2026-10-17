'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'

// Voor een eigenaar of clubmanager: dit toestel uitloggen. Kane logt uit via
// de PT-app, dus voor Kane staat hier de link terug naar de PT-app.

export function UitlogKnop() {
  const [bezig, setBezig] = useState(false)

  async function uitloggen() {
    if (bezig) return
    setBezig(true)
    await stuur('/api/club/uitloggen', 'POST')
    // Ook als het verzoek mislukte: weg van Club; zonder sessie is het een 404.
    window.location.assign('/')
  }

  return (
    <button type="button" className="club-terug" onClick={() => void uitloggen()} disabled={bezig}>
      <LogOut aria-hidden size={15} />
      <span>{bezig ? 'Uitloggen...' : 'Uitloggen'}</span>
    </button>
  )
}
