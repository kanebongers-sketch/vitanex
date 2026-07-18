'use client'

import { useCallback, useId, useState } from 'react'
import { Phone, Trash2, X } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { groepDef, statusDef, type Groep, type Persoon, type PersoonWijziging } from '@/lib/lifeos/crm/crm'
import { Dialoog } from './Dialoog'
import { PopupDetails } from './PopupDetails'
import { HistoriePaneel } from './HistoriePaneel'
import { useHistorie } from './useHistorie'

// De popup die opent bij een klik op een tegel: alle details + de volledige
// status-geschiedenis van één persoon. Bezit `useHistorie`; wijzigingen die de
// server als historie wegschrijft, verversen de tijdlijn stil.

interface PersoonPopupProps {
  persoon: Persoon
  groep: Groep
  /** Fout van een popup-mutatie (status, contact, follow-up, veld, verwijderen).
   *  Wordt IN de dialog getoond — nooit erachter, waar 'm onzichtbaar zou zijn. */
  actieFout: string | null
  onSluit: () => void
  onWijzig: (wijziging: PersoonWijziging) => Promise<boolean>
  onContactGelegd: () => Promise<boolean>
  onVerwijder: () => Promise<void>
}

export function PersoonPopup({
  persoon,
  groep,
  actieFout,
  onSluit,
  onWijzig,
  onContactGelegd,
  onVerwijder,
}: PersoonPopupProps) {
  const historie = useHistorie(persoon.id)
  const labelId = useId()
  const [bevestigWis, setBevestigWis] = useState(false)

  // Status/contact/follow-up worden server-side als historie-item weggeschreven;
  // daarna de tijdlijn stil herladen zodat je de zojuist gedane actie meteen ziet.
  const wijzigEnHerlaad = useCallback(
    async (wijziging: PersoonWijziging): Promise<boolean> => {
      const gelukt = await onWijzig(wijziging)
      const raaktHistorie =
        'status' in wijziging || 'laatsteContactOp' in wijziging || 'followUpDatum' in wijziging
      if (gelukt && raaktHistorie) historie.herlaad()
      return gelukt
    },
    [onWijzig, historie],
  )

  async function contactNu() {
    const gelukt = await onContactGelegd()
    if (gelukt) historie.herlaad()
  }

  const statusLabel = statusDef(groep, persoon.status)?.label ?? persoon.status
  const laatstContact = leesLaatsteContact(persoon.laatsteContactOp)

  return (
    <Dialoog labelId={labelId} onSluit={onSluit}>
      <header className="os-crm__dialoog-kop">
        <div className="os-crm__dialoog-titelblok">
          <h2 id={labelId} className="os-crm__dialoog-titel">
            {persoon.naam}
          </h2>
          <p className="os-crm__dialoog-meta">
            <span className="os-crm__badge">{statusLabel}</span>
            <span className="os-crm__dialoog-groep">{groepDef(groep).label}</span>
          </p>
        </div>
        <button type="button" className="os-crm__sluit" onClick={onSluit} aria-label="Sluiten">
          <X size={18} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </header>

      <div className="os-crm__dialoog-lijf">
        <PopupDetails persoon={persoon} groep={groep} onWijzig={wijzigEnHerlaad} />
        <HistoriePaneel
          groep={groep}
          staat={historie.staat}
          actieFout={historie.actieFout}
          bezig={historie.bezig}
          onOpnieuw={historie.opnieuw}
          onNotitie={historie.voegNotitieToe}
        />
      </div>

      {/* De mutatie-fout hoort hier: binnen de dialog, boven de voet, buiten het
          scrollbare lijf — zo blijft 'm altijd zichtbaar en valt 'm niet achter de
          overlay. Inline spacing want de CSS-tokens/-classes wonen elders. */}
      {actieFout ? (
        <div style={{ flexShrink: 0, padding: '0 20px 12px' }}>
          <Foutmelding bericht={actieFout} />
        </div>
      ) : null}

      <footer className="os-crm__dialoog-voet">
        <div className="os-crm__voet-links">
          <Knop variant="stil" onClick={() => void contactNu()}>
            <Phone size={14} strokeWidth={2.2} aria-hidden="true" />
            Contact gelegd nu
          </Knop>
          {laatstContact ? <span className="os-crm__hint">Laatst: {laatstContact}</span> : null}
        </div>

        {bevestigWis ? (
          <div className="os-crm__wis-bevestig" role="group" aria-label="Verwijderen bevestigen">
            <span className="os-crm__hint">Zeker weten?</span>
            <Knop variant="stil" onClick={() => setBevestigWis(false)}>
              Annuleer
            </Knop>
            <button type="button" className="os-crm__gevaar" onClick={() => void onVerwijder()}>
              <Trash2 size={14} strokeWidth={2.2} aria-hidden="true" />
              Verwijder
            </button>
          </div>
        ) : (
          <button type="button" className="os-crm__gevaar-stil" onClick={() => setBevestigWis(true)}>
            <Trash2 size={14} strokeWidth={2.2} aria-hidden="true" />
            Verwijderen
          </button>
        )}
      </footer>
    </Dialoog>
  )
}

/** '18 jul 2026' of null. Toont wanneer je iemand voor het laatst sprak. */
function leesLaatsteContact(iso: string | null): string | null {
  if (iso === null) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}
