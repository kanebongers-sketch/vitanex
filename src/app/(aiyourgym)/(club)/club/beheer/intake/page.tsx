import type { Metadata } from 'next'
import { eisOnderdeel, eisPakket } from '@/lib/club/toegang'
import { haalIntakeVragen } from '@/lib/club/intakevragen/lezen'
import { dagSleutelNl } from '@/lib/club/kern/datum'
import { IntakeVragenBeheer } from '@/components/club/intakevragen/IntakeVragenBeheer'
import '@/components/club/training/training.css'
import '@/components/club/intakevragen/intakevragen.css'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { INTAKE } from '@/lib/aiyourgym/taal/woorden/club/intake'

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await clubTekst(INTAKE)).beheerPagina.titel }
}

// Het intakeformulier van de sportschool samenstellen: vragen toevoegen,
// aanpassen, volgorde en secties, aan en uit, met een live voorbeeld.
// Zonder eigen vragen geldt de standaardset van Club.

export default async function IntakeformulierPagina() {
  await eisPakket('training')
  const t = await eisOnderdeel('beheer')
  const set = await haalIntakeVragen(t.admin, t.userId)
  const tp = (await clubTekst(INTAKE)).beheerPagina

  return (
    <>
      <InstelKruimel id="intake" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>{tp.titel}</h1>
          <p>{tp.intro}</p>
        </div>
      </header>
      {set ? (
        <IntakeVragenBeheer vragen={set.vragen} standaard={set.standaard} vandaag={dagSleutelNl(new Date())} />
      ) : (
        <p className="club-melding club-melding--fout" role="status">{tp.fout}</p>
      )}
    </>
  )
}
