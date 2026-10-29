# Club en AI Your Gym | AVG-register en werkafspraken

Stand 20-10-2026, opgesteld uit de echte code en database (migraties 380 tot en met 449). Geen juridisch advies: laat de grondslagen en termijnen toetsen door een privacy-specialist voordat een sportschool live gaat.

## 1. Rollen

| Partij | Rol | Waarvoor |
|---|---|---|
| De sportschool | verwerkingsverantwoordelijke | leden, proefleden, leads, medewerkers en alles wat zij in Club zet |
| AI Your Gym (Kane) | verwerker (art. 28 AVG) | levert en host Club in opdracht van de sportschool; zie `docs/aiyourgym/juridisch/verwerkersovereenkomst.md` |
| AI Your Gym (Kane) | verwerkingsverantwoordelijke | eigen website: demo-aanvragen (`ayg_demo_aanvragen`), aanmeldingen en klanten (`ayg_aanmeldingen`), hulpvragen van sportscholen (`club_support`) |

Elke sportschool heeft een eigen omgeving: alle `club_*`-tabellen filteren op `user_id` (het id van de sportschool). Alleen de server (service role) leest de database; RLS staat aan en anon/authenticated hebben geen rechten.

## 2. Register van verwerkingen (per sportschool)

De grondslag is een **voorstel**; de sportschool bepaalt hem en zet hem in haar privacyverklaring.

