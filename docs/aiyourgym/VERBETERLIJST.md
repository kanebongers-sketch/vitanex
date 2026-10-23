# Verbeterlijst AI Your Gym

Doorloop met Kane vanaf 23-10-2026, met Voorbeeld Gym als voorbeeldklant:
Mark (eigenaar, zelfstandige gym, 1 vestiging, ongeveer 600 leden, nu Virtuagym),
Lisa (trainer, doet ook de balie) en Sanne (lid, 3x per week).

Soort: **fout** (werkt niet goed), **verbetering** (werkt, kan beter), **toevoeging** (ontbreekt).
Prioriteit: **1** voor de presentatie, **2** kort daarna, **3** later.

## Stap 1. Mark vindt de website (hoofdpagina)

| # | Soort | Prio | Wat | Wie zag het |
|---|---|---|---|---|

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
