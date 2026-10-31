// ─── Club, AVG: inzage in alles wat Club over een lid bewaart (PUUR) ────────
// Het recht op inzage (art. 15 AVG): de sportschool geeft het lid een bestand
// met alle gegevens. Hier wordt de ruwe databasedata een leesbaar JSON-bestand
// met Nederlandse sleutels, plus een korte samenvatting in gewone tekst.
//
// Bewust een vaste lijst velden per tabel (geen "alles"): zo komen geheimen
// zoals de pincode-hash, inlogcodes, sessietokens, de QR-code en de afmeldlink
// nooit in het bestand. Gezondheidsgegevens (metingen, intake) gaan wel mee:
// het zijn de gegevens van het lid zelf.

export type Rij = Record<string, unknown>

/** De ruwe rijen per tabel, zoals export-opslag.ts ze leest. */
export interface ExportRuw {
  lid: Rij
  bezoeken: Rij[]
  lesboekingen: Rij[]
  afspraken: Rij[]
  intakes: Rij[]
  metingen: Rij[]
  schemas: Rij[]
  trainingen: Rij[]
  sets: Rij[]
  voeding: Rij[]
  notities: Rij[]
  challenges: Rij[]
  opvolgtaken: Rij[]
  meldingen: Rij[]
  meldingVoorkeuren: Rij[]
  pushToestellen: Rij[]
  ledenapp: Rij[]
  sessies: Rij[]
  leads: Rij[]
  leadHistorie: Rij[]
  verwijderverzoek: Rij[]
  communityGroepen: Rij[]
  communityBerichten: Rij[]
  communityReacties: Rij[]
  communityMeldingen: Rij[]
  communityVoorkeur: Rij[]
  aankopen: Rij[]
  tegoeden: Rij[]
  tegoedMutaties: Rij[]
  // Lidgeld (migratie 460 en 461).
  betaalklant: Rij[]
  betaalmethoden: Rij[]
  contracten: Rij[]
  contractPauzes: Rij[]
  facturen: Rij[]
  betalingen: Rij[]
  terugbetalingen: Rij[]
  geschillen: Rij[]
  betaalherinneringen: Rij[]
  kasboek: Rij[]
  betaalopdrachten: Rij[]
  // Koppelingen met health-apps (migratie 463).
  healthToestemmingen: Rij[]
  healthKoppelingen: Rij[]
  healthMetingen: Rij[]
  // Voedingsdagboek (migratie 466).
  voedingKeuzes: Rij[]
  voedingDagboek: Rij[]
  voedingProducten: Rij[]
  voedingFavorieten: Rij[]
  // Profielfoto (migratie 473): wie hem zette en de toestemming; het beeld zelf staat in de ledenapp.
  profielfoto: Rij[]
  // Reden van opzeggen of stoppen (migratie 482).
  opzeggingen: Rij[]
}

export type SectieSleutel = Exclude<keyof ExportRuw, 'lid'>

interface Velden {
  /** Kolom (of pad door een ingesloten tabel, met punten) naar een Nederlandse sleutel. */
  velden: Record<string, string>
  /** Ingesloten lijsten, bv. de oefeningen van een schema. */
  lijsten?: Record<string, { titel: string; velden: Record<string, string> }>
}

interface Sectie extends Velden {
  sleutel: SectieSleutel
  titel: string
}

const LID_VELDEN: Record<string, string> = {
  voornaam: 'Voornaam',
  achternaam: 'Achternaam',
  email: 'E-mail',
  telefoon: 'Telefoon',
  geboortedatum: 'Geboortedatum',
  geslacht: 'Geslacht',
  vestiging: 'Vestiging',
  lidnummer: 'Lidnummer',
  sportivity_id: 'Klantnummer in de ledenadministratie',
  abonnement: 'Abonnement',
  status: 'Status',
  lid_sinds: 'Lid sinds',
  einddatum: 'Einddatum',
  tags: 'Labels',
  coach_id: 'Coach',
  aangemaakt_op: 'In Club gezet op',
  bijgewerkt_op: 'Laatst bijgewerkt op',
}

