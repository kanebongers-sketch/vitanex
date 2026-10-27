import { ScanLine } from 'lucide-react'
import { DagTijd } from '@/components/aiyourgym/dag/DagTijd'
import { formatKlok } from '@/components/aiyourgym/dag/klok'
import { HeldDiepte } from '@/components/aiyourgym/dag/HeldDiepte'
import { Lichtval } from '@/components/aiyourgym/dag/Lichtval'
import { momentTijd } from '@/components/aiyourgym/dag/momenten'
import { AppHome } from '@/components/aiyourgym/mockups/AppSchermen'
import { HeldDashboard } from '@/components/aiyourgym/mockups/HeldDashboard'
import { Toestel } from '@/components/aiyourgym/mockups/kaders'
import { VOORBEELD_NAAM, VOORBEELD_VESTIGING } from '@/components/aiyourgym/mockups/voorbeeld'
import { Geruststelling, TweeRoutes } from '@/components/aiyourgym/site/Actie'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { DAG } from '@/lib/aiyourgym/taal/woorden/website/dag'
import { HELD } from '@/lib/aiyourgym/taal/woorden/website/held'
import { HeldRoutes } from './HeldRoutes'
import { WisselWoord } from './WisselWoord'

// 06:00, de deur gaat open: de opening van de voorpagina als gelaagde scene
// (docs/aiyourgym/scroll-craft/BRIEF.md, lagencontract). Van ver naar dichtbij:
// lichtval, Club in een browservenster (het scherm Vandaag van Kernhal), de tekst,
// de ledenapp op een telefoon en het eerste check-inkaartje van de dag. Elk vlak
// beweegt op een eigen afstand bij muis en scroll (HeldDiepte, dag.css). De tekst
// staat tussen venster en telefoon en beweegt niet. Geen oefenbeelden (besluit
// Kane 27-10-2026); alles is eigen schermwerk met voorbeeldgegevens.

/** Het eerste check-in van de dag, twee minuten na openen. */
const EERSTE_CHECKIN = momentTijd('open') + 2

export async function Held() {
  const taal = await getSiteTaal()
  const t = HELD[taal]
  const d = DAG[taal]
  return (
    <section className="dag-held" aria-labelledby="held-titel" id="open" data-dag={momentTijd('open')} data-dag-naam={d.momenten.open}>
      <HeldDiepte className="dag-held-binnen">
        <Lichtval className="dag-laag dag-laag--licht" />
        <div className="ayg-wrap dag-held-raster">
          <div className="dag-held-tekst ayg-intro">
            <DagTijd minuten={momentTijd('open')} naam={t.label} />
            <h1 className="ayg-display dag-held-titel" id="held-titel">
              <span className="ayg-sr">{t.titelVoorlezen}</span>
              <span aria-hidden="true" className="ayg-held-kop">
                <span>{t.titelVoor}</span>
                <WisselWoord start={t.titelStart} woorden={t.wisselWoorden} />
                <span>{t.titelNa}</span>
              </span>
            </h1>
            <p className="ayg-lead">{t.lead}</p>
            <TweeRoutes />
            <Geruststelling aantal={3} />
            <HeldRoutes />
          </div>
          <div className="dag-held-scene aygm" role="img" aria-label={t.beeldLabel}>
            <div className="dag-laag dag-laag--venster">
              <HeldDashboard />
            </div>
            <div className="dag-laag dag-laag--toestel">
              <span className="dag-contactschaduw" aria-hidden />
              <Toestel tab="Home" className="dag-held-toestel">
                <AppHome />
              </Toestel>
            </div>
            <div className="dag-laag dag-laag--checkin">
              <div className="dag-checkin">
                <span className="dag-checkin-icoon">
                  <ScanLine size={16} aria-hidden />
                </span>
                <span className="dag-checkin-tekst">
                  <b>{d.checkin.kop}</b>
                  <span>{d.checkin.waar(VOORBEELD_NAAM, VOORBEELD_VESTIGING)}</span>
                </span>
                <time dateTime={formatKlok(EERSTE_CHECKIN)}>{formatKlok(EERSTE_CHECKIN)}</time>
              </div>
            </div>
          </div>
        </div>
        <p className="ayg-wrap dag-held-bijschrift">{t.bijschrift}</p>
      </HeldDiepte>
    </section>
  )
}
