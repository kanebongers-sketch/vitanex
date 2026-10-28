# QA Club en ledenapp: functionele kwaliteit (28-10-2026)

Gebied: Club, ledenapp, startwizard en beheerdersportaal. Code: `src/app/(aiyourgym)/(club)/**`, `src/app/(aiyourgym)/api/club/**`, `src/components/club/**`, `src/lib/club/**`.

Statussen: **code** = code ziet er goed uit (gelezen), **tsc** = bouwt, **vitest** = automatisch getest, **e2e** = end-to-end geverifieerd. End-to-end in de browser is **geblokkeerd**: Club en de ledenapp zitten achter inloggen en inloggen mag niet (REGELS.md).

## Volledige testsuite

| Moment | Testbestanden | Tests | Geslaagd | Mislukt | Traagste test |
| --- | --- | --- | --- | --- | --- |
| Voor | 507 | 8691 | 8689 | 2 | tenant-filter 3734 ms plus 2750 ms (samen 6,5 s, twee keer dezelfde scan) |
| Na | 509 | 8607 | 8607 | 0 | periodes.test.ts 1765 ms; tenant-filter nu 929 ms voor beide tests samen |

- De 2 mislukte tests voor stonden in `src/components/aiyourgym/contrast.test.ts` (website, niet mijn gebied). Die test is tussendoor door de website-agent aangepast (493 naar 395 tests); daardoor is het totaal na lager. Nieuw erbij: `routes.test.ts` (7, van mij) en `src/lib/club/kern/verzoek.test.ts` (5, andere agent).
- Uitgevoerd met `npx vitest run --maxWorkers=6` over de hele repo.
- Incrementele tsc (`timeout 280 npx tsc --noEmit -p tsconfig.json --incremental`): een fout, in `src/components/aiyourgym/site/AygNav.tsx` (`houdFocusInPaneel` ontbreekt). Dat is website-code waar een andere agent mee bezig is; mijn bestanden geven geen fouten.

### Tenant-filter-test: waarom traag en de oplossing

`src/lib/club/tenant-filter.test.ts` parste elk .ts/.tsx-bestand in drie mappen (ruim 1700 bestanden) met de volledige TypeScript-parser, en deed dat twee keer (twee tests riepen elk `alleHits()` aan). Op een drukke machine liep een test daardoor tegen de standaard-timeout van 5 s.

Oplossing (de test zelf blijft even streng):
1. Voorfilter: alleen bestanden met `.from(` of `.rpc(` gaan door de parser. Alleen zo'n aanroep kan een hit geven (de scanner kijkt naar `x.from(...)` en `x.rpc(...)`), dus er valt niets weg. Ongeveer 210 van de 1780 bestanden blijven over.
2. Het resultaat wordt een keer per run bewaard; beide tests delen het.

Resultaat: 6,5 s naar minder dan 1 s. De zelftest (slechte en goede query) en de test op verouderde uitzonderingen slagen nog.

## Testmatrix

