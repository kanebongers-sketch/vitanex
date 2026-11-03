# Club in 10 minuten uit te leggen | ontwerp

Opdracht Kane (03-11-2026): "Alles ziet er top uit, maar het is nog te ingewikkeld, er staat te veel. Het moet nog dieper. Ik moet iemand in 10 minuten de volledige app kunnen uitleggen."

Extra opdracht Kane (03-11-2026): communicatie van eigenaren naar het team, werkprocessen en updates moeten in AI Your Gym. Nu is er alleen communicatie naar leden.

Status: **ontwerp, niets gebouwd.** Bouwt verder op `STRUCTUUR.md`, `VEREENVOUDIGING.md` (voorstel 27-10) en het UX-onderzoek van 31-10 (`docs/aiyourgym/strategie/2026-10-31/onderzoek/4-ux.md`). Waar dit document iets anders zegt dan `VEREENVOUDIGING.md`, geldt dit document.

Harde regels die blijven:
- Geen functie verdwijnt. Elke rechtensleutel blijft bestaan (rechten per rol, API, pakketten). Elk oud adres blijft werken: de pagina blijft, of een 308 naar de nieuwe plek met de zoekstring erbij.
- Wat niet is afgenomen of uit staat, staat er niet (zoals nu, `kern/pakketten.ts`).
- Alles in Nederlands en Engels, nooit een concurrent bij naam.

---

## 1. Het mentale model: vijf vaste plekken

| Plek | In een zin | Daaronder (hoogstens 3) |
|---|---|---|
| **Vandaag** | Wat er nu in de club moet gebeuren: inchecken, lessen, wie werkt, taken en wie je belt. | Vandaag · Taken · Prikbord |
| **Leden** | Iedereen die lid is of het wil worden, en wat zij in de app zien. | Leden · Leads · Ledenapp |
| **Rooster** | Alles met een tijd: groepslessen, afspraken en diensten. | Lessen · Agenda · Diensten |
| **Training** | Wat een lid gaat doen: schema's, voeding en de bibliotheek. | Schema's · Voeding · Bibliotheek |
| **Beheer** | Hoe het gaat en hoe het is ingesteld. | Cijfers · Instellingen |

Daarnaast staan in de kop alleen nog: **zoeken** (Ctrl K), **?** (Hulp, met Wat is nieuw) en je **naam** (vestiging, taal, uitloggen). De hulpbalk onderaan verdwijnt: een navigatie in plaats van twee.

### Waarom dit in 10 minuten uit te leggen is

1. **Vijf woorden, elk een vraag die een eigenaar al stelt.** Wat moet er nu? (Vandaag) Wie zijn mijn mensen? (Leden) Wanneer? (Rooster) Wat gaan ze doen? (Training) Hoe staat het ervoor? (Beheer). Je hoeft geen productnamen te leren.
2. **Overal dezelfde vijf.** Op de pc bovenin, op de telefoon onderin, in dezelfde volgorde. Geen Meer-knop meer: vijf past precies in een onderbalk. Wat je op de pc leert, klopt op de telefoon.
3. **Hoogstens drie dingen per plek.** Dat zijn 14 schermen in totaal voor een sportschool die alles heeft. Een nieuwe sportschool ziet er 8 (zie hieronder), want wat nog niet gebruikt wordt, staat er nog niet.
4. **Een plek per ding.** Instellen gebeurt alleen in Beheer · Instellingen. Alles van een lid staat op de ledenkaart. Alles voor het team staat op het Prikbord. Niets staat dubbel, dus niemand hoeft te raden.
5. **Elk scherm heeft een hoofdactie bovenaan** (regels in hoofdstuk 6). Wie de plek kent, ziet meteen wat hij er kan doen.

Een nieuwe kleine sportschool (basis plus Groepslessen en Training, nog geen leads, geen team) ziet op dag een: Vandaag, Leden, Lessen, Schema's, Voeding, Cijfers, Instellingen, plus Taken of Prikbord zodra het eerste item er is. Dat is de eenvoudige stand: **geen knop, maar de standaard.** Wie toch alles wil zien, zet in Instellingen · Onderdelen "Alles tonen, ook wat nog leeg is" aan.

---

## 2. Elk onderdeel: waar het nu staat en waar het heen gaat

Legenda nieuwe plek: **Plek · Scherm**. "Sectie" = een blok op dat scherm met een anker. "Verbergen tot gebruikt" = verschijnt vanzelf zodra er iets in staat of iemand het aanmaakt via de knop elders.

### 2.1 Menu (nu 5 groepen, 15 onderdelen plus 3 secties)

