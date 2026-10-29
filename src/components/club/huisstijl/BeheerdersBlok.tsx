'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, UserPlus } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { BEHEERDER_ROLLEN, type BeheerderActie, type BeheerderOverzicht, type BeheerderRol } from '@/lib/club/beheerders/beheerder'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { HUISSTIJL } from '@/lib/aiyourgym/taal/woorden/club/huisstijl'

// Voor Kane en de eigenaar: eigenaren en clubmanagers van de sportschool die open
// staat. Uitnodigen met naam, e-mailadres en rol; de uitnodigingslink kopieer je
// en geef je door. Daarmee kiest de beheerder een keer een wachtwoord en logt
// daarna in met e-mailadres en wachtwoord. Nieuwe uitnodiging (vergeten
// wachtwoord) of stoppen. Fit Factory zelf krijgt nog geen beheerders.

interface BeheerdersBlokProps {
  sportschool: string
  beheerders: BeheerderOverzicht[] | null
  loginAan: boolean
  /** De eigen sportschool van Kane (Fit Factory): dan geen nieuwe beheerders. */
  eigenSportschool: boolean
  /** Het eigen id als een eigenaar dit beheert: die rij is niet aan te passen. */
  ikZelf: string | null
  /** Het adres van de sportschool (https://aiyourgym.com/<slug>, of het subdomein) als ze een slug heeft; anders dit domein. */
  linkBasis: string | null
}

type StatusTekst = { dicht: string; actief: string; uitgenodigd: string }

function status(b: BeheerderOverzicht, s: StatusTekst): { label: string; chip: string } {
  if (b.gesloten) return { label: s.dicht, chip: 'club-chip--let-op' }
  return b.heeftWachtwoord ? { label: s.actief, chip: 'club-chip--ok' } : { label: s.uitgenodigd, chip: 'club-chip--merk' }
}

export function BeheerdersBlok({ sportschool, beheerders, loginAan, eigenSportschool, ikZelf, linkBasis }: BeheerdersBlokProps) {
  const router = useRouter()
  const [bezig, setBezig] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [gekopieerd, setGekopieerd] = useState<string | null>(null)
  const [naam, setNaam] = useState('')
  const [email, setEmail] = useState('')
  // Veilig standaard: een clubmanager ziet alleen wat de eigenaar aanvinkt; een tweede eigenaar kies je bewust.
  const [rol, setRol] = useState<BeheerderRol>('clubmanager')
  const tekst = useTekst(HUISSTIJL)
  const t = tekst.beheerders

  async function voegToe() {
    if (bezig || !naam.trim() || !email.trim()) return
    setBezig('nieuw')
    setFout(null)
    const uit = await stuur('/api/club/beheerders', 'POST', { naam, email, rol })
    setBezig(null)
    if (!uit.ok) return setFout(uit.fout)
    setNaam('')
    setEmail('')
    setRol('clubmanager')
    router.refresh()
  }

  async function doe(id: string, actie: BeheerderActie) {
    if (bezig) return
    if (!window.confirm(actie === 'stoppen' ? t.stoppenVraag : t.resetVraag)) return
    setBezig(id)
    setFout(null)
    const uit = await stuur(`/api/club/beheerders/${id}`, 'PATCH', { actie })
    setBezig(null)
    if (!uit.ok) return setFout(uit.fout)
    router.refresh()
  }

  async function kopieer(b: BeheerderOverzicht) {
    try {
      await navigator.clipboard.writeText(`${linkBasis ?? window.location.origin}/clubinloggen/${b.code}`)
      setGekopieerd(b.id)
    } catch {
      setFout(t.kopieerFout)
    }
  }

  const actieven = (beheerders ?? []).filter((b) => b.actief)

  return (
    <section className="club-kaart club-beheerders" aria-labelledby="beheerders-kop">
      <h2 id="beheerders-kop">{t.kop(sportschool)}</h2>
      <p className="club-hint">
        {t.uitleg}
        {!loginAan && ` ${t.loginUit}`}
      </p>

      {beheerders === null ? (
        <p className="club-melding club-melding--fout" role="alert">{t.laadFout}</p>
      ) : actieven.length === 0 ? (
        <p className="club-hint">{t.leeg}</p>
      ) : (
        <ul className="club-beheerders-lijst">
          {actieven.map((b) => (
            <li key={b.id} className="club-beheerders-rij">
              <div className="club-beheerders-wie">
                <strong>{b.naam}</strong>
                <span>{t.rollen[b.rol]}{b.email ? ` · ${b.email}` : ''}</span>
              </div>
              <span className={`club-chip ${status(b, t.status).chip}`}>{status(b, t.status).label}</span>
              {b.id === ikZelf ? (
                <span className="club-hint">{t.ikZelf}</span>
              ) : (
              <div className="club-beheerders-acties">
                {!b.heeftWachtwoord && (
                  <button type="button" className="club-knop club-knop--klein" onClick={() => void kopieer(b)}>
                    <Copy aria-hidden size={14} /> {gekopieerd === b.id ? t.gekopieerd : t.link}
                  </button>
                )}
                {(b.heeftWachtwoord || b.gesloten) && (
                  <button type="button" className="club-knop club-knop--klein" disabled={bezig !== null} onClick={() => void doe(b.id, 'reset')}>{t.nieuweUitnodiging}</button>
                )}
                <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig !== null} onClick={() => void doe(b.id, 'stoppen')}>{t.stoppen}</button>
              </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {eigenSportschool ? (
        <p className="club-hint">{t.eigen(sportschool)}</p>
      ) : (
      <form
        className="club-beheerders-nieuw"
        onSubmit={(e) => {
          e.preventDefault()
          void voegToe()
        }}
      >
        <label className="club-veld">
          <span>{tekst.algemeen.naam}</span>
          <input className="club-invoer" maxLength={60} value={naam} onChange={(e) => setNaam(e.target.value)} />
        </label>
        <label className="club-veld">
          <span>{tekst.algemeen.email}</span>
          <input className="club-invoer" type="email" maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="club-veld">
          <span>{t.rol}</span>
          <select className="club-invoer" value={rol} onChange={(e) => setRol(e.target.value as BeheerderRol)}>
            {BEHEERDER_ROLLEN.map((r) => (
              <option key={r} value={r}>{t.rollen[r]}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig !== null || !naam.trim() || !email.trim()}>
          <UserPlus aria-hidden size={16} /> {bezig === 'nieuw' ? t.uitnodigenBezig : t.uitnodigen}
        </button>
      </form>
      )}
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
    </section>
  )
}
