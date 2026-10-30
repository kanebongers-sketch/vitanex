'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { START } from '@/lib/aiyourgym/taal/woorden/club/start'

// Optioneel: wanneer wil je live? De eigenaar kiest een datum in de eerste stap (Huisstijl) of op
// de laatste stap; de kaart op Vandaag toont daarna "Live op 1 november, nog
// 3 stappen". Richting zonder druk: leeg laten mag, weghalen ook (veld leeg
// maken). Geen eigen opslaanknop: de datum wordt vanzelf bewaard zodra hij
// compleet is, met een kleine "Bewaard" ernaast.

interface StreefdatumKiezerProps {
  /** De gekozen datum (YYYY-MM-DD) of null. */
  huidig: string | null
  /** Vandaag (YYYY-MM-DD), de vroegste datum die je kunt kiezen. */
  vandaag: string
  /** Kort: "Live op 1 november, nog 3 stappen". */
  stand: string | null
}

type Stand = 'rust' | 'bezig' | 'bewaard' | { fout: string }

const WACHT_MS = 500

export function StreefdatumKiezer({ huidig, vandaag, stand }: StreefdatumKiezerProps) {
  const router = useRouter()
  const [datum, setDatum] = useState(huidig ?? '')
  const [opslag, setOpslag] = useState<Stand>('rust')
  const bewaard = useRef(huidig ?? '')
  const t = useTekst(START).streef

  useEffect(() => {
    if (datum === bewaard.current) return
    const klok = window.setTimeout(async () => {
      setOpslag('bezig')
      const uit = await stuur('/api/club/start', 'PATCH', { streefdatum: datum || null })
      if (!uit.ok) return setOpslag({ fout: uit.fout })
      bewaard.current = datum
      setOpslag('bewaard')
      router.refresh()
    }, WACHT_MS)
    return () => window.clearTimeout(klok)
  }, [datum, router])

  return (
    <section className="club-start-streef" aria-labelledby="start-streef-kop">
      <h2 id="start-streef-kop">{t.kop}</h2>
      <p>{t.uitleg}</p>
      {stand && <p className="club-start-streef-stand">{stand}</p>}
      <div className="club-start-streef-rij">
        <label className="sr-only" htmlFor="start-streefdatum">{t.label}</label>
        <input
          id="start-streefdatum"
          className="club-invoer"
          type="date"
          min={vandaag}
          max="2100-12-31"
          value={datum}
          onChange={(e) => {
            setOpslag('rust')
            setDatum(e.target.value)
          }}
        />
        <span className="club-start-bewaard" aria-live="polite">
          {opslag === 'bezig' && t.bewaren}
          {opslag === 'bewaard' && (
            <>
              <Check aria-hidden size={14} strokeWidth={3} /> {datum ? t.bewaard : t.weggehaald}
            </>
          )}
        </span>
      </div>
      {typeof opslag === 'object' && (
        <p className="club-melding club-melding--fout" role="alert">
          {opslag.fout}
        </p>
      )}
    </section>
  )
}
