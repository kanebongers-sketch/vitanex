// ─── LifeOS — Sportmerk: het uitvoeringsplan ────────────────────────────────
// Het ZONE2-model voor de hybrid athlete: merk als held, levering via
// leveranciers met een EU-magazijn, groei via ads en creators. Elke fase heeft
// vooraf vastgelegde criteria: wanneer we doorgaan en wanneer we herzien. Zo
// beslist data, niet hoop of sunk cost.
//
// EERLIJK: alle drempels hieronder zijn werkaannames om mee te starten, geen
// branchebenchmarks. Ze worden bijgesteld zodra er eigen cijfers zijn.

import type { Fase } from './types'

export const FASEN: Fase[] = [
  {
    naam: 'Fundament',
    periode: 'Week 1–3',
    doel: 'Een naam met betekenis voor de doelgroep, belofte en visuele identiteit; domein, handles en merkcheck. Merk los van jou: eigen handelsnaam, zakelijke e-mail, geen koppeling met je persoonlijke accounts.',
    doorAls: 'Naam is vrij (domein, handles, merkenregister) en de belofte past in één zin.',
    herzienAls: 'Geen vrije naam die past: terug naar de naamrichtingen, niet doorgaan met een compromis.',
  },
  {
    naam: 'Leveranciers en testbestellingen',
    periode: 'Week 2–6',
    doel: '3–5 leveranciers of fulfilmentpartners met voorraad in de EU; van elk kernproduct een testbestelling naar je eigen adres (levertijd, kwaliteit, verpakking, logo).',
    doorAls: 'Levering ≤ 5 werkdagen, kwaliteit die je zelf zou kopen, kostprijs binnen de range.',
    herzienAls: 'Levertijd > 7 dagen of twijfel over kwaliteit: andere leverancier. Nooit live met een twijfelproduct.',
  },
  {
    naam: 'Winkel en beeld',
    periode: 'Week 4–8',
    doel: 'Webshop met eigen productbeeld (van de testexemplaren, nooit leveranciersfoto’s), 2–3 bundels, eerlijke levertijd en een helder retourbeleid.',
    doorAls: 'Een testbestelling door een buitenstaander loopt foutloos door en de productpagina laadt < 2,5 s op mobiel.',
    herzienAls: 'Buitenstaanders twijfelen of het een echt merk is: beeld en copy eerst verbeteren.',
  },
  {
    naam: 'Advertentietest',
    periode: 'Week 8–12',
    doel: '€500–1.000 over 10–20 advertenties: productbeeld, creator-video’s en bundel-aanbiedingen. Meten per aanbod, niet per gevoel.',
    doorAls: 'Acquisitie ≤ €35 per klant en gemiddelde orderwaarde ≥ €75.',
    herzienAls: '> €50 per klant: aanbod of beeld herzien. Na 3 testrondes niet gehaald: de richting herzien.',
  },
  {
    naam: 'Opschalen',
    periode: 'Week 12–24',
    doel: 'Budget in stappen van 20–30% verhogen zolang de acquisitiekosten houden; e-mailflows (verlaten winkelwagen, na aankoop), reviews en herhaalaankopen.',
    doorAls: 'Acquisitiekosten blijven onder de drempel bij 2× het budget en ≥ 20% koopt binnen 90 dagen opnieuw.',
    herzienAls: 'Marge zakt bij meer budget: stoppen met opschalen, eerst bundels en prijzen verbeteren.',
  },
  {
    naam: 'Eigen producten',
    periode: 'Vanaf maand 6',
    doel: 'De best verkopende producten overzetten naar een eigen ontwerp, beginnend met de racetas als drop via pre-order.',
    doorAls: 'Een product verkoopt 3 maanden stabiel en klanten vragen om een betere versie.',
    herzienAls: 'Geen stabiele bestseller: eerst het assortiment verbeteren, nog geen eigen ontwerp.',
  },
]
