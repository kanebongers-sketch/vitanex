'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail } from 'lucide-react'
import { stuur } from '@/components/club/leden/stuur'
import type { LoginStaat } from '@/lib/club/medewerker-login/medewerker-login'
import { isGemaild, uitnodigLink, uitnodigMelding, uitnodigStand, type Gemaild } from '@/lib/club/start/team-uitnodigen'
import { KopieerKnop } from './KopieerKnop'

// De uitnodiging van een medewerker, in de rij van stap Team. Dezelfde API als
// bij Medewerkers, met mailen: Club mailt de eenmalige link (7 dagen geldig)
// naar de medewerker als mailen is ingesteld. De link staat daarna ook hier,
// om zelf door te sturen als de mail niet aankomt of mailen nog niet aan staat;
// we zeggen eerlijk welke van de twee. In de database staat alleen een hash.

interface TeamUitnodigingProps {
  medewerkerId: string
  naam: string
  email: string | null
  staat: LoginStaat
  loginAan: boolean
  /** Het adres van de sportschool (aiyourgym.com/<slug> of het subdomein), of null. */
  linkBasis: string | null
}

export function TeamUitnodiging({ medewerkerId, naam, email, staat, loginAan, linkBasis }: TeamUitnodigingProps) {
  const router = useRouter()
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState<string | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [gemaild, setGemaild] = useState<Gemaild | null>(null)
  const stand = uitnodigStand(email, staat, loginAan)
  const voornaam = naam.trim().split(' ')[0]
  const melding = link && email ? uitnodigMelding(gemaild, voornaam, email) : null

  async function nodigUit() {
    if (bezig || !email) return
    setBezig(true)
    setFout(null)
    const uit = await stuur(`/api/club/medewerker-toegang/${medewerkerId}`, 'PATCH', { actie: 'uitnodigen', email, mailen: true })
    setBezig(false)
    if (!uit.ok) return setFout(uit.fout)
    const data = typeof uit.data === 'object' && uit.data !== null ? (uit.data as { pad?: unknown; gemaild?: unknown }) : null
    const pad = data?.pad ?? null
    const mail = data?.gemaild
    setGemaild(isGemaild(mail) ? mail : null)
    const volledig = uitnodigLink(pad, linkBasis, window.location.origin)
    if (!volledig) return setFout('De uitnodiging is gemaakt, maar de link kwam niet mee. Probeer het nog een keer.')
    setLink(volledig)
    router.refresh()
  }

  return (
    <div className="club-start-uitnodig">
      <div className="club-start-uitnodig-rij">
        {stand.chip && <span className={`club-chip ${stand.chip.klasse}`}>{stand.chip.label}</span>}
        {stand.knop && !link && (
          <button type="button" className="club-knop club-knop--klein" disabled={bezig} aria-busy={bezig} onClick={() => void nodigUit()} aria-label={`${stand.knop}: ${naam}`}>
            <Mail aria-hidden size={14} /> {bezig ? 'Bezig...' : stand.knop}
          </button>
        )}
      </div>
      {stand.hint && <span className="club-zacht club-start-uitnodig-hint">{stand.hint}</span>}
      {link && (
        <div className="club-start-uitnodig-link" role="status">
          <span className={`club-hint${melding?.ok ? ' club-start-uitnodig-ok' : ''}`}>{melding?.tekst}</span>
          <span className="club-start-uitnodig-adres">
            <input className="club-invoer" readOnly value={link} aria-label={`Uitnodigingslink voor ${naam}`} onFocus={(e) => e.currentTarget.select()} />
            <KopieerKnop tekst={link} label={`uitnodigingslink voor ${naam}`} />
          </span>
        </div>
      )}
      {fout && <p className="club-fout" role="alert">{fout}</p>}
    </div>
  )
}
