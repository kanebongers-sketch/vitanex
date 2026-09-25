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
    id: 'programma',
    naam: 'Trainingsprogramma (12 weken naar een fitness race)',
    rol: 'hoofdproduct',
    prijsInclBtw: 49,
    kostprijs: { min: 1, max: 3 },
    verzendkosten: 0,
    retourRisico: 'laag',
    toelichting: 'Nul voorraad. Via de wachtlijst en gyms/PT\u2019s zonder advertentiekosten; met ads net break-even.',
  },
  {
    id: 'abonnement',
    naam: 'Doorlopend programma (abonnement, per maand)',
    rol: 'margemotor',
    prijsInclBtw: 14,
    kostprijs: { min: 0.5, max: 1.5 },
    verzendkosten: 0,
    retourRisico: 'laag',
    toelichting: 'Per maand gerekend: één betaalde klant verdient zich pas na ~4 maanden terug. Retentie beslist.',
  },
  {
    id: 'cap',
    naam: 'Geborduurde cap (print-on-demand)',
    rol: 'add-on',
    prijsInclBtw: 35,
    kostprijs: { min: 15, max: 19 },
    verzendkosten: 5,
    retourRisico: 'laag',
    toelichting: 'Merkdrager, geen winstbron. Alleen naast een programma of als community-merch.',
  },
  {
    id: 'tas',
    naam: 'Modulaire gym-/racetas (pre-order)',
    rol: 'later',
    prijsInclBtw: 119,
    kostprijs: { min: 20, max: 28 },
    verzendkosten: VERZENDING_STANDAARD,
    retourRisico: 'laag',
    toelichting: 'Pas in fase 4: klanten betalen vooraf de productierun. Geen minimum gehaald = iedereen terugbetaald.',
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
    { label: 'Verzending', waarde: `€${VERZENDING_STANDAARD} per order (cap €5, print-on-demand-tas €12, digitaal €0)` },
    {
      label: 'Retourreserve',
      waarde: `laag ${pct(a.retourReserve.laag)} · middel ${pct(a.retourReserve.middel)} · hoog ${pct(a.retourReserve.hoog)}`,
    },
    { label: 'Acquisitie per klant', waarde: `€${a.cacPerKlant} (benchmark EU lifestyle ~€28, niet ons cijfer)` },
    { label: 'Kostprijs', waarde: 'Midden van de range; schatting tot er offertes of platformprijzen zijn' },
    { label: 'Abonnement', waarde: 'Marge per maand, niet per klant' },
  ]
}

export function bouwStrategie(): Strategie {
  return {
    bijgewerkt: '2026-09-25',
    fase: 'Fase 0 — Fundament',
    richting: {
      naam: 'Richting A — Hybrid athlete',
      samenvatting:
        'Een trainingsmerk voor wie tilt én loopt en naar een fitness race toewerkt. Digital-first en zonder eigen voorraad: jouw programma’s zijn het product, fysieke producten volgen via pre-order zodra het publiek er is.',
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
        tekst: 'Jouw voorsprong: geloofwaardige coaching-content en gyms/PT’s als kanaal. Dat drukt de acquisitiekosten.',
        bron: null,
      },
      {
        tekst: 'Digitaal hoofdproduct: geen voorraad, geen verzending, geen maten en ~95% brutomarge.',
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
        titel: 'Eigen voorraad en print-on-demand als hoofdmodel',
        tekst: 'Voorraad: besloten op 25 september 2026, geen optie. Print-on-demand: te dunne marge en een generieke uitstraling.',
      },
    ],
    risicos: [
      {
        titel: 'Het staat of valt met jouw content',
        tekst: 'Zonder voorraad en met krappe ads-marges is organisch bereik de motor. Zonder vaste contentritme werkt dit model niet.',
      },
      {
        titel: 'Eerste maanden weinig omzet',
        tekst: 'Een lijst van 500 met 4% conversie is ~20 verkopen, ~€1.000. Dit is een publiek opbouwen, geen snelle omzet.',
      },
      {
        titel: '\u201CHyrox\u201D is een merknaam',
        tekst: 'Niet gebruiken in merk- of productnamen zonder licentie; spreek van \u201Cfitness racing\u201D en \u201Chybrid\u201D. Laat dit merkrechtelijk toetsen.',
      },
      {
        titel: 'Btw op digitale producten in de EU',
        tekst: 'Boven de EU-drempel geldt het btw-tarief van het land van de klant (OSS). Een merchant-of-record-platform kan dit overnemen. Laat dit door je boekhouder bevestigen.',
      },
      {
        titel: 'Herroepingsrecht en gezondheidsclaims',
        tekst: 'Bij digitale content vervalt het herroepingsrecht alleen met expliciete toestemming vóór levering. Geen medische claims; wel een disclaimer. Juridisch laten toetsen.',
      },
      {
        titel: 'Afhankelijk van één trend',
        tekst: 'Fitness racing hangt aan één organisator. Het merk moet over de hybrid athlete gaan, niet over één event.',
      },
    ],
    openBeslissingen: [
      'Merknaam en positionering (volgende stap; vóór domein, handles en merkdepot).',
      'Hoeveel uur per week je structureel aan content kunt besteden.',
      'Waar het programma leeft: pdf + video, een bestaand coaching-platform, of later een eigen app.',
    ],
    volgendeStappen: [
      'Merkpositionering: 5–10 naamrichtingen, belofte, tone of voice, visuele richting.',
      'Naam checken: domein, social handles, BOIP/EUIPO-merkenregister.',
      'Gratis instapmiddel ontwerpen (bijv. 4-weken intro of race-ready test) + wachtlijstpagina.',
    ],
    fasen: FASEN,
  }
}
