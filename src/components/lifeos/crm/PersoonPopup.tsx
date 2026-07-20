'use client'

import { useCallback, useId, useState } from 'react'
import { History, Phone, Snowflake, Trash2, X } from 'lucide-react'
import { Knop } from '@/components/lifeos/os/Knop'
import { Foutmelding } from '@/components/lifeos/os/Foutmelding'
import { initialen } from '@/lib/lifeos/crm/monogram'
import { contactVersheid } from '@/lib/lifeos/crm/versheid'
import { groepDef, statusDef, type Groep, type Persoon, type PersoonWijziging } from '@/lib/lifeos/crm/crm'
import { Dialoog } from './Dialoog'
import { DrawerStijl } from './DrawerStijl'
import { ContactActies } from './ContactActies'
import { PopupDetails } from './PopupDetails'
import { HistoriePaneel } from './HistoriePaneel'
import { useHistorie } from './useHistorie'

// De drawer die opent bij een klik op een tegel: één premium relatie-paneel met
// monogram + status, snelle contact-acties, een versheid-regel, de bewerkbare
// velden en de volledige tijdlijn van één persoon. Bezit `useHistorie`;
// wijzigingen die de server als historie wegschrijft, verversen de tijdlijn stil.

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
  // Eén "nu"-snapshot bij het openen: voedt de versheid-regel, de follow-up-
  // snelknoppen én de relatieve tijd in de tijdlijn. De drawer opent altijd na een
  // klik (client-only), dus `new Date()` geeft hier geen hydration-mismatch.
  const [vandaag] = useState(() => new Date())

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
  const versheid = contactVersheid(persoon.laatsteContactOp, vandaag)
  const toegevoegd = datumLabel(persoon.aangemaaktOp)

  return (
    <Dialoog labelId={labelId} onSluit={onSluit}>
      <DrawerStijl />
      <header className="os-crm__dialoog-kop">
        <div className="crm-drawer__kop-links">
          <span className="crm-drawer__monogram" aria-hidden="true">
            {initialen(persoon.naam)}
          </span>
          <div className="os-crm__dialoog-titelblok">
            <h2 id={labelId} className="os-crm__dialoog-titel">
              {persoon.naam}
            </h2>
            <p className="os-crm__dialoog-meta">
              <span className="os-crm__badge">{statusLabel}</span>
              <span className="os-crm__dialoog-groep">{groepDef(groep).label}</span>
            </p>
          </div>
        </div>
        <button type="button" className="os-crm__sluit" onClick={onSluit} aria-label="Sluiten">
          <X size={18} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </header>

      <div className="os-crm__dialoog-lijf">
        <div className="crm-drawer__band">
          <ContactActies persoon={persoon} />
          <div className={`crm-drawer__versheid${versheid.koud ? ' crm-drawer__versheid--koud' : ''}`}>
            <p className="crm-drawer__versheid-tekst">
              {versheid.koud ? (
                <Snowflake size={15} strokeWidth={2.2} aria-hidden="true" className="crm-drawer__versheid-icoon" />
              ) : (
                <History size={15} strokeWidth={2.2} aria-hidden="true" className="crm-drawer__versheid-icoon" />
              )}
              {versheidZin(versheid.tekst, versheid.dagen, versheid.koud)}
            </p>
            <span className="crm-drawer__versheid-knop">
              <Knop variant="stil" onClick={() => void contactNu()}>
                <Phone size={14} strokeWidth={2.2} aria-hidden="true" />
                Contact gelegd
              </Knop>
            </span>
          </div>
        </div>

        <PopupDetails persoon={persoon} groep={groep} vandaag={vandaag} onWijzig={wijzigEnHerlaad} />
        <HistoriePaneel
          groep={groep}
          vandaag={vandaag}
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
        {toegevoegd ? <span className="crm-drawer__voet-info">Toegevoegd op {toegevoegd}</span> : <span />}

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

/** Een menselijke zin over de contact-versheid. Geen verzonnen data: leunt puur op
 *  wat `contactVersheid` teruggeeft (dagen, tekst, koud). */
function versheidZin(tekst: string, dagen: number | null, koud: boolean): string {
  if (dagen === null) return 'Nog geen contact vastgelegd'
  if (koud) return `Laatst gesproken ${tekst} — dit contact verwatert`
  return `Laatst gesproken: ${tekst}`
}

/** '18 jul 2026' of '' bij een ongeldige datum. */
function datumLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}
