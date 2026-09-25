import { DagbriefingKaart } from '@/components/lifeos/dagbriefing/DagbriefingKaart'
import { VitaKaart } from '@/components/lifeos/vita/VitaKaart'
import { VitaGesprek } from '@/components/lifeos/vita/VitaGesprek'
import { TakenApple } from '@/components/lifeos/taken/TakenApple'
import { AgendaKaart } from '@/components/lifeos/agenda/AgendaKaart'
import { InboxKaart } from '@/components/lifeos/inbox/InboxKaart'
import { PtGesprekkenKaart } from '@/components/lifeos/pt/PtGesprekkenKaart'
import { PtKlantenKaart } from '@/components/lifeos/pt/PtKlantenKaart'
import { RefreshProvider } from '@/components/lifeos/os/RefreshContext'

// ─── De cockpit — één dag-scherm ────────────────────────────────────────────
// Dit dashboard gaat over VANDAAG en niets anders. De zware overzichten (het
// Mensen-kanban, je geld, je kennisgrafiek, de agenda-categorieën) hebben elk
// hun eigen pagina en zijn bereikbaar via de sidebar — ze staan niet meer
// ingebed, en er is geen tweede navigatie die de sidebar dubbelt. Dat haalt twee dingen weg die het scherm rommelig maakten: dezelfde
// Mensen-lijst die zowel een link als een heel bord was, en een pagina die tien
// zware oppervlakken tegelijk droeg.
//
// Server Component: hier zit alleen indeling, geen state. Elke kaart is een eigen
// client-eiland dat zichzelf ophaalt — de 'use client'-grens ligt zo laag mogelijk.
//
// ─── Eén Vita-stem, geen drie ───────────────────────────────────────────────
// Vita stond er drie keer: de dagbriefing, de "wat opvalt"-signalen en de vraag-
// balk, elk als losse band. Nu wonen ze in ÉÉN "Vandaag"-kaart: de briefing
// bovenaan, daaronder (achter een dunne lijn) wat opvalt en de vraag-balk. Eén
// oppervlak, één stem.
//
// ─── De volgorde, van boven naar onder ──────────────────────────────────────
//   1. Vandaag  — de briefing + Vita's signalen + vraag-balk (het eerste wat je leest).
//   2. Mijn dag — je taken en je agenda: wat moet er gebeuren en wanneer.
//   3. Deze week — wie je nog moet inplannen (PT-klanten) en de PT-gesprekken.
//   4. Inbox    — wat er écht een reactie vraagt, als rustige volle-breedte-lijst.

export function Cockpit() {
  return (
    <RefreshProvider>
      <div className="os-cockpit">
        {/* Band 1 — Vandaag: de briefing draagt de kaart; Vita's "wat opvalt" en de
            vraag-balk hangen erin via de `extra`-slot, zodat het één oppervlak is. */}
        <div className="os-cockpit__band">
          <DagbriefingKaart
            extra={
              <>
                <VitaKaart plat titel="Wat opvalt" nadruk="normaal" />
                <VitaGesprek plat titel="Vraag Vita" nadruk="normaal" />
              </>
            }
          />
        </div>

        {/* Cluster "Mijn dag" — twee halve tegels die exact optellen tot de volle
            breedte: wat moet er gebeuren (taken) en wanneer (agenda). */}
        <section className="os-cluster" aria-labelledby="os-dag-kop">
          <header className="os-cluster__kop">
            <h2 id="os-dag-kop" className="os-zone__kop">
              Mijn dag
            </h2>
            <p className="os-zone__intro">Je taken en je agenda voor vandaag — wat moet er gebeuren en wanneer.</p>
          </header>
          <div className="os-tile--half">
            <TakenApple />
          </div>
          <div className="os-tile--half">
            <AgendaKaart />
          </div>
        </section>

        {/* Cluster "Deze week" — het PT-paar, naast elkaar want ze horen bij elkaar:
            wie je deze week nog moet inplannen, en de 2-wekelijkse coachgesprekken. */}
        <section className="os-cluster" aria-labelledby="os-week-kop">
          <header className="os-cluster__kop">
            <h2 id="os-week-kop" className="os-zone__kop">
              Deze week
            </h2>
            <p className="os-zone__intro">Wie je nog moet inplannen, en de PT-gesprekken die eraan komen.</p>
          </header>
          <div className="os-tile--half">
            <PtKlantenKaart />
          </div>
          <div className="os-tile--half">
            <PtGesprekkenKaart />
          </div>
        </section>

        {/* Band — de inbox als rustige volle-breedte-lijst onder het gereedschap. */}
        <div className="os-cockpit__band">
          <InboxKaart />
        </div>
      </div>
    </RefreshProvider>
  )
}
