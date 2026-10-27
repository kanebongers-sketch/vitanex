# Club | voorstel om de navigatie te vereenvoudigen

Opdracht Kane (27-10-2026): "Heel veel dingen zijn dubbel. Heel veel verschillende tabbladen, dingen zoeken. Het moet allemaal simpel en makkelijk te vinden zijn, maar wel al die functies hebben."

Uitgangspunten:

- **Minder tabbladen**: samenvoegen wat bij elkaar hoort, geen dubbele plekken. Elk ding heeft een naam en een plek.
- **Alles vanuit het lid**: wat over een lid gaat (intake, schema's, voeding, lidmaatschap, betalen, bezoek, lessen, afspraken, metingen, notities, berichten, AVG) staat op de ledenkaart en start daar. De ledenkaart wordt nu als hub gebouwd (ander werk, hier niet aangeraakt).
- **Geen functie gaat weg.** Elke rechtensleutel blijft bestaan, zodat rechten per rol en de API blijven werken. Een oud adres blijft werken (pagina blijft of 308 naar de nieuwe plek).
- **Geen inhoud achter klikken**: liever een duidelijke volgorde op een pagina met ankers dan tabbladen. Tabbladen alleen waar het echt andere werkstanden zijn.

Status: deel 1 (Werkvloer) is gebouwd. Alles hieronder vanaf "Leden" is een **voorstel**, nog niet gebouwd. Kane kiest per regel.

## Samenvatting in cijfers

| | Nu (voor 27-10) | Na het voorstel |
|---|---|---|
| Onderdelen in het menu | 18 | 11 (nu al 15 na deel 1) |
| Items in de hulpbalk | 5 | 3 |
| Regels in het instellingencentrum | 28 | 21 |

## 1. Werkvloer (gebouwd 27-10-2026)

| Voor | Na | Waar het nu staat |
|---|---|---|
| Vandaag | Vandaag | Het ene dagscherm |
| Check-in | Sectie op Vandaag | `/club#checkin`; vaste balie `/club/checkin` en zelf-check-in `/club/checkin/kiosk` via de kop van de sectie |
| Taken (Dag, Week, Overzicht, Beheer) | Sectie op Vandaag | `/club#taken` (de Dag-tabel); Week, Overzicht en Beheer via de kop van de sectie |
| Opvolgen | Sectie op Vandaag, samen met Leads opvolgen en Jarig | `/club#opvolgen`; volledige lijst met recent afgehandeld `/club/opvolgen` |
| Notities | Notities | Blijft (Kane: handig) |

Werkvloer heeft nu twee onderdelen. Het submenu blijft (twee knoppen), zodat Notities met een tik te vinden is; met alleen Vandaag zou de groep verdwijnen.

## 2. Leden (voorstel)

| Voor | Na | Waar het komt |
|---|---|---|
| Leden | **Leden** | Ledenlijst plus de ledenkaart als hub (alles van een lid). Ledenbestand inlezen en de app-poster blijven acties bovenaan de ledenlijst |
| Leads | **Leads** | Blijft: mensen die nog geen lid zijn. Wat vandaag gebeld moet worden staat ook op Vandaag (geen dubbel: daar alleen de werklijst van vandaag) |
| Berichten | **Ledenapp**, sectie Berichten | Nieuws en acties op Home van de app |
| Community | **Ledenapp**, sectie Community | Te beoordelen berichten en groepen |
| Challenges | **Ledenapp**, sectie Challenges | Lopend, gepland, afgelopen |
| Ledenapp bekijken (hulpbalk) | **Ledenapp**, knop Bekijken als lid | Voorvertoning, poster met QR, leden uitnodigen |

Waarom: Berichten, Community, Challenges en de voorvertoning gaan allemaal over wat het lid in de app ziet. Nu staan ze op vier plekken (drie in het menu, een in de hulpbalk). Een onderdeel "Ledenapp" met vier secties onder elkaar (ankers `#berichten`, `#community`, `#challenges`) is een plek. Rechtensleutels `berichten`, `community`, `challenges` en `app` blijven; een sectie verschijnt alleen voor wie hem mag. Oude adressen `/club/berichten`, `/club/community`, `/club/challenges` blijven als volledig scherm.

Leden gaat van 5 naar 3 onderdelen.

## 3. Planning (voorstel)

| Voor | Na | Waar het komt |
|---|---|---|
| Groepslessen | **Groepslessen** | Blijft (lesrooster, reserveringen, wachtlijst) |
| Afspraken (Week, Dag, per trainer, afspraaktypen) | **Agenda**, filter Afspraken met leden | Intakes, personal training en metingen per trainer |
| Agenda (overleg, intakes, onderhoud) | **Agenda**, filter Team en overleg | Overleg, onderhoud en andere afspraken |
| Personeel (Week, Beschikbaarheid, Mijn diensten, Uren) | **Personeel** | Blijft, met dezelfde vier standen |

Waarom: Afspraken en Agenda tonen allebei afspraken per week en allebei intakes. Dat is dubbel en je moet raden waar iets staat. Een Agenda met een filter (Alles, Afspraken met leden, Team en overleg, per trainer) en Week of Dag is een plek. Een afspraak met een lid start ook vanaf de ledenkaart (alles vanuit het lid). Rechtensleutels `afspraken` en `agenda` blijven: wie alleen `afspraken` mag ziet alleen dat filter. `/club/afspraken` blijft werken (opent de Agenda met het filter Afspraken met leden).

Planning gaat van 4 naar 3 onderdelen.

## 4. Coaching (voorstel)

| Voor | Na | Waar het komt |
|---|---|---|
| Training, tab Intakes | **Training**, bovenaan "Intakes deze week" | Een intake starten en terugzien gebeurt op de ledenkaart; Training toont alleen nog de lijst van open en recente intakes als werklijst |
| Training, tab Schema's | **Training** (standaard) | Schema's maken kan hier en vanaf de ledenkaart (lid alvast gekozen, daarna terug naar het profiel) |
| Training, tab Sjablonen | **Training**, tab Sjablonen | Blijft |
| Training, tab Oefeningen | **Training**, tab Oefeningen | Blijft (ook de regel Oefeningen en coaching in het instellingencentrum, als snelkoppeling) |
| Voeding, tab Plannen | **Voeding** | Plan van een lid ook vanaf de ledenkaart |
| Voeding, tab Sjablonen | **Voeding**, tab Sjablonen | Blijft |

Waarom: de intake hoort bij het lid. Een apart tabblad Intakes naast Schema's laat de trainer zoeken. Training gaat van 4 naar 3 tabbladen. Training en Voeding blijven twee onderdelen: het zijn aparte vakken en Voeding kan bij een sportschool uit staan.

## 5. Beheer (voorstel)

| Voor | Na | Waar het komt |
|---|---|---|
| Cijfers | **Cijfers** | Groei, bezoek, bezetting en behoud per kalendermaand |
| Rapporten | **Cijfers**, knop Exporteren bij elk blok plus sectie Alle exports onderaan | Dezelfde CSV-exports per maand en vestiging |
| (later) Financien | **Financien** | Komt hier bij als het gebouwd is (besluit Kane 23-10-2026) |

Waarom: Rapporten zijn de cijfers als Excel. Bij het cijfer zelf exporteren is makkelijker dan een tweede onderdeel. Rechtensleutel `rapporten` blijft: zonder dat recht geen exportknoppen. `/club/rapporten` blijft als volledig scherm (anker `#exports`). Beheer gaat van 2 naar 1 onderdeel (2 met Financien).

## 6. Hulpbalk (voorstel)

| Voor | Na | Waar het komt |
|---|---|---|
| Instellingen | **Instellingen** | Blijft |
| Koppelingen | **Koppelingen** | Blijft |
| Ledenapp | Weg uit de hulpbalk | Onderdeel Ledenapp in de groep Leden (zie 2) |
| Wat is nieuw (met teller) | **Hulp**, sectie Nieuw bovenaan, de teller op Hulp | Zelfde bron (`src/lib/aiyourgym/nieuw.ts`) |
| Hulp | **Hulp** | Handleidingen en een vraag melden |

Van 5 naar 3 items.

## 7. Instellingencentrum (voorstel)

| Voor | Na | Waar het komt |
|---|---|---|
| Huisstijl, Onderdelen aan of uit, Adres, Beheerders (vier regels op een pagina met ankers) | **Huisstijl** (logo, kleuren, naam) en **Onderdelen aan of uit** (eigen pagina) | Adres naar Bedrijf en adres; Beheerders naar Team |
| Bedrijf en huisregels | **Bedrijf, adres en huisregels** | KvK, btw, webadres, huisregels, voorwaarden |
| Vestigingen, Regels en openingstijden, Sluitingsdagen, Zalen | **Vestigingen**, per vestiging een pagina met de secties Gegevens, Openingstijden en regels, Sluitingsdagen, Zalen | Een plek per vestiging in plaats van vier |
| Medewerkers, Beheerders | **Team**: iedereen met een inlog, per rol (eigenaar, clubmanager, trainer, instructeur, administratie) | Uitnodigen en wachtwoord op een plek |
| Rechten per rol | **Team**, sectie Rechten per rol | Blijft alleen voor de eigenaar |
| Lestypen, Weekrooster | **Lesrooster**: sectie Lestypen en sectie Weekrooster | Twee regels die altijd samen worden ingevuld |
| Afspraaktypen | **Afspraaktypen** | Blijft (snelkoppeling naar de Agenda) |
| Intakeformulier, Oefeningen en coaching | Blijven | |
| Lidmaatschappen en labels, Kortingen en acties | Blijven | Kortingen staat al onder Betalen |
| Ledenbestand inlezen, Check-in, Ledenapp instellen, Boekingswidget | Blijven | |
| Meldingen aan leden, Opvolgregels | Blijven (groep Communicatie) | |
| Startwizard, Privacy en bewaren, Betalen in de ledenapp, Abonnement en facturen | Blijven | |

Van 28 naar 21 regels. Elke oude regel blijft vindbaar via zoeken (Ctrl K) met zijn oude naam als trefwoord, en elk oud adres blijft werken.

## 8. Wat er niet verandert

- Vijf groepen bovenin, zoeken met Ctrl K, de onderbalk op de telefoon (vier plus Meer), sneltoetsen G en een letter.
- Geen functie of recht verdwijnt. Waar iets samengaat, blijft de rechtensleutel en blijft het oude adres werken.
- Leads blijft los van het lid (het is nog geen lid) en los van het PT-systeem.

## Volgorde als Kane akkoord geeft

1. Leden: onderdeel Ledenapp (Berichten, Community, Challenges, Bekijken), hulpbalk zonder Ledenapp.
2. Planning: Afspraken en Agenda samen.
3. Beheer: Rapporten bij Cijfers.
4. Hulpbalk: Wat is nieuw in Hulp.
5. Coaching: Intakes via de ledenkaart (na de ledenkaart-hub).
6. Instellingencentrum: Vestigingen, Team en Lesrooster samenvoegen.
