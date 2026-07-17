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
import { SnelKnoppen } from './SnelKnoppen'

// ─── De cockpit ──────────────────────────────────────────────────────────────
// Eén vullend werkscherm in plaats van drie moment-tabs die de kern (taken,
// notities) verstopten.
//
// Server Component: hier zit alleen indeling, geen state. Elke kaart is een eigen
// client-eiland dat zichzelf ophaalt — de 'use client'-grens ligt zo laag
// mogelijk, precies één niveau onder deze compositie.
//
// ─── Twee vragen, twee zones ────────────────────────────────────────────────
//
// De cockpit is per TOOL ingedeeld: een kaart voor water, een voor taken, een
// voor je agenda. Dat werkt als je iets wíl doen — het is de "wat doe ik nu?"-
// vraag. Maar dat is niet de enige vraag die een Life OS moet beantwoorden.
//
//   1. "Mijn dag"   — wat doe ik nu? Gereedschap, per tool.
//   2. "Mijn leven" — hoe sta ik ervoor? Een lens, per domein.
//
// Ze staan onder elkaar en niet achter een tab, omdat de tweede vraag anders
// nooit gesteld wordt. Wel met een kop ertussen: zonder die scheiding wordt dit
// de widget-muur waar het ontwerp zich tegen verzet — twintig kaarten die
// allemaal even hard roepen is geen overzicht, dat is ruis met een raster.
//
// ─── Waarom Vita bovenaan en dragend ────────────────────────────────────────
//
// Vita is niet nóg een widget: hij legt het verband tussen de kaarten eronder.
// Daarom de volle band én `dragend` — precies één kaart per scherm mag de
// luidste zijn (zie `os/Kaart.tsx`), en dat hoort de kaart te zijn die je vertelt
// waar je op moet letten. Hij stond op `normaal` terwijl een pomodoro-timer
// `dragend` claimde; de luidste stem op het scherm was een eierwekker.

export function Cockpit() {
  return (
    <div className="os-cockpit">
      {/* De verbindende band: wat moet je nú weten? */}
      <div className="os-cockpit__band">
        <VitaKaart nadruk="dragend" />
      </div>

      <section className="os-zone" aria-labelledby="os-dag-kop">
        <header>
          <h2 id="os-dag-kop" className="os-zone__kop">
            Mijn dag
          </h2>
          <p className="os-zone__intro">
            Je gereedschap. Het dagplan adviseert op basis van wat je hebt ingevuld — je top-3 blijft
            jouw keuze en wint altijd van het advies.
          </p>
        </header>

        <div className="os-cockpit__grid">
          <section className="os-prod" aria-label="Werk">
            {/* Het advies boven het gereedschap: eerst "wat zou ik doen?", dan
                de volledige lijst om het te doen. */}
            <div className="os-prod__vol">
              <DagplanKaart />
            </div>
            <div className="os-prod__vol">
              <TakenLijst />
            </div>
            <AgendaKaart />
            <InboxKaart />
            <BrainDumpKaart />
            <FocusKaart />
          </section>

          <aside className="os-rail" aria-label="Welzijn">
            <WelzijnScoreKaart />
            <BurnoutKaart />
            <VitaGeheugen />
            <SnelKnoppen />
          </aside>
        </div>
      </section>

      {/* Het gesprek onder het gereedschap: je vraagt Vita iets nádat je gezien
          hebt wat er speelt, niet ervoor. */}
      <VitaGesprek />

      {/* ─── Loggen ───────────────────────────────────────────────────────────
          Vijf invoerkaarten, geen drie. Stress en stemming zijn erbij gekomen
          omdat ze anders structureel ontbraken: die twee pijlers worden
          UITSLUITEND gevoed door `stress_logs` en `stemming_logs`, en er was
          nergens een invoerpunt. Daardoor kon de welzijnsscore nooit boven
          "4 van 6 gemeten" komen — niet omdat er niks te meten viel, maar omdat
          de app er niet naar vroeg.

          Deze vijf schrijven naar Kane's ÉCHTE MentaForce-data via zijn eigen
          sessie en RLS — niet via de LifeOS-founder-gate, en niet naar een
          tweede database. Eén bron, geen dubbele cijfers. */}
      <section className="os-gezond" aria-label="Gezondheid loggen">
        <VoedingCockpitKaart />
        <WaterCockpitKaart />
        <WorkoutCockpitKaart />
        <StressLogKaart />
        <StemmingLogKaart />
      </section>

      {/* De kennisgrafiek staat bij de brain dump in geest, maar niet in plaats:
          hij heeft breedte nodig die de twee-koloms bento niet geeft. */}
      <KennisGrafiekKaart />

      {/* De tweede vraag: hoe sta ik ervoor? */}
      <MijnLeven />
    </div>
  )
}