export const SECTIES: readonly Sectie[] = [
  { sleutel: 'bezoeken', titel: 'Bezoeken', velden: { op: 'Moment', vestiging: 'Vestiging', bron: 'Ingecheckt met' } },
  {
    sleutel: 'lesboekingen',
    titel: 'Lesboekingen',
    velden: {
      'club_lessen.club_lestypen.naam': 'Les',
      'club_lessen.start_op': 'Les begint',
      'club_lessen.vestiging': 'Vestiging',
      status: 'Status',
      wachtpositie: 'Plek op de wachtlijst',
      bron: 'Geboekt via',
      geboekt_op: 'Geboekt op',
      geannuleerd_op: 'Geannuleerd op',
      te_laat: 'Te laat afgemeld',
    },
  },
  {
    sleutel: 'afspraken',
    titel: 'Afspraken',
    velden: {
      'club_afspraak_typen.naam': 'Soort afspraak',
      start_op: 'Begint',
      eind_op: 'Eindigt',
      vestiging: 'Vestiging',
      medewerker_id: 'Met',
      status: 'Status',
      notitie: 'Notitie',
      geboekt_door: 'Geboekt via',
      geannuleerd_op: 'Geannuleerd op',
    },
  },
  {
    sleutel: 'intakes',
    titel: 'Intakes',
    velden: { datum: 'Datum', medewerker_id: 'Afgenomen door', antwoorden: 'Antwoorden', metingen: 'Metingen', toestemming_gezondheid: 'Toestemming voor gezondheidsgegevens', notitie: 'Notitie', aangemaakt_op: 'Vastgelegd op' },
  },
  {
    sleutel: 'metingen',
    titel: 'Metingen',
    velden: {
      datum: 'Datum',
      gewicht_kg: 'Gewicht (kg)',
      lengte_cm: 'Lengte (cm)',
      vetpercentage: 'Vetpercentage',
      buikomtrek_cm: 'Buikomtrek (cm)',
      heupomtrek_cm: 'Heupomtrek (cm)',
      spiermassa_kg: 'Spiermassa (kg)',
      rusthartslag: 'Rusthartslag',
      bloeddruk: 'Bloeddruk',
      notitie: 'Notitie',
      medewerker_id: 'Gemeten door',
      toestemming_gezondheid: 'Toestemming voor gezondheidsgegevens',
      toestemming_op: 'Toestemming gegeven op',
      toestemming_door: 'Toestemming vastgelegd door',
    },
  },
  {
    sleutel: 'schemas',
    titel: "Trainingsschema's",
    velden: { naam: 'Naam', doel: 'Doel', niveau: 'Niveau', weken: 'Aantal weken', status: 'Status', notitie: 'Notitie', dag_titels: 'Trainingsdagen', medewerker_id: 'Gemaakt door', aangemaakt_op: 'Gemaakt op', bijgewerkt_op: 'Laatst bijgewerkt op' },
    lijsten: {
      club_schema_oefeningen: {
        titel: 'Oefeningen',
        velden: {
          dag: 'Dag', volgorde: 'Volgorde', 'club_oefeningen.naam': 'Oefening', sets: 'Sets', herhalingen: 'Herhalingen', tijd_sec: 'Tijd per set (seconden)',
          gewicht_kg: 'Gewicht (kg)', rpe: 'RPE', rir: 'RIR', tempo: 'Tempo', groep: 'Superset of circuit', rust_sec: 'Rust (seconden)', notitie: 'Notitie',
        },
      },
    },
  },
  { sleutel: 'trainingen', titel: 'Gelogde trainingen', velden: { op: 'Moment', dag: 'Trainingsdag', duur_sec: 'Duur (seconden)', uitgevoerd: 'Uitgevoerd' } },
  {
    sleutel: 'sets',
    titel: 'Gelogde sets',
    velden: { op: 'Moment', 'club_oefeningen.naam': 'Oefening', set_nr: 'Set', herhalingen: 'Herhalingen', gewicht_kg: 'Gewicht (kg)', tijd_sec: 'Tijd (seconden)' },
  },
  {
    sleutel: 'voeding',
    titel: 'Voedingsplan',
    velden: { doel: 'Doel', kcal: 'Kilocalorieën per dag', eiwit_g: 'Eiwit (g)', koolhydraten_g: 'Koolhydraten (g)', vet_g: 'Vet (g)', adviezen: 'Adviezen', maaltijden: 'Maaltijden', notitie: 'Notitie', berekening: 'Berekening', bijgewerkt_door: 'Bijgewerkt door', bijgewerkt_op: 'Bijgewerkt op' },
  },
  { sleutel: 'notities', titel: 'Notities van de sportschool', velden: { tekst: 'Tekst', auteur: 'Geschreven door', vastgepind: 'Vastgepind', aangemaakt_op: 'Geschreven op' } },
  { sleutel: 'challenges', titel: 'Challenges', velden: { 'club_challenges.titel': 'Challenge', ingeschreven_op: 'Ingeschreven op' } },
  {
    sleutel: 'opvolgtaken',
    titel: 'Opvolging door de sportschool',
    velden: { regel: 'Aanleiding', reden: 'Reden', status: 'Status', medewerker_id: 'Opgepakt door', notitie: 'Notitie', uitkomst: 'Uitkomst', afgehandeld_door: 'Afgehandeld door', afgehandeld_op: 'Afgehandeld op', aangemaakt_op: 'Gemaakt op' },
  },
  {
    sleutel: 'meldingen',
    titel: 'Berichten en mails aan het lid',
    velden: { soort: 'Soort', kanaal: 'Kanaal', onderwerp: 'Onderwerp', inhoud: 'Inhoud', status: 'Status', gepland_op: 'Gepland op', verstuurd_op: 'Verstuurd op', gelezen_op: 'Gelezen op' },
  },
  { sleutel: 'meldingVoorkeuren', titel: 'Voorkeuren voor berichten', velden: { herinneringen_per_mail: 'Herinneringen per mail', mails: 'Mails', push: 'Meldingen op de telefoon', gewijzigd_op: 'Gewijzigd op' } },
  { sleutel: 'pushToestellen', titel: 'Toestellen met meldingen', velden: { user_agent: 'Toestel', aangemaakt_op: 'Aangezet op', laatst_gebruikt_op: 'Laatste melding op' } },
  { sleutel: 'ledenapp', titel: 'Ledenapp', velden: { actief: 'Account actief', email: 'Inlog e-mailadres', wachtwoord_gekozen_op: 'Wachtwoord gekozen op', pin_gekozen_op: 'Oude pincode gekozen op', laatst_ingelogd_op: 'Laatst ingelogd op', aangemaakt_op: 'Uitgenodigd op' } },
  { sleutel: 'sessies', titel: 'Ingelogde toestellen', velden: { aangemaakt_op: 'Ingelogd op', laatst_gebruikt_op: 'Laatst gebruikt op', verloopt_op: 'Verloopt op' } },
  {
    sleutel: 'leads',
    titel: 'Aanmelding als belangstellende',
    velden: { naam: 'Naam', email: 'E-mail', telefoon: 'Telefoon', vestiging: 'Vestiging', bron: 'Hoe binnengekomen', interesse: 'Interesse', status: 'Status', proefles_op: 'Proefles op', verloren_reden: 'Reden', toestemming_contact: 'Toestemming voor contact', aangemaakt_op: 'Aangemeld op' },
  },
  { sleutel: 'leadHistorie', titel: 'Contactmomenten als belangstellende', velden: { soort: 'Soort', tekst: 'Tekst', uitkomst: 'Uitkomst', auteur: 'Door', op: 'Moment' } },
  { sleutel: 'verwijderverzoek', titel: 'Verzoek tot verwijderen', velden: { aangevraagd_op: 'Aangevraagd op', definitief_op: 'Wordt definitief verwijderd op' } },
  // Community in de ledenapp (migratie 440).
  { sleutel: 'communityGroepen', titel: 'Community: groepen', velden: { 'club_community_groepen.naam': 'Groep', status: 'Status', toegevoegd_door: 'Toegevoegd door', aangemaakt_op: 'Sinds' } },
  { sleutel: 'communityBerichten', titel: 'Community: berichten', velden: { 'club_community_groepen.naam': 'Groep', tekst: 'Tekst', status: 'Status', aangemaakt_op: 'Geplaatst op' } },
  { sleutel: 'communityReacties', titel: 'Community: reacties', velden: { soort: 'Reactie', aangemaakt_op: 'Gegeven op' } },
  { sleutel: 'communityMeldingen', titel: 'Community: gemelde berichten', velden: { reden: 'Reden', toelichting: 'Toelichting', status: 'Status', aangemaakt_op: 'Gemeld op' } },
  { sleutel: 'communityVoorkeur', titel: 'Community: voorkeuren', velden: { op_ranglijst: 'Op ranglijsten', gewijzigd_op: 'Gewijzigd op' } },
  // Betalen in de ledenapp (migratie 439). Nooit de Stripe-kenmerken.
  {
    sleutel: 'aankopen',
    titel: 'Aankopen in de app',
    velden: { product_naam: 'Product', type: 'Soort', bedrag_cent: 'Bedrag (eurocent)', btw_procent: 'Btw (%)', status: 'Status', betaald_op: 'Betaald op', terugbetaald_cent: 'Terugbetaald (eurocent)', terugbetaald_op: 'Terugbetaald op', aangemaakt_op: 'Gestart op' },
  },
  { sleutel: 'tegoeden', titel: 'Tegoeden', velden: { product_naam: 'Product', soort: 'Soort', totaal: 'Totaal', saldo: 'Over', geldig_tot: 'Geldig tot', aangemaakt_op: 'Sinds' } },
  { sleutel: 'tegoedMutaties', titel: 'Gebruik van tegoeden', velden: { aantal: 'Aantal', reden: 'Reden', door: 'Door', op: 'Moment' } },
  // Lidgeld (migratie 460 en 461). Nooit Stripe-kenmerken, nooit een IBAN of kaartnummer.
  { sleutel: 'betaalklant', titel: 'Betaalgegevens: klant', velden: { aangemaakt_op: 'Klant sinds' } },
  {
    sleutel: 'betaalmethoden',
    titel: 'Betaalmethoden en machtigingen',
    velden: { type: 'Soort', laatste4: 'Laatste vier cijfers', status: 'Status', is_standaard: 'Standaard', bron: 'Afgesloten via', machtiging_kenmerk: 'Kenmerk van de machtiging', ondertekend_op: 'Machtiging gegeven op', laatste_incasso_op: 'Laatste incasso op', aangemaakt_op: 'Toegevoegd op' },
  },
  {
    sleutel: 'contracten',
    titel: 'Lidmaatschapscontracten',
    velden: {
      plan_naam: 'Abonnement', status: 'Status', interval_soort: 'Betaling per', bedrag_cent: 'Bedrag per termijn (eurocent)', btw_procent: 'Btw (%)',
      contract_maanden: 'Looptijd (maanden)', opzegtermijn_dagen: 'Opzegtermijn (dagen)', startdatum: 'Begindatum', einddatum: 'Einddatum', opgezegd_op: 'Opgezegd op',
      opzeg_einddatum: 'Eindigt na opzeggen op', voorwaarden_versie: 'Versie van de voorwaarden', akkoord_op: 'Akkoord gegeven op', notitie: 'Notitie', aangemaakt_op: 'Afgesloten op',
    },
  },
  { sleutel: 'contractPauzes', titel: 'Pauzes van het abonnement', velden: { van: 'Van', tot: 'Tot en met', status: 'Status', reden: 'Reden', verrekening_cent: 'Verrekend (eurocent)', aangemaakt_op: 'Aangevraagd op' } },
  {
    sleutel: 'facturen',
    titel: 'Facturen',
    velden: {
      nummer: 'Factuurnummer', soort: 'Soort', status: 'Status', uitgegeven_op: 'Factuurdatum', vervaldatum: 'Te betalen voor', periode_van: 'Periode van', periode_tot: 'Periode tot',
      subtotaal_excl_cent: 'Bedrag excl. btw (eurocent)', btw_cent: 'Btw (eurocent)', totaal_cent: 'Totaal (eurocent)', betaald_cent: 'Betaald (eurocent)', betaald_op: 'Betaald op',
      klant_naam: 'Naam op de factuur', klant_adres: 'Adres op de factuur', klant_email: 'E-mail',
    },
    lijsten: {
      club_betalen_factuurregels: {
        titel: 'Regels',
        velden: { volgorde: 'Volgorde', omschrijving: 'Omschrijving', aantal: 'Aantal', bedrag_excl_cent: 'Excl. btw (eurocent)', btw_procent: 'Btw (%)', btw_cent: 'Btw (eurocent)', bedrag_incl_cent: 'Incl. btw (eurocent)' },
      },
    },
  },
  { sleutel: 'betalingen', titel: 'Betalingen en incasso', velden: { soort: 'Soort', poging: 'Poging', bedrag_cent: 'Bedrag (eurocent)', status: 'Status', fout_categorie: 'Reden van mislukken', aangeboden_op: 'Aangeboden op', verwerkt_op: 'Verwerkt op', mislukt_op: 'Mislukt op', gestorneerd_op: 'Teruggeboekt op', aangemaakt_op: 'Gestart op' } },
  { sleutel: 'terugbetalingen', titel: 'Terugbetalingen', velden: { bedrag_cent: 'Bedrag (eurocent)', status: 'Status', reden_code: 'Reden', toelichting: 'Toelichting', aangemaakt_op: 'Aangevraagd op', verwerkt_op: 'Verwerkt op' } },
  { sleutel: 'geschillen', titel: 'Betwiste betalingen', velden: { bedrag_cent: 'Bedrag (eurocent)', status: 'Status', reden_code: 'Reden', toelichting: 'Toelichting', aangemaakt_op: 'Gemeld op', gesloten_op: 'Afgesloten op' } },
  { sleutel: 'betaalherinneringen', titel: 'Betalingsherinneringen', velden: { stap: 'Stap', kanaal: 'Kanaal', status: 'Status', gepland_op: 'Gepland op', verstuurd_op: 'Verstuurd op' } },
  { sleutel: 'kasboek', titel: 'Boekingen in het kasboek', velden: { soort: 'Soort', bedrag_cent: 'Bedrag (eurocent)', boekdatum: 'Boekdatum', aangemaakt_op: 'Vastgelegd op' } },
  { sleutel: 'betaalopdrachten', titel: 'Opdrachten aan de betaalprovider', velden: { soort: 'Soort', status: 'Status', aangemaakt_op: 'Gemaakt op', klaar_op: 'Klaar op' } },
  // Koppelingen met health-apps (migratie 463). Nooit de tokens.
  {
    sleutel: 'healthToestemmingen',
    titel: 'Toestemming voor gegevens uit apps',
    velden: { delen: 'Mag ophalen en bewaren', trainer_zien: 'Trainers mogen zien', trainer_bronnen: 'Trainers mogen ook zien van', tekst_versie: 'Versie van de uitleg', gegeven_op: 'Gekozen op', ingetrokken_op: 'Ingetrokken op' },
  },
  { sleutel: 'healthKoppelingen', titel: 'Gekoppelde apps en apparaten', velden: { bron: 'App of apparaat', status: 'Status', laatste_sync_op: 'Laatst bijgewerkt op', aangemaakt_op: 'Gekoppeld op' } },
  { sleutel: 'healthMetingen', titel: 'Metingen uit apps', velden: { gemeten_op: 'Moment', soort: 'Soort', waarde: 'Waarde', training: 'Training', bron: 'Uit' } },
  // Voedingsdagboek in de ledenapp (migratie 466).
  {
    sleutel: 'voedingKeuzes',
    titel: 'Keuzes voor het voedingsdagboek',
    velden: { gestart_op: 'Gestart op', tekst_versie: 'Versie van de uitleg', trainer_zien: 'Trainers mogen meekijken', trainer_zien_op: 'Delen gewijzigd op', kcal: 'Eigen dagdoel (kcal)', eiwit_g: 'Eigen doel eiwit (g)', koolhydraten_g: 'Eigen doel koolhydraten (g)', vet_g: 'Eigen doel vet (g)' },
  },
  {
    sleutel: 'voedingDagboek',
    titel: 'Voedingsdagboek',
    velden: { datum: 'Dag', maaltijd: 'Maaltijd', naam: 'Wat', merk: 'Merk', gram: 'Gram', maat: 'Huishoudmaat', aantal: 'Aantal', kcal: 'Kilocalorieën', eiwit_g: 'Eiwit (g)', koolhydraten_g: 'Koolhydraten (g)', vet_g: 'Vet (g)', vezels_g: 'Vezels (g)', bron: 'Ingevoerd via', aangemaakt_op: 'Gelogd op' },
  },
  {
    sleutel: 'voedingProducten',
    titel: 'Eigen producten',
    velden: { naam: 'Naam', merk: 'Merk', barcode: 'Barcode', kcal_100g: 'Kcal per 100 g', eiwit_100g: 'Eiwit per 100 g', koolhydraten_100g: 'Koolhydraten per 100 g', vet_100g: 'Vet per 100 g', vezels_100g: 'Vezels per 100 g', portie_gram: 'Portie (g)', aangemaakt_op: 'Gemaakt op' },
  },
  { sleutel: 'voedingFavorieten', titel: 'Favoriete producten', velden: { naam: 'Naam', merk: 'Merk', portie_gram: 'Portie (g)', aangemaakt_op: 'Bewaard op' } },
  // Profielfoto (migratie 473). Het beeld zelf ziet en bewaart het lid in de ledenapp (Profiel).
  {
    sleutel: 'profielfoto',
    titel: 'Profielfoto',
    velden: { bron: 'Gezet door', toegevoegd_door: 'Toegevoegd door (medewerker)', toestemming_op: 'Toestemming gegeven op', toestemming_tekst_versie: 'Versie van de toestemmingstekst', aangemaakt_op: 'Gezet op' },
  },
  // Reden van opzeggen of stoppen (migratie 482).
  {
    sleutel: 'opzeggingen',
    titel: 'Reden van opzeggen of stoppen',
    velden: { actie: 'Actie', reden: 'Reden', toelichting: 'Toelichting', einddatum: 'Einddatum', vastgelegd_door: 'Vastgelegd door', aangemaakt_op: 'Vastgelegd op' },
  },
]

