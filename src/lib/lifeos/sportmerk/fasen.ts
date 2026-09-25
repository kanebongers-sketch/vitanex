// ─── LifeOS — Sportmerk: het uitvoeringsplan ────────────────────────────────
// Productmerk in drops via pre-order: geen eigen voorraad, de oprichter blijft
// uit beeld, en niets raakt aan zijn werk. Elke fase heeft vooraf vastgelegde
// criteria: wanneer we doorgaan en wanneer we herzien. Zo beslist data, niet
// hoop of sunk cost.
//
// EERLIJK: alle drempels hieronder zijn werkaannames om mee te starten, geen
// branchebenchmarks. Ze worden bijgesteld zodra er eigen cijfers zijn.

import type { Fase } from './types'

export const FASEN: Fase[] = [
  {
    naam: 'Fundament',
    periode: 'Week 1–4',
    doel: 'Merknaam, belofte en visuele identiteit; domein, handles en merkcheck. Merk los van jou opzetten: eigen handelsnaam, zakelijke e-mail, geen koppeling met je persoonlijke accounts.',
    doorAls: 'Naam is vrij (domein, handles, merkenregister) en de belofte past in één zin.',
    herzienAls: 'Geen vrije naam die past: terug naar de naamrichtingen, niet doorgaan met een compromis.',
  },
  {
    naam: 'Ontwerp en sample',
    periode: 'Week 3–8',
    doel: 'Tas-functies ophalen bij 15–20 hybrid athletes (online, via het merk). 3–5 tassenmakers benaderen, 1–2 samples laten maken.',
    doorAls: 'Een sample haalt de kwaliteitseis bij een kostprijs ≤ €28 en een MOQ ≤ 300 stuks.',
    herzienAls: 'Kostprijs > €32 of MOQ > 500: andere leverancier of het ontwerp vereenvoudigen.',
  },
  {
    naam: 'Vraagtest',
    periode: 'Week 6–10',
    doel: 'Landingspagina met echte samplebeelden en een wachtlijst; klein advertentiebudget (€300–600); 5–10 hybrid-creators krijgen een sample.',
    doorAls: '≥ 300 aanmeldingen en ≤ €4 advertentiekosten per aanmelding.',
    herzienAls: '> €8 per aanmelding: beeld, prijs of belofte herzien en opnieuw testen.',
  },
  {
    naam: 'Drop 1: pre-order',
    periode: 'Week 10–14',
    doel: 'Pre-order van 2–3 weken met een vast minimum (= de MOQ) en een eerlijke levertermijn. Eerst de wachtlijst, daarna ads.',
    doorAls: 'Minimum gehaald binnen de campagneperiode.',
    herzienAls: 'Minimum niet gehaald: iedereen volledig terugbetalen en uitzoeken waar het afhaakte.',
  },
  {
    naam: 'Productie en levering',
    periode: 'Week 14–24',
    doel: 'Kwaliteitsinspectie vóór verzending, levering via een EU-3PL, daarna reviews en klantbeelden vragen.',
    doorAls: '< 3% klachten of retouren en ≥ 30% van de klanten laat een review achter.',
    herzienAls: 'Kwaliteitsklachten: eerst met de leverancier oplossen vóór drop 2.',
  },
  {
    naam: 'Drop 2 en verder',
    periode: 'Vanaf maand 6',
    doel: 'Nieuwe drops per raceseizoen: de tas opnieuw plus add-ons (straps, belt, cap) in dezelfde run. Bestaande klanten krijgen voorrang.',
    doorAls: '≥ 25% van de drop komt van terugkerende klanten of hun doorverwijzingen.',
    herzienAls: 'Vooral nieuwe klanten via dure ads: merk en productlijn herzien vóór opschalen.',
  },
]