| Nu | Huidige plek | Nieuwe plek | Waarom |
|---|---|---|---|
| Vandaag | Werkvloer | **Vandaag · Vandaag** | Blijft het dagscherm. |
| Check-in (sectie) | Werkvloer, sectie op Vandaag | **Vandaag · Vandaag**, sectie `#checkin` bovenaan; balie en kiosk via de kop van de sectie | Ongewijzigd, is al samengevoegd. |
| Taken | Werkvloer | **Vandaag · Taken** (Dag, Week, Overzicht, Beheer) | Besluit Kane 28-10: poetsrooster moet een eigen plek hebben. Verbergen tot gebruikt: pas zichtbaar zodra er een takenlijst is. Tot dan een knop "Takenlijst maken" in de sectie Taken op Vandaag. |
| Opvolgen (sectie) | Werkvloer, sectie op Vandaag | Werklijst van vandaag blijft sectie **"Bellen vandaag"** op Vandaag; de volledige lijst gaat naar **Leden · Leads**, tabblad Opvolgen | Kane: Opvolgen in Leads. Opvolgen is altijd "iemand bellen": leads en leden die aandacht vragen. Een plek voor de lijst. |
| Notities | Werkvloer | **Vandaag · Prikbord**, blok Notities (`/club/notities` blijft als volledig scherm) | Notities zijn communicatie in het team; samen met mededelingen en werkwijzen (hoofdstuk 2.5). |
| Leden | Leden | **Leden · Leden** | Ledenlijst plus ledenkaart als hub. |
| Leads | Leden | **Leden · Leads** (tabbladen Leads en Opvolgen) | Opvolgen erin (zie boven). Verbergen tot gebruikt: zichtbaar als pakket Groei is afgenomen. |
| Berichten | Leden | **Leden · Ledenapp**, sectie Berichten | Gaat over wat het lid in de app ziet. |
| Community | Leden | **Leden · Ledenapp**, sectie Community | Idem. Verbergen tot gebruikt: sectie pas zichtbaar na het eerste bericht of de eerste groep. |
| Challenges | Leden | **Leden · Ledenapp**, sectie Challenges | Idem. Verbergen tot gebruikt: knop "Challenge starten" tot de eerste er is. |
| Groepslessen | Planning | **Rooster · Lessen**, met de knop "Vaste week bewerken" (zelfde editor als Weekrooster) | Een plek voor het rooster: losse lessen en de vaste week. |
| Afspraken | Planning | **Rooster · Agenda**, filter "Met leden" | Afspraken en Agenda tonen allebei afspraken per week en allebei intakes. Een agenda met filters. |
| Agenda | Planning | **Rooster · Agenda**, filter "Team" | Zie boven. Filters: Alles, Met leden, Team, per trainer; weergave Week of Dag. |
| Personeel | Planning | **Rooster · Diensten** (Week, Beschikbaarheid, Mijn diensten, Uren) | Diensten zijn ook tijd. Verbergen tot gebruikt: zichtbaar als pakket Team en vloer is afgenomen. Medewerker opent meteen Mijn diensten. |
| Training, tab Schema's | Coaching | **Training · Schema's** | Hoofdscherm. |
| Training, tab Intakes | Coaching | **Training · Schema's**, sectie "Intakes deze week" bovenaan; starten en terugzien op de ledenkaart | De intake hoort bij het lid. |
| Training, tab Sjablonen | Coaching | **Training · Bibliotheek**, sectie Sjablonen | Wat je hergebruikt, op een plek. |
| Training, tab Oefeningen | Coaching | **Training · Bibliotheek**, sectie Oefeningen | Idem. |
| Voeding, tab Plannen | Coaching | **Training · Voeding** | Plan van een lid ook vanaf de ledenkaart. |
| Voeding, tab Sjablonen | Coaching | **Training · Bibliotheek**, sectie Voedingssjablonen | Een bibliotheek voor schema en voeding. |
| Cijfers | Beheer | **Beheer · Cijfers** | Startscherm van Beheer. |
| Rapporten | Beheer | **Beheer · Cijfers**: knop Exporteren bij elk blok en sectie "Alle exports" (`#exports`) onderaan | Rapporten zijn de cijfers als Excel. Sleutel `rapporten` blijft: zonder recht geen exportknoppen. |

### 2.2 Hulpbalk (nu 5 items)

| Nu | Nieuwe plek | Waarom |
|---|---|---|
| Instellingen | **Beheer · Instellingen** | Instellen is beheer; geen tweede navigatie onderaan. |
| Koppelingen | **Beheer · Instellingen**, losse link bovenaan het centrum naast de Startwizard | Koppelingen zijn instellingen met een stand. Geen negende categorie. |
| Ledenapp (bekijken) | **Leden · Ledenapp**, knop "Bekijk als lid" (hoofdactie), poster met QR en uitnodigen | Een plek voor alles van de app. |
| Wat is nieuw | **?** in de kop, sectie Nieuw bovenaan Hulp; de teller staat op het vraagteken | Updates van AI Your Gym over het product. Let op: dit zijn niet de mededelingen van je eigen club (die staan op het Prikbord). Andere afzender, andere plek, daarom twee namen. |
| Hulp | **?** in de kop | Altijd een tik weg, op elk scherm, zonder balk. |

### 2.3 Overige vaste elementen

