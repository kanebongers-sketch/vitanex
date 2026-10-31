// Uitzonderingen op de tenant-filter-test (tenant-filter.test.ts).
// Een query op een club_* of ayg_* tabel hoort altijd op user_id of organisatie_id
// te filteren. Staat een query hier, dan is dat bewust over sportscholen heen.
// Met `functies` dekt een regel alleen de querys op die tabel in die functies (voorkeur);
// zonder `functies` alle querys op die tabel (of rpc-functie) in dat bestand.
// Een filter waarvan de waarde uit de request komt, is nooit een uitzondering: fixen.
// Zonder passende query in de code faalt de test: houd de lijst schoon.
// Een nieuwe query over sportscholen heen? Voeg hier een regel met reden toe.

export interface TenantUitzondering {
  /** Pad vanaf de projectmap, met slashes. */
  readonly bestand: string
  /** Tabelnaam, of rpc-functienaam bij een rpc-aanroep. */
  readonly tabel: string
  /** Namen van de functies waarin de querys staan; leeg = het hele bestand. */
  readonly functies?: readonly string[]
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
  { bestand: 'src/lib/club/medewerker-login/opslag.ts', tabel: 'club_medewerker_sessies', functies: ['snoeiSessies', 'medewerkerVanSessie', 'logUitMedewerker'], reden: SESSIE },
  { bestand: 'src/lib/club/ledenlogin/opslag.ts', tabel: 'club_lid_toegang', functies: ['vindLidToegang'], reden: LOGIN },
  { bestand: 'src/lib/club/ledenlogin/opslag.ts', tabel: 'club_lid_sessies', functies: ['lidVanSessie', 'logUitLid'], reden: SESSIE },
  { bestand: 'src/lib/club/nieuwe-leden/links-opslag.ts', tabel: 'club_aanmeldlinks', functies: ['vindLink'], reden: 'Aanmelden via een link: de link opzoeken op zijn geheime code, de sportschool volgt uit de gevonden rij.' },
  { bestand: 'src/lib/club/nieuwe-leden/aanmelden-opslag.ts', tabel: 'club_aanmeldingen', functies: ['tel', 'vindAanmelding', 'ruimAanmeldingenOp'], reden: 'Aanmelden via een link: zoekt op tokenhash, telt de rem op IP-, adres- en linkhash en ruimt rijen ouder dan een dag op.' },
  { bestand: 'src/lib/club/platform-login/opslag.ts', tabel: 'club_platform_accounts', reden: 'Platform-account (Kane) heeft geen sportschool; opgezocht op linkhash, e-mail of id van de sessie.' },
  { bestand: 'src/lib/club/platform-login/opslag.ts', tabel: 'club_platform_sessies', reden: SESSIE },

  // Sportschool zoeken voor routering, merk en afmelden
  { bestand: 'src/lib/club/app-uitnodigen/sportschool.ts', tabel: 'club_organisaties', functies: ['zoek'], reden: ROUTING },
  { bestand: 'src/lib/club/ledenapp-pwa/merk-server.ts', tabel: 'club_organisaties', functies: ['zoekOrganisatie'], reden: ROUTING },
  { bestand: 'src/lib/club/widget/opslag.ts', tabel: 'club_organisaties', functies: ['haalWidgetContext'], reden: ROUTING },
  { bestand: 'src/lib/club/toegang.ts', tabel: 'club_organisaties', functies: ['haalOrganisaties', 'haalEigenOrganisatie'], reden: 'De sportscholen van een beheerder (beheerder_id) of de eigen sportschool op id uit de sessie.' },
  { bestand: 'src/lib/club/kern/organisatie-opslag.ts', tabel: 'club_organisaties', functies: ['bewaarHuisstijl', 'maakOrganisatie'], reden: 'Sportschool aanmaken of terugdraaien (alleen Kane; filtert op id en beheerder_id) en de namen van dezelfde beheerder lezen voor een unieke naam (beheerder_id).' },
  { bestand: 'src/lib/club/meldingen/afmelden.ts', tabel: 'club_meldingen_voorkeuren', functies: ['haalAfmeldStand', 'meldAf'], reden: 'Afmelden via een onraadbaar token uit de mail; het token hoort bij een lid van een sportschool.' },
  { bestand: 'src/lib/club/app-uitnodigen/opslag.ts', tabel: 'club_app_aanvragen', functies: ['tel', 'registreerAanvraag'], reden: 'Rem op e-mail- en IP-hash over alle sportscholen heen, zonder persoonsgegevens.' },

