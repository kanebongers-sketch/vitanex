'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, KeyRound, QrCode, RefreshCw, Ban } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { medewerkerLinkPad, type LoginActie, type LoginOverzicht } from '@/lib/club/medewerker-login/medewerker-login'

// De inloglink van een medewerker, voor de eigenaar of clubmanager. Link of
// QR-code uitdelen, de gekozen pincode goedkeuren met de controlecode die de
// medewerker noemt (de server controleert hem), opnieuw maken of intrekken.

interface MedewerkerLoginProps {
  medewerkerId: string
  naam: string
  login: LoginOverzicht | null
  inDienst: boolean
  /** https://<slug>.aiyourgym.com als de sportschool een eigen adres heeft; anders dit domein. */
  linkBasis: string | null
  loginAan: boolean
}

const STATUS: Record<LoginOverzicht['pinStatus'], { label: string; chip: string }> = {
  geen: { label: 'Wacht op pincode', chip: 'club-chip--uit' },
  wacht: { label: 'Pincode wacht op jou', chip: 'club-chip--merk' },
  actief: { label: 'Kan inloggen', chip: 'club-chip--ok' },
}

const VRAAG: Partial<Record<LoginActie, string>> = {
  maken: 'Een nieuwe link maken? De oude link en pincode werken dan niet meer en alle toestellen worden uitgelogd.',
  reset: 'Pincode resetten? Alle toestellen worden uitgelogd en de medewerker kiest een nieuwe pincode.',
  intrekken: 'Inloglink intrekken? De medewerker kan dan niet meer inloggen.',
}

export function MedewerkerLogin({ medewerkerId, naam, login, inDienst, linkBasis, loginAan }: MedewerkerLoginProps) {
  const router = useRouter()
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [controle, setControle] = useState('')
  const [gekopieerd, setGekopieerd] = useState(false)
  const [qr, setQr] = useState<string | null>(null)
  const actief = login?.actief === true

  const link = () => `${linkBasis ?? window.location.origin}${medewerkerLinkPad(login?.code ?? '')}`

  async function doe(actie: LoginActie) {
    if (bezig) return
    const vraag = actie === 'maken' && !actief ? null : VRAAG[actie]
    if (vraag && !window.confirm(vraag)) return
    setBezig(true)
    setFout(null)
    const uit = await stuur(`/api/club/medewerker-toegang/${medewerkerId}`, 'PATCH', { actie, controle })
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    setControle('')
    setQr(null)
    router.refresh()
  }

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(link())
      setGekopieerd(true)
    } catch {
      setFout('Kopieren lukte niet. Toon de QR-code of probeer het opnieuw.')
    }
  }

  async function toonQr() {
    if (qr) return setQr(null)
    try {
      const QRCode = (await import('qrcode')).default
      setQr(await QRCode.toDataURL(link(), { errorCorrectionLevel: 'M', margin: 1, width: 220 }))
    } catch {
      setFout('De QR-code kon niet worden gemaakt. Kopieer de link.')
    }
  }

  if (!inDienst) return null

  return (
    <section className="club-mwlogin" aria-label={`Inloggen voor ${naam}`}>
      <div className="club-mwlogin-kop">
        <KeyRound aria-hidden size={15} />
        <span className="club-label">Eigen login</span>
        {actief && login ? (
          <span className={`club-chip ${login.gesloten ? 'club-chip--let-op' : STATUS[login.pinStatus].chip}`}>
            {login.gesloten ? 'Dicht na foute pogingen' : STATUS[login.pinStatus].label}
          </span>
        ) : (
          <span className="club-chip club-chip--uit">Geen link</span>
        )}
      </div>

      {!loginAan && <p className="club-hint">De eigen login staat nog uit: links werken pas als de schakelaar aan gaat.</p>}

      {actief && login?.pinStatus === 'wacht' && (
        <label className="club-mwlogin-controle">
          <span>Controlecode die {naam.split(' ')[0]} je noemt</span>
          <input
            className="club-invoer"
            inputMode="numeric"
            maxLength={4}
            placeholder="4 cijfers"
            value={controle}
            onChange={(e) => setControle(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
        </label>
      )}

      <div className="club-mwlogin-acties">
        {actief ? (
          <>
            <button type="button" className="club-knop club-knop--klein" onClick={() => void kopieer()}>
              <Copy aria-hidden size={14} /> {gekopieerd ? 'Gekopieerd' : 'Link kopieren'}
            </button>
            <button type="button" className="club-knop club-knop--klein" onClick={() => void toonQr()} aria-expanded={qr !== null}>
              <QrCode aria-hidden size={14} /> {qr ? 'QR verbergen' : 'QR-code'}
            </button>
            {login?.pinStatus === 'wacht' && (
              <>
                <button type="button" className="club-knop club-knop--klein club-knop--primair" disabled={bezig || controle.length !== 4} onClick={() => void doe('goedkeuren')}>Goedkeuren</button>
                <button type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => void doe('afwijzen')}>Afwijzen</button>
              </>
            )}
            {(login?.pinStatus === 'actief' || login?.gesloten) && (
              <button type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => void doe('reset')}>Pincode resetten</button>
            )}
            <button type="button" className="club-knop club-knop--klein" disabled={bezig} onClick={() => void doe('maken')}>
              <RefreshCw aria-hidden size={14} /> Opnieuw maken
            </button>
            <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig} onClick={() => void doe('intrekken')}>
              <Ban aria-hidden size={14} /> Intrekken
            </button>
          </>
        ) : (
          <button type="button" className="club-knop club-knop--klein club-knop--primair" disabled={bezig} onClick={() => void doe('maken')}>
            <KeyRound aria-hidden size={14} /> Inloglink maken
          </button>
        )}
      </div>

      {qr && (
        <figure className="club-mwlogin-qr">
          <img src={qr} width={220} height={220} alt={`QR-code met de inloglink van ${naam}`} />
          <figcaption className="club-hint">Laat {naam.split(' ')[0]} deze code scannen. Daarna kiest hij of zij zelf een pincode.</figcaption>
        </figure>
      )}

      {fout && <p className="club-fout" role="alert">{fout}</p>}
    </section>
  )
}
