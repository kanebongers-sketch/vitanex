# MentaForce — Patchnotes

Hier staat alles wat er is veranderd aan de app, in gewone taal.

---

## 11 juni 2026 — laatste beveiligingsronde: alles dicht

### 🔒 HR-overzicht lekte naar andere bedrijven — gedicht
Het teamoverzicht (namen, laatste check-in, welzijnsscores) werd door de database aan élke ingelogde gebruiker gegeven; alleen de app filterde op bedrijf. Een handige gebruiker kon dus data van andere bedrijven opvragen. De database filtert nu zélf: alleen HR/admin ziet medewerkers, en alleen van het eigen bedrijf. Getest in beide richtingen (HR ziet wel, medewerker ziet niets, anoniem geweigerd).

### 🔒 Alle overige database-waarschuwingen weggewerkt
Van 22 security-meldingen naar 0 echte: sportvoortgang respecteert nu ieders eigen rechten, HR-code-logs zijn alleen nog server-side leesbaar, database-functies zijn vastgepind en niet meer van buitenaf aanroepbaar, en de avatars-map is niet meer doorbladerbaar. Registratie en check-ins zijn na de wijzigingen end-to-end getest — alles werkt.

### ✅ Outreach-agent draait bewezen op de veilige sleutel
De eerste geplande run na de sleutelwissel is geslaagd.

### 👉 Eén klusje voor jou
"Leaked password protection" aanzetten kan alleen handmatig: Supabase dashboard → Authentication → Providers → Email → "Prevent use of leaked passwords" aanvinken.

---

## 11 juni 2026 — grote schoonmaak onder de motorkap

### 🔒 Outreach-data is nu echt afgeschermd
De bedrijven, contacten en concept-mails van de outreach-agent waren via de publieke API voor iedereen leesbaar. Het script is omgezet naar een veilige sleutel (lokaal én in GitHub) en de database-regels zijn aangescherpt en geverifieerd: buitenstaanders zien nu niets meer, de agent en het dashboard werken gewoon door.

### 🔧 135 codeproblemen opgelost — de linter is nu helemaal schoon
Waaronder een paar échte bugs:
- **Invoervelden op de Voedingspagina verloren focus** bij elke toetsaanslag (componenten werden per render opnieuw aangemaakt) — gefixt.
- **Het agent-dashboard kon in een render-lus belanden** door een afhankelijkheidscyclus — gefixt.
- Verder: dode code en ongebruikte variabelen verwijderd, React-effecten herschreven volgens de nieuwe compiler-regels, en alle tekst-escaping netjes gemaakt.

### ✨ Eerste geautomatiseerde tests
Het project heeft nu een testfundament (vitest) met 22 tests op de meest kritieke logica: de beveiliging van wearable-koppelingen en de gezondheidsberekeningen. Draai ze met `npm test`.

---

## 11 juni 2026 — Gezondheid nieuwe stijl

### ✨ Gezondheidspagina volledig vernieuwd — zoals Apple Health
De pagina Gezondheid is opnieuw ontworpen als een persoonlijk gezondheidsoverzicht:

- **Mijn metingen** — een kaartje per meting (stappen, slaap, hartslag, stemming, verbranding, welzijn) met je laatste waarde, een mini-grafiekje van de afgelopen twee weken en de datum van de meting.
- **Tik op een kaartje** voor het detailscherm: kies week, twee weken of maand, zie je gemiddelde, hoogste en laagste waarde, een volledige grafiek én uitleg over wat de meting betekent.
- **Hoogtepunten** — de app vergelijkt automatisch deze week met vorige week ("29% meer stappen — lekker bezig!") met visuele balkjes, naast je bekende patronen.
- **Burn-out risicometer** bovenaan, met risicofactoren als overzichtelijke labels.
- **Ontdek meer** — snelle navigatie naar Voeding, Sport, Check-in en Koppelingen.

Alles werkt op telefoon én desktop, met rustige animaties (die netjes uit gaan als je systeem "minder beweging" aan heeft staan).

### 🔧 Wijzigingen kwamen soms niet aan tijdens ontwikkelen
De app vertelde browsers om code een jaar lang te bewaren — ook tijdens het ontwikkelen, waardoor je soms oude versies bleef zien. Die regel geldt nu alleen nog voor de echte website.

---

## 10 juni 2026 — beveiligingsronde

### 🔒 Wearable-koppelingen zijn nu echt veilig
Bij het koppelen van Fitbit, Google Fit of Google Agenda reisden je toegangssleutels via de adresbalk van de browser — daar konden ze blijven hangen in geschiedenis en logs. Dat is helemaal dicht: de sleutels worden nu direct op de server opgeslagen en de koppeling is cryptografisch gebonden aan jouw account (CSRF-bescherming met een getekende state).

