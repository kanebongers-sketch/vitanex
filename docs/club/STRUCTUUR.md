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
- **Beheer**: Cijfers, Rapporten (Financien komt hier later bij)

### Hulpbalk onderaan (idee Kane 23-10-2026, op onze eigen manier)

Vijf items die je niet elke dag nodig hebt maar wel snel wilt vinden. Ze staan alleen hier, niet in het menu (niets dubbel):

| Item | Waar het heen gaat | Wie het ziet |
|---|---|---|
| Instellingen | Het instellingencentrum `/club/beheer` (licht op bij elke instel-pagina) | Wie minstens een instel-pagina mag (`heeftInstellingen`) |
| Koppelingen | `/club/koppelingen`: betalen met Stripe, boekingswidget, ledenapp, mail en meldingen, ledenbestand inlezen, exports. Alleen wat echt bestaat, met de echte stand en een link naar de instel-pagina | Per koppeling de rechten van die instel-pagina (of Rapporten); zonder enige koppeling geen item |
| Ledenapp | `/club/app`: voorvertoning als lid, met knoppen naar de poster met QR-code, leden uitnodigen en Ledenapp instellen | Recht en onderdeel Ledenapp |
| Wat is nieuw | `/club/nieuw`: de updates per datum, dezelfde bron als de website (`src/lib/aiyourgym/nieuw.ts`). Teller met wat je nog niet zag (per persoon in de browser bewaard); openen zet alles op gelezen | Iedereen |
| Hulp | Het helpcentrum `/club/hulp` | Iedereen |

- Pc en tablet liggend: een balk over de volle breedte onder de inhoud (geen vaste balk over de inhoud heen; op een korte pagina staat hij onderaan het scherm). Actief item: streep in de accentkleur en een zacht merkvlak.
- Telefoon en tablet staand: dezelfde vijf onderaan in het menupaneel (Meer), onder "Instellingen en hulp".
- Op een pagina uit de hulpbalk licht geen groep op; rij 2 noemt het item en wat het is.

Rechts in de balk: **Zoeken** (Ctrl K, / of het vergrootglas). Vindt leden (wie Leden mag, vanaf twee tekens, binnen de gekozen vestiging), elk onderdeel uit het menu, de hulpbalk (plek Onderaan) en elke instel-pagina, alleen wat je mag zien.

### Navigatie per scherm (besluit Kane 20-10-2026: de trainer op de vloer eerst)

| Scherm | Bovenin | Onderin |
|---|---|---|
| Pc en tablet liggend (vanaf 1000px) | Rij 1: logo, de groepen (gevulde pil = actieve groep), zoeken, vestiging. Rij 2: de onderdelen van de groep (streep = actief onderdeel) | Niets |
| Telefoon en tablet staand (tot 1000px) | Logo, vergrootglas. Rij 2: naam van de groep en haar onderdelen; het actieve onderdeel scrolt in beeld | Onderbalk: vier onderdelen plus Meer |

- **Onderbalk**: de eerste vier uit de vaste volgorde Vandaag, Check-in, Leden, Training, Groepslessen, Taken, Personeel, Afspraken, Opvolgen, Leads, Agenda, Voeding, Notities die iemand mag. Trainer: Vandaag, Check-in, Leden, Training. Instructeur: Vandaag, Groepslessen, Personeel. Vaste plekken, niet op gebruik, zodat een knop nooit verspringt. **Meer** opent het menupaneel (alle groepen, twee kolommen, vestiging bovenaan) en wordt Sluiten zolang het open is; Meer licht op als je in een onderdeel buiten de balk zit.
- **Sneltoetsen (pc)**: G en dan een letter. V Vandaag, C Check-in, K Taken, O Opvolgen, N Notities, L Leden, E Leads, B Berichten, R Groepslessen, A Afspraken, P Personeel, T Training, I Instellingen, H Hulp (die twee staan in de hulpbalk). Alleen buiten invoervelden en alleen voor wat je in het menu hebt; de toetsen staan in het zoekvenster naast elk onderdeel.
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

### Instellingen (het instellingencentrum, `/club/beheer`)

