'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { stuur } from '@/components/club/app/verzoek'

// Uitloggen in Profiel: dit toestel, of alle toestellen tegelijk (bijvoorbeeld
// na een kwijtgeraakte telefoon).

/**
 * Trainingen in uitvoering en nog niet verstuurde sets staan op het toestel.
 * Bij uitloggen gaan ze weg: zo komen ze nooit bij een volgend lid op hetzelfde
 * toestel terecht (AVG). Lukt de opslag niet (privevenster), dan is er niets.
 */
function wisToestelGegevens(): void {
  try {
    const sleutels = Array.from({ length: window.localStorage.length }, (_, i) => window.localStorage.key(i)).filter(
      (k): k is string => typeof k === 'string' && k.startsWith('club-training-'),
    )
    for (const k of sleutels) window.localStorage.removeItem(k)
  } catch {
    // Geen toegang tot de opslag: dan staat er ook niets.
  }
}

export function UitlogKnoppen() {
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)

  async function uit(overal: boolean) {
    if (overal && !window.confirm('Op alle toestellen uitloggen? Daarna log je overal opnieuw in met je pincode.')) return
    setBezig(true)
    setFout(null)
    const r = await stuur('/api/club/lid/uitloggen', 'POST', { overal })
    if (!r.ok && r.status !== 502) {
      setBezig(false)
      return setFout(r.fout)
    }
    wisToestelGegevens()
    window.location.replace('/mijn/inloggen')
  }

  return (
    <section className="club-mijn-uitlog" aria-labelledby="mijn-uitloggen">
      <h3 id="mijn-uitloggen">Uitloggen</h3>
      <p>Je blijft 90 dagen ingelogd op dit toestel. Uitloggen kan altijd.</p>
      {fout ? <p className="club-mijn-inlog-fout" role="alert">{fout}</p> : null}
      <button type="button" className="club-lidapp-knop club-lidapp-knop--breed" onClick={() => void uit(false)} disabled={bezig}>
        <LogOut size={18} aria-hidden /> Uitloggen op dit toestel
      </button>
      <button type="button" className="club-lidapp-tekstknop" onClick={() => void uit(true)} disabled={bezig}>
        Overal uitloggen
      </button>
    </section>
  )
}
