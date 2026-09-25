// ─── LifeOS — Sportmerk: de gekozen richting ────────────────────────────────
// Kane's nieuwe D2C-sportmerk, los van MentaForce zelf. Dit bestand is de ene
// bron van waarheid voor de strategie zoals die nu staat; alleen de founder-
// gated route `/api/lifeos/sportmerk` leest het, zodat het plan nooit in een
// publieke bundle of HTML-payload belandt.
//
// EERLIJK: marktclaims hebben een bron; prijzen en kostprijzen zijn schattingen
// tot er leveranciersoffertes zijn (zie `openBeslissingen`). Marges worden hier
// niet getypt maar uitgerekend (`berekenMarge`), zodat ze nooit uit de pas lopen
// met de aannames die de pagina ernaast toont.

import { berekenMarge, MARGE_AANNAMES, VERZENDING_STANDAARD } from './marge'
import type { ProductAanname, Strategie } from './types'

const PRODUCTEN: ProductAanname[] = [
  {
    id: 'tas',
    naam: 'Modulaire gym-/racetas',
    rol: 'hoofdproduct',
    prijsInclBtw: 119,
    kostprijs: { min: 20, max: 28 },
    verzendkosten: VERZENDING_STANDAARD,
    retourRisico: 'laag',
    toelichting: 'Schoen- en natvak, geen maten, licht. Draagt het merk.',
  },
  {
    id: 'race-kit',
    naam: 'Race-kit-bundel (tas + handschoenen + straps + belt)',
    rol: 'hoofdaanbod',
    prijsInclBtw: 149,
    kostprijs: { min: 30, max: 38 },
    verzendkosten: VERZENDING_STANDAARD,
    retourRisico: 'laag',
    toelichting: 'Tilt de orderwaarde ruim boven de acquisitiekosten.',
  },
  {
    id: 'programma',
    naam: 'Trainingsprogramma (12 weken naar een fitness race)',
    rol: 'margemotor',
    prijsInclBtw: 49,
    kostprijs: { min: 1, max: 3 },
    verzendkosten: 0,
    retourRisico: 'laag',
    toelichting: 'Jouw PT-expertise als product. Als upsell zonder eigen acquisitiekosten.',
  },
  {
    id: 'vest',
    naam: 'Weighted vest 6–10 kg',
    rol: 'later',
    prijsInclBtw: 129,
    kostprijs: { min: 32, max: 40 },
    verzendkosten: 13,
    retourRisico: 'middel',
    toelichting: 'Zwaar: dure vracht en verzending, en een retour kost veel.',
  },
  {
    id: 'sleeves',
    naam: 'Knee sleeves 7 mm',
    rol: 'add-on',
    prijsInclBtw: 55,
    kostprijs: { min: 8, max: 12 },
    verzendkosten: VERZENDING_STANDAARD,
    retourRisico: 'middel',
    toelichting: 'Maatgevoelig. Alleen als toevoeging aan een order.',
  },
  {
    id: 'handschoenen',
    naam: 'Race-/griphandschoenen',
    rol: 'add-on',
    prijsInclBtw: 35,
    kostprijs: { min: 4, max: 6 },
    verzendkosten: VERZENDING_STANDAARD,
    retourRisico: 'middel',
    toelichting: 'Maatgevoelig. Onderdeel van de race-kit.',
  },
  {
    id: 'belt-cap',
    naam: 'Running belt / cap',
    rol: 'add-on',
    prijsInclBtw: 37,
    kostprijs: { min: 4, max: 8 },
    verzendkosten: VERZENDING_STANDAARD,
    retourRisico: 'laag',
    toelichting: 'One-size, goed zichtbaar merkdrager. Los niet rendabel via ads.',
  },
  {
    id: 'straps',
    naam: 'Lifting straps',
    rol: 'add-on',
    prijsInclBtw: 25,
    kostprijs: { min: 2, max: 4 },
    verzendkosten: VERZENDING_STANDAARD,
    retourRisico: 'laag',
    toelichting: 'Hoog margepercentage, maar te weinig euro per order.',
  },
  {
    id: 'padeltas',
    naam: 'Padeltas (reserverichting)',
    rol: 'reserve',
    prijsInclBtw: 129,
    kostprijs: { min: 22, max: 30 },
    verzendkosten: VERZENDING_STANDAARD,
    retourRisico: 'laag',
    toelichting: 'Ter vergelijking: sterke marge, maar je voorsprong werkt daar niet.',
  },
]

function aannamesVoorWeergave(): Strategie['aannames'] {
  const a = MARGE_AANNAMES
  const pct = (n: number) => `${(n * 100).toLocaleString('nl-NL', { maximumFractionDigits: 1 })}%`
  return [
    { label: 'Btw', waarde: pct(a.btw) },
    { label: 'Betaalkosten', waarde: `${pct(a.betaalkosten)} van de orderwaarde` },
    { label: 'Verzending', waarde: `€${VERZENDING_STANDAARD} per order (vest €13, digitaal €0)` },
    {
      label: 'Retourreserve',
      waarde: `laag ${pct(a.retourReserve.laag)} · middel ${pct(a.retourReserve.middel)} · hoog ${pct(a.retourReserve.hoog)}`,
    },
    { label: 'Acquisitie per klant', waarde: `€${a.cacPerKlant} (benchmark EU lifestyle ~€28, niet ons cijfer)` },
    { label: 'Kostprijs', waarde: 'Midden van de range; schatting tot er offertes zijn' },
  ]
}

export function bouwStrategie(): Strategie {
  return {
    bijgewerkt: '2026-09-25',
    fase: 'Fase 1 — Strategie (nog niet bouwen)',
    richting: {
      naam: 'Richting A — Hybrid athlete',
      samenvatting:
        'Een merk voor wie tilt én loopt en naar een fitness race toewerkt. Een premium tas en race-kit als hoofdaanbod, jouw trainingsprogramma’s als margemotor.',
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
    ],
    risicos: [
      {
        titel: 'Geen eigen voorraad',
        tekst: 'Besloten op 25 september 2026. Een tas met eigen ontwerp is dan alleen haalbaar via pre-order (klanten financieren de productierun). Print-on-demand-tassen laten na ads ~€5 per order over en zijn generieke blanks: dat botst met de merkambitie.',
      },
      {
        titel: '“Hyrox” is een merknaam',
        tekst: 'Niet gebruiken in merk- of productnamen zonder licentie; spreek van “fitness racing” en “hybrid”. Laat dit merkrechtelijk toetsen.',
      },
      {
        titel: 'Afhankelijk van één trend',
        tekst: 'Fitness racing groeit hard, maar hangt aan één organisator. Het merk moet over de hybrid athlete gaan, niet over één event.',
      },
      {
        titel: 'Productveiligheid (GPSR)',
        tekst: 'Producten van buiten de EU vragen een verantwoordelijke marktdeelnemer in de EU. Juridisch laten toetsen.',
      },
    ],
    openBeslissingen: [
      'Model zonder voorraad: digital-first (programma\u2019s + print-on-demand-merch), pre-order van de tas, of een combinatie.',
      'Startbudget en startmarkt: aangenomen €5–15k en Nederland/Benelux.',
    ],
    volgendeStappen: [
      'Merkpositionering: namen, belofte, tone of voice, visuele richting.',
      '5–8 leveranciers benaderen voor offertes en samples (tas eerst).',
      'Validatieplan met vooraf vastgelegde stop-, herhaal- en opschaalcriteria.',
    ],
  }
}
