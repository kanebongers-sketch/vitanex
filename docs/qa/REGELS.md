# QA-missie 28-10-2026: gedeelde regels voor alle agents

Doel: de app grondig onderzoeken, echt testen, problemen zelf oplossen, hertesten. Prioriteit P0 (security, dataverlies, crash) > P1 (functie kapot, foute mutatie, autorisatie) > P2 (validatie, foutafhandeling, UX) > P3 (performance, a11y, onderhoud).

Scope (besluit Kane 28-10-2026): alleen AI Your Gym (aiyourgym.com: website, Club, ledenapp). PT-app, LifeOS, MentaForce en RELEASE V vallen erbuiten; daar niets aan veranderen.

Harde grenzen (gaan boven alles):
- GEEN `next build`, geen dev-server, geen volledige `npm run typecheck` (Kane's pc crasht). Wel: `npx vitest run <paden>` en `timeout 280 npx tsc --noEmit -p tsconfig.json --incremental`.
- Live testen (aiyourgym.com, fitfactorypt.nl) is productie: alleen niet-destructief. Geen formulieren echt versturen die data aanmaken of mails sturen, geen accounts aanmaken, niet inloggen, geen wachtwoorden of tokens invullen, geen mutaties via API. Wel: GET-verzoeken, verzoeken zonder sessie die geweigerd moeten worden, validatie in de browser tot vlak voor versturen.
- Database (Supabase LifeOS, project bbklogjersviaoocgrve): alleen lezen (SELECT, advisors). Migraties alleen toevoegen, nooit verwijderen of data wissen; een migratie alleen als een P0/P1 dat vraagt en klein en terug te draaien is.
- Geen contact met externe bedrijven, geen nieuwe kosten, geen nieuwe dependencies zonder noodzaak.
- Verwijder geen tests omdat ze falen, schakel geen beveiliging uit, geen lege try/catch. Verzin geen resultaten.
- Raak niet aan: public/oefenbeelden, oefenrenders.data.ts, C:\Users\Kaneb\oefenbeelden (andere agents).
- Alle tekst NL+EN via de taalmodule (aiyourgym); geen gedachtestreepjes of klemtoon-accenten.
- Commit en push NIET: de hoofdsessie doet dat.
- Statussen eerlijk scheiden: "code ziet er goed uit" / "bouwt (tsc)" / "automatisch getest (vitest)" / "end-to-end geverifieerd (live of browser)".

Werklog: elk gebied schrijft in een eigen bestand docs/qa/<gebied>.md met een testmatrix (onderdeel | scenario | verwacht | werkelijk | status | probleem | oplossing | hertest) en een lijst gewijzigde bestanden.
