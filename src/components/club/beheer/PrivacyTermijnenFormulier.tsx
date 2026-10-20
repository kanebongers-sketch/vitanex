'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TERMIJN_VELDEN, keuzesVoor, maandenTekst, type TermijnVeld, type Termijnen } from '@/lib/club/privacy/termijnen'
import { stuur } from '@/components/club/leden/stuur'

// De bewaartermijnen die de sportschool zelf kiest. Elke nacht past Club ze
// toe (club_privacy_opruimen); demodata valt erbuiten.

const TEKST: Record<TermijnVeld, { titel: string; uitleg: string }> = {
  leadsMaanden: {
    titel: 'Leads',
    uitleg: 'Zo lang na het laatste contact (aanmelding, proefles, opvolgdatum of contactmoment) worden naam en contactgegevens van een lead gewist. Leads die lid werden blijven gewoon.',
  },
  oudLedenMaanden: {
    titel: 'Oud-leden',
    uitleg: 'Is iemand gestopt of opgezegd, en zijn einddatum, laatste wijziging en laatste bezoek allemaal ouder dan deze termijn, dan komt er vanzelf een verzoek tot verwijderen. Dat kun je 30 dagen terugdraaien op de ledenkaart.',
  },
  bezoekenMaanden: {
    titel: 'Bezoeken en boekingen',
    uitleg: 'Check-ins en boekingen van gegeven lessen worden na deze termijn losgemaakt van het lid. Ze tellen anoniem mee in je cijfers.',
  },
  logboekMaanden: {
    titel: 'Logboek',
    uitleg: 'Wie wat heeft gedaan in Club. Regels ouder dan deze termijn worden verwijderd.',
  },
}

function gelijk(a: Termijnen, b: Termijnen): boolean {
  return TERMIJN_VELDEN.every((v) => a[v] === b[v])
}

export function PrivacyTermijnenFormulier({ begin }: { begin: Termijnen }) {
  const router = useRouter()
  const [termijnen, setTermijnen] = useState<Termijnen>(begin)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)

  async function bewaar() {
    setBezig(true)
    setMelding(null)
    const uit = await stuur('/api/club/privacy', 'PATCH', termijnen)
    setBezig(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    setMelding({ ok: true, tekst: 'Opgeslagen. Vannacht past Club de nieuwe termijnen toe.' })
    router.refresh()
  }

  return (
    <div className="club-beheer-formulier">
      {TERMIJN_VELDEN.map((veld) => {
        const id = `privacy-${veld}`
        return (
          <div key={veld} className="club-privacy-termijn">
            <div className="club-veld">
              <label htmlFor={id}><span className="club-label">{TEKST[veld].titel}</span></label>
              <p id={`${id}-uitleg`} className="club-hint">{TEKST[veld].uitleg}</p>
            </div>
            <select
              id={id}
              className="club-invoer club-privacy-keuze"
              aria-describedby={`${id}-uitleg`}
              value={termijnen[veld]}
              onChange={(e) => setTermijnen({ ...termijnen, [veld]: Number(e.target.value) })}
            >
              {keuzesVoor(veld, termijnen[veld]).map((m) => (
                <option key={m} value={m}>{maandenTekst(m)}</option>
              ))}
            </select>
          </div>
        )
      })}

      <div className="club-beheer-acties">
        <button type="button" className="club-knop club-knop--primair" disabled={bezig || gelijk(termijnen, begin)} onClick={() => void bewaar()}>
          {bezig ? 'Opslaan...' : 'Opslaan'}
        </button>
        <div role="status" aria-live="polite">
          {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
        </div>
      </div>
    </div>
  )
}
