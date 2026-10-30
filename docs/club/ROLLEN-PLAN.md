# Rollenmodel AI Your Gym | bouwplan

Besluit Kane (29-10-2026). Dit plan beschrijft wat er gebouwd wordt, in welke volgorde, en wat bewust naar fase 2 gaat.

## Doel

- Een profiel per persoon per sportschool. Het profiel is de bestaande rij in `club_medewerkers`.
- Een profiel heeft een of meer rollen, in de tabel `club_profiel_rollen`: eigenaar, manager (clubmanager), trainer, instructeur (groepslesinstructeur), roosteraar en administratie.
- Rechten hebben vier niveaus: geen, zien, bewerken, beheren. Bij meerdere rollen geldt per onderdeel het hoogste niveau.
- Wat iemand ziet: afgenomen EN aan EN een recht via een van de rollen. Dat rekent een functie uit: `niveau()` in `src/lib/club/rollen/`. Menu, pagina's, API, hulpbalk, Ctrl K en het instellingencentrum lezen de uitkomst (de lijst `t.onderdelen` en het niveau per onderdeel).

## Niveaus

| Niveau | Betekenis |
|---|---|
| geen | Bestaat niet: geen menu, pagina en API geven een 404. |
| zien | Lezen (GET). Wijzigen via de API geeft een 404. |
| bewerken | Lezen en wijzigen. |
| beheren | Ook de instellingen van het onderdeel (taken beheren, uren goedkeuren, team beheren). |

## Standaardrechten

| Rol | Ziet en mag |
|---|---|
| Eigenaar | Cijfers, rapporten, team (beheren), financien, abonnement, instellingen, leden en leads (zien). Geen werkvloer, geen coaching. |
| Clubmanager | Bijna alles (alles behalve wat alleen voor de eigenaar is). |
| Trainer | Werkvloer, leden, coaching, afspraken. |
| Groepslesinstructeur | Rooster (bewerken), Vandaag en Notities (zien). |
| Roosteraar | Personeelsrooster en groepslesrooster beheren (keuze Kane), afspraken bewerken. |
| Administratie | Uren beheren, rapporten. |

De exacte tabel staat in `src/lib/club/rollen/standaard.ts` en is getest.

## Startpagina per rol

| Rol | Startpagina |
|---|---|
| Eigenaar | Cijfers |
| Clubmanager | Vandaag |
| Trainer | Vandaag |
| Groepslesinstructeur | Groepslessen |
| Roosteraar | Personeelsrooster |
| Administratie | Uren |

Meerdere rollen: de eerste in de volgorde clubmanager, trainer, instructeur, roosteraar, administratie, eigenaar. Is die pagina niet zichtbaar (pakket niet afgenomen, onderdeel uit), dan het eerste zichtbare onderdeel. De eigenaar stelt per rol een andere startpagina in bij Rechten per rol.

## Alleen voor de eigenaar (vergrendeld)

Abonnement en pakketten, rollen en Rechten per rol, naam en adres, huisstijl, bedrijf, lidmaatschappen, sluiting, Stripe en financien, privacy en AVG-verwijderen, widget en startwizard (`ALLEEN_EIGENAAR` in `src/lib/club/rollen/model.ts`).

- Geen andere rol krijgt deze rechten, ook niet als de opgeslagen rechten dat zeggen (het model zet ze op geen).
- De eigenaar houdt ze altijd op beheren (niet uit te zetten, anders sluit hij zichzelf buiten).
- Er is altijd minstens een eigenaar: de laatste eigenaar verliest de rol niet (API en model, getest).
- Een clubmanager geeft alleen werkrollen (trainer, instructeur, roosteraar, administratie), nooit eigenaar of clubmanager (keuze Kane). Hij haalt ook nooit een eigenaar- of clubmanagerrol weg.

## Datamodel (migratie 469)

- Tabel `club_profiel_rollen`: `user_id`, `medewerker_id`, `rol` (check op de zes rollen), `toegekend_door`, `demo`, `unique(medewerker_id, rol)`, FK naar `club_medewerkers(id, user_id)` met cascade, RLS aan, revoke voor anon en authenticated.
- Kolom `club_medewerkers.alle_vestigingen` (boolean, standaard false): werkt op alle vestigingen, ook nieuwe.
- Kolom `club_beheerders.profiel_id` (FK naar `club_medewerkers`, on delete set null).
- Overzetten, idempotent en zonder dataverlies:
  - `club_medewerkers.rollen[]` naar `club_profiel_rollen`;
  - elke beheerder krijgt een profiel (nieuwe medewerkerrij met naam en e-mail, `alle_vestigingen` aan) en de rol eigenaar of manager;
  - rechten v1 naar v2 in `instellingen.rolrechten`: elke oude sleutel wordt bewerken, de nieuwe sleutels (team, uren, abonnement, financien, privacy, widget, rollen) krijgen de standaard, de eigenaar en de roosteraar de nieuwe standaard. Bestaat `rolrechten` al, dan blijft hij staan.
- Triggers:
  - `club_profiel_rollen` naar `club_medewerkers.rollen` (alleen de vier oude rollen), zodat de oude code blijft werken;
  - een nieuwe beheerder krijgt meteen een profiel met zijn rol (aanmelden, testbetaling, Stripe-webhook en uitnodigen hoeven niets te weten).