| Groep | Regels |
|---|---|
| Sportschool | Startwizard, Huisstijl, Onderdelen aan of uit, Adres, Bedrijf en huisregels |
| Locaties | Vestigingen, Regels en openingstijden, Sluitingsdagen, Zalen |
| Team en rechten | Medewerkers, Rechten per rol, Beheerders |
| Planning | Lestypen, Weekrooster, Afspraaktypen |
| Coaching | Intakeformulier, Oefeningen en coaching |
| Leden en app | Lidmaatschappen en labels, Ledenbestand inlezen, Check-in, Ledenapp instellen, Boekingswidget |
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
| `/club/instellingen?tab=regels` (en zalen, lestypen, weekrooster, medewerkers, vestigingen) | `/club/instellingen/<tab>`, de vestiging gaat mee |
| `/club/instellingen` zonder tab | `/club/beheer` |

Alle andere adressen zijn gelijk gebleven.

## Techniek

- `src/lib/club/kern/instel-paginas.ts`: de lijst van instel-pagina's (groep, pad, rechtensleutel, onderdeel, alleen eigenaar, per vestiging). Stuurt het centrum, het kruimelpad (`InstelKruimel`) en het zoekveld (`src/components/club/shell/zoeken.ts`). Een test bewaakt dat elk pad bestaat en bij zijn rechtensleutel hoort.
- Navigatie: `ClubBalk.tsx` (balk en rij 2), `Onderbalk.tsx`, `MenuPaneel.tsx`, `VestigingKeuze.tsx`, `ClubZoeken.tsx` (met leden via `GET /api/club/leden/zoek`, recht Leden), `useSneltoetsen.ts`, `ClubKruimel.tsx`. Volgorde van de onderbalk en de letters staan in `onderdelen.ts` (`ONDERBALK_VOLGORDE`, `toets`); tests in `navigatie.test.ts`.
- `src/components/club/shell/onderdelen.ts`: alle rechtensleutels blijven bestaan (gelijk aan `ONDERDEEL_SLEUTELS`). Instel-onderdelen hebben `inMenu: false`: wel in rechten en zoeken, niet in de balk. Instellingen (`beheer`), Ledenapp (`app`) en Hulp hebben `hulpbalk: true`. Instellingen staat in de hulpbalk voor wie minstens een instel-pagina mag (`heeftInstellingen`); tabbladen van dagelijkse onderdelen (snelkoppelingen) tellen daarvoor niet. `menuOnderdeel` geeft null buiten het menu.
- Hulpbalk: `hulpbalk.ts` (items, rechten `hulpbalkVoor`, waar je bent `hulpItemOp`), `Hulpbalk.tsx` (balk en `HulpLinks` voor het menupaneel), `nieuw-gezien.ts` (wat je zag bij Wat is nieuw, localStorage met try/catch), `NieuwLijst.tsx`. Koppelingen: regels en standen in `src/lib/club/kern/koppelingen.ts`, de pagina leest de stand op de server. Tests: `hulpbalk.test.ts`, `koppelingen.test.ts`.
- Het centrum (`beheer/layout.tsx`) is open voor wie iets mag instellen en toont alleen die regels. Elke pagina onder `/club/beheer/*` controleert zelf haar recht (`eisOnderdeel`), zodat een clubmanager of medewerker niets extra ziet.
- Rechten per rol: gegroepeerd zoals het menu plus de groep Instellingen; zonder de onderdelen die alleen de eigenaar heeft en zonder Hulp (heeft iedereen).
- API-rechten: elke map onder `src/app/(aiyourgym)/api/club/` staat in `API_ONDERDEEL` (`rechten.ts`) of in de lijst bewuste uitzonderingen in `rechten.test.ts` (beheerders, inloggen, uitloggen, ledenapp, lid, platform, organisatie); de test faalt bij een nieuwe map zonder plek.
- Namen (20-10-2026): de regels van Opvolgen heten overal Opvolgregels (adres blijft `/club/beheer/automatiseringen`); titels en koppen van instel-pagina's zijn gelijk aan `instel-paginas.ts`.
