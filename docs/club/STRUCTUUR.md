# Club | structuur van menu, instellingen en ledenapp

Besluit Kane (18-10-2026): uitgebreid, maar zo simpel mogelijk. Elk ding heeft een naam en een plek. Het menu is voor dagelijks werk, alles wat je instelt staat in het instellingencentrum.

## Inventaris (voor de opruiming)

| Ding | Waar het stond | Probleem |
|---|---|---|
| Instellingen (tabbladen Regels, Zalen, Lestypen, Weekrooster, Medewerkers, Vestigingen) | Menu Beheer en `/instellingen` met tabs | Tweede navigatie naast het instellingencentrum, dat naar dezelfde tabs linkte |
| Instellingencentrum | Menu Beheer | Twee ingangen met bijna dezelfde naam: "Instellingen" en "Instellingencentrum" |
| Huisstijl | Menu Beheer, regel in het centrum en knop in de kop van het centrum | Drie keer |
| Bedrijf, Lidmaatschappen, Sluitingsdagen, Start | Menu Beheer en regels in het centrum | Dubbel |
| Ledenapp | Menu Leden ("Ledenapp", voorvertoning) en centrum ("Ledenapp", instellen) | Zelfde naam, ander ding |
| Berichten, Challenges | Menu Leden en regels in het centrum | Dagelijks werk stond ook tussen de instellingen |
| Hulp en support | Menu Beheer en regel in het centrum | Dubbel |
| Automatiseringen | Centrum, knop "Regels instellen" op Opvolgen | Andere naam dan Opvolgen, terwijl het de regels van Opvolgen zijn |
| Opvolgen (leden) en opvolgen bij Leads | Menu Werkvloer, tabblad bij Leads | Verschillende dingen, onduidelijke naam |
| Beheerders (eigenaren en clubmanagers) | Onderaan Huisstijl, niet in het centrum | Niet te vinden |
| Zoeken | Niet aanwezig (wel "zoekbalk" in commentaar) | Geen manier om een instel-pagina te vinden |
| Ledenapp `/mijn`: meldingen | Bel in de kop (lijst) en Profiel (meldingen op je telefoon) | Twee plekken voor meldingen |
| Ledenapp: kopen | Blok op Home (scherm Kopen) en "boek met strippenkaart" bij een vol lesrecht | Geen dubbel: het tweede is een actie op de plek zelf |
| Ledenapp: community | Alleen via Profiel | Een plek, blijft zo |
| Vandaag | Startkaart (wizard) en blokken per onderdeel | Geen dubbel: verwijzingen in context |
| Voet van Club | Alleen Kane: andere sportschool, platform, website, supportmeldingen, systeem | Geen dubbel |

## Nieuwe indeling

### Menu (dagelijks werk)

- **Werkvloer**: Vandaag, Check-in, Taken, Opvolgen (leden), Notities
- **Leden**: Leden, Leads, Berichten, Community, Challenges
- **Planning**: Groepslessen, Afspraken, Personeel, Agenda
- **Coaching**: Training, Voeding
- **Beheer**: Cijfers, Rapporten, Instellingen, Hulp

Rechts in de balk: **Zoeken** (Ctrl K, / of het vergrootglas). Vindt leden (wie Leden mag, vanaf twee tekens, binnen de gekozen vestiging), elk onderdeel uit het menu en elke instel-pagina, alleen wat je mag zien.

### Navigatie per scherm (besluit Kane 20-10-2026: de trainer op de vloer eerst)

| Scherm | Bovenin | Onderin |
|---|---|---|
| Pc en tablet liggend (vanaf 1000px) | Rij 1: logo, de groepen (gevulde pil = actieve groep), zoeken, vestiging. Rij 2: de onderdelen van de groep (streep = actief onderdeel) | Niets |
| Telefoon en tablet staand (tot 1000px) | Logo, vergrootglas. Rij 2: naam van de groep en haar onderdelen; het actieve onderdeel scrolt in beeld | Onderbalk: vier onderdelen plus Meer |

- **Onderbalk**: de eerste vier uit de vaste volgorde Vandaag, Check-in, Leden, Training, Groepslessen, Taken, Personeel, Afspraken, Opvolgen, Leads, Agenda, Voeding, Notities die iemand mag. Trainer: Vandaag, Check-in, Leden, Training. Instructeur: Vandaag, Groepslessen, Personeel. Vaste plekken, niet op gebruik, zodat een knop nooit verspringt. **Meer** opent het menupaneel (alle groepen, twee kolommen, vestiging bovenaan) en wordt Sluiten zolang het open is; Meer licht op als je in een onderdeel buiten de balk zit.
- **Sneltoetsen (pc)**: G en dan een letter. V Vandaag, C Check-in, K Taken, O Opvolgen, N Notities, L Leden, E Leads, B Berichten, R Groepslessen, A Afspraken, P Personeel, T Training, I Instellingen, H Hulp. Alleen buiten invoervelden en alleen voor wat je in het menu hebt; de toetsen staan in het zoekvenster naast elk onderdeel.
- **Kruimelpad** boven diepere schermen (`ClubKruimel`): ledenkaart (Leden › lid), schema (Leden › lid › schema), intake en voedingsplan van een lid. Telefoon: alleen de stap erboven met pijl (een tik terug). Wie Leden niet mag, gaat terug via Training of Voeding.
- **Personeel** opent voor een ingelogde medewerker meteen Mijn diensten met zijn eigen diensten.
- Tikvlakken minstens 44px (`--club-tik`), niets hangt af van hover, beweging uit bij reduced motion, contrast AA in elke huisstijl (de kleuren komen uit `huisstijl.ts`).

