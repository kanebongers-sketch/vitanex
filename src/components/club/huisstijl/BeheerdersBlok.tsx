'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, UserPlus } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import { BEHEERDER_ROLLEN, ROL_LABEL, type BeheerderActie, type BeheerderOverzicht, type BeheerderRol } from '@/lib/club/beheerders/beheerder'

// Alleen voor Kane: eigenaren en clubmanagers van de sportschool die open
// staat. Kane zet iemand klaar, geeft de persoonlijke link, keurt de gekozen
// pincode goed door de controlecode in te vullen die de beheerder noemt (de
// server controleert hem), en kan resetten of stoppen. Fit Factory zelf krijgt
// nog geen beheerders: Club blijft geheim tot de presentatie.

interface BeheerdersBlokProps {
  sportschool: string
  beheerders: BeheerderOverzicht[] | null
  loginAan: boolean
  /** De eigen sportschool van Kane (Fit Factory): dan geen nieuwe beheerders. */
  eigenSportschool: boolean
}

const STATUS: Record<BeheerderOverzicht['pinStatus'], { label: string; chip: string }> = {
  geen: { label: 'Nog geen pincode', chip: 'club-chip--uit' },
  wacht: { label: 'Pincode wacht', chip: 'club-chip--merk' },
  actief: { label: 'Actief', chip: 'club-chip--ok' },
}

export function BeheerdersBlok({ sportschool, beheerders, loginAan, eigenSportschool }: BeheerdersBlokProps) {
  const router = useRouter()
  const [bezig, setBezig] = useState<string | null>(null)
  const [fout, setFout] = useState<string | null>(null)
  const [gekopieerd, setGekopieerd] = useState<string | null>(null)
  const [naam, setNaam] = useState('')
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState<BeheerderRol>('eigenaar')
  const [controles, setControles] = useState<Record<string, string>>({})

  async function voegToe() {
    if (bezig || !naam.trim()) return
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
    if ((actie === 'stoppen' || actie === 'reset') && !window.confirm(actie === 'stoppen' ? 'Deze beheerder stoppen? De link werkt dan niet meer.' : 'Pincode resetten? Alle toestellen worden uitgelogd.')) return
    setBezig(id)
    setFout(null)
    const uit = await stuur(`/api/club/beheerders/${id}`, 'PATCH', { actie, controle: controles[id] ?? '' })
    setBezig(null)
    if (!uit.ok) return setFout(uit.fout)
    setControles((oud) => Object.fromEntries(Object.entries(oud).filter(([k]) => k !== id)))
    router.refresh()
  }

  async function kopieer(b: BeheerderOverzicht) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/clubinloggen/${b.code}`)
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
        Eigenaren en clubmanagers loggen in met een persoonlijke link en een pincode die jij goedkeurt. Ze zien alleen deze sportschool.
        {!loginAan && ' De eigen login staat nog uit: de links werken pas als de schakelaar aan gaat.'}
      </p>

      {beheerders === null ? (
        <p className="club-melding club-melding--fout" role="alert">De beheerders konden niet worden gelezen. Is migratie 408 al gedraaid?</p>
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
              <span className={`club-chip ${b.gesloten ? 'club-chip--let-op' : STATUS[b.pinStatus].chip}`}>
                {b.gesloten ? 'Dicht na foute pogingen' : STATUS[b.pinStatus].label}
              </span>
              {b.pinStatus === 'wacht' && (
                <label className="club-beheerders-controle">
                  <span>Controlecode</span>
                  <input
                    className="club-invoer"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="4 cijfers"
                    aria-label={`Controlecode die ${b.naam} je noemt`}
                    value={controles[b.id] ?? ''}
                    onChange={(e) => setControles((oud) => ({ ...oud, [b.id]: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  />
                </label>
              )}
              <div className="club-beheerders-acties">
                <button type="button" className="club-knop club-knop--klein" onClick={() => void kopieer(b)}>
                  <Copy aria-hidden size={14} /> {gekopieerd === b.id ? 'Gekopieerd' : 'Link'}
                </button>
                {b.pinStatus === 'wacht' && (
                  <>
                    <button type="button" className="club-knop club-knop--klein club-knop--primair" disabled={bezig !== null || (controles[b.id] ?? '').length !== 4} onClick={() => void doe(b.id, 'goedkeuren')}>Goedkeuren</button>
                    <button type="button" className="club-knop club-knop--klein" disabled={bezig !== null} onClick={() => void doe(b.id, 'afwijzen')}>Afwijzen</button>
                  </>
                )}
                {(b.pinStatus === 'actief' || b.gesloten) && (
                  <button type="button" className="club-knop club-knop--klein" disabled={bezig !== null} onClick={() => void doe(b.id, 'reset')}>Pincode resetten</button>
                )}
                <button type="button" className="club-knop club-knop--klein club-knop--gevaar" disabled={bezig !== null} onClick={() => void doe(b.id, 'stoppen')}>Stoppen</button>
              </div>
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
          <span>E-mail (optioneel)</span>
          <input className="club-invoer" type="email" maxLength={120} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="club-veld">
          <span>Rol</span>
          <select className="club-invoer" value={rol} onChange={(e) => setRol(e.target.value as BeheerderRol)}>
            {BEHEERDER_ROLLEN.map((r) => (
              <option key={r} value={r}>{ROL_LABEL[r]}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig !== null || !naam.trim()}>
          <UserPlus aria-hidden size={16} /> {bezig === 'nieuw' ? 'Toevoegen...' : 'Toevoegen'}
        </button>
      </form>
      )}
      {fout && <p className="club-melding club-melding--fout" role="alert">{fout}</p>}
    </section>
  )
}
