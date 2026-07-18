import { VitaKaart } from '@/components/lifeos/vita/VitaKaart'
import { VitaGesprek } from '@/components/lifeos/vita/VitaGesprek'
import { VitaGeheugen } from '@/components/lifeos/vita/VitaGeheugen'
import { DagplanKaart } from '@/components/lifeos/taken/DagplanKaart'
import { TakenLijst } from '@/components/lifeos/taken/TakenLijst'
import { BrainDumpKaart } from '@/components/lifeos/notities/BrainDumpKaart'
import { KennisGrafiekKaart } from '@/components/lifeos/notities/KennisGrafiekKaart'
import { FocusKaart } from '@/components/lifeos/focus/FocusKaart'
import { AgendaKaart } from '@/components/lifeos/agenda/AgendaKaart'
import { InboxKaart } from '@/components/lifeos/inbox/InboxKaart'
import { WelzijnScoreKaart } from '@/components/lifeos/welzijn/WelzijnScoreKaart'
import { BurnoutKaart } from '@/components/lifeos/welzijn/BurnoutKaart'
import { StressLogKaart } from '@/components/lifeos/welzijn/StressLogKaart'
import { StemmingLogKaart } from '@/components/lifeos/welzijn/StemmingLogKaart'
import { VoedingCockpitKaart } from '@/components/lifeos/gezondheid/VoedingCockpitKaart'
import { WaterCockpitKaart } from '@/components/lifeos/gezondheid/WaterCockpitKaart'
import { WorkoutCockpitKaart } from '@/components/lifeos/gezondheid/WorkoutCockpitKaart'
import { MijnLeven } from '@/components/lifeos/leven/MijnLeven'
import { MensenBord } from '@/components/lifeos/crm/MensenBord'
import { SnelKnoppen } from './SnelKnoppen'

// ─── De cockpit ──────────────────────────────────────────────────────────────
// Eén vullend, breed werkscherm in plaats van zeven losse zones onder elkaar die
// elk een ánder grid gebruikten. De kaarten liggen nu op één gedeeld 12-koloms
// clusterraster: elk cluster is een eigen grid met exact hetzelfde kolom-template,
// zodat de kolomlijnen overal op dezelfde plek vallen en de naden tussen clusters
// doorlopen. Zie `.os-cluster` + de `.os-tile--*`-span-utilities in globals.css —
// daar staat ook de rij-optel-controle die bewijst dat geen rij een wees-cel houdt.
//
// Server Component: hier zit alleen indeling, geen state. Elke kaart is een eigen
// client-eiland dat zichzelf ophaalt — de 'use client'-grens ligt zo laag mogelijk,
// precies één niveau onder deze compositie.
//
// ─── Rang via schaal, niet via kleur ────────────────────────────────────────
// Precies één kaart per scherm mag de luidste zijn: de Vita-band (`dragend`). Hij
// is niet nóg een widget maar legt het verband tussen de kaarten eronder, dus hij
// staat bovenaan én is de enige dragende kaart. De brede ankers (Dagplan, Taken)
// dragen hun rang via een brede span, niet via een luidere nadruk; de rest is
// gelijkwaardig gereedschap. Cyaan blijft strikt accent.
//
// ─── Drie clusters, twee banden ─────────────────────────────────────────────
//   1. Band  — Vita: wat moet je nú weten?
//   2. Cluster "Mijn dag": je gereedschap.
//   3. Band  — Vita-gesprek: je vraagt Vita iets nádat je zag wat er speelt.
//   4. Cluster "Welzijn & loggen": vijf invoerkaarten naar je échte data.
//   5. Cluster "Verbinden": de mensen om je heen, je kennis en je terugblik.

