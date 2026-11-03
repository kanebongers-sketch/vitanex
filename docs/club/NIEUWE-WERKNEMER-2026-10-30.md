# Club en ledenapp door de ogen van een nieuwe werknemer | 30-10-2026, bijgewerkt 03-11-2026

Opdracht Kane (30-10-2026): "Heel de app heeft veel functies maar het moet duidelijk blijven. Alles moet beknopter en overzichtelijker. Ik weet wel hoe alles werkt, maar hoe doet een werknemer dit?"

Sinds 03-11-2026 staat alles op vijf vaste plekken: **Vandaag, Leden, Rooster, Training en Beheer** (`EENVOUD-10-MINUTEN.md`, opbouw in `STRUCTUUR.md`). Op de pc bovenin, op de telefoon dezelfde vijf onderin. In de kop alleen zoeken (Ctrl K), **?** (Hulp met Wat is nieuw) en je naam (vestiging, taal, uitloggen). Het volledige uitlegscript (eigenaar 10 minuten, trainer 3 minuten, lid 2 minuten) staat in hoofdstuk 7 van `EENVOUD-10-MINUTEN.md`; hieronder per rol wat je ziet en waar het staat.

Werkwijze: gelezen uit de code (pagina's, woordenboeken, rechten per rol in `src/lib/club/rollen/standaard.ts`, menu in `src/components/club/shell/onderdelen.ts`). Niet in de browser geklikt (geen dev-server).

Tekens: **A** = aangepast, **O** = staat nog open.

## Per rol: wat je ziet en waar het staat

### Eigenaar en clubmanager

Startpagina: Vandaag. Plekken: alle vijf (de clubmanager zonder wat alleen de eigenaar mag: abonnement, betalen, rechten, adres, privacy).

| Wat | Waar | Klikken |
|---|---|---|
| Wat er nu gebeurt | Vandaag: check-in bovenaan, lessen, wie werkt, taken, Bellen vandaag | 0 |
| Iets aan het team zeggen | Vandaag · Prikbord: mededeling plaatsen aan vestigingen en rollen, eventueel verplicht; je ziet wie bevestigde | 2 |
| Werkwijzen (openen, sluiten, ongeval) | Vandaag · Prikbord, blok Werkwijzen | 1 vanaf het Prikbord |
| Leden en de ledenkaart | Leden · Leden; kaart met Overzicht, Training, Lidmaatschap | 2 |
| Leads en opvolgen | Leden · Leads, tabbladen Leads en Opvolgen | 2 |
| Ledenapp bekijken | Leden · Ledenapp, Bekijk als lid | 2 |
| Rooster | Rooster · Lessen, Agenda, Diensten | 2 |
| Schema's en bibliotheek | Training · Schema's (tabblad Bibliotheek), Voeding | 2 |
| Cijfers en exports | Beheer · Cijfers, Exporteren en Alle exports onderaan | 1 tot 2 |
| Team, rollen, abonnement, koppelingen | Beheer · Instellingen (acht categorieen, Koppelingen als losse link bovenaan) | 2 tot 3 |
| Hulp en Wat is nieuw | **?** rechtsboven | 1 |

### Trainer

Startpagina: Vandaag. Plekken: Vandaag, Leden, Rooster, Training.

| Wat | Waar | Klikken |
|---|---|---|
| Lid inchecken | Vandaag, bovenaan: scannen, of naam typen en Enter | 1 tot 2 |
| Mededelingen lezen en bevestigen | De regel bovenaan Vandaag ("1 mededeling te bevestigen") opent het Prikbord | 2 |
| Taak afvinken | Vandaag, sectie Taken (of Vandaag · Taken); de ingelogde medewerker staat er al als afvinker (`ikAlsAfvinker`) | 1 |
| Wie bel ik vandaag | Vandaag, sectie Bellen vandaag; de volledige lijst bij Leden · Leads, Opvolgen | 0 |
| Lid opzoeken | Vergrootglas of Ctrl K, naam typen | 2 plus typen |
| Notitie bij een lid | Ledenkaart, Overzicht, hoofdactie Notitie toevoegen | 1 vanaf de kaart |
| Schema voor een lid | Ledenkaart, Training, Schema maken (zonder intake: Intake starten); daarna terug naar het lid | 3 plus de editor |
| Eigen afspraken | Rooster · Agenda | 2 |

### Groepslesinstructeur

Startpagina: Rooster · Lessen. Plekken: Vandaag (alleen lezen) en Rooster.

| Wat | Waar | Klikken |
|---|---|---|
| Eigen lessen | Lessen, snelknop Mijn lessen (in de URL, weer uit te zetten) | 1 |
| Deelnemers en wachtlijst | Les openen | 1 |
| Aanwezigheid | In de les per deelnemer afvinken; wie incheckte staat er al op | 1 per deelnemer |
| Mededelingen, werkwijzen, overdracht | Vandaag · Prikbord | 2 |

Een leeg rooster zegt "Nog geen lessen in deze week. De roosteraar of clubmanager zet ze erin.", zonder knop naar Instellingen.

### Roosteraar

Startpagina: Rooster · Diensten. Plekken: Vandaag (Prikbord) en Rooster.

| Wat | Waar | Klikken |
|---|---|---|
| Dienst plannen | Diensten, weekrooster: uur aanklikken, medewerker kiezen, Inplannen | 3 |
| Week vullen | Diensten, Kopieer vorige week, Aanvullen of Vervangen | 3 |
| Groepslessen verzetten of vervanger | Rooster · Lessen | 1 |
| Afspraken | Rooster · Agenda | 1 |

Wie Diensten mag bewerken, opent op het weekrooster en niet op Mijn diensten (`opentBijEigenDiensten`, getest).

### Administratie

Startpagina: Rooster · Diensten, tabblad Uren. Plekken: Vandaag (Prikbord), Rooster en Beheer (alleen de exports).

| Wat | Waar | Klikken |
|---|---|---|
| Uren controleren | Diensten, Uren: per medewerker gepland, gewerkt en contract | 0 tot 1 (periode) |
| Goedkeuren | Alles goedkeuren, afwijkingen apart openen en goedkeuren | 2 plus afwijkingen |
| Naar de salarisadministratie | CSV voor salaris, Markeer als verwerkt (ligt daarna vast) | 1 en 2 |
| Andere exports | Beheer · Cijfers, Alle exports | 2 |

### Nieuw lid in de ledenapp

Onderbalk: Home, Boeken, Schema, Voeding, Profiel.

| Wat | Waar | Klikken |
|---|---|---|
| Activeren | Link of QR van de sportschool, wachtwoord kiezen | 3 tot 4 |
| Inchecken | Home, QR bovenaan | 1 |
| Les of afspraak boeken | Boeken | 2 |
| Schema volgen | Schema; per set een tik. Zonder schema van de trainer start het lid er zelf een | 1 |
| Voeding | Voeding: dagboek bovenaan, het plan als compacte kaart | 1 |
| Gegevens, foto, kopen | Profiel | 1 tot 2 |

## Eerste-keer-kaarten

Hoogstens drie wegklikbare kaarten per rol op de startpagina (NL en EN, kop plus een korte regel). Sinds 03-11-2026 (`WELKOM_VERSIE` 2, dus iedereen ziet ze nog een keer) volgen ze de vijf plekken:

| Rol | Staat op | Kaarten |
|---|---|---|
| Eigenaar | Vandaag | Alles op vijf plekken · Je team op het Prikbord · Cijfers en instellingen in Beheer |
| Clubmanager (en het master account) | Vandaag | Alles op vijf plekken · Je team op het Prikbord · Kwijt? Druk Ctrl K (Hulp onder ?) |
| Trainer | Vandaag | Begin op Vandaag (check-in) · Lees het Prikbord · Alles van een lid op de ledenkaart |
| Instructeur | Rooster · Lessen | Je lessen staan bij Lessen · Aanwezigheid afvinken · Lees het Prikbord |
| Roosteraar | Rooster · Diensten | Diensten plannen · Snel een nieuwe week · Groepslessen bij Lessen |
| Administratie | Diensten, Uren | Uren goedkeuren · Naar de salarisadministratie (exports bij Cijfers) · Lees het Prikbord |
| Lid | Home in de ledenapp | Boek een les · Volg je schema · Maak het je eigen |

Code: rol in `src/lib/club/rollen/welkom.ts` (`welkomRol`, zelfde volgorde als de startpagina), teksten in `src/lib/aiyourgym/taal/woorden/club/welkom.ts`, knoppen en doelen in `src/components/club/welkom/WelkomVoorRol.tsx`. Een knop naar het scherm waar je al bent valt weg. Wegklikken onthoudt het account (migratie 476), de browser is het vangnet. Kaarten echt anders: `WELKOM_VERSIE` ophogen.

## Eerder aangepast (30-10-2026, geldt nog)

- **A** Taken: een ingelogde medewerker vinkt meteen af onder de eigen naam (`src/lib/club/taken/ik.ts`).
- **A** Lessen: snelknop Mijn lessen.
- **A** Vandaag voor de vloer: wie geen leiding is, ziet "Nu in de club" en "Leden met risico" onder een uitklapbaar Meer.
- **A** Leesmodus: wie Leden of Leads alleen mag zien, krijgt op de ledenkaart en bij Leads geen knoppen die iets wijzigen.
- **A** Regel "alleen eigen leden" per vestiging (`club_vestigingen.alleen_eigen_leden`, migratie 477, aan voor Eersel).
- **A** Kortere teksten (NL en EN) bij Vandaag, check-in, taken, notities, schema-editor, ledenkaart, diensten, lessen en de ledenapp.
- **A** Geen concurrenten bij naam in uitleg en hulp.

## Wat nog openstaat

1. **O** Schakelaar voor "alleen eigen leden": de regel staat in de database, nog niet als schakelaar bij Regels per vestiging.
2. **O** Leesmodus op de ledenkaart: metingen en het voedingsplan hebben nog geen leesmodus; de API weigert wel.
3. **O** Zoektrefwoorden: het zoekveld vindt Ledenbestand inlezen ook op de namen van andere systemen. Die woorden zijn niet zichtbaar; weghalen als Kane dat wil.
4. **O** Open vragen uit `EENVOUD-10-MINUTEN.md`: de naam Prikbord, en of een verplichte mededeling iemand moet tegenhouden (nu alleen bovenaan Vandaag).
