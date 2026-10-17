'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { SOCIAL_LABEL, type Gegevens } from '@/lib/club/bedrijf/model'
import { leesGegevens } from '@/lib/club/bedrijf/invoer'
import { stuur } from '@/components/club/leden/stuur'

// Tabblad Gegevens: de officiele gegevens van de sportschool. Eerst in de
// browser gecontroleerd (zelfde regels als de server), zodat de fout bij het
// juiste veld staat.

type Veld = keyof Gegevens

interface VeldInfo {
  veld: Veld
  label: string
  type?: 'text' | 'email' | 'tel' | 'url'
  placeholder?: string
  hint?: string
  breed?: boolean
  auto?: string
}

const GROEPEN: { titel: string; uitleg: string; velden: VeldInfo[] }[] = [
  {
    titel: 'Bedrijf',
    uitleg: 'Zoals in het Handelsregister. Je leden zien dit onder je voorwaarden.',
    velden: [
      { veld: 'bedrijfsnaam', label: 'Officiele bedrijfsnaam', placeholder: 'Bijvoorbeeld: Sportschool Jansen B.V.', breed: true, auto: 'organization' },
      { veld: 'kvk', label: 'KvK-nummer', placeholder: '8 cijfers', hint: 'Precies 8 cijfers.' },
      { veld: 'btw', label: 'Btw-nummer (mag leeg)', placeholder: 'NL123456789B01', hint: 'We controleren het controlegetal.' },
    ],
  },
  {
    titel: 'Hoofdkantoor',
    uitleg: 'Het postadres van het bedrijf. De adressen van je vestigingen staan hieronder apart.',
    velden: [
      { veld: 'adres', label: 'Straat en huisnummer', breed: true, auto: 'address-line1' },
      { veld: 'postcode', label: 'Postcode', placeholder: '1234 AB', auto: 'postal-code' },
      { veld: 'plaats', label: 'Plaats', auto: 'address-level2' },
    ],
  },
  {
    titel: 'Contact',
    uitleg: 'Algemeen contact, los van de balie per vestiging.',
    velden: [
      { veld: 'telefoon', label: 'Telefoon', type: 'tel', auto: 'tel' },
      { veld: 'email', label: 'E-mail', type: 'email', auto: 'email' },
      { veld: 'website', label: 'Website', type: 'url', placeholder: 'https://www.jouwsportschool.nl', breed: true, auto: 'url' },
    ],
  },
  {
    titel: 'Social media',
    uitleg: 'Alleen https-links naar je eigen pagina op dat netwerk.',
    velden: (['instagram', 'facebook', 'tiktok', 'linkedin'] as const).map((s) => ({
      veld: s,
      label: SOCIAL_LABEL[s],
      type: 'url' as const,
      placeholder: `https://www.${s}.com/jouwsportschool`,
    })),
  },
]

function naarTekst(g: Gegevens): Record<Veld, string> {
  return Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v ?? ''])) as Record<Veld, string>
}

export function GegevensFormulier({ begin }: { begin: Gegevens }) {
  const router = useRouter()
  const [waarden, setWaarden] = useState<Record<Veld, string>>(() => naarTekst(begin))
  const [foutVeld, setFoutVeld] = useState<{ veld: string | null; tekst: string } | null>(null)
  const [bezig, setBezig] = useState(false)
  const [opgeslagen, setOpgeslagen] = useState(false)

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    setOpgeslagen(false)
    const controle = leesGegevens(waarden)
    if (!controle.ok) return setFoutVeld({ veld: controle.veld ?? null, tekst: controle.fout })
    setFoutVeld(null)
    setBezig(true)
    const uit = await stuur('/api/club/bedrijf', 'PATCH', { soort: 'gegevens', ...waarden })
    setBezig(false)
    if (!uit.ok) return setFoutVeld({ veld: null, tekst: uit.fout })
    // De nette vorm (bijvoorbeeld 1234 AB of NL...B01) direct terug in de velden.
    setWaarden(naarTekst(controle.waarde))
    setOpgeslagen(true)
    router.refresh()
  }

  return (
    <form className="club-bedrijf-formulier" onSubmit={(e) => void bewaar(e)} noValidate>
      {GROEPEN.map((groep) => (
        <fieldset key={groep.titel} className="club-bedrijf-groep">
          <legend>{groep.titel}</legend>
          <p className="club-hint">{groep.uitleg}</p>
          <div className="club-bedrijf-velden">
            {groep.velden.map((v) => {
              const fout = foutVeld?.veld === v.veld
              const id = `bedrijf-${v.veld}`
              return (
                <label key={v.veld} className={`club-veld${v.breed ? ' club-bedrijf-breed' : ''}`} htmlFor={id}>
                  <span>{v.label}</span>
                  <input
                    id={id}
                    className="club-invoer"
                    type={v.type ?? 'text'}
                    value={waarden[v.veld]}
                    placeholder={v.placeholder}
                    autoComplete={v.auto ?? 'off'}
                    aria-invalid={fout || undefined}
                    aria-describedby={fout ? `${id}-fout` : v.hint ? `${id}-hint` : undefined}
                    onChange={(e) => setWaarden({ ...waarden, [v.veld]: e.target.value })}
                  />
                  {fout ? (
                    <small id={`${id}-fout`} className="club-fout">{foutVeld?.tekst}</small>
                  ) : (
                    v.hint && <small id={`${id}-hint`} className="club-hint">{v.hint}</small>
                  )}
                </label>
              )
            })}
          </div>
        </fieldset>
      ))}

      <div className="club-bedrijf-acties">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>
          {bezig ? 'Opslaan...' : 'Gegevens opslaan'}
        </button>
        <div role="status" aria-live="polite">
          {foutVeld && <p className="club-melding club-melding--fout">{foutVeld.tekst}</p>}
          {opgeslagen && !foutVeld && <p className="club-melding club-melding--ok">Opgeslagen.</p>}
        </div>
      </div>
    </form>
  )
}
