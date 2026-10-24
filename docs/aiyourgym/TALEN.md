# Twee talen in AI Your Gym

Besluit Kane (24-10-2026): heel AI Your Gym (website, Club, ledenapp en mails) in het Nederlands en het Engels. **Nederlands is de bron.** Elke tekst bestaat in beide talen; de tests dwingen dat af.

De taalmodule staat in `src/lib/aiyourgym/taal/` en is volledig eigen: nooit iets importeren uit de MentaForce-i18n (`src/lib/i18n`, `TaalProvider`).

## Opbouw

| Bestand | Wat |
| --- | --- |
| `taal.ts` | `type Taal = 'nl' \| 'en'`, locales (nl-NL, en-GB), cookie `ayg-taal` met `TAAL_COOKIE_OPTIES`, `kiesTaal()` (cookie, anders nl). Puur. |
| `woordenboek.ts` | `woordenboek({ nl, en })` en `tekst(boek, taal)`. Het type komt uit het Nederlands; het Engels moet dezelfde sleutels en vorm hebben. |
| `formaat.ts` | `formatDatum`, `formatTijd`, `formatGetal`, `formatProcent`, `formatEuro`, `formatEuroCenten` per taal, tijdzone Europe/Amsterdam. |
| `pad.ts` | `oudEngelsPad()`: een oud adres met `/en` zonder `/en`, voor de 308. Puur. |
| `metadata.ts` | `siteAlternates()`: alleen de canonical (een adres per pagina, geen hreflang). |
| `server.ts` | `getSiteTaal()` (website) en `getTaal()` (Club en ledenapp), allebei uit de cookie; `siteTekst(BOEK)`, `clubTekst(BOEK)`, `getSitePad()` (voor de canonical). |
| `client.tsx` | `<AygTaal taal>` (in de root layouts), `useTaal()`, `useTekst(BOEK)`, `bewaarTaalVoorkeur()`. |
| `woorden/<gebied>/<onderdeel>.ts` | De woordenboeken. |

Taalkeuze NL | EN: `src/components/aiyourgym/taal/TaalKeuze.tsx`.

## Waar komt de taal vandaan

Besluit Kane (24-10-2026): **geen /en in adressen, focus op Nederlands.** Elke pagina staat altijd op hetzelfde adres. Overal (website, Club, ledenapp) dezelfde regel:

- De taal komt uit de cookie `ayg-taal` (`en` of `nl`). Zonder cookie is het **altijd Nederlands**, voor elke nieuwe bezoeker. De taal van de browser (Accept-Language) telt nooit.
- Engels alleen nadat de bezoeker op EN klikt in de taalkeuze NL | EN. Die zet de cookie (een jaar, `Path=/`, `SameSite=Lax`) en laadt dezelfde pagina opnieuw.
- `getSiteTaal()` en `getTaal()` op de server, `useTaal()` in de client. De root layouts zetten `<html lang>` en `og:locale` volgens de gekozen taal.
- Metadata: alleen een canonical (het ene adres van de pagina), geen hreflang. Engels is daardoor niet apart vindbaar in Google; dat neemt Kane voor lief.
- **Oude links met /en** blijven werken: `/en`, `/en/...` en `/aiyourgym/en/...` geven een 308 naar hetzelfde pad zonder `/en` (zoekstring blijft) en zetten de cookie `ayg-taal=en` (`Path=/`, `SameSite=Lax`, `Secure`, een jaar, niet httpOnly zodat de taalkeuze hem kan overschrijven). Zie `beslisAyg` en `beslisAygTaalElders` in `src/lib/aiyourgym/host.ts` en `src/proxy.ts`.
- `en` en `nl` blijven in `GERESERVEERD` (nooit het adres van een sportschool).

## Een tekst omzetten

1. Zoek of maak het woordenboek in `src/lib/aiyourgym/taal/woorden/<gebied>/`. Gebieden: `website`, `club`, `ledenapp`, `mail`, `algemeen` (gedeeld, zoals de taalkeuze). Een bestand per onderdeel of pagina, kleine bestanden.
2. Schrijf het als:

   ```ts
   import { woordenboek } from '../../woordenboek'

   export const PRIJZEN = woordenboek({
     nl: { titel: 'Prijzen', proef: (dagen: number) => `Probeer ${dagen} dagen gratis` },
     en: { titel: 'Pricing', proef: (dagen: number) => `Try it free for ${dagen} days` },
   })
   ```

3. Gebruik het:
   - Servercomponent op de website: `const t = await siteTekst(PRIJZEN)` (de component wordt `async`).
   - Servercomponent in Club of ledenapp: `const t = await clubTekst(PRIJZEN)`.
   - Clientcomponent: `const t = useTekst(PRIJZEN)`.
   - Mail of puur bestand: geef de taal mee als parameter en gebruik `tekst(PRIJZEN, taal)`.
4. Links op de website zonder taal: `aygPad('/functies')`, `SITE_PADEN.DEMO` en `navLinks(taal)` (de taal alleen voor de labels) uit `src/components/aiyourgym/site/paden.ts`. Nooit `/en` in een link.
5. Datums, getallen en bedragen alleen via `formaat.ts`, nooit zelf `toLocaleString('nl-NL')`.
6. Draai `npx vitest run src/lib/aiyourgym/taal`.

