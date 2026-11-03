# Club | structuur van menu, instellingen en ledenapp

Besluit Kane (18-10-2026): uitgebreid, maar zo simpel mogelijk. Elk ding heeft een naam en een plek. Het menu is voor dagelijks werk, alles wat je instelt staat in het instellingencentrum.

Sinds 03-11-2026 (opdracht Kane: "ik moet iemand in 10 minuten de volledige app kunnen uitleggen") staat alles op **vijf vaste plekken**. Ontwerp, redenen en het uitlegscript: `EENVOUD-10-MINUTEN.md`. De oude groepen Werkvloer, Leden, Planning, Coaching en Beheer en de hulpbalk onderaan bestaan in Club niet meer (alleen nog in de websiteschermen, `GROEPEN` en `hulpbalk-items.ts`, tot die mee zijn).

## De vijf plekken

| Plek | In een zin | Schermen in het menu (hoogstens 3) |
|---|---|---|
| **Vandaag** | Wat er nu in de club moet gebeuren | Vandaag · Taken · Prikbord |
| **Leden** | Leden, leads en de ledenapp | Leden · Leads (met tabblad Opvolgen) · Ledenapp |
| **Rooster** | Alles met een tijd | Lessen · Agenda · Diensten |
| **Training** | Wat een lid gaat doen | Schema's (tabblad Bibliotheek) · Voeding |
| **Beheer** | Hoe het gaat en hoe het is ingesteld | Cijfers (met exports) · Instellingen |

Bron: `PLEKKEN` en `ONDERDELEN` in `src/components/club/shell/onderdelen.ts`; namen in `src/lib/aiyourgym/taal/woorden/club/menu.ts` (NL en EN: Today, Members, Schedule, Training, Management).

Hoe een onderdeel (rechtensleutel) erin staat:

| Manier | Onderdelen |
|---|---|
| Scherm in het menu | vandaag, taken, prikbord, leden, leads, app, rooster (Lessen), agenda, personeel (Diensten), schemas, voeding, cijfers, beheer (Instellingen) |
| Sectie op Vandaag (`sectie`, anker) | checkin (`#checkin`), opvolgen (`#opvolgen`, Bellen vandaag) |
| Onder een ander scherm (`onder`) | notities onder Prikbord; berichten, community en challenges onder Ledenapp; afspraken onder Agenda; rapporten onder Cijfers |
| In de kop (`kop`) | hulp |
| Alleen in het instellingencentrum (`inMenu: false`) | instellingen, start, huisstijl, bedrijf, lidmaatschappen, sluiting |

- Mag iemand een scherm niet zien maar een onderdeel eronder wel (een trainer met Afspraken maar zonder Agenda), dan staat dat onderdeel in het menu in zijn plaats (`schermenVan`). Zo verdwijnt geen functie.
- Wat niet is afgenomen of uit staat, staat er niet (`kern/pakketten.ts`). Leads vraagt Groei, Diensten en de mededelingen en werkwijzen vragen Team en vloer.
- Verbergen tot gebruikt: Taken en het Prikbord staan pas in het menu als er een takenlijst of een prikbord-item is (`inGebruik`, stand uit `src/lib/club/menu/in-gebruik.ts`), behalve als je er net bent. "Alles tonen" (`allesTonen`) zet alles in beeld.
- Een plek staat er alleen als iemand er minstens een scherm van mag zien (`plekkenMet`).

### De kop

Links het logo en de vijf plekken (gevulde pil = waar je bent), rij 2 de schermen van die plek (streep = actief). Rechts alleen:

