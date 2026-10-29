'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TERMIJN_VELDEN, keuzesVoor, maandenTekst, type Termijnen } from '@/lib/club/privacy/termijnen'
import { stuur } from '@/components/club/leden/stuur'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { BEHEER } from '@/lib/aiyourgym/taal/woorden/club/beheer'

// De bewaartermijnen die de sportschool zelf kiest. Elke nacht past Club ze
// toe (club_privacy_opruimen); demodata valt erbuiten.

function gelijk(a: Termijnen, b: Termijnen): boolean {
  return TERMIJN_VELDEN.every((v) => a[v] === b[v])
}

export function PrivacyTermijnenFormulier({ begin }: { begin: Termijnen }) {
  const router = useRouter()
  const [termijnen, setTermijnen] = useState<Termijnen>(begin)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)
  const taal = useTaal()
  const tekst = useTekst(BEHEER)

  async function bewaar() {
    setBezig(true)
    setMelding(null)
    const uit = await stuur('/api/club/privacy', 'PATCH', termijnen)
    setBezig(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    setMelding({ ok: true, tekst: tekst.privacy.opgeslagen })
    router.refresh()
  }

  return (
    <div className="club-beheer-formulier">
      {TERMIJN_VELDEN.map((veld) => {
        const id = `privacy-${veld}`
        return (
          <div key={veld} className="club-privacy-termijn">
            <div className="club-veld">
              <label htmlFor={id}><span className="club-label">{tekst.privacy.velden[veld].titel}</span></label>
              <p id={`${id}-uitleg`} className="club-hint">{tekst.privacy.velden[veld].uitleg}</p>
            </div>
            <select
              id={id}
              className="club-invoer club-privacy-keuze"
              aria-describedby={`${id}-uitleg`}
              value={termijnen[veld]}
              onChange={(e) => setTermijnen({ ...termijnen, [veld]: Number(e.target.value) })}
            >
              {keuzesVoor(veld, termijnen[veld]).map((m) => (
                <option key={m} value={m}>{maandenTekst(m, taal)}</option>
              ))}
            </select>
          </div>
        )
      })}

      <div className="club-beheer-acties">
        <button type="button" className="club-knop club-knop--primair" disabled={bezig || gelijk(termijnen, begin)} onClick={() => void bewaar()}>
          {bezig ? tekst.algemeen.bezig : tekst.algemeen.opslaan}
        </button>
        <div role="status" aria-live="polite">
          {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
        </div>
      </div>
    </div>
  )
}
