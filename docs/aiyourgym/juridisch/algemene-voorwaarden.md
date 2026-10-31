# Algemene voorwaarden AI Your Gym | concept

Bron van de tekst op de website: `src/app/(aiyourgym)/(website)/aiyourgym/(site)/voorwaarden/page.tsx`.
Dit bestand legt de afspraken vast die daar staan, met de achtergrond. Nog niet juridisch getoetst (zie `LIVEGANG-JURIDISCH.md`).

## Start en contract
- Geen proefperiode (besluit Kane 30-10-2026): na het aanmelden betaal je meteen de eerste maand.
- Jaarcontract, maandelijks betaald, per vestiging.
- Elke vestiging heeft een eigen abonnement in Stripe met dezelfde pakketten (de basis Ledenadministratie plus de gekozen add-ons).

## Prijs en staffels (besluit Kane 31-10-2026)
De prijs per vestiging hangt af van de pakketten en van het aantal actieve leden van die vestiging, in staffels: tot 25, tot 50, tot 100, tot 200, tot 500, tot 1.000 en tot 5.000 leden. Daarboven een prijs op maat. Op de website staan geen bedragen: de klant ziet het bedrag bij het afsluiten in Stripe, voordat hij betaalt. De bedragen staan in `docs/aiyourgym/STRIPE.md`.

1. **Telling.** We tellen elke dag de actieve leden per vestiging. Een actief lid is een lid met de status actief of proef, of opgezegd tot en met de einddatum. Niet mee tellen: gepauzeerd, gestopt (ook "wordt verwijderd"), opgezegd na de einddatum, demoleden en leden van wie het lidmaatschap nog niet begonnen is. Code: `src/lib/club/leden/actief-tellen.ts`.
2. **Omhoog.** Komt een vestiging boven de grens van zijn staffel, dan geldt de hogere staffel vanaf de eerstvolgende maandfactuur, zonder aparte toestemming. Het jaarcontract loopt door.
3. **Omlaag.** Zakt het aantal onder de grens, dan gaat de staffel ook vanzelf omlaag vanaf de volgende maandfactuur. Niets met terugwerkende kracht (in Stripe: `proration_behavior=none`).
4. **Inzicht.** De sportschool ziet de staffel en het aantal actieve leden per vestiging altijd in Club bij Abonnement (`/club/beheer/abonnement`), met de laatste wijzigingen.
5. **Mail.** Verandert de staffel van een vestiging, dan krijgt de eigenaar een mail (Resend, afzender `AIYOURGYM_RESEND_FROM`). Zonder afzender staat de wijziging alleen in Club bij Abonnement.
6. **Prijs op maat.** Boven 5.000 actieve leden per vestiging geldt een prijs op maat, vooraf schriftelijk afgesproken. Daar verandert niets automatisch; Kane krijgt een melding.

Een nieuwe vestiging in Club krijgt meteen een eigen abonnement met dezelfde pakketten en dezelfde factuurdatum (naar rato tot die datum).
