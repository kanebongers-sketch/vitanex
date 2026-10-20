// ─── Club, AVG: elke tabel met gegevens van een lid (PUUR) ──────────────────
// Een plek die zegt hoe elke tabel met een lid_id meegaat in de rechten van
// het lid: in de inzage (export) en bij verwijderen (club_lid_definitief_verwijderen,
// laatste versie in migratie 449). tabellen.test.ts leest alle migraties en
// faalt zodra een tabel met lid_id hier ontbreekt, niet in de export zit of
// niet in de verwijderfunctie staat.
//
// Nieuwe tabel met lid_id? Dan:
//   1. hier toevoegen,
//   2. een sectie in export.ts en een bron in opslag.ts (of export: null met reden),
//   3. een nieuwe versie van club_lid_definitief_verwijderen in een migratie.
//
// Controle tegen de echte database (Supabase SQL):
//   select table_name from information_schema.columns
//   where table_schema = 'public' and column_name = 'lid_id' and table_name like 'club_%' order by 1;

import type { SectieSleutel } from './export'

export type Afhandeling =
  /** Rijen worden verwijderd. */
  | 'verwijderd'
  /** De rij blijft als anonieme telling (lid_id null). */
  | 'anoniem'
  /** De rij blijft wegens een wettelijke bewaarplicht, zonder lid (lid_id null). */
  | 'bewaard-zonder-lid'

export interface LidTabel {
  /** Het onderdeel van de export, of null met een reden waarom niet. */
  export: SectieSleutel | null
  afhandeling: Afhandeling
  reden?: string
  /** Gaat mee via on delete cascade in plaats van een eigen regel in de functie. */
  viaCascade?: boolean
}

export const LID_TABELLEN: Readonly<Record<string, LidTabel>> = {
  club_afspraken: { export: 'afspraken', afhandeling: 'verwijderd' },
  club_betalen_mutaties: { export: 'tegoedMutaties', afhandeling: 'verwijderd' },
  club_betalen_tegoeden: { export: 'tegoeden', afhandeling: 'verwijderd' },
  club_betalen_verkopen: { export: 'aankopen', afhandeling: 'bewaard-zonder-lid', reden: 'Fiscale bewaarplicht (7 jaar) voor verkopen.' },
  club_challenge_deelnemers: { export: 'challenges', afhandeling: 'verwijderd' },
  club_checkins: { export: 'bezoeken', afhandeling: 'anoniem', reden: 'Bezoeken per dag en per uur in de maandcijfers.' },
  club_community_berichten: { export: 'communityBerichten', afhandeling: 'verwijderd' },
  club_community_groepsleden: { export: 'communityGroepen', afhandeling: 'verwijderd' },
  club_community_meldingen: { export: 'communityMeldingen', afhandeling: 'verwijderd' },
  club_community_reacties: { export: 'communityReacties', afhandeling: 'verwijderd' },
  club_community_voorkeuren: { export: 'communityVoorkeur', afhandeling: 'verwijderd' },
  club_intakes: { export: 'intakes', afhandeling: 'verwijderd' },
  club_leads: { export: 'leads', afhandeling: 'anoniem', reden: 'Status en bron blijven voor de conversiecijfers; naam en contact gaan weg.' },
  club_lid_sessies: { export: 'sessies', afhandeling: 'verwijderd' },
  club_lid_toegang: { export: 'ledenapp', afhandeling: 'verwijderd' },
  club_lid_verwijderingen: { export: 'verwijderverzoek', afhandeling: 'verwijderd', viaCascade: true },
  club_meldingen: { export: 'meldingen', afhandeling: 'verwijderd' },
  club_meldingen_voorkeuren: { export: 'meldingVoorkeuren', afhandeling: 'verwijderd' },
  club_metingen: { export: 'metingen', afhandeling: 'verwijderd' },
  club_notities: { export: 'notities', afhandeling: 'verwijderd' },
  club_opvolgtaken: { export: 'opvolgtaken', afhandeling: 'verwijderd' },
  club_push_abonnementen: { export: 'pushToestellen', afhandeling: 'verwijderd' },
  club_reserveringen: { export: 'lesboekingen', afhandeling: 'anoniem', reden: 'Bezetting van gegeven lessen; toekomstige boekingen gaan weg.' },
  club_schemas: { export: 'schemas', afhandeling: 'verwijderd' },
  club_set_logs: { export: 'sets', afhandeling: 'verwijderd' },
  club_trainingslog: { export: 'trainingen', afhandeling: 'verwijderd' },
  club_voedingsplannen: { export: 'voeding', afhandeling: 'verwijderd' },
}
