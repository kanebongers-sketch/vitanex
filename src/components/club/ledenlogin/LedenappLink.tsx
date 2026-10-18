'use client'

import { useCallback, useEffect, useState } from 'react'
import { Copy, QrCode, RefreshCw, Smartphone } from 'lucide-react'
import { haal } from '@/components/club/afspraken/haal'
import { stuur } from '@/components/club/leden/stuur'
import { startPad } from '@/lib/club/ledenlogin/paden'
import type { LidLinkOverzicht } from '@/lib/club/ledenlogin/regels'
import './ledenapp-link.css'

// "Ledenapp-link" op de ledenkaart: de persoonlijke link van het lid naar de
// ledenapp, als QR-code om aan de balie te scannen. Opnieuw maken (de oude
// werkt dan niet meer), intrekken en overal uitloggen. Het lid kiest daarna
// zelf een pincode; de sportschool ziet die nooit.

interface Props {
  lidId: string
  voornaam: string
}

const STAAT_TEKST: Record<LidLinkOverzicht['staat'], { label: string; chip: string }> = {
  geen: { label: 'Nog geen link', chip: 'club-chip--geen' },
  kiezen: { label: 'Wacht op pincode', chip: 'club-chip--info' },
  actief: { label: 'In gebruik', chip: 'club-chip--ok' },
  verlopen: { label: 'Link verlopen', chip: 'club-chip--let-op' },
  dicht: { label: 'Dicht na foute pincodes', chip: 'club-chip--let-op' },
  ingetrokken: { label: 'Ingetrokken', chip: 'club-chip--uit' },
}

const DATUM = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })

function leesOverzicht(data: unknown): { link: LidLinkOverzicht; basis: string | null } | null {
  if (typeof data !== 'object' || data === null) return null
  const r = data as Record<string, unknown>
  const link = r.link as LidLinkOverzicht | undefined
  if (!link || typeof link.staat !== 'string' || !(link.staat in STAAT_TEKST)) return null
  return { link, basis: typeof r.basis === 'string' ? r.basis : null }
}

async function maakQr(url: string): Promise<string | null> {
  try {
    const QRCode = (await import('qrcode')).default
    return await QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 1, width: 320, color: { dark: '#0A0B09', light: '#FFFFFF' } })
  } catch {
    return null
  }
}