| Nu | Nieuwe plek | Waarom |
|---|---|---|
| Zoeken (Ctrl K) | Blijft in de kop | Vindt ook oude namen (Rapporten, Afspraken, Community, Notities, Wat is nieuw) als trefwoord. |
| Vestigingskeuze in de kop | Onder je **naam** rechtsboven; bij een vestiging verborgen | Kleine studio heeft er niets aan. |
| Aan de slag (rechtsboven) | Blijft, alleen eigenaar en clubmanager van een nieuwe sportschool | Weg te klikken; verdwijnt als alles af is. |
| Onderbalk telefoon (4 plus Meer) | **De vijf plekken** die iemand heeft; geen Meer | Zelfde model als de pc. Met een plek geen onderbalk. |
| Sneltoetsen G plus letter | G V, G L, G R, G T, G B voor de plekken; oude letters blijven en openen het scherm (G K Taken, G E Leads, G A Agenda, G N Prikbord, G I Instellingen, G H Hulp) | Niets af te leren. |
| Voet voor Kane (platform, systeem, andere sportschool) | Onder je **naam**, alleen master account | Geen eigen balk. |
| Testrol-balk | Blijft bovenaan, alleen master account | Ongewijzigd. |

### 2.4 Ledenkaart (nu 6 tabbladen)

| Nu | Nieuwe plek | Waarom |
|---|---|---|
| Overzicht | **Overzicht** | Blijft. |
| Planning (lessen, reserveringen, afspraken, bezoeken, challenges) | **Overzicht**, sectie Komt eraan (`#planning`) en Bezoek; challenges naar **Training** | Wat er gebeurd is en wat eraan komt, in een blik. |
| Contact en notities: notities en berichten | **Overzicht**, sectie Notities en berichten (`#notities`) | De laatste notitie hoort bij het eerste wat je ziet. |
| Contact en notities: contactgegevens en profielfoto | **Lidmaatschap**, sectie Gegevens (`#gegevens`) | Gegevens van het lid, bij de rest van de administratie. |
| Training | **Training** | Plus voortgang en challenges. |
| Lidmaatschap | **Lidmaatschap** | Plus Gegevens en Privacy. |
| Gegevens en privacy | **Lidmaatschap**, sectie Privacy (`#privacy`) | Downloaden en verwijderen (AVG) bij de gegevens. |

Oude `?tab=` blijven werken: `planning` en `contact` openen Overzicht op het anker, `privacy` opent Lidmaatschap op `#privacy`.

### 2.5 Team: mededelingen, werkwijzen en updates (extra opdracht Kane)

Wat er al is en wat erop lijkt:

| Bestaat al | Wat het doet | Wat het niet doet |
|---|---|---|
| Taken (Dagelijks, Afsluitronde, Poetsrooster) | Vaste lijsten per vestiging, per dag afvinken met wie en wanneer | Uitleg per stap, versie, iets dat niet elke dag terugkomt (ongeval, klacht) |
| Notities (mappen Algemeen, Overdracht, Afspraken, Kennis, Ideeen; vinkjes in tekst) | Vrije tekst voor het team, vastpinnen, overdracht op Vandaag | Gericht aan een rol of vestiging, gelezen per persoon, bevestigen |
| Wat is nieuw | Updates van AI Your Gym over het product, per persoon gelezen in de browser | Berichten van de eigen club |
| Berichten | Nieuws aan leden in de ledenapp | Iets aan het team |

Ontwerp: **geen nieuw menu-onderdeel.** Notities wordt het **Prikbord** (Vandaag · Prikbord), met drie blokken onder elkaar:

1. **Mededelingen.** Eigenaar of clubmanager schrijft iets aan het team. Kiest vestigingen (of alle) en rollen (of iedereen). Optie "Moet gelezen en bevestigd worden". Ieder ziet per mededeling Gelezen, en bij verplicht de knop "Gelezen en begrepen". De schrijver ziet "7 van 9 bevestigd" en wie nog niet.
2. **Werkwijzen.** Vaste instructies stap voor stap: Openen, Sluiten, Ongeval en EHBO, Nieuw lid ontvangen, Klacht, of eigen. Elke werkwijze heeft een versie en een datum. Je kunt hem lezen, of **uitvoeren**: de stappen afvinken, met wie, wanneer en welke vestiging, en een notitie.
3. **Notities.** De bestaande notities met hun mappen, ongewijzigd.

Samenvoegen in plaats van dubbel bouwen:
- **Update = mededeling.** Punt 1 en 3 van Kane zijn hetzelfde ding. Wijzigt een werkwijze en kies je "Belangrijke wijziging", dan maakt Club zelf een verplichte mededeling "Werkwijze Sluiten is gewijzigd (versie 3)" voor de rollen van die werkwijze, met de zin wat er anders is. Geen apart soort bericht.
- **Openen en sluiten blijven afvinken in Taken.** Een werkwijze kan aan een takenlijst hangen (Afsluitronde hoort bij de werkwijze Sluiten). Het dagelijks afvinken blijft in Taken; bij de lijst staat een link "Hoe doe je dit" naar de werkwijze. Uitvoeren in de werkwijze zelf is voor wat niet dagelijks is (ongeval, klacht, nieuw lid).
- **Kennis-notities** blijven notities. Bij een notitie in Kennis staat "Maak er een werkwijze van" (kopie, de notitie linkt daarna naar de werkwijze).
- **Wat is nieuw** blijft apart (afzender AI Your Gym, zie 2.2).

