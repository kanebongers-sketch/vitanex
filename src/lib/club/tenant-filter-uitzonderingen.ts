// Uitzonderingen op de tenant-filter-test (tenant-filter.test.ts).
// Een query op een club_* of ayg_* tabel hoort altijd op user_id of organisatie_id
// te filteren. Staat een query hier, dan is dat bewust over sportscholen heen.
// Elke regel dekt alle querys op die tabel (of rpc-functie) in dat bestand.
// Zonder passende query in de code faalt de test: houd de lijst schoon.
// Een nieuwe query over sportscholen heen? Voeg hier een regel met reden toe.

export interface TenantUitzondering {
  /** Pad vanaf de projectmap, met slashes. */
  readonly bestand: string
  /** Tabelnaam, of rpc-functienaam bij een rpc-aanroep. */
  readonly tabel: string
  /** Eenregelige reden waarom dit over sportscholen heen mag. */
  readonly reden: string
}

const LOGIN = 'Inloggen: zoekt op tokenhash, code of e-mail om de sportschool pas te vinden, of werkt een al geladen rij bij.'
const SESSIE = 'Sessie: opgezocht op tokenhash, de sportschool volgt uit de gevonden rij.'
const ROUTING = 'Routering: de sportschool zoeken op slug of id, dat is juist de tenant zelf.'
const PLATFORM = 'Platformoverzicht, alleen bereikbaar voor de platformeigenaar (eisPlatformEigenaar).'
const CRON = 'Cron: loopt over alle sportscholen, elke rij draagt zijn eigen user_id.'
const WEBHOOK = 'Stripe-webhook: opzoeken op Stripe-id (uniek per sportschool), daarna werkt alles per sportschool.'