- **Zoeken** (Ctrl K, / of het vergrootglas): leden (wie Leden mag, vanaf twee tekens, binnen de vestiging), elk scherm, elke instel-pagina en oude namen als trefwoord (Werkvloer, Rapporten, Afspraken, Community, Notities, Wat is nieuw, hulpbalk). Alleen wat je mag zien.
- **?**: Hulp, met Wat is nieuw (de updates van AI Your Gym, teller op het vraagteken, per persoon in de browser bewaard). Code: `KopHulp.tsx`, `kop-hulp.ts`, `nieuw-gezien.ts`. Mededelingen van de eigen club staan niet hier maar op het Prikbord.
- **Je naam**: vestiging (verborgen bij een vestiging), taal en uitloggen; voor het master account ook de voet van Kane (andere sportschool, platform, systeem, website, supportmeldingen). Code: `MenuPaneel.tsx`, `VestigingKeuze.tsx`.
- **Aan de slag** voor eigenaar en clubmanager van een nieuwe sportschool (weg te klikken). De testrol-balk staat bovenaan, alleen voor het master account.

### Telefoon en tablet staand (tot 1000px)

Bovenin logo, vergrootglas, ? en je naam; rij 2 de schermen van de plek. Onderin **dezelfde vijf plekken**, in dezelfde volgorde, zonder Meer (`onderbalkPlekken`). Met maar een plek is er geen onderbalk.

### Sneltoetsen (pc)

G en dan een letter. G V, G L, G R, G T, G B openen de plekken. De oude letters blijven en openen hun scherm: G C Check-in en G O Opvolgen (anker op Vandaag), G K Taken, G N Prikbord, G E Leads, G A Agenda, G P Diensten, G I Instellingen, G H Hulp. Alleen buiten invoervelden en alleen voor wat je mag. Code: `doelVoorToets`, `useSneltoetsen.ts`.

## Vandaag · Vandaag: het dagscherm

Van boven naar beneden, zonder tabbladen:

| Sectie | Anker | Wat erop staat | Volledig scherm |
|---|---|---|---|
| Prikbord-regel | | Alleen als er iets open is: "2 nieuwe mededelingen, 1 werkwijze te bevestigen" (`PrikbordRegel`) | Prikbord |
| Check-in | `/club#checkin` | Zoeken op naam of lidnummer, scan met camera; Nu binnen en laatste check-ins | Balie `/club/checkin`, zelf-check-in `/club/checkin/kiosk` |
| Lessen en team | | Lessen van vandaag, wie er werkt, overdracht | Lessen, Diensten, Prikbord |
| Taken | `/club#taken` | De Dag-tabel: afvinken als wie, notitie, afsluitronde | Taken (Dag, Week, Overzicht, Beheer) |
| Bellen vandaag | `/club#opvolgen` | Leden en leads die vandaag aan de beurt zijn, jarigen | Leads, tabblad Opvolgen |
| Leden | | Leden om op te letten, nieuw deze week | Leden |

- Elke sectie alleen voor wie het onderdeel mag en als het aan staat (`sectiesVoor`). Wie geen leiding is, ziet Nu in de club en Leden met risico onder Meer.
- Check-in, taken en opvolgen laden los (Suspense); Vandaag ververst elke 2 minuten en bij terugkomen in het venster.
- Op een volledig scherm van een sectie (balie, takenweek) licht Vandaag op.

## De schermen per plek

