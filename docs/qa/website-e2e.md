# QA website AI Your Gym (aiyourgym.com) | end-to-end

Datum: 28-10-2026. Getest live op https://aiyourgym.com met Playwright (Chromium), eerst op de versie van voor Update 239 en daarna opnieuw op Update 239 (obsidiaangrijs, theme-color `#0e0f11`). Alleen niet-destructief: alle POST-verzoeken werden in de browser afgebroken (`page.route`), er is geen formulier met geldige gegevens verstuurd, op het inlogscherm alleen lege of ongeldige waarden, nooit een wachtwoord. Schermafbeeldingen en scripts: `.playwright-mcp/qa/`.

Statussen: **live** = end-to-end geverifieerd op aiyourgym.com; **code** = opgelost in de code, vitest en tsc groen, nog niet live (wacht op push en deploy).

## Inventaris

Openbare pagina's (`src/app/(aiyourgym)/(website)/**`): `/` (voorpagina), `/aiyourgym/functies`, `/trainingsschemas`, `/voor-wie`, `/ledenapp`, `/prijzen`, `/overstappen`, `/demo`, `/demo-aanvragen`, `/aanmelden`, `/nieuw`, `/overstapchecklist`, `/prijs-op-maat`, `/privacy-en-beveiliging`, `/inloggen`, `/privacy`, `/voorwaarden`. Niet openbaar bedoeld maar bereikbaar: `/welkom` en `/testbetaling` (tonen zonder geldige link netjes "We herkennen deze link niet", geen formulier). Vangnet `[...onbekend]` geeft 404.

Kop: logo, Functies, Schema's, Voor wie, Ledenapp, Prijzen, Overstappen, Live demo, Plan een gratis demo, Probeer gratis, NL | EN, Menu (telefoon: paneel met 01 tot 06, Probeer 14 dagen gratis, Plan een gratis demo, Of bekijk de live demo, NL | EN).
Voet: AI Your Gym, Wat is er nieuw, Overstapchecklist, Prijs op maat, Privacy en beveiliging, Inloggen, Privacyverklaring, Voorwaarden.
Overige links in de pagina's: `?pakket=start|club|keten` naar aanmelden en prijs op maat, ankers op functies, trainingsschemas, voor-wie en demo.

## Testmatrix

