import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getSiteTaal, siteTekst } from '@/lib/aiyourgym/taal/server'
import { BEVEILIGING } from '@/lib/aiyourgym/taal/woorden/website/beveiliging'
import { AanmeldBand } from '@/components/aiyourgym/site/AanmeldBand'
import { PaginaKop } from '@/components/aiyourgym/site/bouwstenen'
import { aygPad, SITE_PADEN } from '@/components/aiyourgym/site/paden'

// Privacy en beveiliging in gewone taal. Alleen wat echt zo is gebouwd (bronnen
// in inhoud/beveiliging.ts, Engels in woorden/website/beveiliging.ts); geen
// keurmerken die we niet hebben. De verwerkersovereenkomst is nog een concept
// en staat niet als download online: daarom "op aanvraag".

export async function generateMetadata(): Promise<Metadata> {
  const t = await siteTekst(BEVEILIGING)
  return { title: t.metaTitel, description: t.metaOmschrijving }
}

export default async function PrivacyBeveiligingPagina() {
  const taal = await getSiteTaal()
  const t = BEVEILIGING[taal]
  return (
    <>
      <PaginaKop label={t.label} titel={t.titel} tekst={t.tekst} />
      <section className="ayg-sectie--krap" aria-label={t.inHetKort}>
        <div className="ayg-podium ayg-podium--rond">
          <ul className="ayg-wrap ayg-pb-kern">
            {t.kern.map((k, i) => (
              <li key={k.titel}>
                <span className="ayg-pb-kern-nr" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <strong className="ayg-pb-kern-woord">{k.titel}</strong>
                <span>{k.tekst}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      {t.groepen.map((g) => (
        <section key={g.sleutel} className="ayg-sectie--krap ayg-pb-groep" aria-labelledby={`pb-${g.sleutel}`}>
          <div className="ayg-wrap ayg-pb-rij">
            <div className="ayg-stapel">
              <p className="ayg-label ayg-label--accent">{g.label}</p>
              <h2 className="ayg-h2 ayg-pb-titel" id={`pb-${g.sleutel}`}>
                {g.titel}
              </h2>
            </div>
            <ul className="ayg-pb-punten">
              {g.punten.map((p) => (
                <li key={p.titel}>
                  <h3 className="ayg-h3">{p.titel}</h3>
                  <p>{p.tekst}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}
      <section className="ayg-sectie--krap ayg-pb-groep" aria-labelledby="pb-afspraken">
        <div className="ayg-wrap ayg-pb-rij">
          <div className="ayg-stapel">
            <p className="ayg-label ayg-label--accent">{t.afsprakenLabel}</p>
            <h2 className="ayg-h2 ayg-pb-titel" id="pb-afspraken">
              {t.afsprakenTitel}
            </h2>
          </div>
          <div className="ayg-stapel">
            <div className="ayg-kaart ayg-pb-dpa">
              <h3 className="ayg-h3">{t.dpaKop}</h3>
              <p>{t.dpaTekst}</p>
              <Link href={SITE_PADEN.DEMO_AANVRAGEN} className="ayg-pijllink">
                {t.dpaLink} <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
            <div className="ayg-pb-sub">
              <h3 className="ayg-pb-sub-kop">{t.dienstenKop}</h3>
              <dl>
                {t.diensten.map((s) => (
                  <div key={s.titel}>
                    <dt>{s.titel}</dt>
                    <dd>{s.tekst}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <p className="ayg-klein">
              {t.meer.voor}
              <Link href={aygPad('/privacy')}>{t.meer.link}</Link>
              {t.meer.na}
            </p>
          </div>
        </div>
      </section>
      <AanmeldBand titel={t.bandTitel} />
    </>
  )
}
