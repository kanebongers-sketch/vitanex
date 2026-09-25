// ─── LifeOS — Sportmerk: de gekozen richting ────────────────────────────────
// Kane's nieuwe D2C-sportmerk, los van MentaForce zelf. Dit bestand is de ene
// bron van waarheid voor de strategie zoals die nu staat; alleen de founder-
// gated route `/api/lifeos/sportmerk` leest het, zodat het plan nooit in een
// publieke bundle of HTML-payload belandt.
//
// Model (25 sep 2026): het ZONE2-model, maar voor de hybrid athlete. Merk als
// held, breed accessoire-assortiment, snelle levering via leveranciers met een
// EU-magazijn, groei via ads en creators. Geen eigen voorraad, oprichter uit
// beeld, niets dat raakt aan zijn werk.
//
// EERLIJK: marktclaims hebben een bron; prijzen en kostprijzen zijn schattingen
// tot er leveranciersprijzen zijn. Marges worden hier niet getypt maar
// uitgerekend (`berekenMarge`), zodat ze nooit uit de pas lopen met de
// aannames die de pagina ernaast toont.

import { FASEN } from './fasen'
import { berekenMarge, MARGE_AANNAMES, VERZENDING_STANDAARD } from './marge'
import type { ProductAanname, Strategie } from './types'

const PRODUCTEN: ProductAanname[] = [
  {
    id: 'race-dag-bundel',
    naam: 'Race-dag-bundel: tas + straps + handschoenen + belt',
    rol: 'hoofdaanbod',
    levering: 'eu-leverancier',
    prijsInclBtw: 109,
    kostprijs: { min: 32, max: 40 },
    verzendkosten: VERZENDING_STANDAARD,
    retourRisico: 'laag',
    toelichting: 'De order die de ads moet dragen. Break-even bij ~€43 acquisitie per klant.',
  },
  {
    id: 'gymtas',
    naam: 'Hybrid gymtas (standaardmodel met logo)',
    rol: 'hoofdproduct',
    levering: 'eu-leverancier',
    prijsInclBtw: 89,
    kostprijs: { min: 22, max: 30 },
    verzendkosten: VERZENDING_STANDAARD,
    retourRisico: 'laag',
    toelichting: 'Instapproduct en merkdrager. Los net break-even met ads; de bundel is het doel.',
  },
  {
    id: 'grip-set',
    naam: 'Grip-set: straps + handschoenen + chalk',
    rol: 'add-on',
    levering: 'eu-leverancier',
    prijsInclBtw: 49,
    kostprijs: { min: 8, max: 12 },
    verzendkosten: VERZENDING_STANDAARD,
    retourRisico: 'middel',
    toelichting: 'Chalk en grips slijten: een reden om terug te komen.',
  },
  {
    id: 'sleeves',
    naam: 'Knee sleeves 7 mm',
    rol: 'add-on',
    levering: 'eu-leverancier',
    prijsInclBtw: 49,
    kostprijs: { min: 12, max: 16 },
    verzendkosten: VERZENDING_STANDAARD,
    retourRisico: 'middel',
    toelichting: 'Maatgevoelig. Alleen als toevoeging aan een order.',
  },
  {
    id: 'sokken',
    naam: 'Trainingssokken 3-pack',
    rol: 'add-on',
    levering: 'eu-leverancier',
    prijsInclBtw: 19,
    kostprijs: { min: 3, max: 5 },
    verzendkosten: VERZENDING_STANDAARD,
    retourRisico: 'laag',
    toelichting: 'Herhaalaankoop. Los verlieslatend; als toevoeging deelt hij de verzending.',
  },
  {
    id: 'eigen-tas',
    naam: 'Eigen ontworpen racetas',
    rol: 'later',
    levering: 'pre-order',
    prijsInclBtw: 119,
    kostprijs: { min: 20, max: 28 },
    verzendkosten: VERZENDING_STANDAARD,
    retourRisico: 'laag',
    toelichting: 'Vanaf maand 6 als drop, zodra er klanten zijn die erop wachten.',
  },
]

function aannamesVoorWeergave(): Strategie['aannames'] {
  const a = MARGE_AANNAMES
  const pct = (n: number) => `${(n * 100).toLocaleString('nl-NL', { maximumFractionDigits: 1 })}%`
  return [
    { label: 'Btw', waarde: pct(a.btw) },
    { label: 'Betaalkosten', waarde: `${pct(a.betaalkosten)} van de orderwaarde` },
    { label: 'Verzending', waarde: `€${VERZENDING_STANDAARD} per order naar de klant` },
    {
      label: 'Retourreserve',
      waarde: `laag ${pct(a.retourReserve.laag)} · middel ${pct(a.retourReserve.middel)} · hoog ${pct(a.retourReserve.hoog)}`,
    },
    { label: 'Acquisitie per klant', waarde: `€${a.cacPerKlant} (benchmark EU lifestyle ~€28, niet ons cijfer)` },
    { label: 'Kostprijs', waarde: 'Midden van de range, incl. logo; schatting tot er leveranciersprijzen zijn' },
  ]
}