| Onderdeel | Scenario | Verwacht | Werkelijk | Status | Probleem | Oplossing | Hertest |
|---|---|---|---|---|---|---|---|
| Alle 17 pagina's | Laden NL en EN, 1440 en 390 (68 runs) | 200, geen consolefout, geen 4xx/5xx | 68 keer 200, 0 consolefouten, 0 mislukte verzoeken | Geslaagd | Alleen waarschuwing "CSS preload niet gebruikt" | | live, Update 239 |
| Voorpagina 390 | Console bij scrollen | Geen fouten | Voor Update 239: `Permissions policy violation: accelerometer` (3D-weekring); in Update 239 weg | Geslaagd | (was P3) | Opgelost in Update 239 (Ring3d zonder deviceorientation) | live |
| Alle pagina's | Horizontaal scrollen (68 runs) | scrollWidth = clientWidth | 0 px overloop overal | Geslaagd | | | live |
| /trainingsschemas 390 | Tekst van de schemabouw leesbaar | Tekst binnen het scherm | Kop, lead en stappen lopen tot 549 tot 558 px door en worden rechts afgeknipt (NL en EN) | Mislukt | **P1** tekst onleesbaar op de telefoon. `.dag-schema-podium` had geen kolommaat, de brede editor rekte de enige kolom op | `grid-template-columns: minmax(0, 1fr)` in `dag/dag.css` | code |
| Telefoonmockups 390 | Voorpagina, ledenapp, overstappen | Beeld past | Tweede telefoon steekt bewust half buiten beeld; tabbalk van de mockup in ledenapp heeft overlappende labels | Geslaagd met opmerking | P3 cosmetisch | Niet aangepast | |
| Koppen | Precies een h1, geen sprongen (68 runs) | 1 h1, geen h2 naar h4 | Overal 1 h1, 0 sprongen | Geslaagd | | | live |
| Afbeeldingen | alt aanwezig (68 runs) | Elke img heeft alt | 0 zonder alt; schermbeelden hebben beschrijvende alt in NL en EN | Geslaagd | | | live |
| Taal | EN via taalknop (niet /en) | Cookie `ayg-taal=en`, `lang="en"` | Cookie en lang goed, URL blijft gelijk | Geslaagd | | | live |
| Taal EN | Geen Nederlands (34 runs) | Alleen Engels, behalve juridische tekst | 32 goed (alleen namen als "Sanne de Vries"); /demo toont de coaching van Leg press in het Nederlands | Geslaagd met opmerking | Bewust (demo-data blijft NL, staat erbij), maar de tekst stond als `lang="en"` gemarkeerd: schermlezer leest NL met Engelse uitspraak. P3 | `lang="nl"` op de coaching in `demo/CoachSchermen.tsx` | code |
| Links | 23 interne adressen plus ankers | Elke link 200, ankers bestaan | Alle 200 (noindex), ankers aanwezig, onbekend adres 404, `/en` stuurt door | Geslaagd | `/` en `/aiyourgym` zijn beide 200 (dubbele inhoud, nu noindex) P3 | | live |
| Toetsenbord pc | Tab door de kop | Logische volgorde, zichtbare focus | Overslaan, logo, 7 links, demo, proef, NL, EN; ring 2px overal | Geslaagd | | | live |
| Overslaan-link | Enter op "Naar inhoud" | Focus naar de inhoud | Hash wisselt, focus bleef op body | Mislukt | P3 | `tabIndex={-1}` op `main#inhoud` (site-layout en AanmeldSchil), `.ayg-main:focus { outline: none }` | code |
| Menu telefoon | Openen, Escape | Focus in paneel, Escape sluit, focus terug op knop | Klopt | Geslaagd | | | live |
| Menu telefoon | Tab in open paneel | Focus blijft in paneel | Na EN gaat Tab naar de pagina eronder (die stilstaat) | Mislukt | **P2** toetsenbordgebruiker raakt kwijt | Focusval `houdFocusInPaneel` in `site/AygNav.tsx` (menuknop plus paneel) | code |
| Reduced motion | 8 inhoudspagina's | Alles zichtbaar, geen oneindige animatie | 0 onzichtbare teksten, 0 oneindige animaties | Geslaagd | | | live |
| Demo aanvragen | Leeg versturen | Melding per veld, gekoppeld, focus op eerste | 7 meldingen, gekoppeld met aria-describedby, focus op naam, geen verzoek | Geslaagd | Radiogroep "moment" alleen via fieldset gekoppeld (P3) | Ook `aria-describedby` op de eerste radio | code |
| Demo aanvragen | Ongeldig e-mailadres, telefoon "abc", 0 vestigingen | Begrijpelijke melding | "Enter a valid email address.", "Enter a number from 1 to 500." enz. | Geslaagd | | | live |
| Demo aanvragen | Te lange invoer | Afgekapt | naam max 60, opmerking max 1000 | Geslaagd | | | live |
| Prijs op maat | Stap 1 en 2 leeg | Melding per groep | Meldingen in de goede taal, fieldset gekoppeld | Geslaagd | Eerste radio zonder eigen koppeling (P3) | `prijs/Keuzes.tsx` | code |
| Prijs op maat, aanmelden | Stapknoppen op 390 | Knop heeft een naam | Titel `display: none`, nummer aria-hidden: 4 en 3 knoppen zonder toegankelijke naam | Mislukt | **P2** a11y | Titel visueel verborgen in plaats van `display: none` (`aanmelden/aanmelden.css`) | code |
| Aanmelden | Stap 1 zonder pakket, stap 2 | Melding, focus | "Choose a plan.", focus op pakket; stap 2 met naam uit ?naam= | Geslaagd | | | live |
| Inloggen | Leeg, ongeldig e-mailadres | Melding bij het veld, focus op het veld | Een algemene melding "Enter your email address and password.", ook bij een ongeldig adres; geen aria-invalid, focus op de knop | Mislukt | **P2** | Melding per veld (`emailLeeg`, `emailOngeldig`, `wachtwoordLeeg`) via `Veld`, focus op eerste fout, niets naar de server (`inloggen/InlogFormulier.tsx`, `woorden/website/inloggen.ts`) | code |
| Oproep ?naam= | Naam invullen in de oproep | Aanmelden met naam ingevuld | GET naar `/aiyourgym/aanmelden?naam=...`, stap 2 heeft de naam en een slugvoorstel | Geslaagd | Oproep stond max 80 tekens toe, het veld max 60 (P3) | Beide op `MAX_NAAM` (Oproep.tsx, aanmelden/page.tsx) | code |
| Oproep ?naam= | `<img onerror>` in de parameter | Niet uitgevoerd | Niet in de DOM | Geslaagd | | | live |
| Overstapchecklist | Aanvinken met Spatie, herladen | Voortgang, onthouden | progressbar 1/23, bewaard in localStorage | Geslaagd | | | live |
| Prestaties | LCP, CLS voorpagina | LCP < 2,5 s, CLS < 0,1 | LCP 0,18 tot 0,50 s; CLS pc 0,33 (voet springt van y=600 weg als de pagina het laadscherm vervangt), telefoon 0 | Mislukt | P3 | Laadscherm `minHeight: 100svh` (`(site)/loading.tsx`) | code |
| Formulieren | Echt versturen met geldige gegevens | | | Geblokkeerd | Niet toegestaan op productie (5 formulieren) | | |
| Browsers | Firefox, Safari | | | Geblokkeerd | Alleen Chromium beschikbaar | | |

