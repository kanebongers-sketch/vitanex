'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Phone, X } from 'lucide-react'
import { MAX_TAGS, normaliseerTag } from '@/lib/club/leden/invoer'
import { stuur } from './stuur'

// Gegevens van een lid. Contact en geboortedatum komen uit Sportivity en zijn
// hier alleen te zien; coach en tags horen bij de clubsoftware en zijn te
// wijzigen. Gezondheidsgegevens staan in de intake, niet hier.

interface Keuze {
  id: string
  naam: string
}

interface LidGegevensProps {
  lidId: string
  email: string | null
  telefoon: string | null
  geboortedatum: string | null
  leeftijd: number | null
  coachId: string | null
  trainers: Keuze[]
  tags: string[]
}

function Contact({ email, telefoon, geboortedatum, leeftijd }: Pick<LidGegevensProps, 'email' | 'telefoon' | 'geboortedatum' | 'leeftijd'>) {
  return (
    <dl className="club-leden-gegevens">
      <div>
        <dt>E-mail</dt>
        <dd>{email ? <a href={`mailto:${email}`}><Mail aria-hidden size={14} /> {email}</a> : <span className="club-zacht">Onbekend</span>}</dd>
      </div>
      <div>
        <dt>Telefoon</dt>
        <dd>{telefoon ? <a href={`tel:${telefoon}`}><Phone aria-hidden size={14} /> {telefoon}</a> : <span className="club-zacht">Onbekend</span>}</dd>
      </div>
      <div>
        <dt>Geboortedatum</dt>
        <dd>{geboortedatum ? `${geboortedatum}${leeftijd !== null ? ` (${leeftijd} jaar)` : ''}` : <span className="club-zacht">Onbekend</span>}</dd>
      </div>
    </dl>
  )
}

export function LidGegevens(props: LidGegevensProps) {
  const router = useRouter()
  const [nieuweTag, setNieuweTag] = useState('')
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)
  const [, startTransition] = useTransition()

  async function bewaar(wijziging: { coachId?: string | null; tags?: string[] }): Promise<boolean> {
    setBezig(true)
    setFout(null)
    const uit = await stuur(`/api/club/leden/${props.lidId}`, 'PATCH', wijziging)
    setBezig(false)
    if (!uit.ok) {
      setFout(uit.fout)
      return false
    }
    startTransition(() => router.refresh())
    return true
  }

  async function voegTagToe(e: FormEvent) {
    e.preventDefault()
    const tag = normaliseerTag(nieuweTag)
    if (!tag) return setFout('Een tag bestaat uit letters, cijfers en streepjes (maximaal 30 tekens).')
    if (props.tags.includes(tag)) return setNieuweTag('')
    if (props.tags.length >= MAX_TAGS) return setFout(`Maximaal ${MAX_TAGS} tags per lid.`)
    if (await bewaar({ tags: [...props.tags, tag] })) setNieuweTag('')
  }

  return (
    <section className="club-kaart" id="gegevens" aria-labelledby="gegevens-kop">
      <h2 id="gegevens-kop">Gegevens</h2>
      <Contact email={props.email} telefoon={props.telefoon} geboortedatum={props.geboortedatum} leeftijd={props.leeftijd} />
      <p className="club-hint">Contactgegevens komen uit je ledenbestand. Pas ze aan in je ledenadministratie en lees het bestand opnieuw in.</p>

      <label className="club-veld club-leden-blok">
        <span>Coach</span>
        <select className="club-invoer" value={props.coachId ?? ''} disabled={bezig}
          onChange={(e) => void bewaar({ coachId: e.target.value || null })}>
          <option value="">Geen coach</option>
          {props.trainers.map((t) => <option key={t.id} value={t.id}>{t.naam}</option>)}
        </select>
      </label>

      <div className="club-leden-blok">
        <span className="club-label">Tags</span>
        {props.tags.length ? (
          <ul className="club-leden-tags">
            {props.tags.map((tag) => (
              <li key={tag} className="club-chip club-chip--geen">
                {tag}
                <button type="button" aria-label={`Tag ${tag} weghalen`} disabled={bezig}
                  onClick={() => void bewaar({ tags: props.tags.filter((t) => t !== tag) })}>
                  <X aria-hidden size={12} />
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="club-hint">Nog geen tags.</p>}
        <form className="club-leden-tagform" onSubmit={voegTagToe}>
          <label className="club-sr" htmlFor="nieuwe-tag">Nieuwe tag</label>
          <input id="nieuwe-tag" className="club-invoer" value={nieuweTag} onChange={(e) => setNieuweTag(e.target.value)}
            placeholder="Bijvoorbeeld pt-interesse" maxLength={40} autoComplete="off" />
          <button type="submit" className="club-knop club-knop--klein" disabled={bezig || !nieuweTag.trim()}>Toevoegen</button>
        </form>
      </div>
      {fout ? <p className="club-fout" role="alert">{fout}</p> : null}
    </section>
  )
}