export function Cockpit() {
  return (
    <div className="os-cockpit">
      {/* Band 1 — de verbindende, dragende kaart. */}
      <div className="os-cockpit__band">
        <VitaKaart nadruk="dragend" />
      </div>

      {/* Cluster "Mijn dag" — Dagplan en Taken zijn de brede ankers (span 6 op
          12 kolommen), de acht steunkaarten vullen als kwart-tegels exact twee
          rijen van vier. */}
      <section className="os-cluster" aria-labelledby="os-dag-kop">
        <header className="os-cluster__kop">
          <h2 id="os-dag-kop" className="os-zone__kop">
            Mijn dag
          </h2>
          <p className="os-zone__intro">
            Je gereedschap. Het dagplan adviseert op basis van wat je hebt ingevuld — je top-3 blijft
            jouw keuze en wint altijd van het advies.
          </p>
        </header>

        <div className="os-tile--anker">
          <DagplanKaart />
        </div>
        <div className="os-tile--anker">
          <TakenLijst />
        </div>
        <div className="os-tile--kwart">
          <WelzijnScoreKaart />
        </div>
        <div className="os-tile--kwart">
          <BurnoutKaart />
        </div>
        <div className="os-tile--kwart">
          <AgendaKaart />
        </div>
        <div className="os-tile--kwart">
          <InboxKaart />
        </div>
        <div className="os-tile--kwart">
          <BrainDumpKaart />
        </div>
        <div className="os-tile--kwart">
          <FocusKaart />
        </div>
        <div className="os-tile--kwart">
          <VitaGeheugen />
        </div>
        <div className="os-tile--kwart">
          <SnelKnoppen />
        </div>
      </section>

      {/* Band 2 — het gesprek onder het gereedschap. Volle breedte, maar de
          leeskolom krijgt lucht via `.os-cockpit__gesprek` (gecentreerde
          max-width): een gesprek dat over 1600px uitwaaiert leest niet. */}
      <div className="os-cockpit__gesprek">
        <VitaGesprek />
      </div>

      {/* Cluster "Welzijn & loggen" — vijf invoerkaarten die naar Kane's ÉCHTE
          MentaForce-data schrijven via zijn eigen sessie en RLS (één bron, geen
          dubbele cijfers). Stress en stemming staan erbij omdat die twee pijlers
          anders nergens een invoerpunt hadden. Op 12 kolommen: Voeding+Water+
          Workout (elk een derde) op rij 1, Stress+Stemming (elk de helft) op rij
          2 — geen wees-cel meer. */}
      <section className="os-cluster" aria-labelledby="os-log-kop">
        <header className="os-cluster__kop">
          <h2 id="os-log-kop" className="os-zone__kop">
            Welzijn &amp; loggen
          </h2>
          <p className="os-zone__intro">
            Vijf invoerkaarten die naar je échte MentaForce-data schrijven — via je eigen sessie, niet
            naar een tweede database. Eén bron, geen dubbele cijfers.
          </p>
        </header>

        <div className="os-tile--derde">
          <VoedingCockpitKaart />
        </div>
        <div className="os-tile--derde">
          <WaterCockpitKaart />
        </div>
        <div className="os-tile--derde">
          <WorkoutCockpitKaart />
        </div>
        <div className="os-tile--half">
          <StressLogKaart />
        </div>
        <div className="os-tile--half">
          <StemmingLogKaart />
        </div>
      </section>

      {/* Cluster "Verbinden" — drie volle-breedte-surfaces: het mensen-bord (een
          kanban vraagt breedte), de kennisgrafiek en de terugblik "Mijn leven".
          Alle drie span 12. */}
      <section className="os-cluster" aria-labelledby="os-verbinden-kop">
        <header className="os-cluster__kop">
          <h2 id="os-verbinden-kop" className="os-zone__kop">
            Verbinden
          </h2>
          <p className="os-zone__intro">
            De mensen om je heen, je kennisgrafiek en je terugblik op de zes pijlers.
          </p>
        </header>

        {/* Het CRM-bord op dezelfde pagina i.p.v. een aparte route. Het `id` laat
            de nav er direct naartoe scrollen (/home#mensen) — behouden. Een
            aria-label geeft de sectie een naam zonder een tweede kop naast de
            clusterkop te stapelen. */}
        <section
          id="mensen"
          className="os-tile--vol os-mensen"
          aria-label="Mensen — je PT-klanten en teams"
        >
          <p className="os-zone__intro">
            Je PT-klanten en je teams. Sleep een kaart naar een andere kolom om de status te wijzigen,
            of open een kaart voor de geschiedenis en bijzonderheden.
          </p>
          <MensenBord />
        </section>

        {/* De kennisgrafiek: hoort in geest bij de brain dump, maar heeft breedte
            nodig die de bento niet geeft. */}
        <div className="os-tile--vol">
          <KennisGrafiekKaart />
        </div>

        {/* De tweede vraag: hoe sta ik ervoor? */}
        <div className="os-tile--vol">
          <MijnLeven />
        </div>
      </section>
    </div>
  )
}
