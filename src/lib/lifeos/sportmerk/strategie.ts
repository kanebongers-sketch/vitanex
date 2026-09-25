// ─── LifeOS — Sportmerk: de gekozen richting ────────────────────────────────
// Kane's nieuwe D2C-sportmerk, los van MentaForce zelf. Dit bestand is de ene
// bron van waarheid voor de strategie zoals die nu staat; alleen de founder-
// gated route `/api/lifeos/sportmerk` leest het, zodat het plan nooit in een
// publieke bundle of HTML-payload belandt.
//
// EERLIJK: marktclaims hebben een bron; prijzen en kostprijzen zijn schattingen
// tot er offertes of platformprijzen zijn. Marges worden hier
// niet getypt maar uitgerekend (`berekenMarge`), zodat ze nooit uit de pas lopen
// met de aannames die de pagina ernaast toont.

import { berekenMarge, MARGE_AANNAMES, VERZENDING_STANDAARD } from './marge'
import { FASEN } from './fasen'
import type { ProductAanname, Strategie } from './types'

const PRODUCTEN: ProductAanname[] = [
  {
    id: 'tas',
    naam: 'Modulaire gym-/racetas (pre-order)',
    rol: 'hoofdproduct',
    prijsInclBtw: 119,
    kostprijs: { min: 20, max: 28 },
    verzendkosten: VERZENDING_STANDAARD,
    retourRisico: 'laag',
    toelichting: 'De held van het merk. Schoen- en natvak, geen maten, licht. Break-even bij ~€60 acquisitie per klant.',
  },
  {
    id: 'race-kit',
    naam: 'Race-kit-bundel (pre-order): tas + handschoenen + straps + belt',
    rol: 'hoofdaanbod',
    prijsInclBtw: 149,
    kostprijs: { min: 30, max: 38 },
    verzendkosten: VERZENDING_STANDAARD,
    retourRisico: 'laag',
    toelichting: 'Tilt de orderwaarde; zonder eigen gezicht betaal je voor bereik, dus dit is de order die dat draagt.',
  },
  {
    id: 'straps',
    naam: 'Lifting straps (in een drop, pre-order)',
    rol: 'add-on',
    prijsInclBtw: 25,
    kostprijs: { min: 2, max: 4 },
    verzendkosten: VERZENDING_STANDAARD,
    retourRisico: 'laag',
    toelichting: 'Alleen als toevoeging aan een tas- of bundelorder; los niet rendabel.',
  },
  {
    id: 'belt-cap',
    naam: 'Running belt / cap (in een drop, pre-order)',
    rol: 'add-on',
    prijsInclBtw: 37,
    kostprijs: { min: 4, max: 8 },
    verzendkosten: VERZENDING_STANDAARD,
    retourRisico: 'laag',
    toelichting: 'One-size merkdrager. Meeproduceren in dezelfde run als de tas.',
  },
  {
    id: 'pod-tas',
    naam: 'Gymtas via print-on-demand (ter vergelijking)',
    rol: 'vergelijking',
    prijsInclBtw: 119,
    kostprijs: { min: 38, max: 44 },
    verzendkosten: 12,
    retourRisico: 'laag',
    toelichting: 'Afgewezen: dunne marge en een generieke blank met jouw logo erop.',
  },
]

function aannamesVoorWeergave(): Strategie['aannames'] {
  const a = MARGE_AANNAMES
  const pct = (n: number) => `${(n * 100).toLocaleString('nl-NL', { maximumFractionDigits: 1 })}%`
  return [
    { label: 'Btw', waarde: pct(a.btw) },
    { label: 'Betaalkosten', waarde: `${pct(a.betaalkosten)} van de orderwaarde` },
    { label: 'Verzending', waarde: `€${VERZENDING_STANDAARD} per order via EU-3PL (print-on-demand-tas €12)` },
    {
      label: 'Retourreserve',
      waarde: `laag ${pct(a.retourReserve.laag)} · middel ${pct(a.retourReserve.middel)} · hoog ${pct(a.retourReserve.hoog)}`,
    },
    { label: 'Acquisitie per klant', waarde: `€${a.cacPerKlant} (benchmark EU lifestyle ~€28, niet ons cijfer)` },
    { label: 'Kostprijs', waarde: 'Midden van de range; schatting tot er offertes of platformprijzen zijn' },
  ]
}