export const TENANT_UITZONDERINGEN: readonly TenantUitzondering[] = [
  // Inloggen en sessies
  { bestand: 'src/lib/club/beheerders/beheerder-opslag.ts', tabel: 'club_beheerders', reden: LOGIN },
  { bestand: 'src/lib/club/beheerders/beheerder-opslag.ts', tabel: 'club_beheerder_sessies', reden: SESSIE },
  { bestand: 'src/lib/club/medewerker-login/opslag.ts', tabel: 'club_medewerker_toegang', reden: LOGIN },
  { bestand: 'src/lib/club/medewerker-login/opslag.ts', tabel: 'club_medewerker_sessies', reden: SESSIE },
  { bestand: 'src/lib/club/ledenlogin/opslag.ts', tabel: 'club_lid_toegang', reden: LOGIN },
  { bestand: 'src/lib/club/ledenlogin/opslag.ts', tabel: 'club_lid_sessies', reden: SESSIE },
  { bestand: 'src/lib/club/platform-login/opslag.ts', tabel: 'club_platform_accounts', reden: 'Platform-account (Kane) heeft geen sportschool; opgezocht op linkhash, e-mail of id van de sessie.' },
  { bestand: 'src/lib/club/platform-login/opslag.ts', tabel: 'club_platform_sessies', reden: SESSIE },

  // Sportschool zoeken voor routering, merk en afmelden
  { bestand: 'src/lib/club/app-uitnodigen/sportschool.ts', tabel: 'club_organisaties', reden: ROUTING },
  { bestand: 'src/lib/club/ledenapp-pwa/merk-server.ts', tabel: 'club_organisaties', reden: ROUTING },
  { bestand: 'src/lib/club/widget/opslag.ts', tabel: 'club_organisaties', reden: ROUTING },
  { bestand: 'src/lib/club/toegang.ts', tabel: 'club_organisaties', reden: 'De sportscholen van een beheerder (beheerder_id) of de eigen sportschool op id uit de sessie.' },
  { bestand: 'src/lib/club/kern/organisatie-opslag.ts', tabel: 'club_organisaties', reden: 'Sportschool aanmaken of terugdraaien, alleen Kane; terugdraaien filtert op id en beheerder_id.' },
  { bestand: 'src/lib/club/meldingen/afmelden.ts', tabel: 'club_meldingen_voorkeuren', reden: 'Afmelden via een onraadbaar token uit de mail; het token hoort bij een lid van een sportschool.' },
  { bestand: 'src/lib/club/app-uitnodigen/opslag.ts', tabel: 'club_app_aanvragen', reden: 'Rem op e-mail- en IP-hash over alle sportscholen heen, zonder persoonsgegevens.' },

  // Cron over alle sportscholen
  { bestand: 'src/lib/club/meldingen/context.ts', tabel: 'club_meldingen', reden: CRON },
  { bestand: 'src/lib/club/meldingen/context.ts', tabel: '<dynamisch>', reden: 'Cron: bronrijen op id uit de wachtrij; het resultaat wordt op user_id:id gesleuteld.' },
  { bestand: 'src/lib/club/meldingen/versturen.ts', tabel: 'club_meldingen', reden: CRON },
  { bestand: 'src/lib/club/push/opslag.ts', tabel: 'club_push_abonnementen', reden: 'Cron: ids komen uit de wachtrij van alle sportscholen, resultaat gesleuteld op user_id:lid_id.' },

  // Platformoverzichten en status
  { bestand: 'src/lib/club/platform/opslag.ts', tabel: 'club_organisaties', reden: PLATFORM },
  { bestand: 'src/lib/club/platform/opslag.ts', tabel: 'ayg_aanmeldingen', reden: PLATFORM },
  { bestand: 'src/lib/club/platform/opslag.ts', tabel: 'club_fouten', reden: PLATFORM },
  { bestand: 'src/lib/club/platform/demo-aanvragen.ts', tabel: 'ayg_demo_aanvragen', reden: PLATFORM },
  { bestand: 'src/lib/club/betrouwbaarheid/systeem-opslag.ts', tabel: 'club_fouten', reden: PLATFORM },
  { bestand: 'src/lib/club/betrouwbaarheid/systeem-opslag.ts', tabel: 'club_systeem_status', reden: PLATFORM },
  { bestand: 'src/lib/club/betrouwbaarheid/database.ts', tabel: 'club_organisaties', reden: 'Gezondheidscheck van de database: leest een enkel id, geen gegevens.' },
  { bestand: 'src/lib/club/betrouwbaarheid/melden.ts', tabel: 'club_fout_melden', reden: 'Foutregistratie zonder persoonsgegevens; de functie telt per gebied en route.' },

  // Betalen (Stripe-webhook, wachtrijen)
  { bestand: 'src/lib/club/betalen/opslag.ts', tabel: 'club_betalen_accounts', reden: WEBHOOK },
  { bestand: 'src/lib/club/betalen/opslag.ts', tabel: 'club_betalen_stripe_events', reden: 'Stripe-webhook: eventregistratie op event_id, om dubbele verwerking te stoppen.' },
  { bestand: 'src/lib/club/betalen/opslag.ts', tabel: 'club_betalen_verkopen', reden: 'Stripe-webhook: sessie-id en account moeten allebei kloppen.' },
  { bestand: 'src/lib/club/betalen/opslag.ts', tabel: 'club_betalen_afronden', reden: 'Stripe-webhook: de functie zoekt de verkoop op id, sessie en account.' },
  { bestand: 'src/lib/club/betalen/opslag.ts', tabel: 'club_betalen_terugbetaald', reden: 'Stripe-webhook: de functie zoekt de betaling op payment intent en account.' },
  { bestand: 'src/lib/club/betalen/inbox/opslag-supabase.ts', tabel: 'club_betalen_accounts', reden: WEBHOOK },
  { bestand: 'src/lib/club/betalen/inbox/opslag-supabase.ts', tabel: 'club_betalen_stripe_events', reden: 'Stripe-webhook en cron: events dragen nog geen sportschool; de verwerking haalt het object bij Stripe op en controleert account en sportschool (controleerKoppeling).' },
  { bestand: 'src/lib/club/betalen/inbox/opslag-supabase.ts', tabel: 'club_betalen_betalingen', reden: 'Stripe-webhook: de betaling wordt op id uit de metadata gezocht; daarna moeten account, sportschool, factuur en bedrag kloppen (controleerKoppeling), anders afwijkend.' },
  { bestand: 'src/lib/club/betalen/outbox/opslag-supabase.ts', tabel: 'club_betalen_opdrachten', reden: 'Cron: outbox-werker over alle sportscholen, rijen dragen hun eigen user_id; elke aanroep controleert daarna op die user_id.' },

  // Koppelingen met health-apps (cron en webhooks van leveranciers)
  { bestand: 'src/lib/club/health/opslag-cron.ts', tabel: 'club_health_koppelingen', reden: 'Cron en webhook: koppelingen die aan de beurt zijn of horen bij een gebruiker-id van de leverancier; elke rij draagt zijn eigen user_id.' },
]