### 🔧 Google Fit-koppeling deed het stiekem niet
De database weigerde Google Fit-sleutels op te slaan door een te strenge controle. Gefixt — koppelen werkt nu echt.

### 🔧 Fitbit- en agendagegevens laadden nooit
De pagina Koppelingen vroeg data op zonder je identiteit mee te sturen, dus kreeg je altijd "niet ingelogd" terug. Nu zie je je stappen, slaap en agenda-inzichten gewoon.

### 🔒 Telegram-bot alleen voor Kane
De Telegram-webhook accepteerde berichten van iedereen die de bot vond — en elke vraag kostte AI-tegoed. De bot reageert nu alleen nog op de eigen chat.

### 🔒 Oude installatie-endpoints verwijderd
Twee overgebleven endpoints konden zonder login databasewijzigingen uitvoeren. Weg ermee.

### 🔒 Outreach-data afgeschermd (migratie klaarstaand)
De tabellen van de outreach-agent waren via de publieke API voor iedereen leesbaar én schrijfbaar. Er staat een migratie klaar die dit afsluit — eerst checken of het outreach-script de service role key gebruikt, dan toepassen.

---

## 8 juni 2026 — tweede ronde

### ✨ Inloggen met Google
Op de loginpagina staat nu een "Inloggen met Google" knop. Eén tik en je bent binnen — geen wachtwoord nodig. Werkt zodra Google OAuth is aangezet in Supabase.

### ✨ Knoppen voelen beter aan — overal
Op de homepagina zweefden kaartjes en knoppen al bij aanraken, maar dat werkte alleen op een muis. Nu werkt het ook op telefoon. Kaartjes komen een klein beetje omhoog als je er overheen gaat, knoppen veren in als je ze indrukt.

### ✨ Coach heeft emoji-suggesties
De suggestieknoppen in de AI-coach hebben nu emoji's erbij: 😰 gestrest, ⚡ energie op, 😴 slecht slapen, enzovoort. Ook is er een "Wissen" knop om het gesprek te resetten.

### ✨ Teamoverzicht — wanneer heeft iedereen ingecheckt?
In de teampagina zie je nu per teamlid wanneer ze voor het laatst hun check-in hebben gedaan:
- 🟢 Groen: afgelopen week
- 🟡 Oranje: 8–14 dagen geleden
- 🔴 Rood: langer dan 2 weken geleden
- Grijs: nog nooit ingecheckt

---

## 8 juni 2026

### 🔧 Statistieken stonden op één rij in plaats van een grid
De cijfers op de homepagina (1 | 72 | 0) stonden naast elkaar op één rij. Dat zag er raar uit op telefoon. Nu staan ze netjes in een 2×2 blokje.

### 🔧 Knoppen op de vitaalscorekaart vielen buiten het scherm
De drie knoppen op de groene kaart pasten niet op een klein scherm. De kaart staat nu verticaal, en de derde knop ("Nieuwe check-in") is weggehaald op mobiel.

### 🔧 Bovenste balk kon je niet aanklikken op Android
De navigatiebalk bovenaan zat te hoog — deels verstopt achter de statusbalk van Android. Hij staat nu op de juiste plek.

---

### ✨ 12 kleine verbeteringen in één keer

- **Testknop verstopt in productie** — de "Auto" en "Testmodus" knoppen in de check-in zijn nu onzichtbaar als echte gebruikers de app gebruiken. Ze zijn er alleen voor ons tijdens het bouwen.
- **Geen auto-zoom op iPhone** — als je iets typt in de check-in, zoomt de iPhone niet meer raar in. Dat was irritant.
- **Check-in scrollt goed op Android** — onderaan de check-in was soms wat ruimte te weinig. Nu past alles netjes boven de thuisknop.
- **Voortgangsbalk werkt nu ook voor blinden** — schermlezers kunnen nu de voortgangsbalk lezen ("45% ingevuld").
- **Hamburger-knop is groter** — het icoontje om het menu te openen was te klein om makkelijk op te tikken. Nu is het minstens 44×44 pixels — de minimumgrootte voor vingers.
- **Menu-knop heeft een label** — schermlezers lezen nu "Menu openen" of "Menu sluiten" voor de hamburgerkop.
- **Scoreringel beschrijft zichzelf** — de groene ring met je score zegt nu ook "Vitaliteitsscore: 72 van 100" voor wie de app met ogen dicht gebruikt.
- **Loginformulier heeft labels** — schermlezers wisten niet welk veld voor e-mail en welk voor wachtwoord was. Nu wel.
- **Foutmeldingen bij inloggen worden voorgelezen** — als je verkeerd wachtwoord invult, leest een schermlezer de fout meteen voor.
- **Rapport is niet meer te breed op grote schermen** — de pagina had geen maximale breedte. Nu stopt hij op 900px zodat het leesbaar blijft.
- **Animaties uit als je dat wilt** — als je op je telefoon hebt ingesteld dat je minder animaties wilt, houdt de app zich daar nu aan.