/** Kolommen met een medewerker-id: in het bestand de naam, nooit het id. */
const MEDEWERKER_KOLOMMEN: ReadonlySet<string> = new Set(['medewerker_id', 'coach_id'])

/** Een waarde via een pad met punten; ingesloten tabellen kunnen een lijst van een zijn. */
export function waardeOpPad(rij: Rij, pad: string): unknown {
  let huidig: unknown = rij
  for (const deel of pad.split('.')) {
    if (Array.isArray(huidig)) huidig = huidig[0]
    if (typeof huidig !== 'object' || huidig === null) return null
    huidig = (huidig as Rij)[deel]
  }
  return huidig === undefined ? null : huidig
}

function vertaal(rij: Rij, velden: Record<string, string>, medewerkers: ReadonlyMap<string, string>): Rij {
  const uit: Rij = {}
  for (const [pad, label] of Object.entries(velden)) {
    const waarde = waardeOpPad(rij, pad)
    uit[label] = MEDEWERKER_KOLOMMEN.has(pad) && typeof waarde === 'string' ? medewerkers.get(waarde) ?? 'Medewerker (niet meer bekend)' : waarde
  }
  return uit
}

function vertaalSectie(rij: Rij, sectie: Velden, medewerkers: ReadonlyMap<string, string>): Rij {
  const uit = vertaal(rij, sectie.velden, medewerkers)
  for (const [pad, lijst] of Object.entries(sectie.lijsten ?? {})) {
    const rijen = Array.isArray(rij[pad]) ? (rij[pad] as unknown[]) : []
    uit[lijst.titel] = rijen.filter((r): r is Rij => typeof r === 'object' && r !== null).map((r) => vertaal(r, lijst.velden, medewerkers))
  }
  return uit
}