Bestaande Nederlandse bronnen met eigen tests (zoals `GERUSTSTELLING` in `inhoud/conversie.ts` of `DOELGROEPEN`) blijven de bron: verwijs er in `nl` naar en zet het Engels ernaast (zie `woorden/website/actie.ts`).

### Naamgeving

- Woordenboek: `UPPER_SNAKE_CASE` naar het onderdeel (`KOP`, `HELD`, `VOET`, `NIET_GEVONDEN`).
- Sleutels in het Nederlands en camelCase, naar wat de tekst doet (`titel`, `planDemo`, `zonderRisico`), niet naar de tekst zelf.
- Tekst met een getal of naam erin: een functie (`probeerDagen: (dagen: number) => ...`), nooit zelf aan elkaar plakken in de component.
- Een zin met opmaak in het midden: in delen (`{ voor, lang, na }`), zodat de woordvolgorde per taal kan verschillen.

### Wat de tests afdwingen

- Typecheck: een ontbrekende of extra sleutel of een andere vorm (tekst tegen functie) in het Engels is een fout.
- `woordenboek.test.ts` leest elk bestand in `woorden/` en controleert: dezelfde opbouw (ook even lange lijsten en gelijke parameters), geen lege teksten, Nederlands zonder gedachtestreepjes en klemtoon-accenten, Engels zonder gedachtestreepjes en zonder spatie voor een leesteken.

## Engels: toon en regels

- **Helder en premium.** Kort, actief, zelfverzekerd zonder te schreeuwen. Zoals een goed Brits of internationaal softwaremerk: geen marketingsoep, geen hype.
- **Brits Engels** (programme, colour, organise, centre, licence), datums als 24 October 2026, 24 uur. Valuta als €49.
- **Geen Nederlandse uitdrukkingen of zinsbouw** vertalen. Herschrijf de zin zoals een Engelstalige hem zou schrijven; de betekenis telt, niet de woorden. "Zo stap je over" wordt "How to switch", niet "This is how you switch over".
- **Aanspreken met "you"**, informeel maar zakelijk, net als het Nederlandse "je".
- **Dezelfde stijlregel als het Nederlands: geen gedachtestreepjes** (geen em-dash, geen en-dash, geen " - "). Gebruik een punt, komma of dubbele punt. In titels "|" of "·".
- **Hoofdletters**: alleen het eerste woord en namen (sentence case), ook in knoppen en koppen: "Book a free demo", niet "Book A Free Demo".
- **Merk- en productnamen blijven gelijk**: AI Your Gym, Club, de pakketnamen uit `pakketten.ts` (Start, Club, Keten), RepDB. Vaste vertalingen van termen: ledenapp = member app, trainingsschema = training programme, sportschool = gym, eigenaar = owner, clubmanager = club manager, vestiging = location, check-in = check-in, groepsles = group class, rooster = rota (personeel) of timetable (lessen), proefperiode = trial, opstartkosten = set-up fee.
- **Eerlijkheid geldt net zo hard**: het Engels belooft niets meer dan het Nederlands. Geen verzonnen cijfers, reviews of claims, geen "best", "cheapest" of "advanced AI". Geen concurrent noemen.
- Juridische teksten (voorwaarden, privacyverklaring, verwerkersovereenkomst) worden niet zelf vertaald zonder akkoord van Kane.

## Let op

- **Wisselen van taal is een volledige paginalading.** `<TaalKeuze />` (`src/components/aiyourgym/taal/TaalKeuze.tsx`) bewaart de cookie en doet `window.location.reload()`, overal hetzelfde. Een zachte navigatie zou de layouts (en dus `<html lang>` en de kop) laten staan.
- Plek in Club en de ledenapp: het accountmenu van Club en het profiel in de ledenapp (nog te plaatsen door wie die schermen omzet). Daar `--ayg-taal-actief-vlak` en `--ayg-taal-actief-tekst` zetten voor de kleuren van de actieve stand.
- Een nog niet omgezette tekst blijft Nederlands op een Engelse pagina; zet teksten altijd per onderdeel helemaal om.

## Stand (24-10-2026)

Omgezet: de hele website (alle pagina's en bouwstenen, aanmeldband, demo-aanvraag, foutscherm, laadscherm, deelafbeelding, 404). De juridische teksten (privacy, voorwaarden) blijven Nederlands onder een Engelse kop en conceptmelding (besluit Kane), in een element met `lang="nl"`.

Bewaker: `src/lib/aiyourgym/taal/geen-hardcoded-nl.test.ts` leest elk bestand van de website met de TypeScript-compiler en faalt op vaste tekst in JSX, in zichtbare attributen (aria-label, alt, title, placeholder en de tekst-props van de bouwstenen), in metadata, op Nederlands ogende zinnen in code en op tekst die rechtstreeks uit `inhoud/*` komt. Uitzonderingen (merknamen, demodata, eenheden) staan in de test, elk met een reden.

Nog niet: Club, ledenapp, mails.