Op **Vandaag** staat voor de medewerker bovenaan een regel, alleen als er iets open is: "2 nieuwe mededelingen, 1 werkwijze te bevestigen". Een tik opent het Prikbord. De teller staat ook op de plek Vandaag (bron `src/lib/club/menu/tellers.ts`), en op het Prikbord zelf. Bij 0 niets.

Pakket: Mededelingen en Werkwijzen horen bij **Team en vloer** (`team`), net als Taken en Diensten. Zonder dat pakket is het Prikbord alleen Notities en heet het scherm gewoon Notities.

Ongeval en EHBO: een uitvoering kan gezondheidsgegevens raken. Daarom: geen verplicht lidveld, bij de notitie een vaste waarschuwing "Schrijf hier geen medische details", een optionele koppeling aan een lid valt onder de AVG-regels (export, verwijderen), en de bewaartermijn staat in Privacy en bewaren.

---

## 3. Per rol: wat je ziet (standaard zo weinig mogelijk)

Uitgangspunt: een plek staat er alleen als de persoon er minstens een scherm van mag zien. Rechten per rol blijven zoals in `rollen/standaard.ts`; de eigenaar kan ze aanpassen. Hieronder de standaard.

| Rol | Plekken | Schermen | Startpagina |
|---|---|---|---|
| Eigenaar | Vandaag, Leden, Rooster, Training, Beheer | Alles wat afgenomen is | Vandaag |
| Clubmanager | Vandaag, Leden, Rooster, Training, Beheer | Alles behalve wat alleen de eigenaar mag (abonnement, betalen, rechten, adres, privacy) | Vandaag |
| Trainer | Vandaag, Leden, Rooster, Training | Vandaag, Taken, Prikbord · Leden, Leads · Agenda (eigen afspraken) · Schema's, Voeding, Bibliotheek | Vandaag |
| Instructeur | Vandaag, Rooster | Vandaag (alleen lezen), Prikbord · Lessen | Rooster · Lessen |
| Roosteraar | Vandaag, Rooster | Prikbord · Lessen, Agenda, Diensten | Rooster · Diensten |
| Administratie | Vandaag, Rooster, Beheer | Prikbord · Diensten (Uren) · Cijfers (alleen Alle exports) | Rooster · Diensten, Uren |

Nieuw in de standaard: iedereen ziet het **Prikbord** (lezen en bevestigen), want mededelingen en werkwijzen zijn voor het hele team. Schrijven en werkwijzen maken: eigenaar en clubmanager. Daardoor heeft elke rol de plek Vandaag; voor instructeur, roosteraar en administratie toont Vandaag alleen de regel met open mededelingen, hun lessen of diensten van vandaag en het Prikbord.

Kleine studio (een vestiging, hoogstens 3 medewerkers): het UX-onderzoek (C2) wilde de eigenaar daar standaard ook clubmanager maken. Sinds 31-10 mag de eigenaar al overal beheren (`STANDAARD_RECHTEN.eigenaar`), dus dat is opgelost en hoeft niet meer.

---

## 4. Ledenkaart: drie tabbladen

Kop (altijd): foto, naam, status, lidmaatschap, coach. Een hoofdactie per tabblad rechts in de kop, de rest onder **Meer acties** (inchecken, les boeken, afspraak plannen, intake starten, schema maken, notitie). Op de telefoon staat de hoofdactie als vaste knop onderaan.

| Tabblad | Hoofdactie | Wat erop staat, van boven naar beneden |
|---|---|---|
| **Overzicht** | Notitie toevoegen | Drie feiten (laatste bezoek, volgende les of afspraak, laatste notitie) · Komt eraan: lessen, reserveringen, afspraken met knop Boeken · Bezoek: cijfers, patroon, laatste bezoeken · Notities en berichten |
| **Training** | Schema maken (zonder intake: Intake starten) | Intake · Actieve schema's (ook door het lid gemaakt, met Overnemen) · Voeding: plan en dagboek als het lid meekijken aanzet · Metingen (ook uit apps, met toestemming) · Voortgang en challenges |
| **Lidmaatschap** | Lidmaatschap wijzigen | Lidmaatschap: vorm, start, pauze, opzeggen, stoppen · Betalen (achter de schakelaars) · Gegevens: contact, foto, coach, labels · Ledenapp: link en QR · Privacy: gegevens downloaden, lid verwijderen (AVG) |

Rechten per blok blijven `kaartRechten`; een blok zonder recht staat er niet, een tabblad zonder enig blok ook niet (een instructeur ziet bijvoorbeeld alleen Overzicht).

---

## 5. Ledenapp: vijf tabbladen blijven

De onderbalk (Home, Boeken, Schema, Voeding, Profiel, `src/lib/club/app/tabs.ts`) is goed. Wat er nog te veel op staat:

