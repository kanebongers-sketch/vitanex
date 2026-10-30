# AI Your Gym | testaccount "Test Gym"

Migratie `supabase/lifeos-migrations/423_ayg_testaccount.sql` (uitgevoerd op 17-10-2026) maakte een test-sportschool zoals een betaalde aanmelding hem zou krijgen:

- Sportschool **Test Gym**, gemarkeerd als demo, adres `testgym` (straks testgym.aiyourgym.com).
- Een vestiging: **Test Gym Centrum**.
- De basisbibliotheek met oefeningen (kopie van Fit Factory, zonder eigen coaching).
- Eigenaar-beheerder **Test Eigenaar** met e-mail `test@aiyourgym.com`. Dat adres bestaat niet en is alleen een label; er wordt nooit iets naartoe gestuurd.
- Een rij in `ayg_aanmeldingen` met status `test`. Stripe verandert nooit iets aan die status.
- Geen abonnement, geen facturen en (net als voor elke sportschool sinds 30-10-2026) geen proefperiode. De abonnementspagina toont "Testaccount".

## Erbij komen als Kane

1. Log in op de PT-app als beheerder en open Club (`aiyourgym.com/club`).
2. Ga naar **Huisstijl** en kies bij de sportschool-wissel **Test Gym**.

## De inloglink van de test-eigenaar

1. Kies Test Gym (zie hierboven) en blijf op **Huisstijl**.
2. Scroll naar **Beheerders**. Bij Test Eigenaar staat de knop om de persoonlijke link te kopieren (`/clubinloggen/<code>`).

De code van die link is bij het uitvoeren van de migratie willekeurig gemaakt en staat nergens in de code of in de chat.

## Pincode

Er is geen pincode ingesteld. Die kies je zelf:

1. Open de inloglink en kies een pincode van 6 cijfers. Je ziet een controlecode van 4 cijfers.
2. Keur de pincode goed bij Beheerders door die controlecode in te vullen.

Let op: zolang de schakelaar `CLUB_EIGEN_LOGIN` (in `src/lib/club/beheerders/schakelaar.ts`) uit staat, geeft de inloglink een 404. Dat is bewust: inloggen voor sportscholen opent pas na de presentatie.

## Opruimen

Niet nodig. Wil je hem ooit weg: verwijder de sportschool Test Gym (id `7e570000-0000-4000-8000-000000000001`) en de aanmelding met status `test`.
