'use client'

import { useCallback, useEffect, useState } from 'react'
import { Copy, QrCode, RefreshCw, Smartphone } from 'lucide-react'
import { haal } from '@/components/club/afspraken/haal'
import { stuur } from '@/components/club/leden/stuur'
import { startPad } from '@/lib/club/ledenlogin/paden'
import type { LidLinkOverzicht } from '@/lib/club/ledenlogin/regels'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { LID_INLOGGEN } from '@/lib/aiyourgym/taal/woorden/ledenapp/inloggen'
import { formatDatum, formatTijd } from '@/lib/aiyourgym/taal/formaat'
import './ledenapp-link.css'

// "Ledenapp" op de ledenkaart: de uitnodiging van het lid voor de ledenapp,
// als QR-code om aan de balie te scannen. Daarmee bevestigt het lid zijn
// e-mailadres en kiest het een wachtwoord (eenmalig, 7 dagen geldig); daarna
// logt het in met e-mail en wachtwoord. Opnieuw beginnen (wachtwoord gewist),
// intrekken en overal uitloggen. De sportschool ziet het wachtwoord nooit.

interface Props {
  lidId: string
  voornaam: string
}

/** De chip per stand; de tekst staat in het woordenboek (LID_INLOGGEN.link.staat). */
const STAAT_CHIP: Record<LidLinkOverzicht['staat'], string> = {
  geen: 'club-chip--geen',
  kiezen: 'club-chip--info',
  actief: 'club-chip--ok',
  pincode: 'club-chip--info',
  verlopen: 'club-chip--let-op',
  dicht: 'club-chip--let-op',
  ingetrokken: 'club-chip--uit',
}

function leesOverzicht(data: unknown): { link: LidLinkOverzicht; basis: string | null } | null {
  if (typeof data !== 'object' || data === null) return null
  const r = data as Record<string, unknown>
  const link = r.link as LidLinkOverzicht | undefined
  if (!link || typeof link.staat !== 'string' || !(link.staat in STAAT_CHIP)) return null
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
  const taal = useTaal()
  const t = LID_INLOGGEN[taal].link
  const [stand, setStand] = useState<{ link: LidLinkOverzicht; basis: string | null } | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ tekst: string; fout: boolean } | null>(null)

  const url = stand?.link.code ? `${stand.basis ?? (typeof window === 'undefined' ? '' : window.location.origin)}${startPad(stand.link.code)}` : null

  const toon = useCallback((data: unknown) => {
    const o = leesOverzicht(data)
    if (o) setStand(o)
    else setMelding({ tekst: t.ladenFout, fout: true })
  }, [t])

  useEffect(() => {
    let weg = false
    void haal(api).then((uit) => {
      if (weg) return
      if (uit.ok) toon(uit.data)
      else setMelding({ tekst: uit.fout || t.ladenFout, fout: true })
    })
    return () => {
      weg = true
    }
  }, [api, toon, t])

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
      setMelding({ tekst: t.gekopieerd, fout: false })
    } catch {
      setMelding({ tekst: t.kopierenFout, fout: true })
    }
  }

  const staat = stand ? { label: t.staat[stand.link.staat], chip: STAAT_CHIP[stand.link.staat] } : null
  const s = stand?.link.staat
  /** Er werkt nu een uitnodiging (QR te tonen). */
  const heeftLink = Boolean(stand?.link.code)
  /** Er is een account of uitnodiging die door "Nieuwe link" opnieuw begint. */
  const heeftAccount = s !== undefined && s !== 'geen' && s !== 'ingetrokken'
  const ingelogd = (s === 'actief' || s === 'pincode') && (stand?.link.toestellen ?? 0) > 0
  return (
    <section className="club-kaart club-lidlink" aria-labelledby="lidlink-kop">
      <div className="club-sectiekop">
        <h2 id="lidlink-kop">{t.kop}</h2>
        {staat ? <span className={`club-chip ${staat.chip}`}>{staat.label}</span> : null}
      </div>
      <p className="club-hint">
        {t.uitleg(voornaam)}
      </p>
      {stand && (s === 'actief' || s === 'pincode') ? (
        <p className="club-lidlink-feit">
          {t.toestellen(stand.link.toestellen)}
          {stand.link.laatstIngelogdOp ? t.laatst(`${formatDatum(stand.link.laatstIngelogdOp, taal, 'dag')} ${formatTijd(stand.link.laatstIngelogdOp, taal)}`) : ''}
        </p>
      ) : null}

      {open && url ? (
        <div className="club-lidlink-qr">
          {qr ? <img src={qr} alt={t.qrAlt(voornaam)} width={200} height={200} /> : <span className="club-lidlink-qr-leeg" aria-hidden />}
          <input className="club-lidlink-url" readOnly value={url} aria-label={t.url} onFocus={(e) => e.currentTarget.select()} />
          <button type="button" className="club-knop club-knop--klein" onClick={() => void kopieer()}>
            <Copy size={15} aria-hidden /> {t.kopieer}
          </button>
          <p className="club-hint">{t.alleenDelen(voornaam)}</p>
        </div>
      ) : null}

      <div className="club-lidlink-knoppen">
        {heeftLink ? (
          <button type="button" className="club-knop club-knop--primair" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            <QrCode size={16} aria-hidden /> {open ? t.verberg : t.toon}
          </button>
        ) : null}
        <button
          type="button"
          className={heeftLink || s === 'actief' ? 'club-knop' : 'club-knop club-knop--primair'}
          disabled={bezig || !stand}
          onClick={() =>
            void doe(
              'maak',
              heeftAccount ? t.nieuwVraag(voornaam) : null,
              t.nieuwKlaar,
            )
          }
        >
          {heeftAccount ? <RefreshCw size={16} aria-hidden /> : <Smartphone size={16} aria-hidden />} {heeftAccount ? t.nieuw : t.maken}
        </button>
        {ingelogd ? (
          <button type="button" className="club-knop club-knop--stil" disabled={bezig} onClick={() => void doe('uitloggen', t.uitloggenVraag(voornaam), t.uitgelogd)}>
            {t.overal}
          </button>
        ) : null}
        {heeftAccount ? (
          <button type="button" className="club-knop club-knop--gevaar" disabled={bezig} onClick={() => void doe('intrekken', t.intrekkenVraag(voornaam), t.ingetrokken)}>
            {t.intrekken}
          </button>
        ) : null}
      </div>
      <p className={melding?.fout ? 'club-melding club-melding--fout' : 'club-lidlink-status'} role="status" aria-live="polite">
        {melding?.tekst}
      </p>
    </section>
  )
}