export function bouwStrategie(): Strategie {
  return {
    bijgewerkt: '2026-09-25',
    fase: 'Fase 0 — Fundament',
    richting: {
      naam: 'Richting A — Hybrid athlete',
      samenvatting:
        'Een productmerk voor wie tilt én loopt en naar een fitness race toewerkt. Zonder eigen voorraad en zonder jou in beeld: producten verschijnen in drops via pre-order, content komt van creators en productbeeld. Volledig los van je werk.',
      genomenOp: '2026-09-25',
    },
    waarom: [
      {
        tekst: 'Hyrox in de Benelux groeide van 2.100 deelnemers (2021) naar ~50.000 per seizoen (2024/25).',
        bron: { label: 'Hyrox Benelux', url: 'https://hyroxbenelux.com/growth-of-the-hyrox-community/' },
      },
      {
        tekst: 'Gen Z kiest 2× zo vaak kracht als hoofdsport; hybride routines (tillen + lopen) groeien; runclubs 3,5×.',
        bron: {
          label: 'Strava Year in Sport 2025',
          url: 'https://press.strava.com/articles/strava-releases-12th-annual-year-in-sport-trend-report-2025',
        },
      },
      {
        tekst: 'Europa: 75,5 mln fitnessleden in 2025, maar maar 9,3% penetratie tegen 24,9% in de VS.',
        bron: {
          label: 'EuropeActive/Deloitte',
          url: 'https://www.europeactive.eu/blog/press-corner-4/strong-growth-in-members-and-revenues-for-european-health-fitness-market-in-2025-140',
        },
      },
      {
        tekst: 'Het merk is de held, niet de oprichter: productbeeld, creators en klanten maken de content. Jij blijft onzichtbaar.',
        bron: null,
      },
      {
        tekst: 'Pre-order in drops: klanten financieren elke productierun, dus geen eigen voorraad. Drops passen bij het raceseizoen.',
        bron: null,
      },
      {
        tekst: 'Hoofdproduct zonder maten, licht en zonder elektronica: weinig retouren, simpele logistiek.',
        bron: null,
      },
    ],
    doelgroep: [
      '25–40 jaar, man én vrouw als primaire doelgroep vanaf dag één (fitness racing is gemengd).',
      'Gym-gebaseerd, doelgericht: een race of event op de kalender.',
      'Traint in groepen (runclub, box, gym), deelt progressie op social.',
    ],
    aannames: aannamesVoorWeergave(),
    producten: PRODUCTEN.map((p) => ({ ...p, marge: berekenMarge(p) })),
    geschrapt: [
      { titel: 'Losse lifting-accessoires als merk', tekst: 'Verzadigd en per order onder de acquisitiegrens.' },
      {
        titel: 'Kleding',
        tekst: 'Online 30–46% retouren in Europa. Pas als merch zodra het merk staat.',
      },
      { titel: 'Supplementen', tekst: 'EFSA/NVWA-regels, houdbaarheid; niet te dropshippen. Fase 5+.' },
      { titel: 'Recovery-elektronica en home gym', tekst: 'Defecten, CE, garantie, zware verzending.' },
      {
        titel: 'Eigen voorraad en print-on-demand',
        tekst: 'Voorraad: besloten op 25 september 2026, geen optie. Print-on-demand: te dunne marge en een generieke uitstraling.',
      },
      {
        titel: 'Coaching, programma\u2019s en gym-partners',
        tekst: 'Bewust niet: je wilt een productmerk, geen tweede coachingbedrijf, en niets dat raakt aan je werk of andere gyms.',
      },
    ],
    risicos: [
      {
        titel: 'Zonder gezicht betaal je voor bereik',
        tekst: 'Geen eigen content betekent leunen op ads en creators. Boven ~€60 acquisitie per tasklant (~€75 per bundel) wordt een order verlieslatend.',
      },
      {
        titel: 'Pre-order vraagt vertrouwen',
        tekst: 'Een onbekend merk plus 8–12 weken wachten converteert slechter dan op voorraad. Eerlijke levertermijn, echte samplebeelden, volledige terugbetaling als het minimum niet gehaald wordt.',
      },
      {
        titel: 'Eigen geld vóór de eerste omzet',
        tekst: 'Geen voorraad, wel samples, beeld en een advertentietest: ~€1–2,5k (aanname, te bevestigen met offertes).',
      },
      {
        titel: 'Anoniem blijven heeft grenzen',
        tekst: 'Een webshop moet bedrijfsnaam, KvK-nummer en adres tonen en het KvK-register is openbaar. Je naam hoeft niet in de merkcommunicatie. Gebruik niets van je werk: geen tijd, leden of materialen. Laat de bedrijfsvorm door je boekhouder toetsen.',
      },
      {
        titel: '\u201CHyrox\u201D is een merknaam',
        tekst: 'Niet gebruiken in merk- of productnamen zonder licentie; spreek van \u201Cfitness racing\u201D en \u201Chybrid\u201D. Laat dit merkrechtelijk toetsen.',
      },
      {
        titel: 'Productveiligheid (GPSR) en btw',
        tekst: 'Producten van buiten de EU vragen een verantwoordelijke marktdeelnemer in de EU; bij verkoop in meerdere EU-landen speelt OSS-btw. Juridisch en fiscaal laten toetsen.',
      },
    ],
    openBeslissingen: [
      'Budget vóór de eerste omzet: ~€1–2,5k voor samples, beeld en een advertentietest (aanname).',
      'Merknaam en positionering (volgende stap; vóór domein, handles en merkdepot).',
      'Bedrijfsvorm (eenmanszaak met handelsnaam of BV), mede vanwege zichtbaarheid in het KvK-register.',
    ],
    volgendeStappen: [
      'Merkpositionering: 5–10 naamrichtingen, belofte, tone of voice, visuele richting.',
      'Tas-onderzoek via het merk, niet via jou: korte enquête en 15–20 gesprekken in online communities (Reddit, Discord, Strava-clubs).',
      'Leverancierslijst opstellen: 3–5 tassenmakers benaderen voor samples, kostprijs en MOQ.',
    ],
    fasen: FASEN,
  }
}