  // Cron over alle sportscholen
  { bestand: 'src/lib/club/meldingen/context.ts', tabel: 'club_meldingen', functies: ['haalWachtrij'], reden: CRON },
  { bestand: 'src/lib/club/meldingen/context.ts', tabel: '<dynamisch>', functies: ['lees'], reden: 'Cron: bronrijen op id uit de wachtrij; het resultaat wordt op user_id:id gesleuteld.' },
  { bestand: 'src/lib/club/meldingen/versturen.ts', tabel: 'club_meldingen', functies: ['zet', 'claim', 'ruimVastgelopenOp'], reden: CRON },
  { bestand: 'src/lib/club/push/opslag.ts', tabel: 'club_push_abonnementen', functies: ['abonnementenVan', 'wisAbonnement', 'markeerGebruikt'], reden: 'Cron: ids komen uit de wachtrij van alle sportscholen, resultaat gesleuteld op user_id:lid_id.' },

  // Platformoverzichten en status
  { bestand: 'src/lib/club/platform/opslag.ts', tabel: 'club_organisaties', functies: ['haalInstellingen'], reden: PLATFORM },
  { bestand: 'src/lib/club/platform/opslag.ts', tabel: 'ayg_aanmeldingen', functies: ['haalAanmeldingen'], reden: PLATFORM },
  { bestand: 'src/lib/club/platform/opslag.ts', tabel: 'club_fouten', functies: ['telFouten24'], reden: PLATFORM },
  { bestand: 'src/lib/club/platform/demo-aanvragen.ts', tabel: 'ayg_demo_aanvragen', functies: ['haalDemoAanvragen', 'zetDemoStatus'], reden: PLATFORM },
  { bestand: 'src/lib/club/betrouwbaarheid/systeem-opslag.ts', tabel: 'club_fouten', functies: ['haalSysteemStand'], reden: PLATFORM },
  { bestand: 'src/lib/club/betrouwbaarheid/systeem-opslag.ts', tabel: 'club_systeem_status', functies: ['statusRpc'], reden: PLATFORM },
  { bestand: 'src/lib/club/betrouwbaarheid/database.ts', tabel: 'club_organisaties', functies: ['meetDatabase'], reden: 'Gezondheidscheck van de database: leest een enkel id, geen gegevens.' },
  { bestand: 'src/lib/club/betrouwbaarheid/melden.ts', tabel: 'club_fout_melden', functies: ['bewaar'], reden: 'Foutregistratie zonder persoonsgegevens; de functie telt per gebied en route.' },

  // Betalen (Stripe-webhook, wachtrijen)
  { bestand: 'src/lib/club/betalen/opslag.ts', tabel: 'club_betalen_accounts', functies: ['werkAccountStandBij'], reden: WEBHOOK },
  { bestand: 'src/lib/club/betalen/opslag.ts', tabel: 'club_betalen_stripe_events', functies: ['claimEvent', 'geefEventVrij'], reden: 'Stripe-webhook: eventregistratie op event_id, om dubbele verwerking te stoppen.' },
  { bestand: 'src/lib/club/betalen/opslag.ts', tabel: 'club_betalen_verkopen', functies: ['sluitOpenVerkoop'], reden: 'Stripe-webhook: sessie-id en account moeten allebei kloppen.' },
  { bestand: 'src/lib/club/betalen/opslag.ts', tabel: 'club_betalen_afronden', functies: ['rondVerkoopAf'], reden: 'Stripe-webhook: de functie zoekt de verkoop op id, sessie en account.' },
  { bestand: 'src/lib/club/betalen/opslag.ts', tabel: 'club_betalen_terugbetaald', functies: ['verwerkTerugbetaling'], reden: 'Stripe-webhook: de functie zoekt de betaling op payment intent en account.' },
  { bestand: 'src/lib/club/betalen/inbox/opslag-supabase.ts', tabel: 'club_betalen_accounts', functies: ['accountKolom', 'accountOntkoppeld'], reden: WEBHOOK },
  { bestand: 'src/lib/club/betalen/inbox/opslag-supabase.ts', tabel: 'club_betalen_stripe_events', functies: ['claim', 'rond', 'bewaar'], reden: 'Stripe-webhook en cron: events dragen nog geen sportschool; de verwerking haalt het object bij Stripe op en controleert account en sportschool (controleerKoppeling).' },
  { bestand: 'src/lib/club/betalen/inbox/opslag-supabase.ts', tabel: 'club_betalen_betalingen', functies: ['betaling'], reden: 'Stripe-webhook: de betaling wordt op id uit de metadata gezocht; daarna moeten account, sportschool, factuur en bedrag kloppen (controleerKoppeling), anders afwijkend.' },
  { bestand: 'src/lib/club/betalen/outbox/opslag-supabase.ts', tabel: 'club_betalen_opdrachten', functies: ['tabel', 'claim', 'rond'], reden: 'Cron: outbox-werker over alle sportscholen, rijen dragen hun eigen user_id; elke aanroep controleert daarna op die user_id.' },

