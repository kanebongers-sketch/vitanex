import type { Metadata } from 'next'
import { Check } from 'lucide-react'
import { ADD_ONS, BASIS_PAKKET, PAKKETTEN, vindPakket, type Pakket } from '@/lib/aiyourgym/pakketten'
import { testbetalen } from '@/lib/aiyourgym/testbetaling'
import { PAKKET_NAMEN, pakketWeergave } from '@/lib/aiyourgym/taal/woorden/algemeen/pakketten'
import { getSiteTaal, siteTekst } from '@/lib/aiyourgym/taal/server'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { ACTIE } from '@/lib/aiyourgym/taal/woorden/website/actie'
import { PAKKET_TEKST, pakketTekst } from '@/lib/aiyourgym/taal/woorden/website/pakketten'
import { PRIJZEN } from '@/lib/aiyourgym/taal/woorden/website/prijzen'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { Geruststelling, GERUST_BIJ_KNOP } from '@/components/aiyourgym/site/Actie'
import { Knop, PaginaKop, SectieKop, Vragen } from '@/components/aiyourgym/site/bouwstenen'
import { SITE_PADEN } from '@/components/aiyourgym/site/paden'

// Besluit Kane: geen bedragen op de website. Basis met add-ons (besluit Kane
// 31-10-2026): de basis bovenaan, daaronder de vijf add-ons. Wat erin zit komt uit
// src/lib/aiyourgym/pakketten.ts; de prijs staat alleen in Stripe. Teksten in
// beide talen: woorden/website/prijzen.ts en pakketten.ts.

export async function generateMetadata(): Promise<Metadata> {
  const t = await siteTekst(PRIJZEN)
  return { title: t.metaTitel, description: t.metaOmschrijving }
}

function PakketKaart({ pakket, taal }: { pakket: Pakket; taal: Taal }) {
  const tekst = pakketTekst(pakket.sleutel, taal)
  const basis = pakket.basis === true
  const { AANMELDEN, PRIJS_OP_MAAT } = SITE_PADEN
  // Een add-on kiezen = de basis plus die add-on.
  const aanmelden = basis ? AANMELDEN : `${AANMELDEN}?pakketten=${BASIS_PAKKET},${pakket.sleutel}`
  return (
    <article className={`ayg-pakket${basis ? ' ayg-pakket--basis' : ''}`} aria-labelledby={`pakket-${pakket.sleutel}`}>
      <div className="ayg-stapel">
        <div className="ayg-pakket-kop">
          <h2 className="ayg-pakket-naam ayg-pakket-naam--los" id={`pakket-${pakket.sleutel}`}>
            {basis ? pakketWeergave(pakket.sleutel, taal) : tekst.naam}
          </h2>
        </div>
        <p className="ayg-klein">{tekst.voorWie}</p>
      </div>
      <div className="ayg-pakket-prijs">
        <strong>{PAKKET_TEKST[taal].prijsOpMaat}</strong>
        <span>{PAKKET_TEKST[taal].perVestiging}</span>
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
        <Knop href={aanmelden} soort="inkt" pijl>
          {basis ? PRIJZEN[taal].startBasis : PRIJZEN[taal].kiesAddOn}
        </Knop>
        <Knop href={`${PRIJS_OP_MAAT}?pakket=${pakket.sleutel}`} soort="rand">
          {PRIJZEN[taal].vraagPrijs}
        </Knop>
      </div>
    </article>
  )
}

/** Wat altijd in de basis zit (de kern), kort boven de pakketten. */
function Kern({ taal }: { taal: Taal }) {
  const k = PAKKET_NAMEN[taal].kern
  return (
    <aside className="ayg-prijzen-kern" aria-labelledby="pakket-kern">
      <h2 className="ayg-klein" id="pakket-kern">
        <strong>{PRIJZEN[taal].kernTitel}</strong>
      </h2>
      <ul className="ayg-vinklijst ayg-prijzen-kernlijst">
        {k.inbegrepen.map((i) => (
          <li key={i}>
            <Check size={16} aria-hidden />
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}

// Zolang Stripe niet gekoppeld is, start een aanmelding met een testbetaling
// (besluit Kane 23-10-2026): dat zeggen we bij de vraag over starten eerlijk.
// Geen proefperiode (besluit Kane 30-10-2026).
function vragen(taal: Taal, zonderStripe: boolean) {
  const { vragen: v, zonderStripe: zonder } = PRIJZEN[taal]
  return [
    v.kosten,
    v.later,
    { vraag: v.start.vraag, antwoord: `${v.start.antwoord}${zonderStripe ? zonder : ''}` },
    v.contract,
    v.gegevens,
    v.incasso,
  ]
}

export default async function PrijzenPagina() {
  const taal = await getSiteTaal()
  const t = PRIJZEN[taal]
  const { AANMELDEN, DEMO_AANVRAGEN } = SITE_PADEN
  const basisPakket = vindPakket(BASIS_PAKKET)
  const addOns = ADD_ONS.map(vindPakket).filter((p): p is Pakket => p !== null)
  return (
    <>
      <PaginaKop label={t.label} titel={t.titel} tekst={t.tekst}>
        <div className="ayg-knoppen">
          <Knop href={AANMELDEN} soort="accent" pijl>
            {ACTIE[taal].start}
          </Knop>
          <Knop href={DEMO_AANVRAGEN} soort="rand">
            {ACTIE[taal].planDemo}
          </Knop>
        </div>
        <Geruststelling aantal={GERUST_BIJ_KNOP} onder />
      </PaginaKop>
      <section className="ayg-sectie--krap" aria-label={t.pakketten}>
        <div className="ayg-wrap">
          <Kern taal={taal} />
          {basisPakket && (
            <div className="ayg-prijzen ayg-prijzen--basis">
              <PakketKaart pakket={basisPakket} taal={taal} />
            </div>
          )}
          <h2 className="ayg-prijzen-addons">{t.addOnsTitel}</h2>
          <div className="ayg-prijzen">
            {addOns.map((p) => (
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
