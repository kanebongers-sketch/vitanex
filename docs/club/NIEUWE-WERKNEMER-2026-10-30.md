# Club en ledenapp door de ogen van een nieuwe werknemer | 30-10-2026

Opdracht Kane: "Heel de app heeft veel functies maar het moet duidelijk blijven. Alles moet beknopter en overzichtelijker. Ik weet wel hoe alles werkt, maar hoe doet een werknemer dit?"

Werkwijze: de app doorgelopen met de code als bron (pagina's, componenten, woordenboeken, rechten per rol in `src/lib/club/rollen/standaard.ts`). Klikken zijn geteld vanaf het startscherm van de rol, inclusief de klik die de actie afrondt. Niet in de browser geklikt (geen dev-server); de tellingen zijn dus "gelezen uit de code".

Tekens: **K** = knelpunt, **A** = aangepast in deze ronde, **O** = staat nog open.

## 1. Trainer, eerste dienst

Startpagina: Vandaag (`/club`). Rechten: werkvloer, leden, leads, schema's, voeding en afspraken bewerken.

| Stap | Klikken | Wat er gebeurt | Twijfel |
|---|---|---|---|
| Inloggen | 3 (e-mail, wachtwoord, Inloggen) | Na inloggen naar de startpagina van de rol (`?start=1`) | Geen. De eenmalige link uit de uitnodiging zet het wachtwoord. |
| Vandaag | 0 | Strook met taken en bezetting, check-in, cijfers, lessen, wie werkt, taken, opvolgen, leden met risico | **K** Lang scherm met tien blokken; een nieuweling weet niet waar te beginnen. **A** Eerste-keer-uitleg met drie kaarten (Vandaag, Check-in, Ledenkaart). |
| Lid inchecken | 1 tot 2 (scannen, of naam typen en Enter) | Check-in staat bovenaan Vandaag | **K** Foutmeldingen over de camera waren lang en technisch. **A** Ingekort: "De camera is geblokkeerd. Sta hem toe via het slotje naast het adres." |
| Taak afvinken | Was 3 (wie vinkt af kiezen, naam kiezen, vakje), nu 1 | Dag-tabel op Vandaag en bij Taken | **K** Een ingelogde medewerker moest eerst zichzelf kiezen bij "Wie vinkt af"; zonder keuze kwam een foutmelding. **A** De app vult de ingelogde medewerker zelf in (`ikAlsAfvinker`); wisselen kan nog. |
| Schema voor een lid | 5 (Leden, lid, tab Training, Schema maken, startpunt kiezen) plus de editor, dan Activeren | Schema start op de ledenkaart en opent als concept | **K** Uitlegregels in de keuze en in de editor waren twee zinnen lang. **A** Teruggebracht tot een korte zin. **O** Zoeken op naam kan sneller met Ctrl K, maar dat is op de telefoon niet te zien. |
| Notitie | 3 (Werkvloer, Notities, Nieuwe notitie) of via de ledenkaart (tab Contact en notities) | Twee plekken: algemene notities en notities bij een lid | **K** Introtekst somde alles op. **A** "Overdracht, afspraken, kennis en ideeen op een plek." De lege overdracht op Vandaag zegt nu wat je doet: "Geen overdracht. Schrijf er een bij Notities." |

Wat een nieuweling niet vindt: Ctrl K (geen zichtbare zoekknop op de telefoon, valt onder de navigatie-agent); het verschil tussen Opvolgen (op Vandaag) en Leads (eigen onderdeel).

## 2. Groepslesinstructeur

Startpagina: Groepslessen (`/club/rooster`). Rechten: rooster bewerken; Vandaag en Notities zien.

| Stap | Klikken | Twijfel |
|---|---|---|
| Eigen lessen | Was 2 (filter Instructeur openen, eigen naam zoeken), nu 1 | **K** Het rooster toont alle lessen van alle instructeurs; er was geen "mijn lessen". **A** Snelknop **Mijn lessen** bij de filters (alleen voor wie zelf lesgeeft), staat in de URL en is weer uit te zetten. |
| Deelnemers | 1 (les openen) | Paneel met deelnemers, proefleden en wachtlijst. Duidelijk. |
| Aanwezigheid | 1 per deelnemer | "Vink af wie er is. Nog een keer klikken zet het terug." Duidelijk. Wie incheckte, staat al op aanwezig. **A** Lege wachtlijst is nu een regel in plaats van twee zinnen uitleg. |

**O** Een leeg rooster verwijst naar Instellingen, Weekrooster; een instructeur mag daar niet komen. Beter: voor wie het rooster niet beheert alleen "Er staan deze week geen lessen."

## 3. Roosteraar

Startpagina: Personeel (`/club/personeel`). Rechten: personeel en rooster beheren, afspraken bewerken.

| Stap | Klikken | Twijfel |
|---|---|---|
| Personeel openen | 0 | **K** Bug: een roosteraar met een medewerkerslogin kwam zonder gekozen tabblad bij "Mijn diensten" uit, niet bij het weekrooster dat hij moet plannen. **A** Wie personeel minstens mag bewerken (v2) opent nu op het weekrooster (`opentBijEigenDiensten`, getest). |
| Dienst plannen | 3 (uur aanklikken, medewerker kiezen, Inplannen) | Duidelijk. Het formulier markeert wie kan en vrij is. |
| Week vullen | 3 (Kopieer vorige week, Aanvullen of Vervangen, bevestigen) | **A** Uitleg over Aanvullen en Vervangen ingekort. |
| Groepslesrooster | 2 (Planning, Groepslessen) | Duidelijk. |

## 4. Administratie

Startpagina: Personeel, tab Uren (`/club/personeel?tab=uren`).

| Stap | Klikken | Twijfel |
|---|---|---|
| Uren controleren | 0 tot 1 (periode kiezen) | **K** Voetnoot onder de tabel was een alinea. **A** "Gewerkt is zonder pauze. Avond is na 18:00. Open is gepland maar nog niet bevestigd." |
| Goedkeuren | 2 (Alles goedkeuren, bevestigen) plus afwijkingen apart | **K** "tellen niet mee bij alles goedkeuren" was moeilijk. **A** "3 afwijkingen: open ze en keur ze apart goed." |
| Exporteren | 1 (CSV voor salaris) en 2 (Markeer als verwerkt, bevestigen) | Duidelijk. **A** De eerste-keer-uitleg zegt dat verwerkt vastligt. |

## 5. Eigenaar

Startpagina: Cijfers. Rechten: cijfers, rapporten, team, instellingen, abonnement; leden en leads alleen zien.

| Stap | Klikken | Twijfel |
|---|---|---|
| Cijfers | 0 | Per kalendermaand, met uitleg bij elk cijfer. Duidelijk. |
| Team en rollen | 2 (Instellingen in de hulpbalk, categorie Team en rechten) | **K** Team staat alleen in het instellingencentrum (besluit Kane), dus een eigenaar zoekt het in het menu. **A** De eerste-keer-uitleg heeft een knop "Naar Team" die de categorie meteen opent. |
| Abonnement | 2 (Instellingen, Bedrijf en abonnement) | **A** Knop "Naar Abonnement" in de eerste-keer-uitleg. |

## 6. Nieuw lid in de ledenapp

| Stap | Klikken | Twijfel |
|---|---|---|
| Activeren | 3 tot 4 (link of QR openen, wachtwoord kiezen, bevestigen) | **A** Uitleg bij het wachtwoord ingekort tot een zin. |
| Les boeken | 2 (Lessen, les, Boek) | **K** De regels voor reserveren waren lange zinnen. **A** Korter ("Boek tot X dagen vooruit, hoogstens Y lessen tegelijk."). |
| Schema volgen | 1 (Schema) en per set een tik | Zonder schema van de trainer start het lid zelf een schema (lege toestand met knop). Duidelijk. |
| Voeding | 1 (Voeding) | Dagboek boven het plan. **O** Veel blokken onder elkaar (dagboek, eigen plan, plan van de trainer); de medische en AVG-teksten zijn bewust lang en zijn niet ingekort. |
| Profielfoto | 2 (Profiel, foto kiezen) plus bijsnijden | Duidelijk. |

**A** Bij de eerste keer op Home drie kaarten: Boek een les, Volg je schema, Maak het je eigen (Profiel). Een tabblad dat de sportschool uit heeft gezet, valt weg.

## Wat is aangepast

**Nieuw: eerste-keer-uitleg per rol** (NL en EN, hoogstens 3 kaarten, een tegelijk, wegklikbaar)
- Rol bepalen: `src/lib/club/rollen/welkom.ts` (`welkomRol`, zelfde volgorde als de startpagina; Kane ziet de uitleg van de clubmanager). Getest in `welkom.test.ts`.
- Teksten: `src/lib/aiyourgym/taal/woorden/club/welkom.ts` (zes rollen plus leden).
- Componenten: `src/components/club/welkom/` (`WelkomKaarten` client, `WelkomVoorRol` server). Wegklikken onthoudt de browser per sportschool, persoon, rol en versie (`WELKOM_VERSIE`); een knop naar het scherm waar je al bent valt weg.
- Staat op Vandaag, Cijfers, Groepslessen, Personeel (ook Uren) en Home in de ledenapp.

**Duidelijker gedrag**
- Taken: ingelogde medewerker vinkt meteen af onder de eigen naam (`src/lib/club/taken/ik.ts`, getest).
- Groepslessen: snelknop Mijn lessen.
- Personeel: roosteraar opent op het weekrooster (`opentBijEigenDiensten`, getest).

**Kortere teksten** (NL en EN): Vandaag (overdracht leeg, leden met risico), Check-in (camera), Taken (beheer), Notities (intro), schema-editor (kopie, progressie, geen sets, vervangen), ledenkaart (geen intake, schema maken), Personeel (week kopieren, uren goedkeuren, voetnoot), Groepslessen (wachtlijst), ledenapp (regels reserveren, wachtlijst, geen lessen, wachtwoord).

In cijfers: 8 schermen met kortere teksten, 3 schermen met minder klikken (taak afvinken 3 naar 1, eigen lessen 2 naar 1, roosteraar 1 klik minder en geen verkeerd startscherm), 5 startschermen plus Home in de ledenapp met eerste-keer-uitleg.

## Tweede ronde (zelfde dag)

- **Vandaag voor de vloer**: "Nu in de club" en "Leden met risico" staan voor wie geen leiding is onder een uitklapbaar Meer. Eigenaar en clubmanager zien ze meteen.
- **Leeg rooster voor een instructeur**: "Nog geen lessen in deze week. De roosteraar of clubmanager zet ze erin." Geen knop meer naar Instellingen voor wie daar niet mag komen.
- **Voeding in de ledenapp**: bovenaan het dagboek, het plan als compacte kaart (kcal en doel) met Bekijk plan; het hele plan en zelf maken of aanpassen zitten daarachter.
- **Uitleg per account**: wegklikken bewaart het account (migratie 476, uitgevoerd), dus niet meer per apparaat. De browser blijft het vangnet (master account zonder profiel, geen verbinding).
- **Regel van Eersel**: nu data per vestiging (`club_vestigingen.alleen_eigen_leden`, migratie 477, uitgevoerd, aan voor Eersel). Teksten bij check-in zijn algemeen ("Hier sporten alleen eigen leden").
- **Leesmodus**: wie Leden of Leads alleen mag zien, krijgt op de ledenkaart en bij Leads geen knoppen die iets wijzigen.
- **Geen concurrenten bij naam**: de uitleg bij Ledenbestand inlezen en het hulpartikel noemen geen andere software meer.

## Wat nog openstaat

1. **Zoeken op de telefoon**: Ctrl K is op de telefoon onzichtbaar. Hoort bij de navigatie-agent (shell).
2. **Schakelaar voor "alleen eigen leden"**: de regel staat in de database, maar nog niet als schakelaar bij Regels per vestiging.
3. **Leesmodus op de ledenkaart**: metingen (Voortgang) en het voedingsplan op de kaart hebben nog geen leesmodus; de API weigert wel.
4. **Zoektrefwoorden**: het zoekveld (Ctrl K, hulp) vindt Ledenbestand inlezen ook op de namen van andere systemen. Die woorden zijn niet zichtbaar; weghalen als Kane dat wil.
