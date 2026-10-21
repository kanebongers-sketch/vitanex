# AI Your Gym | juridisch regelen voor de livegang

> **Geen juridisch advies.** Dit is een checklist van onderwerpen die voor de livegang geregeld moeten zijn, opgesteld op basis van wat er in de code en de docs staat (17-10-2026). Welke keuze goed is, bepaal je samen met een jurist, boekhouder of adviseur.

## 1. Het bedrijf
- [ ] **Rechtsvorm kiezen en inschrijven bij de KvK**: eenmanszaak of eigen bv. Laat de gevolgen voor aansprakelijkheid, belasting en een latere investeerder of verkoop uitleggen.
- [ ] **Handelsnaam** AI Your Gym laten registreren bij de KvK (en eventueel het merk bij het BOIP laten checken op botsingen).
- [ ] **Domein aiyourgym.com** op naam van het bedrijf (nog niet gekocht; kosten eerst afwegen).
- [ ] **Zakelijke rekening** op naam van het bedrijf.
- [ ] **Bedrijfsaansprakelijkheid en eventueel cyberverzekering** laten bekijken.

## 2. Eigendom van de software
- [ ] **Afspraken met Fit Factory op papier.** Kane is in loondienst bij Fit Factory, de software is gebouwd naast het werk, en Fit Factory is de eerste klant. Laat vastleggen van wie de software, de code, de naam en de klantgegevens zijn, en of Fit Factory rechten heeft (bijvoorbeeld via de arbeidsovereenkomst of een concurrentie- of nevenwerkzaamhedenbeding).
- [ ] **Rol van Fit Factory**: klant (met een eigen abonnement en verwerkersovereenkomst), partner of mede-eigenaar. Kies bewust en leg het vast.
- [ ] **Huidige data van Fit Factory**: Fit Factory is verwerkingsverantwoordelijke voor haar leden. Ook voor de pilot Budel is een verwerkersovereenkomst nodig zodra er echte leden in staan.
- [ ] **Overdracht naar het bedrijf**: accounts (Supabase, Render, GitHub, Stripe, Resend, Hostinger) staan nu op naam van Kane. Bepaal of ze naar het bedrijf gaan.

## 3. Licenties van wat we gebruiken
- [ ] **RepDB**: de oefeningbeelden komen van de gratis versie van RepDB. Voor commercieel gebruik in een betaald product de **Standard-licentie** nemen (kosten eerst afwegen) en de voorwaarden lezen, inclusief de vereiste bronvermelding "Exercise data by RepDB (repdb.co)".
- [ ] **Everkinetic** (reserve, CC BY-SA 4.0): bronvermelding en de "gelijk delen"-voorwaarde laten beoordelen als die beelden nog gebruikt worden.
- [ ] **Lettertypen en open-sourcepakketten**: een lijst van licenties maken (de meeste zijn MIT of OFL; laten controleren dat er niets tussen zit dat commercieel gebruik beperkt).
- [ ] **Geen materiaal van Virtuagym of anderen** (al de regel; laten bevestigen dat teksten en ontwerp eigen werk zijn).

## 4. Voorwaarden, privacy en verwerkersovereenkomst
- [ ] **Algemene voorwaarden definitief** (de huidige pagina `/aiyourgym/voorwaarden` is een concept, zie hieronder wat ontbreekt).
- [ ] **Privacyverklaring definitief** (de huidige pagina `/aiyourgym/privacy` is een concept).
- [ ] **Verwerkersovereenkomst** laten controleren en definitief maken: concept in `verwerkersovereenkomst.md`. Bewaartermijnen, termijnen en aansprakelijkheid invullen.
- [ ] **Verwerkersovereenkomsten met de subverwerkers** afsluiten of accepteren (Supabase, Render, Resend, Stripe) en bewaren.
- [ ] **Regio van Render en Resend** nakijken. De database staat in Frankfurt; de privacypagina zegt dat de gegevens in de EU staan. Klopt dat niet voor de server of de mail, dan de tekst of de regio aanpassen.
- [ ] **Register van verwerkingen** bijhouden (voor de eigen verwerkingen van AI Your Gym, zoals klantgegevens en aanmeldingen in `ayg_aanmeldingen`).
- [ ] **DPIA** laten beoordelen: Club verwerkt gezondheidsgegevens (metingen, intakes) van leden. Laat bepalen of een gegevensbeschermingseffectbeoordeling nodig is en wie die doet (meestal de sportschool, met hulp van AI Your Gym).
- [ ] **Datalekprocedure**: wie meldt wat binnen welke tijd (concept in de verwerkersovereenkomst, artikel 9).
- [ ] **Back-ups**: het gratis Supabase-plan maakt geen automatische back-ups (zie `docs/club/LIVEGANG.md`). Voor de livegang met echte leden regelen, want het is ook een beveiligingsmaatregel in de verwerkersovereenkomst.
- [ ] **Verwijderen van een lid**: kan nog niet in de software zelf (alleen status gestopt of opgezegd). Nodig voor het recht op verwijdering; bouwen voor de livegang.

