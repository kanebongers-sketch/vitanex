import type { Metadata } from 'next'
import { eisOnderdeel } from '@/lib/club/toegang'
import { haalIntakeVragen } from '@/lib/club/intakevragen/lezen'
import { dagSleutelNl } from '@/lib/club/kern/datum'
import { IntakeVragenBeheer } from '@/components/club/intakevragen/IntakeVragenBeheer'
import '@/components/club/training/training.css'
import '@/components/club/intakevragen/intakevragen.css'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'

export const metadata: Metadata = { title: 'Intakeformulier' }

// Het intakeformulier van de sportschool samenstellen: vragen toevoegen,
// aanpassen, volgorde en secties, aan en uit, met een live voorbeeld.
// Zonder eigen vragen geldt de standaardset van Club.

export default async function IntakeformulierPagina() {
  const t = await eisOnderdeel('beheer')
  const set = await haalIntakeVragen(t.admin, t.userId)

  return (
    <>
      <InstelKruimel id="intake" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>Intakeformulier</h1>
          <p>
            De vragen die je trainers bij een intake stellen, in jouw volgorde en secties. Doelen, ervaring, dagen en minuten blijven altijd staan:
            daar maakt Club het schemavoorstel mee. Gezondheidsvragen ziet de trainer alleen als het lid toestemming geeft.
          </p>
        </div>
      </header>
      {set ? (
        <IntakeVragenBeheer vragen={set.vragen} standaard={set.standaard} vandaag={dagSleutelNl(new Date())} />
      ) : (
        <p className="club-melding club-melding--fout" role="status">De intakevragen konden niet worden gelezen. Probeer het later opnieuw.</p>
      )}
    </>
  )
}
