'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LEDENAPP_TABS, LEDENAPP_TAB_LABEL, MAX_WELKOM, type LedenappInstellingen, type LedenappTab } from '@/lib/club/kern/org-instellingen'
import { stuur } from '@/components/club/leden/stuur'

// De app voor leden instellen: een eigen welkomsttekst, welke tabbladen er
// zijn en of de check-in code zichtbaar is (bijvoorbeeld als je met een pasje werkt).

export function LedenappFormulier({ begin }: { begin: LedenappInstellingen }) {
  const router = useRouter()
  const [welkom, setWelkom] = useState(begin.welkom ?? '')
  const [tabsUit, setTabsUit] = useState<LedenappTab[]>(begin.tabsUit)
  const [qr, setQr] = useState(begin.qr)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)

  async function bewaar() {
    setBezig(true)
    setMelding(null)
    const uit = await stuur('/api/club/organisatie/instellingen', 'PATCH', { ledenapp: { welkom, tabsUit, qr } })
    setBezig(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    setMelding({ ok: true, tekst: 'Opgeslagen. De ledenapp toont dit meteen.' })
    router.refresh()
  }

  return (
    <div className="club-beheer-formulier">
      <label className="club-veld">
        <span>Welkomsttekst op het beginscherm (mag leeg)</span>
        <textarea className="club-invoer" rows={2} maxLength={MAX_WELKOM} value={welkom} placeholder="Bijvoorbeeld: Fijn dat je er bent. Vandaag wordt een goede dag." onChange={(e) => setWelkom(e.target.value)} />
        <small className="club-hint">{welkom.length} van {MAX_WELKOM} tekens</small>
      </label>

      <fieldset className="club-beheer-keuzes">
        <legend className="club-label">Tabbladen in de app</legend>
        <p className="club-hint">Home en Profiel staan altijd aan.</p>
        {LEDENAPP_TABS.map((tab) => (
          <label key={tab} className="club-beheer-keuze">
            <input type="checkbox" checked={!tabsUit.includes(tab)} onChange={(e) => setTabsUit(e.target.checked ? tabsUit.filter((x) => x !== tab) : [...tabsUit, tab])} />
            <span>{LEDENAPP_TAB_LABEL[tab]}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="club-beheer-keuzes">
        <legend className="club-label">Inchecken</legend>
        <label className="club-beheer-keuze">
          <input type="checkbox" checked={qr} onChange={(e) => setQr(e.target.checked)} />
          <span>Toon de check-in code (QR) in de app</span>
        </label>
      </fieldset>

      <div className="club-beheer-acties">
        <button type="button" className="club-knop club-knop--primair" disabled={bezig} onClick={() => void bewaar()}>
          {bezig ? 'Opslaan...' : 'Opslaan'}
        </button>
        <div role="status" aria-live="polite">
          {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
        </div>
      </div>
    </div>
  )
}