export interface ExportMeta {
  sportschool: string
  gemaaktOp: Date
  vestigingNaam: string | null
}

export const EXPORT_UITLEG =
  'Dit bestand bevat alle gegevens die de sportschool in Club over dit lid bewaart, op het moment van downloaden. ' +
  'Abonnementen en incasso staan alleen in Club als de sportschool die daar laat lopen, anders in de ledenadministratie van de sportschool; aankopen in de app staan er altijd in. ' +
  'Pincodes en inloglinks zijn om veiligheidsredenen niet opgenomen.'

/** Het volledige bestand: per onderdeel een lijst rijen met Nederlandse sleutels. */
export function bouwExport(ruw: ExportRuw, medewerkers: ReadonlyMap<string, string>, meta: ExportMeta): Rij {
  const lid = vertaal(ruw.lid, LID_VELDEN, medewerkers)
  if (meta.vestigingNaam) lid.Vestiging = meta.vestigingNaam
  const bestand: Rij = {
    'Over dit bestand': { Sportschool: meta.sportschool, 'Gemaakt op': meta.gemaaktOp.toISOString(), Uitleg: EXPORT_UITLEG },
    Lid: lid,
  }
  for (const sectie of SECTIES) bestand[sectie.titel] = ruw[sectie.sleutel].map((r) => vertaalSectie(r, sectie, medewerkers))
  return bestand
}

