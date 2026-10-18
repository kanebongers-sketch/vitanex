'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { stuur } from '@/components/club/app/verzoek'

// Uitloggen in Profiel: dit toestel, of alle toestellen tegelijk (bijvoorbeeld
// na een kwijtgeraakte telefoon).

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