| Scherm | Nu | Wat eruit of anders | Waarom |
|---|---|---|---|
| Home | Welkom met coach, QR, volgende les, weekring, reeks, berichten, intakekaart, sluitingen, vraag om meldingen, kopen | 1. **QR bovenaan** (hoofdactie Inchecken, een tik naar vol scherm). 2. Volgende les. 3. Deze week: ring en reeks in een blok. 4. Hoogstens **een** kaart "te doen", in deze volgorde: intake invullen, sluiting binnenkort, meldingen aanzetten. 5. Het nieuwste bericht, plus "Alle berichten". Kopen gaat naar Profiel. Coach als kleine regel in de welkom. | Bij de deur is inchecken de enige taak (UX-onderzoek L2). Een kaart tegelijk in plaats van vier. |
| Boeken | Schakelaar Lessen, Afspraken | Blijft. Zonder afspraken geen schakelaar. Strippenkaart alleen bij een volle les. | Al goed. |
| Schema | Schakelaar Schema, Voortgang; challenges onder voortgang | Blijft. Eigen schema maken als knop onderaan het schema, niet bovenaan. | Het schema van vandaag eerst. |
| Voeding | Dagboek, eigen plan, plan van de trainer, voorstel | Dagboek eerst. Het plan als een regel "Je dagdoel: 2100 kcal" met een tik naar het plan. Lange uitleg en toestemming achter "Lees meer"; toestemming blijft een eigen knop. | Loggen is de dagelijkse taak, het plan stel je een keer in. |
| Profiel | Gegevens, foto, meldingen op je telefoon, hulp van de sportschool, community, koppelingen, wachtwoord, uitloggen | Plus **Kopen** (strippenkaart, PT). Meldingen op je telefoon alleen nog onder de bel (zoals in STRUCTUUR besloten), niet ook hier. Volgorde: gegevens, kopen, community, koppelingen, hulp, account. | Een plek per ding. |
| Kop | Logo, bel | Blijft. | |

3D-weekring: op Home de SVG-ring (`DiepteRing`), 3D alleen als `saveData` uit staat en de app al geladen is (UX-onderzoek L3). Klein punt, wel in deel 2.

---

## 6. Regels voor elk scherm

1. **Een hoofdactie bovenaan rechts** (telefoon: vaste knop onderaan). Alleen als iemand hem mag. Voorbeelden: Leden · Lid toevoegen, Leads · Lead toevoegen, Lessen · Les toevoegen, Agenda · Afspraak plannen, Diensten · Dienst toevoegen, Schema's · Schema maken, Voeding · Plan maken, Cijfers · Exporteren, Prikbord · Mededeling plaatsen (voor de leiding; voor de rest geen knop), Ledenapp · Bekijk als lid.
2. **Hoogstens een korte regel uitleg** onder de kop (hoogstens 12 woorden). Langere uitleg alleen in Hulp.
3. **Details achter een tik.** Filters, instellingen van het scherm, export en tweede acties onder een knop "Meer" of in een uitklapper. Geen tweede rij knoppen.
4. **Lege staat: verbergen of een knop.** Een leeg blok staat er niet. Is het hele scherm leeg, dan een zin plus de hoofdactie ("Nog geen leads. Lead toevoegen"). Een scherm dat nog nooit gebruikt is en niet de kern van de plek is, staat niet in het menu (verbergen tot gebruikt); het is via zoeken en via de knop op de plek waar je hem nodig hebt wel te maken.
5. **Hoogstens drie tabbladen** op een scherm, en alleen voor echt andere werkstanden (Week of Dag is een weergaveknop, geen tabblad).
6. **Getallen alleen met een echte bron**, per kalendermaand, nooit verzonnen.
7. **Tikvlakken 44 px** bij `pointer: coarse`, tekst die je moet lezen minstens 12 px.

---

## 7. Het uitlegscript

### Nieuwe eigenaar, 10 minuten

| Minuut | Wat je laat zien | Wat je zegt |
|---|---|---|
| 0 tot 1 | De balk bovenin, dan dezelfde vijf onderin op de telefoon | "Alles staat op vijf plekken: Vandaag, Leden, Rooster, Training en Beheer. Op je telefoon zijn het dezelfde vijf." |
| 1 tot 2 | Vandaag: check-in bovenaan, een lid inchecken | "Vandaag is wat er nu moet gebeuren; bovenaan check je iemand in." |
| 2 tot 3 | Vandaag: lessen, wie werkt, taken afvinken, Bellen vandaag | "Daaronder de lessen, wie er werkt, de taken en wie je vandaag belt." |
| 3 tot 4 | Vandaag · Prikbord: mededeling plaatsen aan Trainers in Budel, verplicht | "Op het Prikbord zet je wat je team moet weten, en je ziet wie het gelezen heeft." |
| 4 tot 5 | Prikbord: werkwijze Sluiten met stappen, versie, gekoppeld aan de afsluitronde | "Hier staan je werkwijzen stap voor stap; verander je er een, dan moet je team hem opnieuw bevestigen." |
| 5 tot 6 | Leden: Lid toevoegen, uitnodiging gaat mee; ledenkaart met drie tabbladen | "Leden is iedereen; op de kaart van een lid staat alles van dat lid." |
| 6 tot 7 | Leden · Leads met Opvolgen; Leden · Ledenapp, Bekijk als lid | "Leads zijn mensen die nog lid moeten worden, en hier zie je de app zoals je lid hem ziet." |
| 7 tot 8 | Rooster: Lessen met Vaste week bewerken, Agenda, Diensten | "Rooster is alles met een tijd: lessen, afspraken en diensten." |
| 8 tot 9 | Training: schema maken vanaf een lid, bibliotheek met renders | "Training is wat een lid gaat doen: schema, voeding en de oefeningen met coaching." |
| 9 tot 10 | Beheer: Cijfers met Exporteren, Instellingen met acht categorieen en zoeken; daarna ? en Ctrl K | "In Beheer zie je hoe het gaat en stel je alles in; kwijt? Druk Ctrl K of tik op het vraagteken." |