## 5. Geld en belasting
- [ ] **Btw**: btw-nummer (komt met de KvK-inschrijving), tarief voor software-abonnementen, factuureisen en omzetgrenzen laten uitleggen door een boekhouder.
- [ ] **Facturen** die voldoen aan de eisen (Stripe kan facturen maken; laten controleren of ze kloppen voor Nederland).
- [ ] **Stripe-account op naam van het bedrijf** (niet privé), met KvK- en btw-gegevens, en de Stripe-voorwaarden accepteren als bedrijf.
- [ ] **Prijzen en proefperiode** in de voorwaarden zetten zoals ze in Stripe staan (geen prijzen op de website, wel schriftelijk vooraf aan de klant).
- [ ] **Administratie en bewaarplicht** (7 jaar voor de belastingdienst) inrichten.

## 6. Wat in de concepten nog ontbreekt

**Privacyverklaring (`src/app/(aiyourgym)/(website)/aiyourgym/(site)/privacy/page.tsx`)**
- Wie AI Your Gym is: bedrijfsnaam, adres, KvK-nummer en contactgegevens voor privacyvragen (staat nu "volgen in de definitieve versie").
- De eigen verwerkingen van AI Your Gym als verantwoordelijke: gegevens van de eigenaar bij aanmelden (naam, e-mail, telefoon, sportschoolnaam), betaling via Stripe, welkomstmail via Resend. Met doel en grondslag per verwerking.
- Grondslagen (overeenkomst, gerechtvaardigd belang, toestemming).
- Bewaartermijnen (staat nu "werken we nog uit").
- Subverwerkers en ontvangers, en doorgifte buiten de EU (Supabase, Render, Resend en Stripe zijn Amerikaanse bedrijven).
- De claim "servers in de Europese Unie": klopt voor de database (Frankfurt), nog te controleren voor Render en Resend.
- Cookies in de app zelf: functionele sessiecookies voor inloggen (nu staat alleen dat de website geen advertentiecookies plaatst).
- Beveiliging in hoofdlijnen en wat er gebeurt bij een datalek.
- Klachtrecht bij de Autoriteit Persoonsgegevens.
- Datum of versie van de verklaring.

**Voorwaarden (`src/app/(aiyourgym)/(website)/aiyourgym/(site)/voorwaarden/page.tsx`)**
- Partijen en identiteit van AI Your Gym (naam, KvK, adres).
- Totstandkoming, looptijd, verlenging en opzegging (staat nu "nog uit te werken").
- Wat er gebeurt na de proefperiode (automatisch betaald of niet).
- Betaling, facturatie, btw, te late betaling, opschorten bij wanbetaling, prijswijzigingen.
- Beschikbaarheid, onderhoud en storingen (staat nu "nog uit te werken").
- Aansprakelijkheid en overmacht (staat nu "nog uit te werken").
- Intellectueel eigendom: de software blijft van AI Your Gym, de sportschool krijgt een gebruiksrecht; de gegevens blijven van de sportschool (dat laatste staat er al).
- Einde: export van gegevens en termijn van verwijderen (sluit aan op de verwerkersovereenkomst).
- Verwijzing naar de verwerkersovereenkomst als onderdeel van de afspraken.
- Wijzigen van de voorwaarden (staat nu "nog uit te werken").
- Toepasselijk recht en bevoegde rechter.
- Datum of versie.
