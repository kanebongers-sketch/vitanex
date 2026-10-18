import type { Metadata } from 'next'
import Link from 'next/link'
import { ListChecks } from 'lucide-react'
import { eisOnderdeel } from '@/lib/club/toegang'
import { clubPad } from '@/lib/club/kern/vestiging'
import { kiesUit, naamVan } from '@/lib/club/kern/vestigingen'
import { haalAlleMedewerkers, haalRegels } from '@/lib/club/automatisering/opslag'
import { RegelsBeheer } from '@/components/club/automatisering/RegelsBeheer'
import '@/components/club/automatisering/automatisering.css'
import { InstelKruimel } from '@/components/club/beheer/InstelKruimel'

export const metadata: Metadata = { title: 'Automatiseringen' }

// Automatiseringen voor ledenbehoud: welke regels de opvolglijst vullen, met
// welke drempel, wie het oppakt en welke voorbeeldtekst het team krijgt.
// De regels gelden voor alle vestigingen van de sportschool.

export default async function AutomatiseringenPagina() {
  const t = await eisOnderdeel('beheer')
  const [regels, medewerkers] = await Promise.all([haalRegels(t.admin, t.userId), haalAlleMedewerkers(t.admin, t.userId)])
  const v = kiesUit(t.vestigingen, null)
  const vestigingNaam = v ? naamVan(t.vestigingen, v) : t.organisatie.naam

  return (
    <>
      <InstelKruimel id="opvolgregels" />
      <header className="club-paginakop">
        <div>
          <p className="club-boventitel">{t.organisatie.naam}</p>
          <h1>Automatiseringen</h1>
          <p>Regels die elke dag klaarzetten wie het team even aanspreekt: nieuwe leden, proefleden, wie wegblijft, verjaardagen, opzeggingen en mijlpalen. Ze vullen de opvolglijst met een voorbeeldtekst. Club verstuurt zelf nog niets; automatisch versturen per mail of app komt later.</p>
        </div>
        {v && (
          <div className="club-acties">
            <Link href={clubPad('/opvolgen', v)} className="club-knop">
              <ListChecks size={16} aria-hidden /> Naar de opvolglijst
            </Link>
          </div>
        )}
      </header>

      <aside className="club-auto-uitleg" aria-label="Zo werkt het">
        <ol>
          <li><strong>Elke dag</strong> kijkt Club bij het openen van de opvolglijst welke leden aan een regel voldoen.</li>
          <li><strong>Nooit dubbel:</strong> per lid en aanleiding komt er een taak. Een verjaardag een keer per jaar, risico hooguit een keer per maand.</li>
          <li><strong>Vanzelf opgelost:</strong> komt iemand weer trainen voordat je belde, dan verdwijnt de taak van de lijst.</li>
        </ol>
      </aside>

      {!regels && <p className="club-melding club-melding--fout" role="status">De regels konden niet worden gelezen. Probeer het later opnieuw.</p>}
      {medewerkers === null && <p className="club-melding" role="status">De medewerkers konden niet worden gelezen; je kunt nu alleen een functie kiezen.</p>}
      {regels && <RegelsBeheer regels={regels} medewerkers={medewerkers ?? []} vestigingNaam={vestigingNaam} />}
    </>
  )
}