### Klikken voor de trainer (telefoon, voor en na 20-10-2026)

| Taak | Voor | Na |
|---|---|---|
| Check-in openen | 2 (Menu, Check-in) | 1 (onderbalk) |
| Lid opzoeken | 4 tikken plus typen (Menu, Leden, zoekveld, lid) | 2 tikken plus typen (vergrootglas, lid) |
| Schema van een lid openen | 6 | 4 (vergrootglas, lid, Training, schema) |
| Van schema terug naar het lid | Via Training en opnieuw zoeken | 1 (kruimelpad) |
| Mijn diensten | 5 (Menu, Personeel, tab, medewerker, Toon) | 2 (Meer, Personeel) |
| Les en deelnemers, taken, opvolgen | 3, 3, 2 | 3, 3, 2 (via Meer); op de pc G R, G K, G O |

### Instellingen (het instellingencentrum, `/clubkane/beheer`)

| Groep | Regels |
|---|---|
| Sportschool | Startwizard, Huisstijl, Onderdelen aan of uit, Adres, Bedrijf en huisregels |
| Locaties | Vestigingen, Regels en openingstijden, Sluitingsdagen, Zalen |
| Team en rechten | Medewerkers, Rechten per rol, Beheerders |
| Planning | Lestypen, Weekrooster, Afspraaktypen |
| Coaching | Intakeformulier, Oefeningen en coaching |
| Leden en app | Lidmaatschappen en labels, Ledenbestand inlezen, Check-in, Ledenapp, Ledenapp bekijken |
| Communicatie | Meldingen aan leden, Opvolgregels |
| Betalen en abonnement | Betalen in de ledenapp, Abonnement en facturen |

Elke regel toont de stand. Elke instel-pagina heeft bovenaan een kruimelpad met de knop terug: Instellingen › groep › pagina.

### Ledenapp (`/mijn`)

- Onderbalk: Home, Lessen, Afspraken, Schema, Voeding, Voortgang, Profiel (tabbladen aan of uit per sportschool)
- Bel in de kop: Meldingen, nu ook met "Meldingen op je telefoon" aan of uit (stond in Profiel)
- Kopen: via het blok op Home
- Community: via Profiel

## Oude adressen

| Oud | Nieuw |
|---|---|
| `/clubkane/instellingen?tab=regels` (en zalen, lestypen, weekrooster, medewerkers, vestigingen) | `/clubkane/instellingen/<tab>`, de vestiging gaat mee |
| `/clubkane/instellingen` zonder tab | `/clubkane/beheer` |

Alle andere adressen zijn gelijk gebleven.

## Techniek

- `src/lib/club/kern/instel-paginas.ts`: de lijst van instel-pagina's (groep, pad, rechtensleutel, onderdeel, alleen eigenaar, per vestiging). Stuurt het centrum, het kruimelpad (`InstelKruimel`) en het zoekveld (`src/components/club/shell/zoeken.ts`). Een test bewaakt dat elk pad bestaat en bij zijn rechtensleutel hoort.
- Navigatie: `ClubBalk.tsx` (balk en rij 2), `Onderbalk.tsx`, `MenuPaneel.tsx`, `VestigingKeuze.tsx`, `ClubZoeken.tsx` (met leden via `GET /api/club/leden/zoek`, recht Leden), `useSneltoetsen.ts`, `ClubKruimel.tsx`. Volgorde van de onderbalk en de letters staan in `onderdelen.ts` (`ONDERBALK_VOLGORDE`, `toets`); tests in `navigatie.test.ts`.
- `src/components/club/shell/onderdelen.ts`: alle rechtensleutels blijven bestaan (gelijk aan `ONDERDEEL_SLEUTELS`). Instel-onderdelen hebben `inMenu: false`: wel in rechten en zoeken, niet in de balk. Instellingen staat in het menu voor wie minstens een instel-pagina mag (`heeftInstellingen`); tabbladen van dagelijkse onderdelen (snelkoppelingen) tellen daarvoor niet.
- Het centrum (`beheer/layout.tsx`) is open voor wie iets mag instellen en toont alleen die regels. Elke pagina onder `/clubkane/beheer/*` controleert zelf haar recht (`eisOnderdeel`), zodat een clubmanager of medewerker niets extra ziet.
- Rechten per rol: gegroepeerd zoals het menu plus de groep Instellingen; zonder de onderdelen die alleen de eigenaar heeft en zonder Hulp (heeft iedereen).
- API-rechten: elke map onder `src/app/api/club/` staat in `API_ONDERDEEL` (`rechten.ts`) of in de lijst bewuste uitzonderingen in `rechten.test.ts` (beheerders, inloggen, uitloggen, ledenapp, lid, platform, organisatie); de test faalt bij een nieuwe map zonder plek.
- Namen (20-10-2026): de regels van Opvolgen heten overal Opvolgregels (adres blijft `/clubkane/beheer/automatiseringen`); titels en koppen van instel-pagina's zijn gelijk aan `instel-paginas.ts`.
