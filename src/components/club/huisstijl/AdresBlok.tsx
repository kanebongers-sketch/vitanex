'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import { adresVan, adresVeld, leesSlug, slugVoorstel } from '@/lib/club/kern/subdomein'
import { stuur } from '@/components/club/leden/stuur'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { HUISSTIJL } from '@/lib/aiyourgym/taal/woorden/club/huisstijl'

// Het eigen adres van de sportschool. Tot de volledige livegang
// aiyourgym.com/<slug> (besluit Kane 23-10-2026); met de schakelaar
// CLUB_SUBDOMEINEN_ACTIEF aan <slug>.aiyourgym.com. Los (huisstijl-portaal)
// met een eigen knop die meteen opslaat; in de startwizard zonder knop
// (`onWijzig`): daar bewaart de knop onderaan de stap het adres.

interface AdresBlokProps {
  slug: string | null
  naam: string
  /** Staan de subdomeinen aan? Dan <slug>.aiyourgym.com, anders aiyourgym.com/<slug>. */
  subdomeinen: boolean
  /** In de wizard: geen eigen knop, de stap krijgt elke wijziging en slaat zelf op. */
  onWijzig?: (waarde: string) => void
  /** Begint met deze waarde (de wizard houdt hem vast tussen renders). */
  begin?: string
}

export function AdresBlok({ slug, naam, subdomeinen, onWijzig, begin }: AdresBlokProps) {
  const router = useRouter()
  const [waarde, setWaarde] = useState(begin ?? slug ?? slugVoorstel(naam))
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState<{ ok: boolean; tekst: string } | null>(null)
  const controle = leesSlug(waarde)
  const gewijzigd = waarde.trim().toLowerCase() !== (slug ?? '')
  const veld = adresVeld(subdomeinen)
  const metKnop = !onWijzig
  const tekst = useTekst(HUISSTIJL)
  const t = tekst.adres

  async function bewaar() {
    if (!controle.ok) return setMelding({ ok: false, tekst: controle.fout })
    setBezig(true)
    const uit = await stuur('/api/club/organisatie/adres', 'PATCH', { slug: controle.slug })
    setBezig(false)
    if (!uit.ok) return setMelding({ ok: false, tekst: uit.fout })
    setMelding({ ok: true, tekst: t.opgeslagen })
    router.refresh()
  }

  return (
    <section className="club-huisstijl-blok" aria-labelledby="adres-kop">
      <h2 id="adres-kop" className="club-huisstijl-kop">{t.kop}</h2>
      <p className="club-hint">{slug ? t.uitlegMet(adresVan(slug, subdomeinen)) : t.uitleg}</p>
      <div className="club-huisstijl-adres">
        <Globe aria-hidden size={18} />
        {veld.voor && <span className="club-huisstijl-domein">{veld.voor}</span>}
        <input
          className="club-invoer"
          aria-label={t.label}
          aria-describedby="adres-melding"
          aria-invalid={!controle.ok}
          value={waarde}
          maxLength={40}
          spellCheck={false}
          onChange={(e) => {
            const nieuw = e.target.value.toLowerCase()
            setMelding(null)
            setWaarde(nieuw)
            onWijzig?.(nieuw)
          }}
        />
        {veld.achter && <span className="club-huisstijl-domein">{veld.achter}</span>}
        {metKnop && (
          <button type="button" className="club-knop" disabled={bezig || !gewijzigd} onClick={() => void bewaar()}>
            {bezig ? tekst.algemeen.bezig : t.opslaan}
          </button>
        )}
      </div>
      <div id="adres-melding" aria-live="polite">
        {!controle.ok && gewijzigd && <p className="club-melding club-melding--fout">{controle.fout}</p>}
        {!metKnop && controle.ok && gewijzigd && slug && (
          <p className="club-melding">{t.letOp(adresVan(slug, subdomeinen), adresVan(controle.slug, subdomeinen))}</p>
        )}
        {melding && <p className={`club-melding ${melding.ok ? 'club-melding--ok' : 'club-melding--fout'}`}>{melding.tekst}</p>}
      </div>
    </section>
  )
}
