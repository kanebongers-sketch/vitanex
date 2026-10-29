import { clubTekst, getTaal } from '@/lib/aiyourgym/taal/server'
import { INTAKE } from '@/lib/aiyourgym/taal/woorden/club/intake'
import type { Metadata } from 'next'
import { eisModule } from '@/lib/club/toegang'
import { haalLid, volledigeNaam } from '@/lib/club/kern/lid'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { type ZoekParams } from '@/lib/club/kern/vestiging'
import { binnenVestigingen, kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { GeenVestigingen } from '@/components/club/shell/GeenVestigingen'
import { ClubKruimel, stappenNaarLid } from '@/components/club/shell/ClubKruimel'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { moduleAan } from '@/lib/club/kern/organisatie'
import { dagSleutelNl } from '@/lib/club/kern/datum'
import { haalIntakeVragen } from '@/lib/club/intakevragen/lezen'
import { standaardVragen } from '@/lib/club/intakevragen/kern'
import { IntakeFormulier } from '@/components/club/training/IntakeFormulier'
import { trainingPad, trainingPaden } from '@/components/club/training/TrainingTabs'
import { kwamVanLid, lidKaartPad, metVanLid } from '@/lib/club/leden/hub/tabs'
import '@/components/club/training/training.css'
import '@/components/club/intakevragen/intakevragen.css'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(INTAKE)).pagina.titel }
}

// Een nieuwe intake. ?lid=<id> zet het lid alvast klaar. Met ?van=lid begon het
// op de ledenkaart: het schemavoorstel en "Later" gaan daarna terug naar het
// tabblad Training van het lid. Vanaf Training kies je eerst een lid.

export default async function IntakePagina({ searchParams }: { searchParams: ZoekParams }) {
  const t = await eisModule('training')
  const taal = await getTaal()
  const tp = (await clubTekst(INTAKE)).pagina
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
  // Vanaf de ledenkaart terug naar het lid; anders naar de intakes bij Training.
  const magLeden = moduleAan(t.organisatie, 'leden') && magOnderdeel(t.onderdelen, 'leden')
  const naarLid = lid ? stappenNaarLid(magLeden, { id: lid.id, naam: volledigeNaam(lid) }, vestiging, taal).map((s, i) => (i === 1 ? { ...s, href: lidKaartPad(lid.id, vestiging, 'training') } : s)) : []
  const kruimel = naarLid.length ? naarLid : [{ label: tp.training, href: trainingPad(vestiging, 'intakes', lid?.id ?? null) }]
  const vanLid = kwamVanLid(zoek.van) && magLeden && lid !== null
  const editorHref = vanLid ? metVanLid(paden.editor) : paden.editor
  // __lid__ vult het formulier in, ook als de trainer nog een ander lid kiest.
  const lidHref = vanLid ? lidKaartPad('__lid__', vestiging, 'training') : paden.intakesVanLid

  return (
    <>
      <ClubKruimel stappen={kruimel} huidig={tp.titel} />
      <section className="club-paginakop">
        <div>
          <p className="club-boventitel">{tp.boventitel(naamVan(t.vestigingen, vestiging))}</p>
          <h1>{tp.titel}</h1>
          <p>{tp.intro}</p>
        </div>
      </section>
      {medewerkers === null && <p className="club-melding">{tp.trainersFout}</p>}
      {vragen === null && <p className="club-melding club-melding--fout" role="status">{tp.vragenFout}</p>}
      <IntakeFormulier
        vestiging={vestiging}
        beginLid={lid ? { id: lid.id, naam: volledigeNaam(lid), lidnummer: lid.lidnummer } : null}
        trainers={(medewerkers ?? []).map((m) => ({ id: m.id, naam: m.naam }))}
        vandaag={dagSleutelNl(new Date())}
        lidHref={lidHref}
        editorHref={editorHref}
        vragen={vragen?.vragen ?? standaardVragen()}
      />
    </>
  )
}
