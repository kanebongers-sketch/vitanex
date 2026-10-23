# Verbeterlijst AI Your Gym

Doorloop met Kane vanaf 23-10-2026, met Voorbeeld Gym als voorbeeldklant:
Mark (eigenaar, zelfstandige gym, 1 vestiging, ongeveer 600 leden, nu Virtuagym),
Lisa (trainer, doet ook de balie) en Sanne (lid, 3x per week).

Soort: **fout** (werkt niet goed), **verbetering** (werkt, kan beter), **toevoeging** (ontbreekt).
Prioriteit: **1** voor de presentatie, **2** kort daarna, **3** later.

## Stap 1. Mark vindt de website (hoofdpagina)

| # | Soort | Prio | Wat | Wie zag het |
|---|---|---|---|---|

## Stap 2. Aanmelden en betalen

Doorloop van de eerste dag (code en tests, geen echte database). Opgelost in dezelfde ronde: de abonnementspagina toont na een testbetaling eerlijk "Proefperiode tot ..." en dat er niets wordt afgeschreven (was "Actief"); een nieuwe sportschool krijgt alleen de standaardoefeningen, nooit de eigen oefeningen van een andere sportschool.

| # | Soort | Prio | Wat | Wie zag het |
|---|---|---|---|---|
| 2.1 | fout | 1 | Twee aanmeldingen met hetzelfde e-mailadres die tegelijk wachten (twee tabbladen, of opnieuw aanmelden voor afronden) worden allebei ingericht: de controle op een bestaand account zit alleen in `api/aiyourgym/checkout`, niet bij het afronden (testbetaling en webhook). Daarna vindt `vindBeheerderOpEmail` twee rijen en kan de eigenaar niet meer inloggen. Bij afronden opnieuw controleren, en een unieke index op het e-mailadres van actieve beheerders (migratie 460+). | Claude |
| 2.2 | verbetering | 1 | Eerlijk vooraf: Club doet geen abonnementen en incasso van leden (dat blijft in een eigen ledenadministratie). Mark komt van Virtuagym, dat dit wel doet. Dit moet op de website en bij het aanmelden staan, niet pas in Club. | Claude |
| 2.3 | verbetering | 2 | De testbetaalpagina toont "Adres: naam.aiyourgym.com" terwijl subdomeinen uit staan, en zegt niet dat inloggen voorlopig op aiyourgym.com/inloggen gaat (website-bestand, niet in deze ronde aangepast). | Claude |
| 2.4 | verbetering | 2 | De welkomstmail noemt de proefperiode en "er wordt niets afgeschreven" niet, terwijl de testbetaalpagina dat belooft (`welkomTekst` in `src/lib/aiyourgym/welkom-mail.ts`). | Claude |
| 2.5 | verbetering | 2 | Een nieuwe sportschool krijgt in `maakOrganisatie` de accentkleur brons #B58E5C en donker thema: de kleur van Fit Factory. Zonder logo blijft Mark daarmee zitten. Neutrale standaard, of in stap 2 laten kiezen. | Claude |
| 2.6 | verbetering | 2 | De basisbibliotheek wordt nog gekopieerd uit de bibliotheek van de eigen sportschool van het platform (nu alleen de standaardnamen). Past die sportschool de uitleg of aandachtspunten van een standaardoefening aan, dan gaat die tekst mee naar nieuwe sportscholen. Beter een vaste bron voor de basis (code of een eigen tabel). | Claude |
| 2.7 | verbetering | 3 | `ruimSportschoolOp` ruimt alleen beheerders, vestigingen, oefeningen en de organisatie op. Komt er bij het inrichten iets bij (lestypen, instellingen), dan moet dat daar ook in. | Claude |

## Stap 3. Startwizard

Opgelost in dezelfde ronde: de stap Vestiging stond bij een nieuwe sportschool meteen op af en de gekozen soort zette zijn openingstijden en regels nooit neer (de plaatshouder-tijden van de eerste vestiging telden als eigen werk); stap Team en de checklist noemden nog "inloglink met pincode"; voorbeeldadres "Budel" en "Eersel"; na het inlezen van leden is er nu een knop terug naar de wizard.

