'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LEDENAPP_TABS, MAX_WELKOM, type LedenappInstellingen, type LedenappTab } from '@/lib/club/kern/org-instellingen'
import { stuur } from '@/components/club/leden/stuur'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { BEHEER } from '@/lib/aiyourgym/taal/woorden/club/beheer'

// De app voor leden instellen: een eigen welkomsttekst, welke tabbladen er
// zijn en of de check-in code zichtbaar is (bijvoorbeeld als je met een pasje werkt).

export function LedenappFormulier({ begin }: { begin: LedenappInstellingen }) {
  const router = useRouter()
  const [welkom, setWelkom] = useState(begin.welkom ?? '')
  const [tabsUit, setTabsUit] = useState<LedenappTab[]>(begin.tabsUit)
  const [qr, setQr] = useState(begin.qr)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)
  const tekst = useTekst(BEHEER)

  async function bewaar() {
    setBezig(true)
    setMelding(null)
    const uit = await stuur('/api/club/organisatie/instellingen', 'PATCH', { ledenapp: { welkom, tabsUit, qr } })
    setBezig(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    setMelding({ ok: true, tekst: tekst.ledenapp.opgeslagen })
    router.refresh()
  }

  return (
    <div className="club-beheer-formulier">
      <label className="club-veld">
        <span>{tekst.ledenapp.welkom}</span>
        <textarea className="club-invoer" rows={2} maxLength={MAX_WELKOM} value={welkom} placeholder={tekst.ledenapp.welkomVoorbeeld} onChange={(e) => setWelkom(e.target.value)} />
        <small className="club-hint">{tekst.ledenapp.tekens(welkom.length, MAX_WELKOM)}</small>
      </label>

      <fieldset className="club-beheer-keuzes">
        <legend className="club-label">{tekst.ledenapp.tabs}</legend>
        <p className="club-hint">{tekst.ledenapp.altijdAan}</p>
        {LEDENAPP_TABS.map((tab) => (
          <label key={tab} className="club-beheer-keuze">
            <input type="checkbox" checked={!tabsUit.includes(tab)} onChange={(e) => setTabsUit(e.target.checked ? tabsUit.filter((x) => x !== tab) : [...tabsUit, tab])} />
            <span>{tekst.ledenapp.tab[tab]}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="club-beheer-keuzes">
        <legend className="club-label">{tekst.ledenapp.inchecken}</legend>
        <label className="club-beheer-keuze">
          <input type="checkbox" checked={qr} onChange={(e) => setQr(e.target.checked)} />
          <span>{tekst.ledenapp.qr}</span>
        </label>
      </fieldset>

      <div className="club-beheer-acties">
        <button type="button" className="club-knop club-knop--primair" disabled={bezig} onClick={() => void bewaar()}>
          {bezig ? tekst.algemeen.bezig : tekst.algemeen.opslaan}
        </button>
        <div role="status" aria-live="polite">
          {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
        </div>
      </div>
    </div>
  )
}