### Trainer, 3 minuten

| Minuut | Wat je laat zien | Wat je zegt |
|---|---|---|
| 0 tot 1 | Telefoon: onderbalk met vier plekken, Vandaag met check-in, de regel "1 mededeling te bevestigen" | "Je begint op Vandaag: inchecken, je taken, en lees eerst wat er op het Prikbord voor je klaarstaat." |
| 1 tot 2 | Vergrootglas, lid zoeken, ledenkaart Overzicht, notitie toevoegen | "Zoek een lid en je ziet alles op een kaart; een notitie zet je er met een tik bij." |
| 2 tot 3 | Ledenkaart Training: schema maken, terug naar het lid; Rooster · Agenda met je afspraken | "Een schema maak je vanaf het lid, en je afspraken staan in Rooster." |

### Lid, 2 minuten

| Moment | Wat je laat zien | Wat je zegt |
|---|---|---|
| 0:00 tot 0:30 | Home: QR bovenaan op vol scherm | "Bij de deur open je de app en laat je deze code zien." |
| 0:30 tot 1:00 | Boeken: les reserveren | "Bij Boeken reserveer je een les of een afspraak met je trainer." |
| 1:00 tot 1:30 | Schema: oefening openen, rep-speler, set afvinken | "Bij Schema zie je je training met hoe je elke oefening doet, en vink je je sets af." |
| 1:30 tot 2:00 | Voeding en Profiel | "Bij Voeding houd je bij wat je eet, en bij Profiel staan je gegevens en wat je kunt kopen." |

---

## 8. Bouwplan in vijf delen

Vier delen voor de vereenvoudiging, een vijfde voor het team (extra opdracht). Elk deel heeft eigen bestanden; waar een deel een ander deel nodig heeft, staat het contract erbij. Elke nieuwe tekst in NL en EN in het eigen woordenboekbestand (bewaker `src/lib/aiyourgym/taal/geen-hardcoded-nl.test.ts`). Geen deel draait een volledige `tsc` of `next build` (Kane draait die); wel de vitest-bestanden van het eigen deel.

**Contract voor alle delen** (in deel 1 als code, de rest leest het alleen): `PLEKKEN` = `vandaag`, `leden`, `rooster`, `training`, `beheer`, en per onderdeelsleutel zijn plek. Paden veranderen niet, behalve de nieuwe `/club/prikbord` (deel 5). Een oud scherm dat opgaat in een ander, blijft bestaan of krijgt een 308; het deel dat de pagina bezit, regelt dat.

### Deel 1 | Navigatie: vijf plekken (shell)

- Bestanden: `src/components/club/shell/**` (`onderdelen.ts`: `GROEPEN` wordt `PLEKKEN`, veld `plek` per onderdeel, `ONDERBALK` = de plekken; `hulpbalk-items.ts`, `Hulpbalk.tsx`, `hulpbalk.css` weg, in de plaats een `KopHulp.tsx` met teller van Wat is nieuw; `ClubBalk.tsx`, `Onderbalk.tsx`, `MenuPaneel.tsx` (wordt het naam-menu: vestiging, taal, uitloggen, voet van Kane), `VestigingKeuze.tsx`, `iconen.ts`, `zoeken.ts` met oude namen als trefwoord, `useSneltoetsen.ts`, `useTellers.ts`), `src/lib/aiyourgym/taal/woorden/club/menu.ts`, `src/app/(aiyourgym)/(club)/club/hulp/**` en `club/nieuw/**` (Wat is nieuw als sectie in Hulp, `/club/nieuw` blijft), `src/app/(aiyourgym)/(club)/club/layout.tsx` (alleen de balken).
- Verbergen tot gebruikt: een functie `inGebruik(sleutel, stand)` in `onderdelen.ts`; de stand (aantal takenlijsten, leads, prikbord-items, diensten) leest de layout via een nieuwe `src/lib/club/menu/in-gebruik.ts` (puur plus een lezer, gefilterd op `t.userId`).
- Prikbord: het menu-item `prikbord` komt als laatste commit, na deel 5 (dat de sleutel registreert).
- Tests bijwerken: `navigatie.test.ts` (vijf plekken, onderbalk zonder Meer, sneltoetsen inclusief oude letters), `iconen.test.ts` (icoon per plek en per scherm, geen dubbel binnen een plek), `hulpbalk.test.ts` wordt `kop-hulp.test.ts`, `routes.test.ts`, `zoeken.test.ts` en `zoeken-telefoon.test.ts` (oude namen vinden de nieuwe plek). Nieuw: `in-gebruik.test.ts`. Groen moeten blijven: `src/lib/club/kern/pakketten-routes.test.ts`, `src/lib/club/rollen/routekaart.test.ts`, `routes-per-rol.test.ts`, `tenant-filter.test.ts`.