- **Taken**: Dag, Week, Overzicht en Beheer in de Excel-weergave; poetsrooster en afsluitronde. Bij een lijst die aan een werkwijze hangt de link "Hoe doe je dit".
- **Prikbord** (`/club/prikbord`): Mededelingen (aan vestigingen en rollen, optie "gelezen en bevestigd", de schrijver ziet "7 van 9 bevestigd"), Werkwijzen (stap voor stap met versie; lezen of uitvoeren; een belangrijke wijziging maakt zelf een verplichte mededeling) en Notities (de bestaande mappen, `/club/notities` blijft als volledig scherm). Iedereen ziet het en bevestigt; eigenaar en clubmanager plaatsen en beheren. Zonder Team en vloer is het alleen Notities.
- **Leden**: de lijst met hoofdactie Lid toevoegen; de ledenkaart is de hub (zie hieronder).
- **Leads**: tabbladen Leads en Opvolgen (de volledige opvolglijst; `/club/opvolgen` geeft een 308 hierheen).
- **Ledenapp** (`/club/app`): Bekijk als lid, poster met QR, uitnodigen; secties Berichten, Community en Challenges (die blijven ook als eigen scherm).
- **Lessen** (`/club/rooster`): het groepslesrooster met Mijn lessen en de knop Vaste week bewerken.
- **Agenda**: een agenda met filters (Alles, Met leden, Team, per trainer), Week of Dag. `/club/afspraken` opent de Agenda met filter Met leden; Met leden alleen met pakket Afspraken.
- **Diensten** (`/club/personeel`): Week, Beschikbaarheid, Mijn diensten en Uren. Een medewerker opent meteen Mijn diensten; Uren is voor wie uren beheert.
- **Schema's** (`/club/training`): bovenaan Intakes deze week, daaronder de schema's; tabblad Bibliotheek met Sjablonen, Oefeningen en Voedingssjablonen.
- **Voeding**: plannen per lid, ook vanaf de ledenkaart.
- **Cijfers**: per kalendermaand; met recht op Rapporten de hoofdactie Exporteren, een exportknop per hoofdstuk en onderaan Alle exports (`#exports`). `/club/rapporten` blijft als volledig scherm.
- **Instellingen** (`/club/beheer`): het instellingencentrum, zie hieronder.

## Ledenkaart: drie tabbladen

Kop: foto, naam, status, lidmaatschap, coach, een hoofdactie per tabblad en de rest onder Meer acties. Tabbladen in de URL (`?tab=`, `src/lib/club/leden/hub/tabs.ts`):

| Tabblad | Wat erop staat |
|---|---|
| **Overzicht** | Drie feiten, Komt eraan (`#planning`), Bezoek, Notities en berichten (`#notities`) |
| **Training** | Intake, schema's (ook door het lid gemaakt, met Overnemen), voeding, metingen, voortgang en challenges |
| **Lidmaatschap** | Lidmaatschap (vorm, start, pauze, opzeggen, stoppen), betalen, Gegevens (`#gegevens`), ledenapp, Privacy (`#privacy`, downloaden en verwijderen) |

- Oude `?tab=` blijven werken: `planning` en `contact` openen Overzicht op het anker, `privacy` opent Lidmaatschap op `#privacy`.
- Elk blok alleen met het recht op dat onderdeel (`kaartRechten`); een tabblad zonder blok valt weg. Een actie vanaf de kaart krijgt `?van=lid` en eindigt weer op de kaart.
- Kruimelpad (`ClubKruimel`) boven diepere schermen: Leden › lid › schema, intake of voedingsplan.

## Instellingen (het instellingencentrum, `/club/beheer`)

Bovenaan naam, webadres en zoeken (Ctrl K), alleen bij open punten "Nog te doen", daarna acht categorieen (op de pc links, inhoud rechts):

| Categorie | Voorbeelden |
|---|---|
| Merk en adres | Huisstijl, adres, onderdelen aan of uit |
| Vestigingen en openingstijden | Vestigingen, regels en openingstijden, sluitingsdagen, zalen |
| Team en rechten | Team (met Medewerkers als kleine link), rechten per rol |
| Groepslessen | Lestypen, weekrooster |
| Coaching | Intakeformulier, oefeningen en coaching |
| Leden en app | Lidmaatschappen en labels (kortingen), ledenbestand, check-in, ledenapp, boekingswidget |
| Communicatie | Meldingen aan leden, opvolgregels |
| Bedrijf en abonnement | Bedrijfsgegevens (privacy eronder), abonnement en pakketten |

- Losse links bovenaan: de Startwizard en Koppelingen (`/club/koppelingen`, alleen echte koppelingen met hun echte stand). Koppelingen is geen negende categorie en heeft geen eigen menu-item meer.
- Lijst en indeling: `src/lib/club/kern/instel-paginas.ts` (`groep`, `onder`, `ookNaar`, `losseLink`), UI in `src/components/club/instelcentrum/`. Elke instel-pagina heeft een kruimelpad terug naar haar categorie (`InstelKruimel`).
- Het centrum is open voor wie iets mag instellen (`heeftInstellingen`) en toont alleen die regels. Elke pagina onder `/club/beheer/*` controleert zelf haar recht (`eisOnderdeel`).

