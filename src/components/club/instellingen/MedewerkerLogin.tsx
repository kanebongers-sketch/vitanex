'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, Copy, KeyRound, Mail, QrCode } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import type { LoginOverzicht, LoginStaat } from '@/lib/club/medewerker-login/medewerker-login'

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

const STATUS: Record<LoginStaat, { label: string; chip: string }> = {
  geen: { label: 'Geen login', chip: 'club-chip--uit' },
  uitgenodigd: { label: 'Uitgenodigd', chip: 'club-chip--merk' },
  verlopen: { label: 'Uitnodiging verlopen', chip: 'club-chip--let-op' },
  actief: { label: 'Kan inloggen', chip: 'club-chip--ok' },
  oud: { label: 'Nog met pincode', chip: 'club-chip--merk' },
}

const DATUM = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' })

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

  async function nodigUit(e: FormEvent) {
    e.preventDefault()
    if (bezig) return
    if (staat === 'actief' && !window.confirm(`Een nieuwe uitnodiging maken? ${voornaam} kiest daarmee een nieuw wachtwoord; het huidige werkt tot dan.`)) return
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
    if (bezig || !window.confirm(`Login van ${voornaam} intrekken? Inloggen kan dan niet meer en alle toestellen worden uitgelogd.`)) return
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
      setFout('Kopieren lukte niet. Selecteer de link en kopieer hem zelf, of toon de QR-code.')
    }
  }

  async function toonQr() {
    if (!link) return
    if (qr) return setQr(null)
    try {
      const QRCode = (await import('qrcode')).default
      setQr(await QRCode.toDataURL(link, { errorCorrectionLevel: 'M', margin: 1, width: 220 }))
    } catch {
      setFout('De QR-code kon niet worden gemaakt. Kopieer de link.')
    }
  }

  if (!inDienst) return null
  const status = STATUS[staat]
  const heeftLogin = staat !== 'geen'

  return (
    <section className="club-mwlogin" aria-label={`Inloggen voor ${naam}`}>
      <div className="club-mwlogin-kop">
        <KeyRound aria-hidden size={15} />
        <span className="club-label">Eigen login</span>
        <span className={`club-chip ${login?.gesloten ? 'club-chip--let-op' : status.chip}`}>{login?.gesloten ? 'Dicht na foute pogingen' : status.label}</span>
      </div>

      {!loginAan && <p className="club-hint">De eigen login staat nog uit: uitnodigingen werken pas als de schakelaar aan gaat.</p>}
      {staat === 'uitgenodigd' && login?.uitnodigingTot && (
        <p className="club-hint">Uitnodiging naar {login.email} geldig tot {DATUM.format(new Date(login.uitnodigingTot))}.</p>
      )}
      {staat === 'actief' && login?.email && <p className="club-hint">Logt in met {login.email}.</p>}
      {staat === 'oud' && <p className="club-hint">{voornaam} logt nog in met de oude link en pincode. Nodig {voornaam} uit om over te stappen op e-mailadres en wachtwoord.</p>}
      {login?.gesloten && <p className="club-hint">Na te veel foute pogingen is deze login dicht. Een nieuwe uitnodiging zet hem weer open.</p>}

      <form className="club-mwlogin-acties club-mwlogin-acties--email" onSubmit={(e) => void nodigUit(e)} noValidate>
        <label className="club-mwlogin-email">
          <span>E-mailadres van {voornaam}</span>
          <input className="club-invoer" type="email" autoComplete="off" maxLength={120} required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button type="submit" className="club-knop club-knop--klein club-knop--primair" disabled={bezig || !email.trim()}>
          <Mail aria-hidden size={14} /> {heeftLogin ? 'Nieuwe uitnodiging' : 'Uitnodigen'}
        </button>
        {heeftLogin && (
          <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig} onClick={() => void trekIn()}>
            <Ban aria-hidden size={14} /> Intrekken
          </button>
        )}
      </form>

      {link && (
        <div className="club-mwlogin-qr" role="status">
          <p className="club-hint">
            Stuur deze link naar {voornaam}. Hij werkt een keer en 7 dagen lang; je ziet hem alleen nu.
          </p>
          <input className="club-invoer club-mwlogin-link" readOnly value={link} aria-label={`Uitnodigingslink voor ${naam}`} onFocus={(e) => e.currentTarget.select()} />
          <div className="club-mwlogin-acties">
            <button type="button" className="club-knop club-knop--klein" onClick={() => void kopieer()}>
              <Copy aria-hidden size={14} /> {gekopieerd ? 'Gekopieerd' : 'Link kopieren'}
            </button>
            <button type="button" className="club-knop club-knop--klein" onClick={() => void toonQr()} aria-expanded={qr !== null}>
              <QrCode aria-hidden size={14} /> {qr ? 'QR verbergen' : 'QR-code'}
            </button>
          </div>
          {qr && <img src={qr} width={220} height={220} alt={`QR-code met de uitnodigingslink van ${naam}`} />}
        </div>
      )}

      {fout && <p className="club-fout" role="alert">{fout}</p>}
    </section>
  )
}