### Deel 2 | Het lid: ledenkaart en ledenapp

- Bestanden: `src/lib/club/leden/hub/**` (`tabs.ts`: drie tabbladen plus omzetting van oude `?tab=`, `rechten.ts`), `src/components/club/leden/hub/**` (`ContactTab` en `PlanningTab` worden secties van Overzicht en Lidmaatschap; kop met hoofdactie en Meer acties), `src/app/(aiyourgym)/(club)/club/leden/[id]/**`, `src/lib/aiyourgym/taal/woorden/club/ledenkaart.ts`; ledenapp: `src/app/(aiyourgym)/(club)/mijn/page.tsx`, `src/components/club/app/**` (HomeTab, ProfielTab, de ring), `src/lib/club/app/tabs.ts` alleen als nodig, woordenboeken van de ledenapp.
- Niet aanraken: de editor van schema's en de lijst `/club/leden` (deel 3).
- Tests: `hub/tabs.test.ts` (drie tabbladen, oude waarden naar het juiste tabblad en anker), `hub/rechten.test.ts` (tabblad zonder blok valt weg), `hub/planning.test.ts`, `lidmaatschap.test.ts`, `src/lib/club/app/tabs.test.ts`. Nieuw: een pure `homeVolgorde()` (welke "te doen"-kaart, hoogstens een) met test.

### Deel 3 | Plekken samenvoegen: Leden, Rooster, Training