| # | Soort | Prio | Wat | Wie zag het |
|---|---|---|---|---|
| 3.1 | verbetering | 1 | Twee soorten "Clubmanager": de medewerkerrol `manager` (label Clubmanager, bij Medewerkers en in stap Team) en de beheerdersrol clubmanager (bij Huisstijl, Beheerders). Wie in stap Team een clubmanager toevoegt, verwacht dat die ook instellingen beheert. Een begrip, of duidelijk verschillende namen. | Claude |
| 3.2 | toevoeging | 2 | In stap Team kun je iemand niet meteen uitnodigen om in te loggen; dat moet daarna bij Medewerkers (de tekst wijst er nu wel naar). Een knop Uitnodigen in de wizard (MedewerkerLogin hergebruiken) scheelt een omweg. | Claude |
| 3.3 | toevoeging | 2 | Uitnodigingen (beheerders en medewerkers) gaan niet per mail: de eigenaar kopieert de link en stuurt hem zelf door. Een mail vanuit AI Your Gym maakt dit simpeler. | Claude |
| 3.4 | verbetering | 3 | Stap Klaar zegt dat persoonlijke hulp in Club en Keten zit, maar niet welk pakket deze sportschool heeft. | Claude |
| 3.5 | verbetering | 3 | De check-in regel "leden van Eersel sporten overal, anderen overal behalve Eersel" zit vast in gedeelde code (`src/lib/club/checkin/regels.ts`, vestiging-slug `eersel`) met vaste tekst in `CheckinKaart.tsx`. Voor andere sportscholen doet hij niets, maar het hoort een instelling per sportschool te zijn (toegang per vestiging). | Claude |

## Stap 4. Instellingencentrum

Opgelost in dezelfde ronde: zoekwoord "pincode" en "inloglink" weg, Sportivity niet meer als vanzelfsprekend (lidmaatschappen, ledenkaart, check-in, ledenapp, leads), een technische melding ("Is migratie 410 al gedraaid?") weg voor eigenaren, de uitleg bij Adres klopt nu zolang eigen adressen nog niet live zijn, en een nieuwe beheerder krijgt standaard de rol clubmanager in plaats van eigenaar. In Hulp staat nu hoe je je team laat inloggen.

| # | Soort | Prio | Wat | Wie zag het |
|---|---|---|---|---|
| 4.1 | verbetering | 2 | Adres (eigen subdomein) staat voor elke eigenaar in het instellingencentrum, terwijl "Eigen adres naam.aiyourgym.com" volgens `pakketten.ts` alleen in Keten zit. Per pakket tonen of de pakkettekst aanpassen. | Claude |
| 4.2 | verbetering | 2 | Medewerkers en beheerders staan op twee plekken (Instellingen, Medewerkers en Huisstijl, Beheerders). Voor een nieuwe eigenaar is "wie mag inloggen" een ding; samen onder Team en rechten zetten. | Claude |
| 4.3 | opruimen | 3 | `src/components/club/inloggen/ClubInlogPoort.tsx` (pincode en controlecode) wordt nergens meer gebruikt. | Claude |

## Stap 5. Leden importeren

Opgelost in dezelfde ronde: een bestand met alleen een kolom Naam (of Full name) is nu in te lezen (de naam wordt gesplitst, ook "Vries, Jan de"); meer Engelse kolomnamen herkend (Member ID, Membership name, Mobile phone); de teksten noemen Virtuagym en Excel, niet alleen Sportivity; een leeg Sportivity-ID staat niet meer als "Onbekend" op de ledenkaart.

| # | Soort | Prio | Wat | Wie zag het |
|---|---|---|---|---|
| 5.1 | toevoeging | 2 | Alleen CSV: een Excel-bestand (.xlsx) moet Mark eerst zelf als CSV opslaan. Direct .xlsx inlezen scheelt een stap. | Claude |
| 5.2 | verbetering | 2 | De herkende Virtuagym-kolomnamen zijn niet getoetst aan een echte Virtuagym-export. Controleren met een geanonimiseerde export en zo nodig aanvullen in `kolommen.ts`. | Claude |
| 5.3 | verbetering | 3 | Het veld heet "Sportivity-ID" in de kolomkoppeling en op de ledenkaart; voor andere systemen "Extern nummer" noemen (kolom `sportivity_id` kan blijven). | Claude |
| 5.4 | toevoeging | 3 | Inlezen gaat altijd in een vestiging; een ketenbestand met een kolom Vestiging kan niet in een keer. | Claude |

## Stap 6. Een dag op de vloer

