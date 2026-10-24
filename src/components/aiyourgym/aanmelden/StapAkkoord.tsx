import type { AanmeldVeld } from '@/lib/aiyourgym/aanmelding'
import { adresVan } from '@/lib/club/kern/subdomein'
import { aygPad } from '@/components/aiyourgym/site/paden'
import { useTaal } from '@/lib/aiyourgym/taal/client'
import { AANMELD_FORMULIER } from '@/lib/aiyourgym/taal/woorden/website/aanmelden'
import type { Invoer, PakketKeuze, Wijzig } from './types'

// Stap 4: alles nog een keer op een rij, en akkoord met de voorwaarden.

interface StapAkkoordProps {
  /** Staan de subdomeinen aan? Dan naam.aiyourgym.com, anders aiyourgym.com/naam. */
  subdomeinen: boolean
  invoer: Invoer
  pakket: PakketKeuze | null
  proefdagen: number
  fouten: Partial<Record<AanmeldVeld, string>>
  wijzig: Wijzig
  naarStap: (stap: number) => void
}

export function StapAkkoord({ invoer, pakket, proefdagen, fouten, wijzig, naarStap, subdomeinen }: StapAkkoordProps) {
  const taal = useTaal()
  const t = AANMELD_FORMULIER[taal]
  const rijen: { label: string; waarde: string; stap: number }[] = [
    { label: t.rij.pakket, waarde: pakket?.naam ?? t.nogNietGekozen, stap: 0 },
    { label: t.rij.sportschool, waarde: invoer.sportschoolNaam || '...', stap: 1 },
    { label: t.rij.vestigingen, waarde: String(invoer.aantalVestigingen), stap: 1 },
    { label: t.rij.adres, waarde: invoer.slug ? adresVan(invoer.slug, subdomeinen) : '...', stap: 1 },
    { label: t.rij.eigenaar, waarde: [invoer.eigenaarNaam, invoer.eigenaarEmail, invoer.eigenaarTelefoon].filter(Boolean).join(' · ') || '...', stap: 2 },
  ]
  return (
    <fieldset className="aan-fieldset">
      <legend className="aan-legend">{t.controleren}</legend>
      <dl className="aan-controle">
        {rijen.map((r) => (
          <div key={r.label} className="aan-controle-rij">
            <dt>{r.label}</dt>
            <dd>{r.waarde}</dd>
            <button type="button" className="aan-wijzig" onClick={() => naarStap(r.stap)}>
              {t.wijzig}<span className="ayg-sr"> {r.label.toLowerCase()}</span>
            </button>
          </div>
        ))}
      </dl>

      {pakket?.open && pakket.test ? (
        <p className="aan-uitleg">{t.uitlegTest(proefdagen)}</p>
      ) : pakket?.open ? (
        <p className="aan-uitleg">{t.uitlegStripe(proefdagen)}</p>
      ) : (
        <p className="aan-uitleg">{t.uitlegAanvraag}</p>
      )}

      <div className="aan-akkoord" data-fout={fouten.akkoord ? 'ja' : undefined}>
        <input id="akkoord" type="checkbox" checked={invoer.akkoord} onChange={(e) => wijzig('akkoord', e.target.checked)}
          aria-invalid={fouten.akkoord ? true : undefined} aria-describedby={fouten.akkoord ? 'akkoord-fout' : undefined} />
        <label htmlFor="akkoord">
          {t.akkoord.voor}
          <a href={aygPad('/voorwaarden', taal)} target="_blank" rel="noopener">{t.akkoord.voorwaarden}</a>{t.akkoord.midden}
          <a href={aygPad('/privacy', taal)} target="_blank" rel="noopener">{t.akkoord.privacy}</a>{t.akkoord.na}
        </label>
      </div>
      {fouten.akkoord && <p id="akkoord-fout" className="aan-fout" role="alert">{fouten.akkoord}</p>}

      {/* Tegen robots: mensen zien dit veld niet en laten het leeg. */}
      <div className="aan-val" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" value={invoer.website} onChange={(e) => wijzig('website', e.target.value)} />
      </div>
    </fieldset>
  )
}