  // Koppelingen met health-apps (cron en webhooks van leveranciers)
  { bestand: 'src/lib/club/health/opslag-cron.ts', tabel: 'club_health_koppelingen', functies: ['koppelingenTeSyncen', 'verwerkWebhook'], reden: 'Cron en webhook: koppelingen die aan de beurt zijn of horen bij een gebruiker-id van de leverancier; elke rij draagt zijn eigen user_id.' },

  // AI Your Gym-platform: aanmelden en betalen gebeuren voordat er een sportschool bestaat.
  // Een rij in ayg_aanmeldingen, ayg_stripe_events, ayg_proefmails of ayg_demo_aanvragen hoort bij een aanmelding, niet bij een sportschool.
  { bestand: 'src/lib/aiyourgym/opslag.ts', tabel: 'ayg_aanmeldingen', reden: 'Aanmelding van een nieuwe sportschool: opgezocht op id, slug of Stripe-sessie uit de webhook, er is nog geen sportschool.' },
  { bestand: 'src/lib/aiyourgym/opslag.ts', tabel: 'ayg_stripe_events', functies: ['claimEvent', 'geefEventVrij'], reden: 'Stripe-webhook: eventregistratie op event_id, om dubbele verwerking te stoppen.' },
  { bestand: 'src/lib/aiyourgym/opslag.ts', tabel: 'club_organisaties', functies: ['slugVrij'], reden: 'Is een webadres nog vrij: zoekt op slug over alle sportscholen, leest alleen het id.' },
  { bestand: 'src/lib/aiyourgym/demo-aanvraag-opslag.ts', tabel: 'ayg_demo_aanvragen', functies: ['tel', 'bewaarDemoAanvraag'], reden: 'Demo-aanvraag van een bezoeker van de website: er is geen sportschool, de rem telt op e-mail en IP-hash.' },
  { bestand: 'src/lib/aiyourgym/proefmails/versturen.ts', tabel: 'ayg_aanmeldingen', functies: ['haalKandidaten'], reden: CRON },
  { bestand: 'src/lib/aiyourgym/proefmails/versturen.ts', tabel: 'ayg_proefmails', functies: ['haalVerstuurd', 'claim', 'verstuurProefmails'], reden: 'Cron: claim per aanmelding (aanmelding_id) zodat elke startmail precies een keer weggaat.' },
  { bestand: 'src/lib/aiyourgym/proefmails/versturen.ts', tabel: 'club_organisaties', functies: ['metActueleNaam'], reden: 'Cron: actuele naam en slug op de ids van de eigen aanmeldingen, alleen voor de mail aan die eigenaar.' },
  { bestand: 'src/lib/aiyourgym/sportschool.ts', tabel: 'club_organisaties', functies: ['organisatiesVan'], reden: 'Sportschool aanmaken na betalen: de sportscholen van de platformeigenaar (beheerder_id), namens het systeem.' },
  { bestand: 'src/lib/aiyourgym/sportschool.ts', tabel: 'club_organisaties', functies: ['maakSportschool'], reden: 'Sportschool aanmaken na betalen: werkt de net gemaakte rij bij op id en beheerder_id van de platformeigenaar.' },

  // Profielfoto's: de wachtrij met vervallen bestanden heeft alleen een pad (migratie 473).
  { bestand: 'src/lib/club/profielfoto/opslag.ts', tabel: 'club_profielfoto_opruimen', functies: ['ruimProfielfotosOp'], reden: 'Wachtrij van vervallen bestanden over alle sportscholen; een rij is alleen een pad dat met de sportschool begint, de server wist het bestand via de Storage API.' },
]