const DATUM = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' })

function datumTekst(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : DATUM.format(d)
}

/** De eerste en laatste datum van een kolom in een lijst, als "van X tot en met Y". */
function periode(rijen: readonly Rij[], kolom: string): string {
  const tijden = rijen.map((r) => (typeof r[kolom] === 'string' ? Date.parse(r[kolom] as string) : NaN)).filter((t) => !Number.isNaN(t))
  if (tijden.length === 0) return ''
  const van = datumTekst(new Date(Math.min(...tijden)).toISOString())
  const tot = datumTekst(new Date(Math.max(...tijden)).toISOString())
  return van === tot ? ` (${van})` : ` (van ${van} tot en met ${tot})`
}

/** Kolom met de datum per onderdeel, voor de periode in de samenvatting. */
const PERIODE_KOLOM: Partial<Record<SectieSleutel, string>> = {
  bezoeken: 'op',
  lesboekingen: 'geboekt_op',
  afspraken: 'start_op',
  intakes: 'datum',
  metingen: 'datum',
  trainingen: 'op',
  sets: 'op',
  notities: 'aangemaakt_op',
  meldingen: 'gepland_op',
  communityBerichten: 'aangemaakt_op',
  aankopen: 'aangemaakt_op',
  tegoedMutaties: 'op',
  facturen: 'uitgegeven_op',
  betalingen: 'aangemaakt_op',
  kasboek: 'boekdatum',
  healthMetingen: 'gemeten_op',
  voedingDagboek: 'datum',
}

