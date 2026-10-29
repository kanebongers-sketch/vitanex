import { PROVIDERS, type ProviderKaart } from '@/lib/club/health/providers'
import type { KoppelingPubliek } from '@/lib/club/health/opslag'
import { magDelen, type Toestemming } from '@/lib/club/health/toestemming'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { HEALTH } from '@/lib/aiyourgym/taal/woorden/ledenapp/health'
import type { BronId, Meting } from '@/lib/club/health/typen'
import { BronKaart } from './BronKaart'
import { LaatsteMetingen } from './LaatsteMetingen'
import { ToestemmingFormulier } from './ToestemmingFormulier'
import './health.css'

// De pagina Koppelingen in de ledenapp: eerst de laatste metingen, dan de
// bronnen (wat werkt bovenaan), dan de toestemming. Presentatie; de pagina
// haalt de gegevens op.

export interface KoppelingenData {
  providers: ProviderKaart[]
  koppelingen: KoppelingPubliek[]
  toestemming: Toestemming
  tekst: { versie: string; regels: readonly string[] }
  laatste: Meting[]
  viaTelefoon: readonly string[]
}

interface KoppelingenSchermProps {
  data: KoppelingenData
  sportschool: string
  voor: string | null
  alleenLezen: boolean
  melding: { gekoppeld: BronId | null; fout: string | null }
  taal: Taal
}

export function KoppelingenScherm({ data, sportschool, voor, alleenLezen, melding, taal }: KoppelingenSchermProps) {
  const h = HEALTH[taal]
  const s = h.scherm
  const fouten: Readonly<Record<string, string>> = h.fout
  const perBron = new Map(data.koppelingen.map((k) => [k.bron, k]))
  const werkt = data.providers.filter((p) => p.status !== 'binnenkort')
  const later = data.providers.filter((p) => p.status === 'binnenkort')
  const apartBronnen = data.providers.filter((p) => p.trainerApart).map((p) => ({ id: p.id, naam: p.naam }))
  const kaart = (p: ProviderKaart) => (
    <BronKaart
      key={p.id}
      p={p}
      koppeling={perBron.get(p.id) ?? null}
      toegestaan={p.soorten.filter((s) => magDelen(data.toestemming, s))}
      voor={voor}
      alleenLezen={alleenLezen}
      altijdWissen={PROVIDERS[p.id].regels.wissenBijOntkoppelen}
    />
  )
  return (
    <div className="club-lidapp-tab club-hl">
      <header className="club-hl-kop">
        <h2 className="club-lidapp-kop">{s.titel}</h2>
        <p>{s.intro(sportschool)}</p>
      </header>
      {melding.gekoppeld && (
        <p className="club-hl-melding" data-soort="goed" role="status">
          {s.gekoppeld(h.bronnen[melding.gekoppeld].naam)}
        </p>
      )}
      {melding.fout && (
        <p className="club-hl-melding" data-soort="fout" role="alert">
          {fouten[melding.fout] ?? h.fout.ongeldig}
        </p>
      )}
      <section className="club-hl-sectie" aria-labelledby="hl-laatste">
        <h3 id="hl-laatste">{s.laatste}</h3>
        <LaatsteMetingen metingen={data.laatste} leeg={s.geenMetingen} taal={taal} />
      </section>
      <section className="club-hl-sectie" aria-labelledby="hl-bronnen">
        <h3 id="hl-bronnen">{s.bronnen}</h3>
        {werkt.length > 0 ? <ul className="club-hl-bronnen">{werkt.map(kaart)}</ul> : <p className="club-hl-via">{s.nogNiet}</p>}
        <p className="club-hl-via">{s.viaTelefoon(data.viaTelefoon.join(', '))}</p>
      </section>
      {later.length > 0 && (
        <section className="club-hl-sectie" aria-labelledby="hl-later">
          <h3 id="hl-later">{s.binnenkort}</h3>
          <ul className="club-hl-bronnen">{later.map(kaart)}</ul>
        </section>
      )}
      <ToestemmingFormulier toestemming={data.toestemming} tekst={data.tekst} apartBronnen={apartBronnen} sportschool={sportschool} voor={voor} alleenLezen={alleenLezen} />
    </div>
  )
}
