import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eisModule } from '@/lib/club/toegang'
import { haalLid, volledigeNaam } from '@/lib/club/kern/lid'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { type ZoekParams } from '@/lib/club/kern/vestiging'
import { binnenVestigingen, kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { dagSleutelNl } from '@/lib/lifeos/leads/leads'
import { haalIntakeVragen } from '@/lib/club/intakevragen/lezen'
import { standaardVragen } from '@/lib/club/intakevragen/kern'
import { IntakeFormulier } from '@/components/club/training/IntakeFormulier'
import { trainingPad, trainingPaden } from '@/components/club/training/TrainingTabs'
import '@/components/club/training/training.css'
import '@/components/club/intakevragen/intakevragen.css'

export const metadata: Metadata = { title: 'Intake' }

// Een nieuwe intake. ?lid=<id> zet het lid alvast klaar (vanuit de ledenkaart).

export default async function IntakePagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('training')
  const zoek = await searchParams
  const vestiging = kiesUit(t.vestigingen, zoek.v)
  if (!vestiging) return <GeenVestigingen />
  const lidParam = typeof zoek.lid === 'string' ? zoek.lid : null
  const [gelezenLid, medewerkers, vragen] = await Promise.all([
    lidParam ? haalLid(t.admin, t.userId, lidParam) : Promise.resolve(null),
    haalMedewerkers(t.admin, t.userId, vestiging, 'trainer'),
    haalIntakeVragen(t.admin, t.userId),
  ])
  // Een lid uit een andere vestiging dan die van deze persoon wordt niet klaargezet.
  const lid = binnenVestigingen(t.vestigingen, gelezenLid)
  const paden = trainingPaden(vestiging)

  return (
    <>
      <section className="club-paginakop">
        <div>
          <p className="club-boventitel">{naamVan(t.vestigingen, vestiging)} · Training</p>
          <h1>Intake</h1>
          <p>Alle stappen op een scherm, met de vragen van je sportschool. Gezondheidsgegevens alleen met toestemming van het lid.</p>
        </div>
        <Link className="club-knop club-knop--stil" href={trainingPad(vestiging, 'intakes', lid?.id ?? null)}>
          <ArrowLeft aria-hidden size={16} /> Terug
        </Link>
      </section>
      {medewerkers === null && <p className="club-melding">De trainers konden niet worden geladen; je kunt de intake wel opslaan.</p>}
      {vragen === null && <p className="club-melding club-melding--fout" role="status">De intakevragen van je sportschool konden niet worden gelezen. Je ziet nu de standaardvragen; opslaan lukt pas weer als ze te lezen zijn.</p>}
      <IntakeFormulier
        vestiging={vestiging}
        beginLid={lid ? { id: lid.id, naam: volledigeNaam(lid), lidnummer: lid.lidnummer } : null}
        trainers={(medewerkers ?? []).map((m) => ({ id: m.id, naam: m.naam }))}
        vandaag={dagSleutelNl(new Date())}
        lidHref={paden.intakesVanLid}
        editorHref={paden.editor}
        vragen={vragen?.vragen ?? standaardVragen()}
      />
    </>
  )
}
