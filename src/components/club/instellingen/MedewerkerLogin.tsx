'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, Copy, KeyRound, Mail, QrCode } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import type { LoginOverzicht, LoginStaat } from '@/lib/club/medewerker-login/medewerker-login'
import { useTaal, useTekst } from '@/lib/aiyourgym/taal/client'
import { INSTELLINGEN } from '@/lib/aiyourgym/taal/woorden/club/instellingen'
import { formatDatum, formatTijd } from '@/lib/aiyourgym/taal/formaat'

// De login van een medewerker, voor de eigenaar of clubmanager (besluit Kane
// 23-10-2026: e-mailadres plus wachtwoord, geen pincode of controlecode meer).
// Uitnodigen met een e-mailadres geeft een eenmalige link die je kopieert of
// als QR-code toont; de medewerker kiest daar zelf een wachtwoord. De link is
// alleen direct na het maken te zien (in de database staat alleen een hash).

interface MedewerkerLoginProps {
  medewerkerId: string
  naam: string
  /** Het e-mailadres uit de medewerkerkaart, als voorstel. */
  emailVoorstel: string | null
  login: LoginOverzicht | null
  inDienst: boolean
  /** Het adres van de sportschool (https://aiyourgym.com/<slug>, of het subdomein) als ze een slug heeft; anders dit domein. */
  linkBasis: string | null
  loginAan: boolean
}

const CHIP: Record<LoginStaat, string> = {
  geen: 'club-chip--uit',
  uitgenodigd: 'club-chip--merk',
  verlopen: 'club-chip--let-op',
  actief: 'club-chip--ok',
  oud: 'club-chip--merk',
}

function leesPad(data: unknown): string | null {
  const p = typeof data === 'object' && data !== null ? (data as { pad?: unknown }).pad : null
  return typeof p === 'string' ? p : null
}

export function MedewerkerLogin({ medewerkerId, naam, emailVoorstel, login, inDienst, linkBasis, loginAan }: MedewerkerLoginProps) {
  const router = useRouter()
  const staat: LoginStaat = login?.staat ?? 'geen'
  const [email, setEmail] = useState(login?.email ?? emailVoorstel ?? '')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [gekopieerd, setGekopieerd] = useState(false)
  const [qr, setQr] = useState<string | null>(null)
  const voornaam = naam.split(' ')[0]
  const taal = useTaal()
  const t = useTekst(INSTELLINGEN).login

  async function nodigUit(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (staat === 'actief' && !window.confirm(t.opnieuw(voornaam))) return
    setBezig(true)
    setFout(null)
    const uit = await stuur(`/api/club/medewerker-toegang/${medewerkerId}`, 'PATCH', { actie: 'uitnodigen', email })
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    const pad = leesPad(uit.data)
    setLink(pad ? `${linkBasis ?? window.location.origin}${pad}` : null)
    setGekopieerd(false)
    setQr(null)
    router.refresh()
  }

  async function trekIn() {
    if (bezig || !window.confirm(t.intrekkenVraag(voornaam))) return
    setBezig(true)
    setFout(null)
    const uit = await stuur(`/api/club/medewerker-toegang/${medewerkerId}`, 'PATCH', { actie: 'intrekken' })
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    setLink(null)
    setQr(null)
    router.refresh()
  }

  async function kopieer() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setGekopieerd(true)
    } catch {
      setFout(t.kopieerFout)
    }
  }

  async function toonQr() {
    if (!link) return
    if (qr) return setQr(null)
    try {
      const QRCode = (await import('qrcode')).default
      setQr(await QRCode.toDataURL(link, { errorCorrectionLevel: 'M', margin: 1, width: 220 }))
    } catch {
      setFout(t.qrFout)
    }
  }

  if (!inDienst) return null
  const status = { label: t.status[staat], chip: CHIP[staat] }
  const heeftLogin = staat !== 'geen'

  return (
    <section className="club-mwlogin" aria-label={t.label(naam)}>
      <div className="club-mwlogin-kop">
        <KeyRound aria-hidden size={15} />
        <span className="club-label">{t.kop}</span>
        <span className={`club-chip ${login?.gesloten ? 'club-chip--let-op' : status.chip}`}>{login?.gesloten ? t.dicht : status.label}</span>
      </div>

      {!loginAan && <p className="club-hint">{t.staatUit}</p>}
      {staat === 'uitgenodigd' && login?.uitnodigingTot && (
        <p className="club-hint">{t.uitgenodigdTot(login.email ?? '', `${formatDatum(login.uitnodigingTot, taal, 'dag')} ${formatTijd(login.uitnodigingTot, taal)}`)}</p>
      )}
      {staat === 'actief' && login?.email && <p className="club-hint">{t.logtIn(login.email)}</p>}
      {staat === 'oud' && <p className="club-hint">{t.oud(voornaam)}</p>}
      {login?.gesloten && <p className="club-hint">{t.dichtUitleg}</p>}

      <form className="club-mwlogin-acties club-mwlogin-acties--email" onSubmit={(e) => void nodigUit(e)} noValidate>
        <label className="club-mwlogin-email">
          <span>{t.emailVan(voornaam)}</span>
          <input className="club-invoer" type="email" autoComplete="off" maxLength={120} required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button type="submit" className="club-knop club-knop--klein club-knop--primair" disabled={bezig || !email.trim()}>
          <Mail aria-hidden size={14} /> {heeftLogin ? t.nieuweUitnodiging : t.uitnodigen}
        </button>
        {heeftLogin && (
          <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig} onClick={() => void trekIn()}>
            <Ban aria-hidden size={14} /> {t.intrekken}
          </button>
        )}
      </form>

      {link && (
        <div className="club-mwlogin-qr" role="status">
          <p className="club-hint">{t.stuurLink(voornaam)}</p>
          <input className="club-invoer club-mwlogin-link" readOnly value={link} aria-label={t.linkLabel(naam)} onFocus={(e) => e.currentTarget.select()} />
          <div className="club-mwlogin-acties">
            <button type="button" className="club-knop club-knop--klein" onClick={() => void kopieer()}>
              <Copy aria-hidden size={14} /> {gekopieerd ? t.gekopieerd : t.kopieer}
            </button>
            <button type="button" className="club-knop club-knop--klein" onClick={() => void toonQr()} aria-expanded={qr !== null}>
              <QrCode aria-hidden size={14} /> {qr ? t.qrVerbergen : t.qr}
            </button>
          </div>
          {qr && <img src={qr} width={220} height={220} alt={t.qrAlt(naam)} />}
        </div>
      )}

      {fout && <p className="club-fout" role="alert">{fout}</p>}
    </section>
  )
}
