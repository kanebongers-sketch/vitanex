'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { CLUB_DOMEIN, leesSlug, slugVoorstel } from '@/lib/club/kern/subdomein'
import { stuur } from '@/components/club/leden/stuur'

// Het eigen adres van de sportschool: <slug>.aiyourgym.com, zoals bij Virtuagym
// <naam>.virtuagym.com. Wordt meteen opgeslagen. Werkt pas als het domein live
// staat (schakelaar CLUB_SUBDOMEINEN_ACTIEF); tot dan is het een reservering.

interface AdresBlokProps {
  slug: string | null
  naam: string
  actief: boolean
}

export function AdresBlok({ slug, naam, actief }: AdresBlokProps) {
  const router = useRouter()
  const [waarde, setWaarde] = useState(slug ?? slugVoorstel(naam))
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)
  const controle = leesSlug(waarde)
  const gewijzigd = waarde.trim().toLowerCase() !== (slug ?? '')

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
        Je eigen adres voor medewerkers en leden. {actief ? 'Dit adres is actief.' : `Eigen adressen op ${CLUB_DOMEIN} komen binnenkort. Kies het nu, dan houden we het voor je vast. Tot dan logt iedereen in op ${CLUB_DOMEIN}/inloggen.`}
      </p>
      <div className="club-huisstijl-adres">
        <Globe aria-hidden size={18} />
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
        <span className="club-huisstijl-domein">.{CLUB_DOMEIN}</span>
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
