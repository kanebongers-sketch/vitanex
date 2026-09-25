// ─── LifeOS — Sportmerk: het uitvoeringsplan ────────────────────────────────
// Digital-first, zonder eigen voorraad. Elke fase heeft vooraf vastgelegde
// criteria: wanneer we doorgaan en wanneer we herzien. Zo beslist data, niet
// hoop of sunk cost.
//
// EERLIJK: alle drempels hieronder zijn werkaannames om mee te starten, geen
// branchebenchmarks. Ze worden bijgesteld zodra er eigen cijfers zijn.

import type { Fase } from './types'

export const FASEN: Fase[] = [
  {
    naam: 'Fundament',
    periode: 'Week 1–3',
    doel: 'Merknaam, positionering en belofte vast; domein, handles en merkcheck rond; opzet van het eerste programma.',
    doorAls: 'Naam is vrij (domein, handles, merkenregister) en de belofte past in één zin.',
    herzienAls: 'Geen vrije naam die past: terug naar de naamrichtingen, niet doorgaan met een compromis.',
  },
  {
    naam: 'Publiek en wachtlijst',
    periode: 'Week 2–10',
    doel: '4–5 korte video’s per week over race-prep en hybride training; een gratis instapmiddel dat e-mailadressen oplevert; 5–10 gyms/PT’s als partner.',
    doorAls: '≥ 500 aanmeldingen in 8 weken en ≥ 20% van de bezoekers van de wachtlijstpagina meldt zich aan.',
    herzienAls: '< 150 aanmeldingen: hooks, instapmiddel of doelgroep aanpassen en 4 weken opnieuw testen.',
  },
  {
    naam: 'Eerste betaalde programma',
    periode: 'Week 8–14',
    doel: 'Het 12-weken-programma voorverkopen aan de wachtlijst met een vaste startdatum; bouwen terwijl het al verkocht is.',
    doorAls: '≥ 3–5% van de lijst koopt (≥ 50 verkopen) en < 5% vraagt geld terug.',
    herzienAls: '< 1% koopt: prijs, belofte of programma-opzet herzien vóór er meer gebouwd wordt.',
  },
  {
    naam: 'Abonnement en merch',
    periode: 'Maand 4–6',
    doel: 'Doorlopend programma per maand (nieuwe blokken per raceseizoen) plus community; caps via print-on-demand als merkdrager.',
    doorAls: '≥ 70% blijft na maand 2 en klanten delen hun resultaten uit zichzelf.',
    herzienAls: 'Retentie < 50%: eerst het product verbeteren, niet meer klanten zoeken.',
  },
  {
    naam: 'Pre-order van de tas',
    periode: 'Maand 6–9',
    doel: 'Ontwerp en sample, daarna een pre-ordercampagne met een vast minimum. Klanten financieren de productierun.',
    doorAls: 'Lijst ≥ 2.000 en ≥ 300 betalende klanten vóór de start; minimum binnen de campagneperiode gehaald.',
    herzienAls: 'Minimum niet gehaald: iedereen volledig terugbetalen en het ontwerp of de prijs herzien.',
  },
]