| # | Soort | Prio | Wat | Wie zag het |
|---|---|---|---|---|
| 6.1 | verbetering | 1 | Startwizard (niet aangeraakt) noemt nog de oude login: `TeamFormulier.tsx` "Iedereen krijgt later een eigen inloglink met pincode", `StapTeksten.tsx` "De inloglink voor je team maak je later", `eerste-dag.ts` "deel de persoonlijke inloglink". Moet worden: uitnodiging per e-mail, daarna e-mailadres en wachtwoord. | Lisa |
| 6.2 | fout | 1 | Technische meldingen voor de sportschool: "Is migratie 410 al gedraaid?" (`huisstijl/BeheerdersBlok.tsx`) en "Is migratie 457 al gedraaid?" (`instellingen/MedewerkersBeheer.tsx`). Gebied van de agent voor uitnodigingen; vervangen door "Ververs de pagina of probeer het later opnieuw". | Mark |
| 6.3 | verbetering | 1 | Beheerders: "Vraag een andere eigenaar of Kane." (`api/club/beheerders/[id]/route.ts`) en "Club blijft geheim tot de presentatie" (`BeheerdersBlok.tsx`, `api/club/beheerders/route.ts`, alleen bij Fit Factory zelf). Kane eruit; "of de klantenservice van AI Your Gym". | Mark |
| 6.4 | verbetering | 2 | De oude inlogpoort met pincode en controlecode (`components/club/inloggen/ClubInlogPoort.tsx`, `/clubinloggen/[code]`) bestaat nog. Sinds 23-10-2026 overbodig: weghalen of laten doorverwijzen naar inloggen met e-mail en wachtwoord. | Lisa |
| 6.5 | verbetering | 2 | Check-in: de regel "leden van Eersel sporten overal, anderen overal behalve Eersel" staat vast in de code (`checkin/regels.ts` `magInVestiging`, teksten in `CheckinKaart.tsx`). Werkt alleen op de vestiging met slug `eersel` (dus niet bij andere sportscholen), maar hoort een instelling te zijn bij Lidmaatschappen (welke vestigingen een vorm toelaat). | Lisa |
| 6.6 | verbetering | 3 | Opvolgen belooft "Automatisch versturen per mail of app komt later". Eerlijk, maar haal de zin weg zodra het er is of als het niet komt. | Lisa |

## Stap 7. Leden en leads

| # | Soort | Prio | Wat | Wie zag het |
|---|---|---|---|---|
| 7.1 | toevoeging | 1 | Een nieuw lid met de hand aanmaken en contactgegevens (e-mail, telefoon, geboortedatum) wijzigen kan niet in Club: alleen via Ledenbestand inlezen of een lead omzetten. Aan de balie wil Lisa een nieuw lid of een nieuw telefoonnummer meteen invoeren. Status wijzigen kan sinds deze ronde wel op de ledenkaart. | Lisa |
| 7.2 | verbetering | 2 | Inlezen overschrijft een status die Lisa op de ledenkaart zette als het bestand een statuskolom heeft. Toon in het controle-overzicht welke statussen veranderen, of laat de status met rust als hij in Club is gewijzigd. | Mark |
| 7.3 | verbetering | 3 | De kolom en de code heten nog `sportivity_id` (label is nu "Extern klantnummer"). Bij een volgende migratie neutraal hernoemen; de import herkent "sportivity" als kolomnaam en dat mag blijven. | Mark |

## Stap 8. Planning

| # | Soort | Prio | Wat | Wie zag het |
|---|---|---|---|---|
| 8.1 | verbetering | 1 | Een trainer met het onderdeel Personeel kan diensten van collega's plannen, wijzigen en verwijderen, en verlof of afwezigheid voor een collega invoeren (`api/club/personeel/diensten`, `beschikbaarheid`, `beschikbaarheid/vast`). Uren goedkeuren is sinds deze ronde dicht voor trainers; voor plannen een keuze van Kane nodig: alleen clubmanager en eigenaar plannen, trainers zien het rooster en melden zelf hun beschikbaarheid. | Lisa |
| 8.2 | verbetering | 2 | De vestigingscontrole voor medewerkers (`eisVestigingVanRecord`) ontbreekt nog bij `personeel/beschikbaarheid` (POST, ook `vast`) en `personeel/ruilen`: een medewerker kan daar een collega van een andere vestiging kiezen. Boeken in een les en taken afvinken of toevoegen zijn in deze ronde dichtgezet. | Lisa |

## Stap 9. Coaching

| # | Soort | Prio | Wat | Wie zag het |
|---|---|---|---|---|
| 9.1 | verbetering | 3 | Een lid kan in de ledenapp een training loggen op elk eigen schema, ook een afgerond of concept-schema (`app/acties-training.ts` controleert alleen dat het schema van het lid is). Alleen actieve schema's toestaan, of het oude schema duidelijk tonen. | Sanne |

## Stap 10 en 11. De ledenapp

| # | Soort | Prio | Wat | Wie zag het |
|---|---|---|---|---|
| 10.1 | verbetering | 3 | De QR-code in de app staat aan als zowel "QR in de ledenapp" (Ledenapp) als de check-inmethode (Check-in) het toelaten: twee schakelaars op twee plekken voor hetzelfde. Samenvoegen in Instellingen, Check-in. | Mark |

## Stap 12. Eind van de maand

| # | Soort | Prio | Wat | Wie zag het |
|---|---|---|---|---|
| 12.1 | verbetering | 2 | Uren goedkeuren en verwerken staat nu alleen open voor eigenaar, clubmanager en medewerkers met de rol Administratie of Clubmanager. Er is nog geen aparte login voor een externe administratie of boekhouder die alleen Uren ziet. | Mark |