## Ledenapp (`/mijn`)

- Onderbalk: Home, Boeken (Lessen en Afspraken), Schema (met Voortgang), Voeding, Profiel (`src/lib/club/app/tabs.ts`). Een tabblad zonder zichtbare sectie valt weg; oude `?tab=lessen|afspraken|voortgang` blijven werken.
- Bel in de kop: meldingen, ook "Meldingen op je telefoon" aan of uit.
- Kopen en community: via Profiel.

## Per rol (standaard, de eigenaar past het aan)

| Rol | Plekken | Startpagina (`rollen/standaard.ts`) |
|---|---|---|
| Eigenaar | Alle vijf | Vandaag |
| Clubmanager | Alle vijf, zonder wat alleen de eigenaar mag | Vandaag |
| Trainer | Vandaag, Leden, Rooster, Training | Vandaag |
| Instructeur | Vandaag, Rooster | Rooster · Lessen |
| Roosteraar | Vandaag, Rooster | Rooster · Diensten |
| Administratie | Vandaag, Rooster, Beheer | Diensten, tabblad Uren |

Iedereen ziet het Prikbord (lezen en bevestigen). De eerste-keer-kaarten per rol (`rollen/welkom.ts`, teksten `woorden/club/welkom.ts`) volgen deze plekken en startpagina's.

## Oude adressen

| Oud | Nieuw |
|---|---|
| `/club/opvolgen` | 308 naar `/club/leads?tab=opvolgen` (zoekstring mee) |
| `/club/afspraken` | 308 naar `/club/agenda?filter=leden` voor wie de Agenda ziet; `?tab=typen` blijft |
| `/club/notities` | Blijft als volledig scherm; staat als blok op het Prikbord |
| `/club/rapporten` | Blijft als volledig scherm; dezelfde exports staan op Cijfers |
| `/club/nieuw` | Blijft; ook als sectie in Hulp |
| `/club/checkin`, `/club/checkin/kiosk`, `/club/taken/*` | Blijven bestaan als volledig scherm |
| `/club/instellingen?tab=...` | `/club/instellingen/<tab>`; zonder tab `/club/beheer` |
| Ledenkaart `?tab=planning|contact|privacy` | Overzicht of Lidmaatschap op het anker |

Elke rechtensleutel blijft bestaan; oude links, bladwijzers en de PWA blijven werken.

## Techniek

- Navigatie: `ClubBalk.tsx` (plekken en rij 2), `Onderbalk.tsx`, `MenuPaneel.tsx` (het naam-menu), `KopHulp.tsx`, `ClubZoeken.tsx` (leden via `GET /api/club/leden/zoek`), `useSneltoetsen.ts`, `useTellers.ts`, `ClubKruimel.tsx`. Iconen per scherm in `iconen.ts`.
- Tellers alleen met een echte bron (`src/lib/club/menu/tellers.ts`): open taken, te bellen leden en leads, nieuwe leads, open punten op het Prikbord. Bij 0 niets.
- Tests: `navigatie.test.ts` (vijf plekken, onderbalk zonder Meer, sneltoetsen), `iconen.test.ts`, `kop-hulp.test.ts`, `routes.test.ts`, `zoeken.test.ts`, `zoeken-telefoon.test.ts`; groen moeten blijven `kern/pakketten-routes.test.ts`, `rollen/routekaart.test.ts`, `routes-per-rol.test.ts` en `tenant-filter.test.ts`.
- API-rechten: elke map onder `src/app/(aiyourgym)/api/club/` staat in `API_ONDERDEEL` (`rechten.ts`) of in de bewuste uitzonderingen in `rechten.test.ts`; de test faalt bij een nieuwe map zonder plek.
- Namen: de regels van Opvolgen heten Opvolgregels (adres blijft `/club/beheer/automatiseringen`); titels van instel-pagina's zijn gelijk aan `instel-paginas.ts`.