export function LedenappLink({ lidId, voornaam }: Props) {
  const api = `/api/club/leden/${encodeURIComponent(lidId)}/ledenapp-link`
  const [stand, setStand] = useState<{ link: LidLinkOverzicht; basis: string | null } | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ tekst: string; fout: boolean } | null>(null)

  const url = stand?.link.code ? `${stand.basis ?? (typeof window === 'undefined' ? '' : window.location.origin)}${startPad(stand.link.code)}` : null

  const toon = useCallback((data: unknown) => {
    const o = leesOverzicht(data)
    if (o) setStand(o)
    else setMelding({ tekst: 'De ledenapp-link kon niet worden geladen.', fout: true })
  }, [])

  useEffect(() => {
    let weg = false
    void haal(api).then((uit) => {
      if (weg) return
      if (uit.ok) toon(uit.data)
      else setMelding({ tekst: uit.fout || 'De ledenapp-link kon niet worden geladen.', fout: true })
    })
    return () => {
      weg = true
    }
  }, [api, toon])

  useEffect(() => {
    let weg = false
    if (!open || !url) return
    void maakQr(url).then((bron) => {
      if (!weg) setQr(bron)
    })
    return () => {
      weg = true
    }
  }, [open, url])

  async function doe(actie: 'maak' | 'intrekken' | 'uitloggen', vraag: string | null, klaar: string) {
    if (vraag && !window.confirm(vraag)) return
    setBezig(true)
    setMelding(null)
    const uit = await stuur(api, 'POST', { actie })
    setBezig(false)
    if (!uit.ok) return setMelding({ tekst: uit.fout, fout: true })
    toon(uit.data)
    setQr(null)
    if (actie === 'maak') setOpen(true)
    setMelding({ tekst: klaar, fout: false })
  }

  async function kopieer() {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setMelding({ tekst: 'Link gekopieerd.', fout: false })
    } catch {
      setMelding({ tekst: 'Kopieren lukte niet. Selecteer de link en kopieer hem zelf.', fout: true })
    }
  }

  const staat = stand ? STAAT_TEKST[stand.link.staat] : null
  const heeftLink = Boolean(stand?.link.code)
  return (
    <section className="club-kaart club-lidlink" aria-labelledby="lidlink-kop">
      <div className="club-sectiekop">
        <h2 id="lidlink-kop">Ledenapp</h2>
        {staat ? <span className={`club-chip ${staat.chip}`}>{staat.label}</span> : null}
      </div>
      <p className="club-hint">
        {voornaam} scant de QR-code, kiest een eigen pincode en zet de app op het beginscherm. Een link is 7 dagen geldig om de pincode te kiezen.
      </p>
      {stand && stand.link.staat === 'actief' ? (
        <p className="club-lidlink-feit">
          {stand.link.toestellen === 1 ? 'Ingelogd op 1 toestel' : `Ingelogd op ${stand.link.toestellen} toestellen`}
          {stand.link.laatstIngelogdOp ? ` · laatst ingelogd ${DATUM.format(new Date(stand.link.laatstIngelogdOp))}` : ''}
        </p>
      ) : null}

      {open && url ? (
        <div className="club-lidlink-qr">
          {qr ? <img src={qr} alt={`QR-code met de ledenapp-link van ${voornaam}`} width={200} height={200} /> : <span className="club-lidlink-qr-leeg" aria-hidden />}
          <input className="club-lidlink-url" readOnly value={url} aria-label="Ledenapp-link" onFocus={(e) => e.currentTarget.select()} />
          <button type="button" className="club-knop club-knop--klein" onClick={() => void kopieer()}>
            <Copy size={15} aria-hidden /> Kopieer link
          </button>
          <p className="club-hint">Deel deze link alleen met {voornaam}: wie hem heeft, kan de pincode kiezen.</p>
        </div>
      ) : null}

      <div className="club-lidlink-knoppen">
        {heeftLink && (stand?.link.staat === 'kiezen' || stand?.link.staat === 'actief') ? (
          <button type="button" className="club-knop club-knop--primair" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            <QrCode size={16} aria-hidden /> {open ? 'Verberg QR-code' : 'Toon QR-code'}
          </button>
        ) : null}
        <button
          type="button"
          className={heeftLink && stand?.link.staat !== 'verlopen' && stand?.link.staat !== 'dicht' ? 'club-knop' : 'club-knop club-knop--primair'}
          disabled={bezig || !stand}
          onClick={() => void doe('maak', heeftLink ? `Een nieuwe link maken? De oude link en pincode van ${voornaam} werken dan niet meer en alle toestellen worden uitgelogd.` : null, 'Nieuwe link gemaakt. Laat de QR-code scannen.')}
        >
          {heeftLink ? <RefreshCw size={16} aria-hidden /> : <Smartphone size={16} aria-hidden />} {heeftLink ? 'Nieuwe link' : 'Ledenapp-link maken'}
        </button>
        {stand?.link.staat === 'actief' && stand.link.toestellen > 0 ? (
          <button type="button" className="club-knop club-knop--stil" disabled={bezig} onClick={() => void doe('uitloggen', `${voornaam} op alle toestellen uitloggen?`, 'Overal uitgelogd.')}>
            Overal uitloggen
          </button>
        ) : null}
        {heeftLink ? (
          <button type="button" className="club-knop club-knop--gevaar" disabled={bezig} onClick={() => void doe('intrekken', `De ledenapp-link van ${voornaam} intrekken? De app werkt dan niet meer tot je een nieuwe link maakt.`, 'Link ingetrokken.')}>
            Intrekken
          </button>
        ) : null}
      </div>
      <p className={melding?.fout ? 'club-melding club-melding--fout' : 'club-lidlink-status'} role="status" aria-live="polite">
        {melding?.tekst}
      </p>
    </section>
  )
}
