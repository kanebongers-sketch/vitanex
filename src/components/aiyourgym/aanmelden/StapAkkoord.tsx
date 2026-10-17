import type { AanmeldVeld } from '@/lib/aiyourgym/aanmelding'
import type { Invoer, PakketKeuze, Wijzig } from './types'

// Stap 4: alles nog een keer op een rij, en akkoord met de voorwaarden.

interface StapAkkoordProps {
  invoer: Invoer
  pakket: PakketKeuze | null
  proefdagen: number
  fouten: Partial<Record<AanmeldVeld, string>>
  wijzig: Wijzig
  naarStap: (stap: number) => void
}

export function StapAkkoord({ invoer, pakket, proefdagen, fouten, wijzig, naarStap }: StapAkkoordProps) {
  const rijen: { label: string; waarde: string; stap: number }[] = [
    { label: 'Pakket', waarde: pakket?.naam ?? 'Nog niet gekozen', stap: 0 },
    { label: 'Sportschool', waarde: invoer.sportschoolNaam || '...', stap: 1 },
    { label: 'Vestigingen', waarde: String(invoer.aantalVestigingen), stap: 1 },
    { label: 'Adres', waarde: invoer.slug ? `${invoer.slug}.aiyourgym.com` : '...', stap: 1 },
    { label: 'Eigenaar', waarde: [invoer.eigenaarNaam, invoer.eigenaarEmail, invoer.eigenaarTelefoon].filter(Boolean).join(' · ') || '...', stap: 2 },
  ]
  return (
    <fieldset className="aan-fieldset">
      <legend className="aan-legend">Controleren en bevestigen</legend>
      <dl className="aan-controle">
        {rijen.map((r) => (
          <div key={r.label} className="aan-controle-rij">
            <dt>{r.label}</dt>
            <dd>{r.waarde}</dd>
            <button type="button" className="aan-wijzig" onClick={() => naarStap(r.stap)}>
              Wijzig<span className="ayg-sr"> {r.label.toLowerCase()}</span>
            </button>
          </div>
        ))}
      </dl>

      {pakket?.open ? (
        <p className="aan-uitleg">Hierna ga je naar de beveiligde betaalpagina van Stripe. Daar zie je het bedrag. De eerste {proefdagen} dagen zijn gratis en je kunt in die tijd kosteloos stoppen.</p>
      ) : (
        <p className="aan-uitleg">Online aanmelden voor dit pakket is nog niet open. Verstuur je aanvraag, dan nemen we zelf contact met je op. Je betaalt nu niets.</p>
      )}

      <div className="aan-akkoord" data-fout={fouten.akkoord ? 'ja' : undefined}>
        <input id="akkoord" type="checkbox" checked={invoer.akkoord} onChange={(e) => wijzig('akkoord', e.target.checked)}
          aria-invalid={fouten.akkoord ? true : undefined} aria-describedby={fouten.akkoord ? 'akkoord-fout' : undefined} />
        <label htmlFor="akkoord">
          Ik ga akkoord met de{' '}
          <a href="/aiyourgym/voorwaarden" target="_blank" rel="noopener">algemene voorwaarden</a> en heb de{' '}
          <a href="/aiyourgym/privacy" target="_blank" rel="noopener">privacyverklaring</a> gelezen.
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
