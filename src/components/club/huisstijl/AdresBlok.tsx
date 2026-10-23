'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { adresVan, adresVeld, leesSlug, slugVoorstel } from '@/lib/club/kern/subdomein'
import { stuur } from '@/components/club/leden/stuur'

// Het eigen adres van de sportschool. Tot de volledige livegang
// aiyourgym.com/<slug> (besluit Kane 23-10-2026); met de schakelaar
// CLUB_SUBDOMEINEN_ACTIEF aan <slug>.aiyourgym.com, zoals bij Virtuagym
// <naam>.virtuagym.com. Wordt meteen opgeslagen en werkt meteen.

interface AdresBlokProps {
  slug: string | null
  naam: string
  /** Staan de subdomeinen aan? Dan <slug>.aiyourgym.com, anders aiyourgym.com/<slug>. */
  subdomeinen: boolean
}

export function AdresBlok({ slug, naam, subdomeinen }: AdresBlokProps) {
  const router = useRouter()
  const [waarde, setWaarde] = useState(slug ?? slugVoorstel(naam))
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)
  const controle = leesSlug(waarde)
  const gewijzigd = waarde.trim().toLowerCase() !== (slug ?? '')
  const veld = adresVeld(subdomeinen)

  async function bewaar() {
    if (!controle.ok) return setMelding({ ok: false, tekst: controle.fout })
    setBezig(true)
    const uit = await stuur('/api/club/organisatie/adres', 'PATCH', { slug: controle.slug })
    setBezig(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    setMelding({ ok: true, tekst: 'Adres opgeslagen.' })
    router.refresh()
  }

  return (
    <section className="club-huisstijl-blok" aria-labelledby="adres-kop">
      <h2 id="adres-kop" className="club-huisstijl-kop">Adres</h2>
      <p className="club-hint">
        Je eigen adres voor medewerkers en leden{slug ? `: ${adresVan(slug, subdomeinen)}` : ''}. Wijzig je het, dan werkt het oude adres niet meer.
      </p>
      <div className="club-huisstijl-adres">
        <Globe aria-hidden size={18} />
        {veld.voor && <span className="club-huisstijl-domein">{veld.voor}</span>}
        <input
          className="club-invoer"
          aria-label="Adres van je sportschool"
          aria-describedby="adres-melding"
          aria-invalid={!controle.ok}
          value={waarde}
          maxLength={40}
          spellCheck={false}
          onChange={(e) => {
            setMelding(null)
            setWaarde(e.target.value.toLowerCase())
          }}
        />
        {veld.achter && <span className="club-huisstijl-domein">{veld.achter}</span>}
        <button type="button" className="club-knop" disabled={bezig || !gewijzigd} onClick={() => void bewaar()}>
          {bezig ? 'Opslaan...' : 'Adres opslaan'}
        </button>
      </div>
      <div id="adres-melding" aria-live="polite">
        {!controle.ok && gewijzigd && <p className="club-melding club-melding--fout">{controle.fout}</p>}
        {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
      </div>
    </section>
  )
}