| Verwerking | Gegevens | Tabellen | Doel | Grondslag (voorstel) | Bewaartermijn | Wie ziet het |
|---|---|---|---|---|---|---|
| Ledenadministratie | naam, e-mail, telefoon, geboortedatum, geslacht, lidnummer, Sportivity-id, vestiging, abonnement (naam), status, labels, coach | `club_leden` | begeleiding, contact, toegang | overeenkomst | zolang lid; oud-leden (gestopt of opgezegd) na 24 maanden (instelbaar 6 tot 84) automatisch een verzoek tot verwijderen, 30 dagen terug te draaien | rol met onderdeel Leden |
| Bezoek en toegang | lid, vestiging, tijdstip, manier | `club_checkins` | toegang, bezoekcijfers | overeenkomst | na 24 maanden (instelbaar 3 tot 84) los van het lid, de telling blijft | Check-in, Leden, Cijfers |
| Lessen en reserveren | boekingen, wachtlijst, aanwezig, te laat afgemeld | `club_reserveringen`, `club_lessen` | lesrooster | overeenkomst | gegeven lessen: na dezelfde termijn als bezoek los van het lid; toekomstige boekingen weg bij verwijderen | Rooster |
| Afspraken | lid of lead, medewerker, tijd, soort, status, notitie | `club_afspraken` | intakes, PT, metingen plannen | overeenkomst | zolang lid; bij een gewiste lead gaat de notitie weg | Afspraken |
| **Intake** | antwoorden, PAR-Q, blessures, klachten, medicatie, metingen, toestemming | `club_intakes` | veilig trainen, begeleiding | **uitdrukkelijke toestemming (art. 9 lid 2a)** voor alle gezondheidsdelen | zolang lid | Training (Schema's) en Leden |
| **Metingen** | gewicht, lengte, vet, omtrek, spiermassa, rusthartslag, bloeddruk | `club_metingen` | voortgang | **uitdrukkelijke toestemming**; database weigert een meting zonder (migratie 430) | zolang lid | Leden; elke inzage gelogd met de naam van het lid |
| Training | schema's, gelogde trainingen en sets (gewicht, herhalingen) | `club_schemas`, `club_schema_oefeningen`, `club_trainingslog`, `club_set_logs` | trainingsbegeleiding | overeenkomst | zolang lid | Schema's; het lid zelf in de app |
| **Voeding** | doel, kcal, macro's, adviezen, maaltijden | `club_voedingsplannen` | voedingsbegeleiding | toestemming (kan gezondheid raken) | zolang lid | Voeding |
| **Voedingsdagboek** | wat het lid per maaltijd at (naam, portie, kcal, macro's), eigen producten, favorieten, keuzes (start, trainer mag meekijken, eigen doel, toestemming AI-schatting) | `club_voeding_logs`, `club_voeding_producten`, `club_voeding_favorieten`, `club_voeding_instellingen` | het lid houdt zelf bij wat het eet (ledenapp) | uitdrukkelijke keuze van het lid (start met tijdstip en tekstversie); trainer alleen met een aparte ja van het lid; AI-schatting alleen met een aparte toestemming (tijdstip en tekstversie) | instelbaar, standaard 12 maanden (`voeding_dagboek_maanden`); weg bij verwijderen | Voeding, alleen met `trainer_zien` |
| Notities | vrije tekst van medewerkers | `club_notities` | begeleiding | gerechtvaardigd belang | zolang lid | Leden. Afspraak: geen gezondheid in vrije tekst |
| Challenges | deelname, scores (tellingen) | `club_challenge_deelnemers` | activiteiten | gerechtvaardigd belang | zolang lid | Challenges; in de app staan andere leden alleen op de ranglijst als ze zich inschreven of zelf voor ranglijsten kozen |
| Community | berichten, reacties, meldingen, groepen, ranglijstkeuze | `club_community_*` | ledencommunity | overeenkomst / toestemming (ranglijst) | zolang lid | Community |
| Opvolging | reden (bijv. wegblijven, verjaardag), status | `club_opvolgtaken` | ledenbehoud | gerechtvaardigd belang | zolang lid | Opvolgen |
| Berichten aan leden | mails en app-meldingen (les, afspraak) | `club_meldingen`, `club_meldingen_voorkeuren`, `club_push_abonnementen` | informeren | overeenkomst | meldingen 12 maanden; push-toestel na 6 maanden zonder melding weg | systeem |
| Ledenapp | inloglink, gehashte pincode, sessies (hash), laatste inlog | `club_lid_toegang`, `club_lid_sessies` | inloggen | overeenkomst | verlopen sessies elke nacht weg | niemand leesbaar (hashes) |
| Betalen in de app | aankopen, tegoeden, gebruik | `club_betalen_verkopen`, `club_betalen_tegoeden`, `club_betalen_mutaties` | verkoop losse lessen en pakketten | overeenkomst, wettelijke plicht | verkopen 7 jaar (fiscaal), bij verwijderen zonder lid; tegoeden weg | eigenaar |
| Leads | naam, e-mail, telefoon, bron, interesse, status, proefles, contactmomenten | `club_leads`, `club_lead_historie` | belangstellenden opvolgen | gerechtvaardigd belang / precontractueel | 12 maanden na het laatste contact (instelbaar 3 tot 36) automatisch gewist (naam en contact weg, telling blijft) | Leads |
| Proefles via widget | als leads, plus gekozen les | `club_leads` (bron Website), `club_lead_historie` | aanvraag proefles | toestemming / precontractueel (privacylink van de sportschool in de widget) | als leads | Leads |
| Medewerkers | naam, e-mail, rollen, vestigingen, contracturen | `club_medewerkers`, `club_medewerker_toegang`, `club_medewerker_sessies` | planning, rechten, inloggen | arbeidsovereenkomst | zolang in dienst; daarna op verzoek wissen (naam wordt "Oud-medewerker XXXX") | Instellingen, eigenaar |
| Rooster en uren | diensten, gewerkte tijden, pauze, ziek, verlof, ruilen, goedkeuring | `club_diensten`, `club_beschikbaarheid`, `club_rooster_notities` | rooster en urenadministratie | arbeidsovereenkomst, wettelijke plicht | diensten en uren 7 jaar (fiscale bewaarplicht); beschikbaarheid en roosternotities 24 maanden | Personeel, administratie |
| Taken | wie vinkte wat af | `club_taak_afvinken`, `club_taak_afsluitrondes`, `club_taak_notities` | dagelijkse taken | gerechtvaardigd belang | 24 maanden | Taken |
| Logboek | wie, actie, onderwerp (soms een naam) | `club_logboek` | verantwoording, beveiliging | gerechtvaardigd belang | 24 maanden (instelbaar 6 tot 84); namen eruit bij verwijderen van lid, lead of medewerker | eigenaar |
| Beheerders | naam, e-mail, rol, gehashte pincode | `club_beheerders`, `club_beheerder_sessies` | toegang beheeromgeving | overeenkomst | zolang beheerder; verlopen sessies elke nacht weg | Kane, eigenaar |

## 3. AI Your Gym als verantwoordelijke

| Verwerking | Gegevens | Tabel | Bewaartermijn |
|---|---|---|---|
| Demo-aanvragen website | naam, sportschool, e-mail, telefoon, voorkeur, opmerking, IP als HMAC | `ayg_demo_aanvragen` | 12 maanden |
| Aanmeldingen | eigenaar, e-mail, telefoon, pakket, Stripe-kenmerken | `ayg_aanmeldingen` | nooit klant geworden: 12 maanden; klanten: looptijd plus fiscale termijn (open beslissing) |
| Hulpvragen | melder (naam, rol), vraag, antwoord | `club_support` | 24 maanden na laatste wijziging |
| Foutregistratie | route, soort, sportschool-id, geschoonde melding | `club_fouten` | 90 dagen; e-mail, uuid's, tokens, cijfers en tekst tussen aanhalingstekens worden eruit gehaald |

## 4. Gezondheidsgegevens

- **Toestemming:** een losse meting kan niet zonder toestemming (database, migratie 430). Een intake slaat **zonder toestemming geen enkele meting en geen gezondheidsantwoord** op (`src/lib/club/training/intake.ts`, `GEZONDHEIDSMETINGEN` is sinds 20-10-2026 alle metingen) en toont ze ook niet (`intake-rij.ts`).
- **Rechten:** metingen via onderdeel Leden, intakes via Leden of Schema's, voeding via Voeding (`src/lib/club/beheerders/rechten.ts`). Elke inzage in metingen komt in het logboek met de naam van het lid.
- **Nergens anders:** niet in CSV-rapporten (`rapporten/definities.ts`), niet in mails, push of meldingen (alleen les- en afspraakteksten), niet in de widget, niet op ranglijsten (alleen tellingen). Wel in de AVG-export van het lid zelf.
- **Voedingsdagboek (migratie 466):** het lid start het dagboek zelf; trainers zien het op de ledenkaart alleen als het lid dat aanzet (en weer uit kan zetten). Het lid kan alles zelf wissen. Producten worden via onze server bij Open Food Facts opgezocht (alleen de zoekterm of barcode, geen lid); geen productfoto's van derden in de app.
- **AI-schatting in het voedingsdagboek (besluit Kane 29-10-2026, migratie 468):** inspreken is verwijderd (geen Groq of OpenAI meer). Wat blijft, alleen met `CLUB_VOEDING_AI_ACTIEF=1`: een maaltijdfoto of een korte omschrijving laten schatten. Voor het eerste gebruik geeft het lid uitdrukkelijk toestemming met de tekst "De foto gaat naar onze AI-dienst (Anthropic) om de maaltijd te schatten en wordt niet bewaard." (vastgelegd in `club_voeding_instellingen.ai_toestemming_op` en `ai_tekst_versie`, nu `ai-foto-2026-10-29`; intrekken kan in hetzelfde scherm en wist beide). De server weigert zonder toestemming (403). De browser verkleint de foto eerst (langste zijde 1024 px, JPEG). De foto en de omschrijving gaan via onze server naar Anthropic en worden door ons nergens bewaard of gelogd (alleen het soort fout bij een storing). Het antwoord is een voorstel: het lid ziet het altijd eerst, past het aan en bevestigt zelf; pas dan komt een regel in het dagboek (bron `foto` of `schatting`). Remmen: 6 per minuut en 30 per dag per lid (geheugen van de server). Code: `src/lib/club/voeding/dagboek/ai/`, `src/components/club/voeding/dagboek/AiPaneel.tsx`.
- **Ledenapp:** het lid ziet eigen gewicht, omtrek, vet en spiermassa, nooit bloeddruk of hartslag en nooit trainersnotities.
- **Let op:** de naam van een afspraaksoort (bijv. "Intake", "Meting") staat in herinneringen. Dat zegt niets over de gezondheid zelf; kies geen soortnamen als "Fysio rugklachten".

## 5. Rechten van betrokkenen in de software

| Wie | Inzage (art. 15 en 20) | Wissen (art. 17) |
|---|---|---|
| Lid | ledenkaart > Privacy (AVG) > downloaden (JSON plus samenvatting), `src/lib/club/leden/avg/` | ledenkaart > Lid verwijderen: 30 dagen terug te draaien, dan `club_lid_definitief_verwijderen` (elke nacht). Alleen Kane en eigenaar |
| Lead | leadkaart > Privacy (AVG) > downloaden | leadkaart > wissen: `club_lead_anonimiseren`. Kane, eigenaar, clubmanager. Een lead die lid werd gaat mee met het lid |
| Medewerker | medewerker > Privacy (AVG) > downloaden | eerst op inactief, dan wissen: `club_medewerker_anonimiseren`. Alleen Kane en eigenaar. Uren blijven (bewaarplicht) zonder naam |
| Website (AI Your Gym) | Kane zoekt in `ayg_demo_aanvragen` en `ayg_aanmeldingen` (Supabase) | Kane verwijdert de rij; anders automatisch na 12 maanden |

**Volledigheid bewaakt door een test:** `src/lib/club/leden/avg/tabellen.ts` noemt elke tabel met `lid_id`; `tabellen.test.ts` leest alle migraties en faalt als een tabel met `lid_id` niet in die lijst, niet in de export of niet in de laatste versie van `club_lid_definitief_verwijderen` staat.

## 6. Automatisch opruimen (pg_cron, LifeOS-database)

| Taak | Wanneer (UTC) | Wat |
|---|---|---|
| `club_fouten_opruimen` | 03:40 | foutregistratie ouder dan 90 dagen |
| `club_lid_verwijderingen_afronden` | 03:50 | verzoeken tot verwijderen na 30 dagen definitief |
| `club_privacy_opruimen` (migratie 449) | 04:05 | per sportschool: leads wissen, oud-leden aanvragen, bezoek en boekingen loskoppelen, logboek inkorten; voor iedereen: meldingen 12 maanden, verlopen sessies (leden, medewerkers, beheerders), push 6 maanden, remmen 7 dagen, hulpvragen 24 maanden, beschikbaarheid, roosternotities en taken 24 maanden, diensten 7 jaar, website-aanvragen 12 maanden |

De termijnen per sportschool staan in `club_privacy_instellingen` en zijn in te stellen op **Instellingen > Sportschool > Privacy en bewaren** (`/club/beheer/privacy`, alleen Kane en eigenaar). Demodata (`demo = true`) valt erbuiten.

## 7. Logging, foutregistratie en IP-adressen

- Server-logs: alleen een prefix en de foutmelding of code, geen verzoeken, namen of e-mailadressen. Rapportfouten loggen alleen naam en melding van de fout.
- `club_fouten` schoont de melding (`src/lib/club/betrouwbaarheid/fout.ts`). Een losse naam in een databasemelding kan erdoor glippen; de termijn is daarom kort (90 dagen).
- IP-adressen worden nooit bewaard. De remmen (widget, app-aanvragen, demo-aanvragen) bewaren een **HMAC met een servergeheim** (`src/lib/club/kern/rem-hash.ts`, geheim `CLUB_REM_GEHEIM` of anders de service-sleutel), dus niet terug te rekenen. Inlogremmen tellen in het geheugen van de server.
- Het logboek bewaart namen van leden in het onderwerp; die gaan eruit bij verwijderen.

## 8. Cookies en lokale opslag

Alleen functionele cookies; geen analytische of trackingcookies en geen scripts van derden (Google Analytics, pixels en dergelijke zijn er niet). Een cookiebanner is daarom niet nodig; vermeld de cookies wel in de privacyverklaring.

| Cookie | Doel | Looptijd | Instellingen |
|---|---|---|---|
| `__Host-club_lid` | sessie ledenapp | 90 dagen | httpOnly, Secure, SameSite=Lax |
| `__Host-club_lid_link` | onthoudt de persoonlijke link van het lid | 400 dagen | idem |
| `__Host-club_sessie` | sessie eigenaar of clubmanager | 30 dagen, 7 dagen inactief | idem |
| `__Host-club_mw_sessie` | sessie medewerker | 30 dagen, 7 dagen inactief | idem |
| `club-org` | welke sportschool Kane bekijkt | 180 dagen | httpOnly, Lax |

Lokale opslag op het toestel (geen cookie, gaat niet naar de server): training in uitvoering en nog niet verstuurde sets (`club-training-*`, gaat weg bij uitloggen), keuzes voor installeren en meldingen (`club-app-*`), en op de balie de naam van wie taken afvinkt (`club-taken-persoon:*`). De website en de widget zetten geen cookies.

## 9. Subverwerkers

Zie Bijlage 3 van de verwerkersovereenkomst. Kort: Supabase (database, Frankfurt), Render (hosting), Resend (mail), Stripe (abonnement AI Your Gym; bij Betalen in de app ook de betaling van leden via het Stripe-account van de sportschool), en de push-diensten van de browser (Google, Apple, Mozilla) die alleen versleutelde berichten doorgeven. Geen AI-diensten met gegevens van leden, met een uitzondering die standaard UIT staat: de AI-schatting van het voedingsdagboek (foto of omschrijving; `CLUB_VOEDING_AI_ACTIEF`). Staat die aan, dan is Anthropic subverwerker (Bijlage 3, alleen als de sportschool de foto-functie gebruikt): de foto of omschrijving gaat er alleen heen na toestemming van het lid en wordt door ons niet bewaard. Inspreken is verwijderd (besluit Kane 29-10-2026); Groq en OpenAI zijn geen subverwerker. Open Food Facts krijgt alleen zoektermen en barcodes van onze server, geen persoonsgegevens.

## 10. Nieuwe functie? Checklist

1. Nieuwe tabel met `lid_id`: in `tabellen.ts`, in export (`export.ts` en `opslag.ts`) en een nieuwe versie van `club_lid_definitief_verwijderen` (de test dwingt dit af).
2. Gegevens van medewerkers of leads: in de export en de wisfunctie van lead of medewerker.
3. Kies een bewaartermijn en zet hem in `club_privacy_opruimen` en in dit document.
4. Gezondheid: alleen met toestemming, niet in rapporten, mails, push of widget.
5. Geen persoonsgegevens in `console.error`; IP alleen via `remSleutel`.
6. Nieuwe cookie of script van derden: eerst nagaan of er toestemming nodig is.

## 11. Open beslissingen (Kane)

- Standaardtermijnen bevestigen: leads 12 maanden, oud-leden 24 maanden, bezoek 24 maanden, logboek 24 maanden, meldingen 12 maanden.
- Bewaartermijn klanten AI Your Gym (`ayg_aanmeldingen`) na opzeggen.
- Back-ups: het gratis Supabase-plan maakt geen back-ups; kiezen en de bewaartijd in de verwerkersovereenkomst zetten.
- Regio van Render en Resend controleren en invullen.
- Of de sportschool leden laat kiezen voor de ranglijst bij automatische challenges (nu: alleen wie zelf koos, net als bij de community).
