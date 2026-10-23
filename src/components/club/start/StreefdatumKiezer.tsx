'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'

// Optioneel: wanneer wil je live? De eigenaar kiest een datum in stap 1 of op
// de laatste stap; de kaart op Vandaag toont daarna "Live op 1 november, nog
// 3 stappen". Richting zonder druk: leeg laten mag, weghalen ook.

interface StreefdatumKiezerProps {
  /** De gekozen datum (YYYY-MM-DD) of null. */
  huidig: string | null
  /** Vandaag (YYYY-MM-DD), de vroegste datum die je kunt kiezen. */
  vandaag: string
  /** Kort: "Live op 1 november, nog 3 stappen". */
  stand: string | null
}

export function StreefdatumKiezer({ huidig, vandaag, stand }: StreefdatumKiezerProps) {
  const router = useRouter()
  const [datum, setDatum] = useState(huidig ?? '')
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)

  async function bewaar(waarde: string | null) {
    setBezig(true)
    setMelding(null)
    const uit = await stuur('/api/club/start', 'PATCH', { streefdatum: waarde })
    setBezig(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    setMelding({ ok: true, tekst: waarde ? 'Streefdatum bewaard.' : 'Streefdatum weggehaald.' })
    if (!waarde) setDatum('')
    router.refresh()
  }

  function opslaan(e: FormEvent) {
    e.preventDefault()
    void bewaar(datum || null)
  }

  return (
    <section className="club-start-streef" aria-labelledby="start-streef-kop">
      <h2 id="start-streef-kop">Wanneer wil je live?</h2>
      <p>Kies een datum als je dat prettig vindt. Op Vandaag zie je dan hoeveel dagen en stappen er nog zijn. Niet verplicht.</p>
      {stand && <p className="club-start-streef-stand">{stand}</p>}
      <form className="club-start-streef-rij" onSubmit={opslaan}>
        <label className="sr-only" htmlFor="start-streefdatum">Streefdatum voor livegang</label>
        <input id="start-streefdatum" className="club-invoer" type="date" min={vandaag} max="2100-12-31" value={datum} onChange={(e) => setDatum(e.target.value)} />
        <button type="submit" className="club-knop" disabled={bezig || datum === (huidig ?? '')}>
          <CalendarDays aria-hidden size={16} /> {bezig ? 'Bezig...' : 'Bewaren'}
        </button>
        {huidig && (
          <button type="button" className="club-knop club-knop--stil" disabled={bezig} onClick={() => void bewaar(null)}>
            Weghalen
          </button>
        )}
      </form>
      <div aria-live="polite">
        {melding && (
          <p className={`club-melding${melding.ok ? ' club-melding--ok' : ' club-melding--fout'}`} role={melding.ok ? 'status' : 'alert'}>
            {melding.tekst}
          </p>
        )}
      </div>
    </section>
  )
}