export function bouwStrategie(): Strategie {
  return {
    bijgewerkt: '2026-09-25',
    fase: 'Fase 0 — Fundament',
    richting: {
      naam: 'Het ZONE2-model, voor de hybrid athlete',
      samenvatting:
        'Een merk voor wie tilt én loopt en naar een fitness race toewerkt. Het merk is de held: een naam met betekenis, sterk beeld, bundels en goede service. Snelle levering via leveranciers met een EU-magazijn, groei via ads en creators. Geen eigen voorraad, jij uit beeld, los van je werk.',
      genomenOp: '2026-09-25',
    },
    waarom: [
      {
        tekst: 'Bewijs dat het model in NL werkt: ZONE2 verkoopt hardloopaccessoires zonder oprichter in beeld, met ~181 actieve Meta-ads en 4,8 op Trustpilot. Omzetschatting (extern, onzeker): $66–97k per maand.',
        bron: { label: 'Brandsearch', url: 'https://brandsearch.co/brands/zone2sportswear.com' },
      },
      {
        tekst: 'ZONE2 bedient lopers, niet de hybrid athlete. Die groep groeit hard: Hyrox Benelux ging van 2.100 (2021) naar ~50.000 deelnemers per seizoen.',
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
        tekst: 'ZONE2-reviews prijzen vooral de klantenservice. Service en eerlijke levertijden zijn een onderscheid dat geen leverancier voor je regelt.',
        bron: { label: 'Trustpilot', url: 'https://nl.trustpilot.com/review/zone2sportswear.com?page=2' },
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
      { titel: 'Een tweede hardloopmerk', tekst: 'Die plek heeft ZONE2 al. Kopiëren is geen merk.' },
      {
        titel: 'Eigen voorraad',
        tekst: 'Besloten op 25 september 2026. Leveranciers met een EU-magazijn houden de voorraad; de eigen tas komt later via pre-order.',
      },
      {
        titel: 'Coaching, programma’s en gym-partners',
        tekst: 'Bewust niet: je wilt een productmerk, geen tweede coachingbedrijf, en niets dat raakt aan je werk of andere gyms.',
      },
      {
        titel: 'Kleding, supplementen, elektronica',
        tekst: 'Retouren (30–46% bij kleding), regelgeving en defecten. Niet in de start.',
      },
    ],
    risicos: [
      {
        titel: 'Krappe marge met betaalde ads',
        tekst: 'Losse producten van €19–49 verliezen geld na één betaalde klant. Stuur op bundels en een gemiddelde orderwaarde ≥ €75; de bundel is break-even bij ~€43 acquisitie.',
      },
      {
        titel: 'Standaardproducten zijn vergelijkbaar',
        tekst: 'Wat jij verkoopt kan een ander ook inkopen. Onderscheid komt alleen van naam, eigen beeld, bundels en service. Nooit leveranciersfoto’s gebruiken.',
      },
      {
        titel: 'Voorraad en levertijd niet in eigen hand',
        tekst: 'De leverancier houdt de voorraad. Twee leveranciers per kernproduct, voorraadkoppeling met de shop, en nooit “op voorraad” tonen wat het niet is.',
      },
      {
        titel: 'Anoniem blijven heeft grenzen',
        tekst: 'Een webshop moet bedrijfsnaam, KvK-nummer en adres tonen en het KvK-register is openbaar. Je naam hoeft niet in de merkcommunicatie. Gebruik niets van je werk. Laat de bedrijfsvorm door je boekhouder toetsen.',
      },
      {
        titel: '“Hyrox” en “Roxzone” zijn merknamen',
        tekst: 'Niet gebruiken in merk- of productnamen zonder licentie; spreek van “fitness racing” en “hybrid”. Laat de gekozen naam merkrechtelijk toetsen.',
      },
      {
        titel: 'Consumentenrecht en productveiligheid',
        tekst: '14 dagen herroepingsrecht met een retouradres in de EU; productveiligheid (GPSR) en OSS-btw bij verkoop in meerdere EU-landen. Juridisch en fiscaal laten toetsen.',
      },
    ],
    openBeslissingen: [
      'Merknaam: een naam met eigen betekenis voor de doelgroep, zoals “zone 2” dat voor lopers heeft.',
      'Budget vóór de eerste omzet: ~€1–2k voor testbestellingen, eigen beeld en een advertentietest (aanname).',
      'Bedrijfsvorm (eenmanszaak met handelsnaam of BV), mede vanwege zichtbaarheid in het KvK-register.',
    ],
    volgendeStappen: [
      'Naamrichtingen met betekenis, daarna domein, handles en merkenregister checken.',
      'Leverancierslijst: 3–5 leveranciers of fulfilmentpartners met voorraad in de EU en logo-opties.',
      'Assortiment en bundels vastleggen: 5–8 producten, 2–3 bundels.',
    ],
    fasen: FASEN,
  }
}
