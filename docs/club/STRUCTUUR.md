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

Rechts in de balk: **Zoeken** (Ctrl K of /). Vindt elk onderdeel uit het menu en elke instel-pagina, alleen wat je mag zien.

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
- `src/components/club/shell/onderdelen.ts`: alle rechtensleutels blijven bestaan (gelijk aan `ONDERDEEL_SLEUTELS`). Instel-onderdelen hebben `inMenu: false`: wel in rechten en zoeken, niet in de balk. Instellingen staat in het menu voor wie minstens een instel-pagina mag (`heeftInstellingen`); tabbladen van dagelijkse onderdelen (snelkoppelingen) tellen daarvoor niet.
- Het centrum (`beheer/layout.tsx`) is open voor wie iets mag instellen en toont alleen die regels. Elke pagina onder `/clubkane/beheer/*` controleert zelf haar recht (`eisOnderdeel`), zodat een clubmanager of medewerker niets extra ziet.
- Rechten per rol: gegroepeerd zoals het menu plus de groep Instellingen; zonder de onderdelen die alleen de eigenaar heeft en zonder Hulp (heeft iedereen).
