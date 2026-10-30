'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Phone, X } from 'lucide-react'
import { MAX_TAGS, normaliseerTag } from '@/lib/club/leden/invoer'
import { stuur } from './stuur'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { LIDKAART_BLOKKEN } from '@/lib/aiyourgym/taal/woorden/club/ledenkaart'

// Gegevens van een lid. Contact en geboortedatum komen uit de ledenadministratie
// (Ledenbestand inlezen) en zijn hier alleen te zien (blok Contact op het
// tabblad Contact en notities); coach en tags zijn hier te wijzigen. De status
// staat bij Lidmaatschap. Gezondheidsgegevens staan in de intake, niet hier.

interface Keuze {
  id: string
  naam: string
}

interface LidGegevensProps {
  lidId: string
  coachId: string | null
  trainers: Keuze[]
  tags: string[]
  /** Rollen v2, alleen zien: coach en labels tonen zonder ze te kunnen wijzigen. */
  alleenLezen?: boolean
}

interface ContactProps {
  email: string | null
  telefoon: string | null
  geboortedatum: string | null
  leeftijd: number | null
}

export function Contact({ email, telefoon, geboortedatum, leeftijd }: ContactProps) {
  const t = useTekst(LIDKAART_BLOKKEN).gegevens
  return (
    <dl className="club-leden-gegevens">
      <div>
        <dt>{t.email}</dt>
        <dd>{email ? <a href={`mailto:${email}`}><Mail aria-hidden size={14} /> {email}</a> : <span className="club-zacht">{t.onbekend}</span>}</dd>
      </div>
      <div>
        <dt>{t.telefoon}</dt>
        <dd>{telefoon ? <a href={`tel:${telefoon}`}><Phone aria-hidden size={14} /> {telefoon}</a> : <span className="club-zacht">{t.onbekend}</span>}</dd>
      </div>
      <div>
        <dt>{t.geboortedatum}</dt>
        <dd>{geboortedatum ? `${geboortedatum}${leeftijd !== null ? ` (${t.jaar(leeftijd)})` : ''}` : <span className="club-zacht">{t.onbekend}</span>}</dd>
      </div>
    </dl>
  )
}

export function LidGegevens(props: LidGegevensProps) {
  const router = useRouter()
  const t = useTekst(LIDKAART_BLOKKEN).gegevens
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
    if (!tag) return setFout(t.tagOngeldig)
    if (props.tags.includes(tag)) return setNieuweTag('')
    if (props.tags.length >= MAX_TAGS) return setFout(t.teVeelTags(MAX_TAGS))
    if (await bewaar({ tags: [...props.tags, tag] })) setNieuweTag('')
  }

  return (
    <section className="club-kaart" id="gegevens" aria-labelledby="gegevens-kop">
      <h2 id="gegevens-kop">{t.kop}</h2>

      <label className="club-veld club-leden-blok">
        <span>{t.coach}</span>
        <select className="club-invoer" value={props.coachId ?? ''} disabled={bezig || props.alleenLezen}
          onChange={(e) => void bewaar({ coachId: e.target.value || null })}>
          <option value="">{t.geenCoach}</option>
          {props.trainers.map((m) => <option key={m.id} value={m.id}>{m.naam}</option>)}
        </select>
      </label>

      <div className="club-leden-blok">
        <span className="club-label">{t.tags}</span>
        {props.tags.length ? (
          <ul className="club-leden-tags">
            {props.tags.map((tag) => (
              <li key={tag} className="club-chip club-chip--geen">
                {tag}
                {!props.alleenLezen && (
                  <button type="button" aria-label={t.tagWeg(tag)} disabled={bezig}
                    onClick={() => void bewaar({ tags: props.tags.filter((x) => x !== tag) })}>
                    <X aria-hidden size={12} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : <p className="club-hint">{t.geenTags}</p>}
        {!props.alleenLezen && <form className="club-leden-tagform" onSubmit={voegTagToe}>
          <label className="club-sr" htmlFor="nieuwe-tag">{t.nieuweTag}</label>
          <input id="nieuwe-tag" className="club-invoer" value={nieuweTag} onChange={(e) => setNieuweTag(e.target.value)}
            placeholder={t.tagVoorbeeld} maxLength={40} autoComplete="off" />
          <button type="submit" className="club-knop club-knop--klein" disabled={bezig || !nieuweTag.trim()}>{t.toevoegen}</button>
        </form>}
      </div>
      {fout ? <p className="club-fout" role="alert">{fout}</p> : null}
    </section>
  )
}
