'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, Download, Maximize2, Printer, Share2, X } from 'lucide-react'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { NIEUWE_LEDEN } from '@/lib/aiyourgym/taal/woorden/club/nieuwe-leden'

// De QR van een link (aanmeldlink of uitnodiging), groot en scherp om aan de
// balie te scannen, met kopieren, delen (deelknop van de telefoon), downloaden
// als PNG en printen als A4-poster. De QR maakt de browser zelf met de
// bibliotheek qrcode (die zat al in de app); de link verlaat de pagina niet.

interface Props {
  url: string
  /** Voor de bestandsnaam en de deeltekst. */
  sportschool: string
  /** De A4-poster (alleen bij een aanmeldlink). */
  posterHref?: string | null
  /** Kleiner, voor in een venster na het toevoegen van een lid. */
  compact?: boolean
}

export async function maakQr(url: string, breedte: number): Promise<string | null> {
  try {
    const QRCode = (await import('qrcode')).default
    return await QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 2, width: breedte, color: { dark: '#0A0B09', light: '#FFFFFF' } })
  } catch {
    return null
  }
}

function bestandsnaam(sportschool: string): string {
  const basis = sportschool.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${basis || 'aanmelden'}-qr.png`
}

export function QrPaneel({ url, sportschool, posterHref = null, compact = false }: Props) {
  const t = useTekst(NIEUWE_LEDEN).qr
  const [qr, setQr] = useState<string | null>(null)
  const [fout, setFout] = useState(false)
  const [gekopieerd, setGekopieerd] = useState(false)
  const [groot, setGroot] = useState(false)
  const [kanDelen, setKanDelen] = useState(false)

  useEffect(() => {
    let weg = false
    void maakQr(url, 720).then((beeld) => {
      if (weg) return
      setQr(beeld)
      setFout(beeld === null)
    })
    setKanDelen(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
    return () => {
      weg = true
    }
  }, [url])

  useEffect(() => {
    if (!groot) return
    const toets = (e: KeyboardEvent) => e.key === 'Escape' && setGroot(false)
    window.addEventListener('keydown', toets)
    return () => window.removeEventListener('keydown', toets)
  }, [groot])

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(url)
      setGekopieerd(true)
      window.setTimeout(() => setGekopieerd(false), 2000)
    } catch {
      setGekopieerd(false)
    }
  }

  async function deel() {
    try {
      await navigator.share({ title: t.deelTekst(sportschool), text: t.deelTekst(sportschool), url })
    } catch {
      // Delen geannuleerd: niets aan de hand.
    }
  }

  async function download() {
    const beeld = await maakQr(url, 1600)
    if (!beeld) return setFout(true)
    const a = document.createElement('a')
    a.href = beeld
    a.download = bestandsnaam(sportschool)
    a.click()
  }

  return (
    <div className="club-nl-qr" data-compact={compact || undefined}>
      <div className="club-nl-qr-beeld">
        {qr ? (
          <button type="button" className="club-nl-qr-knop" onClick={() => setGroot(true)} aria-label={t.groot}>
            {/* eslint-disable-next-line @next/next/no-img-element -- data-URL van de QR, geen bestand om te optimaliseren */}
            <img src={qr} alt="" width={compact ? 200 : 260} height={compact ? 200 : 260} />
            <span className="club-nl-qr-vergroot" aria-hidden><Maximize2 size={14} /></span>
          </button>
        ) : (
          <div className="club-nl-qr-leeg" aria-busy={!fout}>{fout ? <p className="club-hint">{t.qrFout}</p> : null}</div>
        )}
      </div>
      <div className="club-nl-qr-link">
        <code>{url}</code>
      </div>
      <div className="club-nl-qr-acties">
        <button type="button" className="club-knop club-knop--klein" onClick={() => void kopieer()}>
          {gekopieerd ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />} {gekopieerd ? t.gekopieerd : t.kopieer}
        </button>
        {kanDelen && (
          <button type="button" className="club-knop club-knop--klein" onClick={() => void deel()}>
            <Share2 size={15} aria-hidden /> {t.deel}
          </button>
        )}
        <button type="button" className="club-knop club-knop--klein" onClick={() => void download()} disabled={!qr}>
          <Download size={15} aria-hidden /> {t.download}
        </button>
        {posterHref && (
          <a href={posterHref} className="club-knop club-knop--klein" target="_blank" rel="noopener">
            <Printer size={15} aria-hidden /> {t.print}
          </a>
        )}
      </div>
      {groot && qr && (
        <div className="club-nl-qr-groot" role="dialog" aria-modal="true" aria-label={t.groot} onClick={() => setGroot(false)}>
          <button type="button" className="club-nl-qr-groot-sluit" autoFocus onClick={() => setGroot(false)} aria-label={t.sluit}><X size={22} aria-hidden /></button>
          <p className="club-nl-qr-groot-kop">{t.kop}</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- data-URL van de QR */}
          <img src={qr} alt="" width={560} height={560} />
          <p className="club-nl-qr-groot-sub">{t.sub(sportschool)}</p>
        </div>
      )}
    </div>
  )
}