| Onderdeel | Scenario | Verwacht | Werkelijk | Status | Probleem | Oplossing | Hertest |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Testsuite | Hele repo draaien | Alles groen | 2 rood (website, contrast) | vitest | Buiten gebied | Gemeld, niet aangeraakt | Na: 0 rood |
| Tenant-filter | Snelheid | Ruim binnen timeout | 6,5 s, soms timeout | vitest | Dubbele volledige scan | Voorfilter plus cache | 0,9 s groen |
| Menu | Elk onderdeel en elk scherm (ONDERDELEN, schermen) heeft een pagina | Ja | Ja | vitest | | Nieuwe test `routes.test.ts` | Groen |
| Hulpbalk | Instellingen, Koppelingen, Ledenapp, Wat is nieuw, Hulp | Pagina bestaat | Ja | vitest | | Idem | Groen |
| Instellingencentrum | Alle 28 instel-pagina's (INSTEL_PAGINAS) | Pagina bestaat | Ja | vitest | | Idem | Groen |
| Links in code | Elke letterlijke `/club/...` en `/mijn/...` in Club-code (met `${}` als segment) | Wijst naar bestaande route | Ja, ruim 160 links | vitest | | Idem | Groen |
| Rechten op pagina | Elke `eisOnderdeel('x')` noemt een bestaand onderdeel | Ja | Ja (24 sleutels) | vitest | Een tikfout zou de pagina voor elke rol met rechten dichtzetten | Nieuwe test | Groen |
| Rechten op pagina | Layout van een menumap eist het onderdeel van die map | Ja | Ja | vitest | | Nieuwe test | Groen |
| Rechten per pagina | Elke pagina heeft een bewaker (eisOnderdeel, eisModule, eisBeheerdersBeheer, eisPlatformEigenaar of eisClubToegang via de Club-layout) | Ja | Ja, alle 71 pagina's | code | | | |
| Rechten per rol | Clubmanager, eigenaar, Kane, trainer, instructeur | Volgens rechten.ts | Bestaande tests groen (rechten.test.ts, navigatie.test.ts, hub/rechten.test.ts) | vitest | | | |
| Database: kolommen | Elke kolom in select, filters, order, insert, update, upsert en onConflict van club_/ayg_-tabellen bestaat in de echte database | Ja | 3054 controles, 0 afwijkingen | code (script tegen live schema, alleen lezen) | | | |
| Database: verplichte velden | Elke letterlijke insert vult alle NOT NULL-kolommen zonder standaardwaarde | Ja | 37 inserts gecontroleerd, 0 missend | code (script) | Inserts met spread of bouwfunctie niet gedekt | | |
| Database: functies | Alle 20 rpc-functies die de code aanroept bestaan | Ja | Ja | code (SQL, alleen lezen) | | | |
| Database: migraties | Lokale migraties 380 t/m 465 staan in Supabase | Ja | Ja, ook 463, 464, 465 | code (list_migrations) | CLAUDE.md zei "463/464 nog niet uitgevoerd" | Feit bijgewerkt in `.claude/CLAUDE.md` | |
| AVG | Elke tabel met lid_id in de database staat in `LID_TABELLEN` | Ja | Ja (41 tabellen) | code plus bestaande vitest | | | |
| Mutaties | Uitkomst van een mutatie genegeerd | Alleen bij bewust opruimen | 25 plekken, allemaal terugdraaien na een fout of sessie-opruiming | code | | | |
| Foutafhandeling | Lege catch of stil ingeslikte fout | Geen | Geen lege catch; `.catch(() => null)` alleen bij JSON lezen of bewust vuur-en-vergeet (gelezen-markering) | code | | | |
| Foutafhandeling | fetch zonder controle op res.ok | Geen | Een: `LedenappMeldingen.tsx` (gelezen markeren, bewust) | code | | | |
| Dubbel versturen | Schema kopie naar ander lid: snel twee keer op een lid klikken | Een kopie | Tweede klik maakte een tweede kopie (LidKiezer blijft klikbaar tijdens het opslaan) | code | P2 | Ref-slot in `KopieNaarLid.tsx` | tsc groen, e2e geblokkeerd |
| Dubbel versturen | Taken afvinken, berichten, check-in, wizardvoet, notities | Een actie | Beschermd (bezig-set, disabled, StartVoet bezig, confirm) | code | | | |
| Laad- en fouttoestand | loading.tsx per onderdeel, error.tsx | Aanwezig | 31 loading.tsx, error.tsx op Club-niveau en Training, not-found | code | | | |
| Mock en TODO | TODO, FIXME, lorem, mock, console.log in productiecode | Geen | Geen | code | | | |
| Taal | Club en ledenapp via de taalmodule | Elke tekst NL en EN | 39 van 450 Club-componenten gebruiken de taalmodule; TALEN.md zegt zelf "Nog niet: Club, ledenapp, mails" | code | P2, groot | Niet in deze ronde (zie open punten) | |
| Browser | Club en ledenapp end-to-end | | | geblokkeerd | Achter inloggen | | |

Tellingen: **18 geslaagd** (automatisch of in de code bewezen), **2 problemen gevonden en opgelost** (P2 dubbel versturen, traagheid tenant-filter), **1 open** (taal), **1 geblokkeerd** (end-to-end in de browser). Daarnaast 1 feitcorrectie (migratiestatus).

## Opgelost

| Prioriteit | Probleem | Bestand | Bewijs |
| --- | --- | --- | --- |
| P2 | Tenant-filter-test liep tegen de timeout (dubbele volledige scan) | `src/lib/club/tenant-filter.test.ts` | vitest groen, 6,5 s naar 0,9 s |
| P2 | Kopie van een schema naar een ander lid kon dubbel worden gemaakt | `src/components/club/training/editor/KopieNaarLid.tsx` | tsc zonder fouten in dit bestand; e2e geblokkeerd |
| P3 | Geen bewaker voor dode links en verkeerde rechtensleutels | `src/components/club/shell/routes.test.ts` (nieuw, 7 tests) | vitest groen |
| Feit | Migraties 463 en 464 stonden als "nog niet uitgevoerd" | `.claude/CLAUDE.md` | list_migrations |

Geen P0 en geen P1 gevonden in dit gebied.

## Open

- **Taal (P2, groot):** Club en de ledenapp zijn nog grotendeels vaste Nederlandse tekst (ongeveer 410 van 450 componenten, plus labels in `src/lib/club/**/model.ts` zoals `LEAD_STATUS_LABEL`). Dat is een omzetting per onderdeel, geen kleine fix. Voorstel: per onderdeel omzetten volgens `docs/aiyourgym/TALEN.md` en daarna `src/components/club` en `src/app/(aiyourgym)/(club)` toevoegen aan de mappen van `geen-hardcoded-nl.test.ts`.
- **End-to-end:** geblokkeerd tot er een testaccount op een lokale of staging-omgeving is waar inloggen mag.
- **Kolomcontrole als vaste test:** het script vergelijkt met het live schema en draait daarom niet in vitest. Een vaste test zou kunnen lezen uit de migratiebestanden.
- **Website:** `contrast.test.ts` (voor) en tsc-fout in `AygNav.tsx` horen bij de website-agent.

## Gewijzigde bestanden

- `src/lib/club/tenant-filter.test.ts`
- `src/components/club/shell/routes.test.ts` (nieuw)
- `src/components/club/training/editor/KopieNaarLid.tsx`
- `.claude/CLAUDE.md` (migratiestatus 463 en 464)
- `docs/qa/club-functioneel.md` (dit werklog)
