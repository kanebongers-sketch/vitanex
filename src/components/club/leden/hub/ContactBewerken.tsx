'use client'

import { useEffect, useId, useRef, useState, useTransition, type FormEvent, type InputHTMLAttributes, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CONTACT_VELDEN, MAX_ACHTERNAAM, MAX_VOORNAAM, leesContact, type ContactFout, type ContactFouten, type ContactVeld } from '@/lib/club/leden/invoer'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { LIDKAART_BLOKKEN } from '@/lib/aiyourgym/taal/woorden/club/ledenkaart'
import { Contact } from '../LidGegevens'
import { stuur } from '../stuur'

// Contactgegevens van een lid op de ledenkaart: tonen (Contact) en, voor wie
// Leden mag bewerken, wijzigen in een formulier op dezelfde plek (zelfde vorm
// als de acties bij Lidmaatschap). Alleen gewijzigde velden gaan naar de API;
// de regels staan in leesContact (getest) en draaien hier en op de server.

type Waarden = Record<ContactVeld, string>
type VeldFouten = Partial<Record<ContactVeld, string>>
type Melding = { soort: 'ok' | 'fout'; tekst: string } | null

interface ContactBewerkenProps {
  lidId: string
  voornaam: string
  achternaam: string
  email: string | null
  telefoon: string | null
  /** yyyy-mm-dd, voor het datumveld. */
  geboortedatum: string | null
  /** De geboortedatum zoals hij in beeld staat. */
  geboortedatumTekst: string | null
  leeftijd: number | null
  /** Vandaag als yyyy-mm-dd (Nederlandse dag). */
  vandaag: string
  /** Leesmodus (alleen zien): geen knop Wijzigen. */
  alleenLezen: boolean
}

interface VeldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'> {
  id: string
  label: string
  fout: string | undefined
}

function Veld({ id, label, fout, ...invoer }: VeldProps) {
  return (
    <label className="club-veld" htmlFor={id}>
      <span>{label}</span>
      <input id={id} className="club-invoer" autoComplete="off" aria-invalid={fout ? true : undefined} aria-describedby={fout ? `${id}-fout` : undefined} {...invoer} />
      {fout ? <small id={`${id}-fout`} className="club-fout">{fout}</small> : null}
    </label>
  )
}

function beginWaarden(p: ContactBewerkenProps): Waarden {
  return { voornaam: p.voornaam, achternaam: p.achternaam, email: p.email ?? '', telefoon: p.telefoon ?? '', geboortedatum: p.geboortedatum?.slice(0, 10) ?? '' }
}

/** Alleen wat anders is dan wat er stond. */
function gewijzigd(nu: Waarden, begin: Waarden): Partial<Waarden> {
  return Object.fromEntries(CONTACT_VELDEN.filter((v) => nu[v].trim() !== begin[v].trim()).map((v) => [v, nu[v]])) as Partial<Waarden>
}

/** De fouten per veld die de server meestuurt ({ velden: { email: '...' } }). */
function serverFouten(data: unknown): VeldFouten {
  const velden = typeof data === 'object' && data !== null ? (data as Record<string, unknown>).velden : null
  if (typeof velden !== 'object' || velden === null) return {}
  const ruw = velden as Record<string, unknown>
  return Object.fromEntries(CONTACT_VELDEN.flatMap((v) => (typeof ruw[v] === 'string' ? [[v, ruw[v]] as const] : []))) as VeldFouten
}

/** De foutcodes van leesContact als tekst in de taal van de pagina. */
function foutTeksten(fouten: ContactFouten, teksten: Record<ContactFout, string>): VeldFouten {
  const per: VeldFouten = {}
  for (const v of CONTACT_VELDEN) {
    const code = fouten[v]
    if (code) per[v] = teksten[code]
  }
  return per
}