- Bestanden: `club/leden/page.tsx` (lijst, hoofdactie Lid toevoegen), `club/leads/**` en `src/components/club/leads/**` (tabblad Opvolgen), `club/opvolgen/**` (308 naar Leads, tabblad Opvolgen; de sectie op Vandaag is van deel 4), `club/app/**` (Ledenapp-scherm met secties Berichten, Community, Challenges en Bekijk als lid), `club/berichten|community|challenges/**` (blijven als volledig scherm), `club/rooster/**` (knop Vaste week bewerken), `club/agenda/**` en `club/afspraken/**` met `src/components/club/agenda|afspraken/**` (een Agenda met filters; `/club/afspraken` opent de Agenda met filter Met leden, `?tab=typen` blijft), `club/personeel/**` (naam Diensten), `club/training/**` en `club/voeding/**` (Intakes als sectie, Bibliotheek met sjablonen en oefeningen), bijbehorende woordenboeken (`leads.ts`, `agenda.ts`, `afspraken.ts`, `training.ts`, `voeding.ts`, `app-pagina.ts`, `personeel.ts`).
- Let op pakketten: de Agenda is kern, het filter Met leden alleen met pakket Afspraken (`afspraken`); Leads alleen met Groei.
- Tests: `pakketten-routes.test.ts` en `routekaart.test.ts` groen (geen nieuwe routes, wel 308's), bestaande tests van agenda, afspraken, leads en training. Nieuw: een pure `agendaFilter()` (welke filters iemand ziet bij welke rechten en pakketten) met test.

### Deel 4 | Vandaag, Beheer en instellingen

- Bestanden: `club/page.tsx` en `src/components/club/vandaag/**` (sectie Bellen vandaag, regel met open mededelingen op de plek die deel 5 levert, Taken-knop als er nog geen lijst is), `club/cijfers/**` en `club/rapporten/**` (Exporteren per blok, `#exports`; `/club/rapporten` blijft als volledig scherm), `src/lib/club/kern/instel-paginas.ts` en `src/components/club/instelcentrum/**` (Koppelingen als losse link bovenaan, Medewerkers onder Team ook zonder v2 weg uit de lijst, "Alles tonen" bij Onderdelen), `club/koppelingen/**`, woordenboeken `vandaag.ts`, `cijfers.ts`, `rapporten.ts`, `instel-paginas.ts`, `beheer.ts`.
- Contract met deel 5: Vandaag toont `<PrikbordRegel />` uit `src/components/club/prikbord/` als die bestaat; deel 4 zet de regel in `club/page.tsx`, deel 5 levert het component en de data.
- Tests: `instel-paginas.test.ts` (elke pagina in precies een categorie, bereikbaar, Koppelingen als losse link), `instel-te-doen.test.ts`, `koppelingen.test.ts`, `pakketten-routes.test.ts`, tests van Vandaag (`sectiesVoor`). Nieuw: test dat elk exportblok in Cijfers dezelfde export heeft als `/club/rapporten`.

### Deel 5 | Prikbord: mededelingen, werkwijzen en updates voor het team

- Migratie `supabase/lifeos-migrations/489_club_prikbord.sql` (alleen toevoegen):
  - `club_mededelingen`: id, `user_id` (sportschool), titel, inhoud, `vestigingen` text[] (leeg = alle), `rollen` text[] (leeg = iedereen), `verplicht` bool, `soort` ('mededeling' of 'wijziging'), `werkwijze_id` en `werkwijze_versie` (bij een wijziging), `door_profiel`, `geplaatst_op`, `verloopt_op`, `gearchiveerd`.
  - `club_mededeling_gelezen`: `user_id`, `mededeling_id`, `profiel_id`, `gelezen_op`, `bevestigd_op`; uniek op mededeling plus profiel.
  - `club_werkwijzen`: id, `user_id`, titel, `soort` ('openen', 'sluiten', 'veiligheid', 'nieuw_lid', 'klacht', 'eigen'), `vestigingen`, `rollen`, `versie`, `takenlijst_id` (optioneel), `gearchiveerd`.
  - `club_werkwijze_versies`: `user_id`, `werkwijze_id`, `versie`, `stappen` jsonb (tekst en uitleg per stap), `wat_anders`, `door_profiel`, `gemaakt_op`. Oude versies blijven, zodat je ziet wat iemand bevestigde.
  - `club_werkwijze_uitvoeringen`: `user_id`, `werkwijze_id`, `versie`, `vestiging`, `profiel_id`, `gestart_op`, `afgerond_op`, `afgevinkt` jsonb, `notitie`, `lid_id` (optioneel).
  - RLS aan en alleen via de server; indexen op `user_id` plus vestiging en op `profiel_id`.
  - AVG: `club_werkwijze_uitvoeringen.lid_id` in `club_lid_definitief_verwijderen`, in de export en in `src/lib/club/leden/avg/tabellen.ts`; `profiel_id` en `door_profiel` in `club_medewerker_anonimiseren`; bewaartermijn voor uitvoeringen en gelezen-regels in `club_privacy_instellingen` en `club_privacy_opruimen`.
- Code: `src/lib/club/prikbord/` (puur: voor wie is een mededeling (vestiging en rol), wat is open voor een persoon, telling "x van y bevestigd", nieuwe versie maakt een verplichte wijziging; plus opslag), `src/components/club/prikbord/` (scherm, `PrikbordRegel` voor Vandaag, werkwijze lezen en uitvoeren), `src/app/(aiyourgym)/(club)/club/prikbord/**`, API `src/app/(aiyourgym)/api/club/prikbord/**`, woordenboek `src/lib/aiyourgym/taal/woorden/club/prikbord.ts` (NL en EN), `club/notities/**` en `src/components/club/kladblok/**` (blok Notities, "Maak er een werkwijze van"), `src/components/club/taken/**` en `src/lib/club/taken/**` (link "Hoe doe je dit" bij een gekoppelde lijst), teller in `src/lib/club/menu/tellers.ts`.
- Registratie van de nieuwe sleutel `prikbord` (deel 5 bezit deze bestanden voor deze wijziging): `ONDERDEEL_SLEUTELS` in `src/lib/club/kern/org-instellingen.ts`, `ONDERDEEL_PAKKET` in `src/lib/club/kern/pakketten.ts` (pakket `team`; Notities blijft kern), `API_ONDERDEEL` in `src/lib/club/beheerders/rechten.ts`, `STANDAARD_RECHTEN` in `src/lib/club/rollen/standaard.ts` (eigenaar en clubmanager beheren, alle andere rollen zien; zien = lezen, bevestigen en uitvoeren, bewerken = mededeling plaatsen, beheren = werkwijzen en versies).
- Rollen: elke API controleert het niveau via `rollen/api.ts`; nooit `t.rol ===` (bewaker `rol-bewaker.test.ts`). Een clubmanager kan geen mededeling richten aan de eigenaar alleen; elke query filtert op `t.userId`.
- Tests: nieuw `prikbord/model.test.ts` (doelgroep, open per persoon, versie maakt verplichte wijziging, bevestigen telt alleen de juiste versie), `api.test.ts` met rechten per niveau. Groen moeten blijven of bijgewerkt: `tenant-filter.test.ts` (alle nieuwe queries op `user_id`), `leden/avg/tabellen.test.ts`, `pakketten-routes.test.ts`, `routekaart.test.ts`, `routes-per-rol.test.ts`, `model.test.ts` van rollen (snapshot van de standaard), `instel-paginas.test.ts` als Privacy een nieuwe termijn toont, `geen-hardcoded-nl.test.ts`.

### Volgorde

Deel 2, 3, 4 en 5 kunnen tegelijk. Deel 1 ook, met een uitzondering: het menu-item Prikbord en de teller op de plek pas na deel 5. Deel 4 zet de regel `PrikbordRegel` pas na deel 5. Na alle delen: `docs/club/STRUCTUUR.md` bijwerken, de eerste-keer-kaarten (`WELKOM_VERSIE` ophogen) en de walkthrough `NIEUWE-WERKNEMER-2026-10-30.md` naar het nieuwe script.

### Open voor Kane

- Naam **Prikbord** voor het scherm met mededelingen, werkwijzen en notities. Alternatief: "Team", maar dat botst met Instellingen · Team (mensen en rollen).
- Moet een verplichte mededeling iemand tegenhouden (eerst lezen, dan verder) of alleen bovenaan Vandaag staan? Ontwerp: alleen bovenaan, niet blokkeren.
