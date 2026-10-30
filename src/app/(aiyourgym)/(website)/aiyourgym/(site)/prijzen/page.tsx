import type { Metadata } from 'next'
import { Check } from 'lucide-react'
import { PAKKETTEN, type Pakket } from '@/lib/aiyourgym/pakketten'
import { testbetalen } from '@/lib/aiyourgym/testbetaling'
import { PAKKET_NAMEN } from '@/lib/aiyourgym/taal/woorden/algemeen/pakketten'
import { getSiteTaal, siteTekst } from '@/lib/aiyourgym/taal/server'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { ACTIE } from '@/lib/aiyourgym/taal/woorden/website/actie'
import { PAKKET_TEKST, pakketTekst } from '@/lib/aiyourgym/taal/woorden/website/pakketten'
import { PRIJZEN } from '@/lib/aiyourgym/taal/woorden/website/prijzen'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { Geruststelling, GERUST_BIJ_KNOP } from '@/components/aiyourgym/site/Actie'
import { Knop, PaginaKop, SectieKop, Vragen } from '@/components/aiyourgym/site/bouwstenen'
import { SITE_PADEN } from '@/components/aiyourgym/site/paden'

// Besluit Kane: geen bedragen op de website. De losse pakketten (besluit Kane
// 29-10-2026: kies alleen wat je nodig hebt) en wat erin zit komen uit
// src/lib/aiyourgym/pakketten.ts; de prijs staat alleen in Stripe. Teksten in
// beide talen: woorden/website/prijzen.ts en pakketten.ts.

export async function generateMetadata(): Promise<Metadata> {
  const t = await siteTekst(PRIJZEN)
  return { title: t.metaTitel, description: t.metaOmschrijving }
}

function PakketKaart({ pakket, taal }: { pakket: Pakket; taal: Taal }) {
  const tekst = pakketTekst(pakket.sleutel, taal)
  const { AANMELDEN, PRIJS_OP_MAAT } = SITE_PADEN
  return (
    <article className="ayg-pakket" aria-labelledby={`pakket-${pakket.sleutel}`}>
      <div className="ayg-stapel">
        <div className="ayg-pakket-kop">
          <h2 className="ayg-pakket-naam ayg-pakket-naam--los" id={`pakket-${pakket.sleutel}`}>
            {tekst.naam}
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
        <Knop href={`${AANMELDEN}?pakketten=${pakket.sleutel}`} soort="inkt" pijl>
          {PAKKET_TEKST[taal].kies}
        </Knop>
        <Knop href={`${PRIJS_OP_MAAT}?pakket=${pakket.sleutel}`} soort="rand">
          {PRIJZEN[taal].vraagPrijs}
        </Knop>
      </div>
    </article>
  )
}

/** Wat altijd bij elk pakket zit (de kern), kort boven de pakketten. */
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
