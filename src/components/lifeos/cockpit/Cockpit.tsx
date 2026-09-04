import { DagbriefingKaart } from '@/components/lifeos/dagbriefing/DagbriefingKaart'
import { VitaKaart } from '@/components/lifeos/vita/VitaKaart'
import { VitaGesprek } from '@/components/lifeos/vita/VitaGesprek'
import { DagplanKaart } from '@/components/lifeos/taken/DagplanKaart'
import { VangOp } from '@/components/lifeos/vangop/VangOp'
import { KennisGrafiekKaart } from '@/components/lifeos/notities/KennisGrafiekKaart'
import { AgendaKaart } from '@/components/lifeos/agenda/AgendaKaart'
import { InboxKaart } from '@/components/lifeos/inbox/InboxKaart'
import { MensenBord } from '@/components/lifeos/crm/MensenBord'
import { FinanceKaart } from '@/components/lifeos/finance/FinanceKaart'
import { PtGesprekkenKaart } from '@/components/lifeos/pt/PtGesprekkenKaart'
import { RefreshProvider } from '@/components/lifeos/os/RefreshContext'

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
// De dagbriefing-band staat bovenaan en is de luidste: het is het eerste wat je
// 's ochtends leest — de COO-briefing die de dag samenvat. Vita volgt eronder als
// je interactieve companion: nog altijd `dragend`, maar één trap onder de briefing.
// De brede ankers (Dagplan, Vang op) dragen hun rang via een brede span, niet via
// een luidere nadruk; daaronder een rij halve tegels (Agenda, Inbox) — rang via
// schaal, niet via kleur. Cyaan blijft strikt accent.
//
// Welzijn, training en voeding stonden hier ook, maar zijn eruit: welzijn dubbelde
// met de gewone app (Home → zes pijlers) en training/voeding kregen een eigen
// /training-pagina in de sidebar. Dit dashboard blijft op werk, taken en agenda.
//
// ─── Drie banden, twee clusters ─────────────────────────────────────────────
//   1. Band  — Dagbriefing: wat is vandaag het beeld? (het eerste wat je leest)
//   2. Band  — Vita: wat moet je nú weten?
//   3. Cluster "Mijn dag": je gereedschap — dagplan, vang op, agenda en inbox.
//   4. Band  — Vita-gesprek: je vraagt Vita iets nádat je zag wat er speelt.
//   5. Cluster "Verbinden": de mensen om je heen, je geld en je kennis — je
//      zakelijke overzicht.
//
// De losse invoerkaarten (Voeding/Water/Workout/Stress/Stemming) stonden hier als
// inline-gemak, maar zijn eruit: de 6 pijlerkaarten dekken het welzijnsbeeld, en
// loggen leeft op de eigen MentaForce-pagina's (/checkin, /stress, /stemming,
// /voeding, /water) plus de "Check-in doen"-knop in de Welzijn-kaart.

export function Cockpit() {
  return (
    <RefreshProvider>
    <div className="os-cockpit">
      {/* Band 1 — de dagbriefing: het eerste wat je 's ochtends leest, de luidste
          band via schaal en een zachte cyaan-gloed. */}
      <div className="os-cockpit__band">
        <DagbriefingKaart />
      </div>

      {/* Band 2 — de verbindende, dragende kaart onder de briefing. */}
      <div className="os-cockpit__band">
        <VitaKaart nadruk="dragend" />
      </div>

      {/* Cluster "Mijn dag" — Dagplan en Vang op zijn de brede ankers (span 6 op
          12 kolommen). Daaronder één rij halve tegels (Welzijn + de agenda met
          haar 3-dagen-rooster) en de inbox als volle-breedte-lijst. Elke rij telt
          op 12 kolommen exact op tot 12; op smaller vallen de halve tegels samen
          tot een paar en pakt de volle tegel de hele breedte. */}
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

        {/* Dagplan en Vang op zijn de brede ankers (span 6). Welzijn is eruit — dat
            zit al in de gewone app (Home → de zes pijlers) en dubbelde hier; Training
            (het 4-weken-blok) en het programma-/voedingsschema verhuisden naar de
            eigen /training-pagina in de sidebar. Zo blijft dit dashboard op werk,
            taken en agenda gericht i.p.v. álles tegelijk. */}
        <div className="os-tile--anker">
          <DagplanKaart />
        </div>
        {/* "Vang op": één capture-balk voor taken én notities, met de rijke lijst
            eronder. Vervangt de losse takenlijst + brain dump — de systemen erachter
            bleven gescheiden, alleen de dubbele invoer is samengevoegd. */}
        <div className="os-tile--anker">
          <VangOp />
        </div>
        {/* Eén rij halve tegels: de agenda (met haar 1-dag/7-dagen-rooster) en de
            inbox-triage. Samen 12 kolommen; op smaller stapelen ze vanzelf. */}
        <div className="os-tile--half">
          <AgendaKaart />
        </div>
        <div className="os-tile--half">
          <InboxKaart />
        </div>
        {/* PT-gesprekken: het 2-wekelijkse coachgesprek per PT-klant. Compact —
            toont vooral wie nog ingepland moet worden; de rest zit ingeklapt. */}
        <div className="os-tile--half">
          <PtGesprekkenKaart />
        </div>
      </section>

      {/* Band 2 — het gesprek onder het gereedschap. Volle breedte, maar de
          leeskolom krijgt lucht via `.os-cockpit__gesprek` (gecentreerde
          max-width): een gesprek dat over 1600px uitwaaiert leest niet. */}
      <div className="os-cockpit__gesprek">
        <VitaGesprek />
      </div>

      {/* Cluster "Verbinden" — drie volle-breedte-surfaces: het mensen-bord (een
          kanban vraagt breedte), het geld-overzicht en de kennisgrafiek. Elk span
          12, dus elk een eigen rij. Samen Kane's zakelijke overzicht: de mensen,
          het geld dat ze opleveren en de kennis eromheen. De terugblik "Mijn
          leven" stond hier, maar hoort niet op een dashboard dat op werk,
          dagelijkse taken en CRM is gericht — die component blijft bestaan voor
          een eigen plek. */}
      <section className="os-cluster" aria-labelledby="os-verbinden-kop">
        <header className="os-cluster__kop">
          <h2 id="os-verbinden-kop" className="os-zone__kop">
            Verbinden
          </h2>
          <p className="os-zone__intro">
            De mensen om je heen, je geldoverzicht en je kennisgrafiek.
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

        {/* Geld en kennis naast elkaar (half): scheelt een volle rij en houdt de
            kaarten op een prettige breedte i.p.v. de hele 2400px. Op smaller
            stapelen ze vanzelf. */}
        <div className="os-tile--half">
          <FinanceKaart />
        </div>

        <div className="os-tile--half">
          <KennisGrafiekKaart />
        </div>
      </section>
    </div>
    </RefreshProvider>
  )
}
