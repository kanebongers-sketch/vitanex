import { VitaKaart } from '@/components/lifeos/vita/VitaKaart'
import { TakenLijst } from '@/components/lifeos/taken/TakenLijst'
import { BrainDumpKaart } from '@/components/lifeos/notities/BrainDumpKaart'
import { FocusKaart } from '@/components/lifeos/focus/FocusKaart'
import { AgendaKaart } from '@/components/lifeos/agenda/AgendaKaart'
import { InboxKaart } from '@/components/lifeos/inbox/InboxKaart'
import { WelzijnScoreKaart } from '@/components/lifeos/welzijn/WelzijnScoreKaart'
import { VoedingCockpitKaart } from '@/components/lifeos/gezondheid/VoedingCockpitKaart'
import { WaterCockpitKaart } from '@/components/lifeos/gezondheid/WaterCockpitKaart'
import { WorkoutCockpitKaart } from '@/components/lifeos/gezondheid/WorkoutCockpitKaart'
import { SnelKnoppen } from './SnelKnoppen'

// ─── De cockpit ──────────────────────────────────────────────────────────────
// Eén vullend werkscherm in plaats van drie moment-tabs die de kern (taken,
// notities) verstopten. Alles staat tegelijk in beeld; de disclosure-lade en de
// klok-gestuurde tab-wissel zijn weg.
//
// Server Component: hier zit alleen indeling, geen state. Elke kaart is een eigen
// client-eiland dat zichzelf ophaalt (Vita, taken, brain dump, agenda, inbox,
// focus, welzijn) — de 'use client'-grens ligt zo laag mogelijk, precies één
// niveau onder deze compositie.
//
// Compositie (zie ook de CSS in globals.css, .os-cockpit):
//   1. Vita als volle band bovenaan — hij is niet nóg een widget, hij legt het
//      verband tussen de kaarten eronder.
//   2. Productiviteit (de kern) links: de volwaardige takenlijst als anker over
//      de volle breedte, daaronder brain dump, focus, agenda en inbox in een
//      twee-koloms bento.
//   3. Welzijn rechts als zij-rail: de échte MentaForce-welzijnsscore, plus de
//      Check-in-tegel.
//   4. Gezondheid als eigen rij over de volle breedte: drie échte invoerkaarten
//      (voeding, water, workout) die rechtstreeks naar Kane's MentaForce-data
//      schrijven — geen tweede DB, geen dubbele cijfers. Ze staan bewust apart
//      van de rail: een invoerformulier heeft breedte nodig die de smalle rail
//      niet geeft.

export function Cockpit() {
  return (
    <div className="os-cockpit">
      {/* De verbindende band. nadruk="normaal": over de volle breedte hoeft Vita
          niet óók de grootste kaart te zijn — de plek zegt al genoeg. */}
      <div className="os-cockpit__band">
        <VitaKaart nadruk="normaal" />
      </div>

      <div className="os-cockpit__grid">
        <section className="os-prod" aria-label="Productiviteit">
          {/* De takenlijst is het anker: over de volle breedte van de zone. */}
          <div className="os-prod__vol">
            <TakenLijst />
          </div>
          <BrainDumpKaart />
          <FocusKaart />
          <AgendaKaart />
          <InboxKaart />
        </section>

        <aside className="os-rail" aria-label="Welzijn">
          <WelzijnScoreKaart />
          <SnelKnoppen />
        </aside>
      </div>

      <section className="os-gezond" aria-label="Gezondheid loggen">
        <VoedingCockpitKaart />
        <WaterCockpitKaart />
        <WorkoutCockpitKaart />
      </section>
    </div>
  )
}
