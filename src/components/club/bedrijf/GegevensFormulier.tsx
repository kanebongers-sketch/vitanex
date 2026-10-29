'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { Gegevens } from '@/lib/club/bedrijf/model'
import { useTekst } from '@/lib/aiyourgym/taal/client'
import { BEDRIJF } from '@/lib/aiyourgym/taal/woorden/club/bedrijf'
import { leesGegevens } from '@/lib/club/bedrijf/invoer'
import { stuur } from '@/components/club/leden/stuur'
import { bedrijfsnaamVoorstel } from '@/lib/club/kern/sportschool-naam'

/** Namen van de netwerken (merknamen, in elke taal gelijk). */
const SOCIAL_NAAM = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', linkedin: 'LinkedIn' } as const

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

type BedrijfTekst = (typeof BEDRIJF)['nl']

function groepenVan(t: BedrijfTekst, sportschool: string): { titel: string; uitleg: string; velden: VeldInfo[] }[] {
  const v = t.velden
  return [
    {
      ...t.groepen.bedrijf,
      velden: [
        { veld: 'bedrijfsnaam', label: v.bedrijfsnaam.label, placeholder: sportschool || v.bedrijfsnaam.placeholder, hint: v.bedrijfsnaam.hint(sportschool), breed: true, auto: 'organization' },
        { veld: 'kvk', label: v.kvk.label, placeholder: v.kvk.placeholder, hint: v.kvk.hint },
        { veld: 'btw', label: v.btw.label, placeholder: 'NL123456789B01', hint: v.btw.hint },
      ],
    },
    {
      ...t.groepen.hoofdkantoor,
      velden: [
        { veld: 'adres', label: v.adres, breed: true, auto: 'address-line1' },
        { veld: 'postcode', label: v.postcode, placeholder: '1234 AB', auto: 'postal-code' },
        { veld: 'plaats', label: v.plaats, auto: 'address-level2' },
      ],
    },
    {
      ...t.groepen.contact,
      velden: [
        { veld: 'telefoon', label: v.telefoon, type: 'tel', auto: 'tel' },
        { veld: 'email', label: v.email, type: 'email', auto: 'email' },
        { veld: 'website', label: v.website, type: 'url', placeholder: v.websiteVoorbeeld, breed: true, auto: 'url' },
      ],
    },
    {
      ...t.groepen.social,
      velden: (['instagram', 'facebook', 'tiktok', 'linkedin'] as const).map((s) => ({
        veld: s,
        label: SOCIAL_NAAM[s],
        type: 'url' as const,
        placeholder: v.socialVoorbeeld(s),
      })),
    },
  ]
}

function naarTekst(g: Gegevens): Record<Veld, string> {
  return Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v ?? ''])) as Record<Veld, string>
}

interface GegevensFormulierProps {
  begin: Gegevens
  /** De naam van de sportschool (Huisstijl): voorstel voor een lege bedrijfsnaam. */
  sportschool: string
}

export function GegevensFormulier({ begin, sportschool }: GegevensFormulierProps) {
  const router = useRouter()
  const [waarden, setWaarden] = useState<Record<Veld, string>>(() => naarTekst(begin))
  const [foutVeld, setFoutVeld] = useState<{ veld: string | null; tekst: string } | null>(null)
  const [bezig, setBezig] = useState(false)
  const [opgeslagen, setOpgeslagen] = useState(false)
  const t = useTekst(BEDRIJF)

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
      {groepenVan(t, sportschool).map((groep) => (
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
                  {v.veld === 'bedrijfsnaam' && !waarden.bedrijfsnaam.trim() && sportschool && (
                    <button type="button" className="club-knop club-knop--stil club-bedrijf-overnemen" onClick={() => setWaarden({ ...waarden, bedrijfsnaam: bedrijfsnaamVoorstel(waarden.bedrijfsnaam, sportschool) })}>
                      {t.velden.bedrijfsnaam.overnemen}
                    </button>
                  )}
                </label>
              )
            })}
          </div>
        </fieldset>
      ))}

      <div className="club-bedrijf-acties">
        <button type="submit" className="club-knop club-knop--primair" disabled={bezig}>
          {bezig ? t.gegevens.bezig : t.gegevens.opslaan}
        </button>
        <div role="status" aria-live="polite">
          {foutVeld && <p className="club-melding club-melding--fout">{foutVeld.tekst}</p>}
          {opgeslagen && !foutVeld && <p className="club-melding club-melding--ok">{t.gegevens.opgeslagen}</p>}
        </div>
      </div>
    </form>
  )
}