/** Een korte samenvatting in gewone tekst, om mee te sturen met het bestand. */
export function bouwSamenvatting(ruw: ExportRuw, meta: ExportMeta): string {
  const naam = [ruw.lid.voornaam, ruw.lid.achternaam].filter((d) => typeof d === 'string').join(' ')
  const regels = [
    `Gegevens van ${naam || 'dit lid'} bij ${meta.sportschool}`,
    `Gemaakt op ${DATUM.format(meta.gemaaktOp)}.`,
    '',
    'Wat Club over dit lid bewaart:',
    `- Persoonsgegevens: naam, contactgegevens, geboortedatum, vestiging, lidmaatschap, labels en coach.`,
  ]
  for (const sectie of SECTIES) {
    const rijen = ruw[sectie.sleutel]
    if (rijen.length === 0) continue
    const kolom = PERIODE_KOLOM[sectie.sleutel]
    regels.push(`- ${sectie.titel}: ${rijen.length}${kolom ? periode(rijen, kolom) : ''}`)
  }
  const verzoek = ruw.verwijderverzoek[0]
  if (verzoek) {
    const op = datumTekst(verzoek.definitief_op)
    regels.push('', `Dit lid wordt verwijderd${op ? ` op ${op}` : ''}. Daarna zijn alle gegevens hierboven weg.`)
  }
  regels.push('', EXPORT_UITLEG, 'Alle gegevens staan in het bijbehorende JSON-bestand.')
  return regels.join('\n')
}

/** Een veilige bestandsnaam: gegevens-<voornaam>-<achternaam>-<datum>.<extensie>. */
export function exportBestandsnaam(lid: Rij, op: Date, extensie: 'json' | 'txt'): string {
  const naam = [lid.voornaam, lid.achternaam]
    .filter((d): d is string => typeof d === 'string')
    .join('-')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  const datum = op.toISOString().slice(0, 10)
  return `gegevens-${naam || 'lid'}-${datum}.${extensie}`
}