---

### ✨ Navigatiebalk onderaan

Er is een balk onderaan het scherm gekomen met vier knoppen: **Home**, **Check-in**, **Rapport** en **Coach**. Zo hoef je niet meer het hamburgermenu te openen voor de meest gebruikte pagina's.

### ✨ Zachtere herinnering aan check-in

Als je je wekelijkse check-in nog niet hebt gedaan, kreeg je vroeger een harde doorstuur naar de check-in pagina. Nu krijg je een vriendelijk scherm van onderen met "Vul je check-in in — duurt maar 3 minuten" en een knop. Je kan ook "Misschien later" klikken.

### ✨ Terug-knop werkt op Android

De terug-knop op Android deed soms niks, of sloot de app helemaal. Nu gaat hij netjes één pagina terug. Op de homepagina minimaliseert hij de app in plaats van hem te sluiten.

---

### ✨ Actieplan zichtbaar in rapport

De AI maakte al een actieplan — maar dat was onzichtbaar. Nu zie je in je rapport een groene kaart met genummerde stappen: wat je moet doen, waarom, en wanneer.

### ✨ Aandachtspunten zichtbaar in rapport

Ook de aandachtspunten van de AI waren verstopt. Die staan er nu ook bij, met oranje bolletjes per punt.

### ✨ Check-in is toegankelijker voor schermlezers

De vragen per onderdeel (Slaap, Stress, etc.) zijn nu gegroepeerd. Een schermlezer weet nu dat die vragen bij "Slaap" horen.

### ✨ Knoppen voelen beter aan op telefoon

De "schaal"-knoppen en navigatieknoppen in de check-in veerkeren nu terug als je erop drukt. Dat werkt nu ook op touch — voorheen werkte dat alleen op een muis.

### ✨ Welkomstscherm bij eerste gebruik

Nieuwe gebruikers zien nu eerst een welkomstscherm met drie voordelen van de app voordat ze hun profiel invullen. Fijner dan meteen een formulier.

### 📧 Wekelijkse herinnerings-e-mail (klaar voor activatie)

Er is een systeem gebouwd dat elke maandag een mailtje stuurt naar mensen die hun check-in nog niet hebben gedaan. Dit staat klaar maar moet nog worden aangezet in de Supabase-instellingen.

---

---

## 8 juni 2026 — design upgrade

### ✨ Vitaliteitsscore ziet er veel beter uit
De grote ring met je score op de homepagina was best klein en saai. Nu is hij groter (130px), en de achtergrond van de hele kaart verandert mee met je score: groen als je goed scoort, geel als het matig is, rood als je extra zorg nodig hebt. Voelt meteen als een premium app.

### ✨ Rapport ook met kleur-achtergrond
Zelfde behandeling voor je rapport: de score-kaart bovenaan heeft nu ook een kleurverloop dat past bij hoe je ervoor staat.

### ✨ Aandachtspunten en actieplan in rapport
De AI maakte al aandachtspunten en een actieplan — maar die waren bijna onzichtbaar. Nu staan de aandachtspunten met oranje bolletjes duidelijk in beeld, en het actieplan heeft een groene kaart met genummerde stappen (wat, waarom, wanneer).

### ✨ Coach-suggesties met emoji's
De suggestieknoppen in de AI-coach hebben nu emoji's: 😰 gestrest, ⚡ energie op, 😴 slecht slapen, enz. Ook zijn er 2 nieuwe suggesties bijgekomen.

### ✨ Navigatiebalk onderaan is glassmorphism geworden
De balk onderaan het scherm (Home / Check-in / Rapport / Coach) heeft nu een doorzichtig, wazig effect — net zoals bij moderne apps als Arc of iOS. De actieve tab heeft een subtiel gekleurd bolletje als indicator.

### 🔧 Statistiek-kaartjes hover werkt nu via CSS
De kaartjes op de homepagina die omhoog kwamen bij aanraken hadden nog oud JavaScript in zich. Nu werkt dat via CSS-klassen — schoner en sneller.

*Volgende update volgt zodra er iets nieuws is gebouwd.*
