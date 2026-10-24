import type { Metadata } from 'next'
import { Check } from 'lucide-react'
import { PAKKETTEN, PROEFDAGEN, type Pakket } from '@/lib/aiyourgym/pakketten'
import { testbetalen } from '@/lib/aiyourgym/testbetaling'
import { getSiteTaal, siteTekst } from '@/lib/aiyourgym/taal/server'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { ACTIE } from '@/lib/aiyourgym/taal/woorden/website/actie'
import { PAKKET_TEKST, pakketTekst, vestigingenTekst } from '@/lib/aiyourgym/taal/woorden/website/pakketten'
import { PRIJZEN } from '@/lib/aiyourgym/taal/woorden/website/prijzen'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { Geruststelling, GERUST_BIJ_KNOP } from '@/components/aiyourgym/site/Actie'
import { Knop, PaginaKop, SectieKop, Vragen } from '@/components/aiyourgym/site/bouwstenen'
import { sitePaden } from '@/components/aiyourgym/site/paden'

// Besluit Kane: geen bedragen op de website. De pakketten en wat erin zit komen
// uit src/lib/aiyourgym/pakketten.ts; de prijs is altijd op maat. Teksten in
// beide talen: woorden/website/prijzen.ts en pakketten.ts.

export async function generateMetadata(): Promise<Metadata> {
  const t = await siteTekst(PRIJZEN)
  return { title: t.metaTitel, description: t.metaOmschrijving }
}

function PakketKaart({ pakket, taal }: { pakket: Pakket; taal: Taal }) {
  const tekst = pakketTekst(pakket.sleutel, taal)
  const { AANMELDEN, PRIJS_OP_MAAT } = sitePaden(taal)
  return (
    <article className="ayg-pakket" data-aanbevolen={pakket.aanbevolen ? '' : undefined} aria-labelledby={`pakket-${pakket.sleutel}`}>
      <div className="ayg-stapel">
        <div className="ayg-pakket-kop">
          <h2 className="ayg-pakket-naam" id={`pakket-${pakket.sleutel}`}>
            {pakket.naam}
          </h2>
          {pakket.aanbevolen && <span className="ayg-badge">{PAKKET_TEKST[taal].aanbevolen}</span>}
        </div>
        <p className="ayg-klein">{tekst.voorWie}</p>
      </div>
      <div className="ayg-pakket-prijs">
        <strong>{PAKKET_TEKST[taal].prijsOpMaat}</strong>
        <span>{vestigingenTekst(pakket.maxVestigingen, taal, true)}</span>
      </div>
      <ul className="ayg-vinklijst">
        {tekst.inbegrepen.map((i) => (
          <li key={i}>
            <Check size={16} aria-hidden />
            <span>{i}</span>
          </li>
        ))}
      </ul>
      <div className="ayg-knoppen">
        <Knop href={`${AANMELDEN}?pakket=${pakket.sleutel}`} soort={pakket.aanbevolen ? 'accent' : 'inkt'} pijl>
          {ACTIE[taal].probeerDagen(PROEFDAGEN)}
        </Knop>
        <Knop href={`${PRIJS_OP_MAAT}?pakket=${pakket.sleutel}`} soort="rand">
          {PRIJZEN[taal].vraagPrijs}
        </Knop>
      </div>
    </article>
  )
}

// Zolang Stripe niet gekoppeld is, start de proefperiode met een testbetaling
// (besluit Kane 23-10-2026): dat zeggen we bij de vraag over de proefperiode eerlijk.
function vragen(taal: Taal, zonderStripe: boolean) {
  const { vragen: v, zonderStripe: zonder } = PRIJZEN[taal]
  return [
    v.kosten,
    { vraag: v.proef.vraag, antwoord: `${v.proef.antwoord}${zonderStripe ? zonder : ''}` },
    v.contract,
    v.gegevens,
    v.hulp,
    v.eerstZien,
    v.incasso,
    v.nieuw,
  ]
}

export default async function PrijzenPagina() {
  const taal = await getSiteTaal()
  const t = PRIJZEN[taal]
  const { AANMELDEN, DEMO_AANVRAGEN } = sitePaden(taal)
  return (
    <>
      <PaginaKop label={t.label} titel={t.titel} tekst={t.tekst}>
        <div className="ayg-knoppen">
          <Knop href={AANMELDEN} soort="accent" pijl>
            {ACTIE[taal].probeerDagen(PROEFDAGEN)}
          </Knop>
          <Knop href={DEMO_AANVRAGEN} soort="rand">
            {ACTIE[taal].planDemo}
          </Knop>
        </div>
        <Geruststelling aantal={GERUST_BIJ_KNOP} onder />
      </PaginaKop>
      <section className="ayg-sectie--krap" aria-label={t.pakketten}>
        <div className="ayg-wrap">
          <div className="ayg-prijzen">
            {PAKKETTEN.map((p) => (
              <PakketKaart key={p.sleutel} pakket={p} taal={taal} />
            ))}
          </div>
          <div className="ayg-ruim-boven">
            <Geruststelling />
          </div>
        </div>
      </section>
      <section className="ayg-sectie" id="vragen" aria-labelledby="prijs-vragen-titel">
        <div className="ayg-wrap ayg-gesplitst">
          <SectieKop id="prijs-vragen-titel" label={t.vragenLabel} titel={t.vragenTitel} />
          <Vragen vragen={vragen(taal, PAKKETTEN.some((p) => testbetalen(p.sleutel)))} />
        </div>
      </section>
      <AanmeldBand />
    </>
  )
}
