import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eisClubToegang } from '@/lib/club/toegang'
import { haalLid, volledigeNaam } from '@/lib/club/gedeeld/lid'
import { haalMedewerkers } from '@/lib/club/gedeeld/medewerker'
import { kiesVestiging, VESTIGING_LABEL, type ZoekParams } from '@/lib/club/gedeeld/vestiging'
import { dagSleutelNl } from '@/lib/lifeos/leads/leads'
import { IntakeFormulier } from '@/components/club/training/IntakeFormulier'
import { trainingPad, trainingPaden } from '@/components/club/training/TrainingTabs'
import '@/components/club/training/training.css'

export const metadata: Metadata = { title: 'Intake' }

// Een nieuwe intake. ?lid=<id> zet het lid alvast klaar (vanuit de ledenkaart).

export default async function IntakePagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisClubToegang()
  const zoek = await searchParams
  const vestiging = kiesVestiging(zoek.v)
  const lidParam = typeof zoek.lid === 'string' ? zoek.lid : null
  const [lid, medewerkers] = await Promise.all([
    lidParam ? haalLid(t.admin, t.userId, lidParam) : Promise.resolve(null),
    haalMedewerkers(t.admin, t.userId, vestiging, 'trainer'),
  ])
  const paden = trainingPaden(vestiging)

  return (
    <>
      <section className="club-paginakop">
        <div>
          <p className="club-boventitel">{VESTIGING_LABEL[vestiging]} · Training</p>
          <h1>Intake</h1>
          <p>Vijf korte stappen op een scherm. Gezondheidsgegevens alleen met toestemming van het lid.</p>
        </div>
        <Link className="club-knop club-knop--stil" href={trainingPad(vestiging, 'intakes', lid?.id ?? null)}>
          <ArrowLeft aria-hidden size={16} /> Terug
        </Link>
      </section>
      {medewerkers === null && <p className="club-melding">De trainers konden niet worden geladen; je kunt de intake wel opslaan.</p>}
      <IntakeFormulier
        vestiging={vestiging}
        beginLid={lid ? { id: lid.id, naam: volledigeNaam(lid), lidnummer: lid.lidnummer } : null}
        trainers={(medewerkers ?? []).map((m) => ({ id: m.id, naam: m.naam }))}
        vandaag={dagSleutelNl(new Date())}
        lidHref={paden.intakesVanLid}
        editorHref={paden.editor}
      />
    </>
  )
}