export function ContactBewerken(props: ContactBewerkenProps) {
  const w = useTekst(LIDKAART_BLOKKEN)
  const router = useRouter()
  const id = useId()
  const [, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [waarden, setWaarden] = useState<Waarden>(() => beginWaarden(props))
  const [fouten, setFouten] = useState<VeldFouten>({})
  const [melding, setMelding] = useState<Melding>(null)
  const knop = useRef<HTMLButtonElement>(null)
  /** Waar de focus heen moet na de volgende render: een veld, of terug naar de knop. */
  const focusNa = useRef<ContactVeld | 'knop' | null>(null)

  useEffect(() => {
    const doel = focusNa.current
    if (!doel) return
    focusNa.current = null
    if (doel === 'knop') knop.current?.focus()
    // Het veld staat pas na het tekenen in de pagina: opzoeken op het eigen id.
    else document.getElementById(`${id}-${doel}`)?.focus()
  })

  function openen() {
    setWaarden(beginWaarden(props))
    setFouten({})
    setMelding(null)
    focusNa.current = 'voornaam'
    setOpen(true)
  }

  function sluiten(nieuweMelding: Melding) {
    focusNa.current = 'knop'
    setMelding(nieuweMelding)
    setOpen(false)
  }

  function toonFouten(per: VeldFouten, tekst: string) {
    setFouten(per)
    setMelding({ soort: 'fout', tekst })
    focusNa.current = CONTACT_VELDEN.find((v) => per[v]) ?? null
  }

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    const body = gewijzigd(waarden, beginWaarden(props))
    if (Object.keys(body).length === 0) return sluiten(null)
    const gelezen = leesContact(body, props.vandaag)
    if (!gelezen.ok) return toonFouten(foutTeksten(gelezen.fouten, w.contact.fout), w.contact.controleer)
    setBezig(true)
    setFouten({})
    setMelding(null)
    const uit = await stuur(`/api/club/leden/${encodeURIComponent(props.lidId)}`, 'PATCH', gelezen.waarde)
    setBezig(false)
    if (!uit.ok) return toonFouten(serverFouten(uit.data), uit.fout)
    const loginBlijft = typeof uit.data === 'object' && uit.data !== null && (uit.data as Record<string, unknown>).loginBlijft === true
    sluiten({ soort: 'ok', tekst: loginBlijft ? w.contact.loginBlijft : w.contact.opgeslagen })
    startTransition(() => router.refresh())
  }

  function toets(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key !== 'Escape' || bezig) return
    e.stopPropagation()
    sluiten(null)
  }

  const veld = (v: ContactVeld, label: string): VeldProps => ({
    id: `${id}-${v}`,
    label,
    fout: fouten[v],
    value: waarden[v],
    disabled: bezig,
    onChange: (e) => setWaarden({ ...waarden, [v]: e.target.value }),
  })

  return (
    <>
      <Contact email={props.email} telefoon={props.telefoon} geboortedatum={props.geboortedatumTekst} leeftijd={props.leeftijd} />
      {!props.alleenLezen && !open && (
        <div className="club-acties">
          <button ref={knop} type="button" className="club-knop club-knop--klein" onClick={openen}>{w.contact.wijzig}</button>
        </div>
      )}
      {!props.alleenLezen && open && (
        <form className="club-lidhub-actieform" aria-label={w.contact.formulier} noValidate onSubmit={bewaar} onKeyDown={toets}>
          <div className="club-formrij">
            <Veld {...veld('voornaam', w.contact.voornaam)} type="text" maxLength={MAX_VOORNAAM} required />
            <Veld {...veld('achternaam', w.contact.achternaam)} type="text" maxLength={MAX_ACHTERNAAM} required />
            <Veld {...veld('email', w.gegevens.email)} type="email" inputMode="email" maxLength={120} spellCheck={false} />
            <Veld {...veld('telefoon', w.gegevens.telefoon)} type="tel" inputMode="tel" maxLength={30} />
            <Veld {...veld('geboortedatum', w.gegevens.geboortedatum)} type="date" max={props.vandaag} />
          </div>
          <div className="club-acties">
            <button type="submit" className="club-knop club-knop--primair club-knop--klein" disabled={bezig} aria-busy={bezig || undefined}>
              {bezig ? w.contact.bezig : w.contact.opslaan}
            </button>
            <button type="button" className="club-knop club-knop--stil club-knop--klein" disabled={bezig} onClick={() => sluiten(null)}>{w.contact.annuleer}</button>
          </div>
        </form>
      )}
      {melding && <p className={`club-melding ${melding.soort === 'ok' ? 'club-melding--ok' : 'club-melding--fout'}`} role={melding.soort === 'ok' ? 'status' : 'alert'}>{melding.tekst}</p>}
    </>
  )
}
