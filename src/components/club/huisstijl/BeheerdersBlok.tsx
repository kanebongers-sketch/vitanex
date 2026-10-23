'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, UserPlus } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { BEHEERDER_ROLLEN, ROL_LABEL, type BeheerderActie, type BeheerderOverzicht, type BeheerderRol } from '@/lib/club/beheerders/beheerder'

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
  /** https://<slug>.aiyourgym.com als de sportschool een eigen adres heeft; anders dit domein. */
  linkBasis: string | null
}

function status(b: BeheerderOverzicht): { label: string; chip: string } {
  if (b.gesloten) return { label: 'Dicht na foute pogingen', chip: 'club-chip--let-op' }
  return b.heeftWachtwoord ? { label: 'Actief', chip: 'club-chip--ok' } : { label: 'Uitgenodigd', chip: 'club-chip--merk' }
}

export function BeheerdersBlok({ sportschool, beheerders, loginAan, eigenSportschool, ikZelf, linkBasis }: BeheerdersBlokProps) {
  const router = useRouter()
  const [bezig, setBezig] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [gekopieerd, setGekopieerd] = useState<string | null>(null)
  const [naam, setNaam] = useState('')
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState<BeheerderRol>('eigenaar')

  async function voegToe() {
    if (bezig || !naam.trim() || !email.trim()) return
    setBezig('nieuw')
    setFout(null)
    const uit = await stuur('/api/club/beheerders', 'POST', { naam, email, rol })
    setBezig(null)
    if (!uit.ok) return setFout(uit.fout)
    setNaam('')
    setEmail('')
    router.refresh()
  }

  async function doe(id: string, actie: BeheerderActie) {
    if (bezig) return
    if (!window.confirm(actie === 'stoppen' ? 'Deze beheerder stoppen? Inloggen kan dan niet meer.' : 'Nieuwe uitnodiging maken? Het wachtwoord vervalt, de oude link werkt niet meer en alle toestellen worden uitgelogd.')) return
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
      setFout('Kopieren lukte niet. Selecteer de link en kopieer hem zelf.')
    }
  }

  const actieven = (beheerders ?? []).filter((b) => b.actief)

  return (
    <section className="club-kaart club-beheerders" aria-labelledby="beheerders-kop">
      <h2 id="beheerders-kop">Beheerders van {sportschool}</h2>
      <p className="club-hint">
        Nodig eigenaren en clubmanagers uit met hun e-mailadres. Met de uitnodigingslink kiezen ze een keer een wachtwoord; daarna loggen ze in met e-mailadres en wachtwoord. Ze zien alleen deze sportschool. Een eigenaar mag alles; een clubmanager ziet wat je bij de rol Clubmanager aanvinkt bij Instellingen, Rechten per rol.
        {!loginAan && ' De eigen login staat nog uit: uitnodigingen werken pas als de schakelaar aan gaat.'}
      </p>

      {beheerders === null ? (
        <p className="club-melding club-melding--fout" role="alert">De beheerders konden niet worden gelezen. Is migratie 410 al gedraaid?</p>
      ) : actieven.length === 0 ? (
        <p className="club-hint">Nog geen beheerders.</p>
      ) : (
        <ul className="club-beheerders-lijst">
          {actieven.map((b) => (
            <li key={b.id} className="club-beheerders-rij">
              <div className="club-beheerders-wie">
                <strong>{b.naam}</strong>
                <span>{ROL_LABEL[b.rol]}{b.email ? ` · ${b.email}` : ''}</span>
              </div>
              <span className={`club-chip ${status(b).chip}`}>{status(b).label}</span>
              {b.id === ikZelf ? (
                <span className="club-hint">Dit ben jij</span>
              ) : (
              <div className="club-beheerders-acties">
                {!b.heeftWachtwoord && (
                  <button type="button" className="club-knop club-knop--klein" onClick={() => void kopieer(b)}>
                    <Copy aria-hidden size={14} /> {gekopieerd === b.id ? 'Gekopieerd' : 'Uitnodigingslink'}
                  </button>
                )}
                {(b.heeftWachtwoord || b.gesloten) && (
                  <button type="button" className="club-knop club-knop--klein" disabled={bezig !== null} onClick={() => void doe(b.id, 'reset')}>Nieuwe uitnodiging</button>
                )}
                <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig !== null} onClick={() => void doe(b.id, 'stoppen')}>Stoppen</button>
              </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {eigenSportschool ? (
        <p className="club-hint">Voor {sportschool} zelf maak je nog geen beheerders aan: Club blijft geheim tot de presentatie.</p>
      ) : (
      <form
        className="club-beheerders-nieuw"
        onSubmit={(e) => {
          e.preventDefault()
          void voegToe()
        }}
      >
        <label className="club-veld">
          <span>Naam</span>
          <input className="club-invoer" maxLength={60} value={naam} onChange={(e) => setNaam(e.target.value)} />
        </label>
        <label className="club-veld">
          <span>E-mail</span>
          <input className="club-invoer" type="email" maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="club-veld">
          <span>Rol</span>
          <select className="club-invoer" value={rol} onChange={(e) => setRol(e.target.value as BeheerderRol)}>
            {BEHEERDER_ROLLEN.map((r) => (
              <option key={r} value={r}>{ROL_LABEL[r]}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig !== null || !naam.trim() || !email.trim()}>
          <UserPlus aria-hidden size={16} /> {bezig === 'nieuw' ? 'Uitnodigen...' : 'Uitnodigen'}
        </button>
      </form>
      )}
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
    </section>
  )
}