## Prestaties voorpagina (Update 239, cache uit)

| Meting | pc 1440 | telefoon 390 |
|---|---|---|
| TTFB | 19 ms | 15 ms |
| FCP | 176 ms | 156 ms |
| LCP | 504 ms (tekst) | 156 ms (tekst) |
| CLS | 0,33 (laadscherm, opgelost in code) | 0 |
| Verzoeken | 54 | 28 |
| JS | 12 bestanden, 162 kB over de lijn, 514 kB uitgepakt | idem |
| CSS | 6 bestanden, 32 kB over de lijn, 144 kB uitgepakt | idem |
| Lettertypen | 34 kB | 34 kB |
| Totaal | 294 kB | 267 kB |

JS (162 kB) zit net boven het budget van 150 kB voor een landingspagina, CSS (32 kB) net boven 30 kB. Gemeten in een lokale Chromium op een snelle lijn: geen veldgegevens.

## Gewijzigde bestanden

- `src/components/aiyourgym/dag/dag.css`
- `src/components/aiyourgym/demo/CoachSchermen.tsx`
- `src/components/aiyourgym/site/AygNav.tsx`
- `src/components/aiyourgym/aanmelden/aanmelden.css`
- `src/components/aiyourgym/aanmelden/AanmeldSchil.tsx`
- `src/components/aiyourgym/demo-aanvraag/DemoKeuzes.tsx`
- `src/components/aiyourgym/prijs/Keuzes.tsx`
- `src/components/aiyourgym/inloggen/InlogFormulier.tsx`
- `src/components/aiyourgym/voorpagina/Oproep.tsx`
- `src/lib/aiyourgym/taal/woorden/website/inloggen.ts`
- `src/app/(aiyourgym)/(website)/aiyourgym/(site)/layout.tsx`
- `src/app/(aiyourgym)/(website)/aiyourgym/(site)/loading.tsx`
- `src/app/(aiyourgym)/(website)/aiyourgym/aanmelden/page.tsx`
- `src/app/(aiyourgym)/(website)/aiyourgym/aiyourgym.css`

Verificatie: `npx vitest run src/components/aiyourgym src/lib/aiyourgym` 28 bestanden, 944 tests groen; `tsc --noEmit --incremental` exit 0. Nog niet live hertest: na de push opnieuw `/trainingsschemas` op 390, het menu met Tab, de stapknoppen, inloggen leeg en ongeldig, en CLS op de voorpagina.