- `club_medewerker_anonimiseren` wist ook de rollen en de koppeling met een beheerder; `club_demo_verversen` vult ontbrekende rollen van demo-medewerkers aan.
- AVG: `club_profiel_rollen` staat in de export van een medewerker en in `docs/club/AVG.md`.
- Migratie 470: het profiel van een beheerderslogin staat op `actief = false` zolang het geen werkrol heeft (anders telde de oude code het als personeel en sloeg de startwizard de stap Team over). Krijgt het een werkrol in Team, dan wordt het actief op alle vestigingen.
- Uitgevoerd 29/30-10-2026 met controlequery: medewerkers 15 naar 18 (3 beheerderprofielen), actief 15 (gelijk aan voor), profielrollen 25 (22 oude rollen plus 3 eigenaar), 1 sportschool met rechten v1 omgezet naar rolrechten, oude `rollen[]` ongewijzigd (zelfde controlehash).
- Terugdraaien: `docs/club/rollen/terugdraaien-469.sql` (alleen de nieuwe tabel, triggers en kolommen; `club_medewerkers.rollen` blijft gesynchroniseerd, dus de oude code verliest niets).

## Schakelaar CLUB_ROLLEN_V2

- `src/lib/club/rollen/schakelaar.ts`. Standaard uit. Aan voor de demo (Voorbeeld Gym) en Test Gym via een lijst organisatie-id's in de code. Kane zet hem later overal aan (`CLUB_ROLLEN_V2_OVERAL`).
- Uit: alles precies zoals nu (de oude `rechten.ts` en `medewerker-login/rechten.ts`).
- Aan: `clubToegang()` leest de rollen van het profiel en rekent het niveau per onderdeel uit. `t.onderdelen` wordt de lijst met minstens zien (ook voor de eigenaar, die dus niet meer alles ziet), `t.profiel` houdt rollen, niveaus en startpagina. Een wijziging via de API vraagt minstens bewerken.

## Inloggen

- Fase 1 (nu): beide logins blijven (beheerder en medewerker). De rollen hangen aan het profiel; de sessie wijst naar het profiel (`club_beheerders.profiel_id` of de medewerkerrij).
- Na inloggen en op `/club` zonder Vandaag: door naar de startpagina.
- Fase 2 (vervolgstap): een account voor meerdere sportscholen (keuze Kane: ja). Een tabel `club_accounts` (e-mail, wachtwoord) met per sportschool een profiel; na inloggen kies je de sportschool. Tot die er is: een uitnodiging voor een e-mailadres dat al bij een andere sportschool hoort, geeft een duidelijke melding ("Dit e-mailadres heeft al een account bij een andere sportschool. Een account voor meerdere sportscholen komt binnenkort; gebruik voorlopig een ander e-mailadres.").

## UI

- Team staat alleen in het instellingencentrum, categorie Team en rechten (niet in het menu). Een pagina `/club/beheer/team` met personen, rol-chips per categorie (Leiding, Vloer, Planning en administratie) en een paneel om te bewerken. Het oude Beheerders-blok op Huisstijl wordt (met de schakelaar aan) een doorverwijzing naar Team.
- Rechten per rol: een matrix per categorie met vier niveaus. Rijen die alleen voor de eigenaar zijn krijgen een slotje, rijen buiten het pakket worden grijs. Per rol een startpagina, en een voorvertoning "Bekijk menu als".
- Startwizard, stap Team: de eigenaar met de vraag "Werk je zelf op de vloer?" (zet de rol trainer erbij) en dezelfde matrix.
- Werkt in de huisstijl van de sportschool, teksten in NL en EN (`woorden/club/rollen.ts`).

## Tests

- Model: optellen van rollen, `ALLEEN_EIGENAAR` niet open te zetten, standaard startpagina bereikbaar.
- Routekaart: leest alle routemappen van /club en /api/club en eist voor elk een onderdeel.
- `routes-per-rol.test.ts`: per rol en voor combinaties de uitkomst per route.
- Geen escalatie en de laatste eigenaar.
- Bewaker: geen `t.rol ===` buiten `src/lib/club/rollen/`.
- Bestaande tests groen met de schakelaar aan en uit: tenant-filter, tabellen.test, pakketten-routes.test en de toegangstests.

## Volgorde

1. Puur model en tests (`src/lib/club/rollen/`).
2. Migratie 469 met controlequery voor en na, uitvoeren, terugdraaiscript.
3. Koppelen in `toegang.ts` achter de schakelaar; `t.rol`-vergelijkingen naar helpers.
4. API voor rollen en rechten (`/api/club/team`).
5. UI: Team, Rechten per rol (v2), startpagina-doorverwijzing, wizardstap.
6. Docs (CLAUDE.md, AVG.md) en alle tests.

## Vervolgstappen

- Fase 2: een account voor meerdere sportscholen (zie Inloggen).
- Vestigingen per profiel in Team bewerken met "alle vestigingen".
- Schakelaar overal aan zodra Kane het in de demo heeft gezien; daarna de oude `rechten.ts` en `medewerker-login/rechten.ts` opruimen.
