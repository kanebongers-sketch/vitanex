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
// dragen hun rang via een brede span, niet via een luidere nadruk; daaronder
// krijgen de kaarten die breedte dragen (Welzijn, Agenda, Inbox, Brain dump) een
// halve tegel en de compacte tools een kwart — rang via schaal, niet via kleur.
// Cyaan blijft strikt accent.
//
// ─── Twee clusters, twee banden ─────────────────────────────────────────────
//   1. Band  — Vita: wat moet je nú weten?
//   2. Cluster "Mijn dag": je gereedschap (incl. de 6 pijlers als knop-kaarten).
//   3. Band  — Vita-gesprek: je vraagt Vita iets nádat je zag wat er speelt.
//   4. Cluster "Verbinden": de mensen om je heen, je kennis en je terugblik.
//
// De losse invoerkaarten (Voeding/Water/Workout/Stress/Stemming) stonden hier als
// inline-gemak, maar zijn eruit: de 6 pijlerkaarten dekken het welzijnsbeeld, en
// loggen leeft op de eigen MentaForce-pagina's (/checkin, /stress, /stemming,
// /voeding, /water) plus de "Check-in doen"-knop in de Welzijn-kaart.

export function Cockpit() {
  return (
    <div className="os-cockpit">
      {/* Band 1 — de verbindende, dragende kaart. */}
      <div className="os-cockpit__band">
        <VitaKaart nadruk="dragend" />
      </div>

      {/* Cluster "Mijn dag" — Dagplan en Taken zijn de brede ankers (span 6 op
          12 kolommen). Daaronder twee rijen halve tegels voor de kaarten die
          breedte dragen (Welzijn, de agenda met haar 3-dagen-rooster, Inbox,
          Brain dump) en één rij van vier kwart-tegels voor de compacte tools
          (Burn-out, Focus, Vita-geheugen, Snelknoppen). Op 12 kolommen telt elke
          rij exact op tot 12; op smaller vallen half en kwart samen tot paren —
          zie de rij-optel-controle in globals.css. */}
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
        {/* Twee rijen halve tegels: de kaarten die breedte dragen. De agenda
            heeft haar 3-dagen-rooster (min ~448px) en agendalijst; op een halve
            tegel passen de drie dagkolommen comfortabel i.p.v. samengeperst. */}
        <div className="os-tile--half">
          <WelzijnScoreKaart />
        </div>
        <div className="os-tile--half">
          <AgendaKaart />
        </div>
        <div className="os-tile--half">
          <InboxKaart />
        </div>
        <div className="os-tile--half">
          <BrainDumpKaart />
        </div>

        {/* Eén rij van vier kwart-tegels: de compacte tools. */}
        <div className="os-tile--kwart">
          <BurnoutKaart />
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
