# Verbeterlijst AI Your Gym

Doorloop met Kane vanaf 23-10-2026, met Voorbeeld Gym als voorbeeldklant:
Mark (eigenaar, zelfstandige gym, 1 vestiging, ongeveer 600 leden, nu Virtuagym),
Lisa (trainer, doet ook de balie) en Sanne (lid, 3x per week).

Soort: **fout** (werkt niet goed), **verbetering** (werkt, kan beter), **toevoeging** (ontbreekt).
Prioriteit: **1** voor de presentatie, **2** kort daarna, **3** later.

## Stap 1. Mark vindt de website (hoofdpagina)

| # | Soort | Prio | Wat | Wie zag het |
|---|---|---|---|---|
| 1 | toevoeging | 1 | Wachtwoord vergeten voor eigenaren en clubmanagers kan niet zelf: /inloggen verwijst naar het demoformulier. Een eigen "wachtwoord vergeten" met eenmalige link (zoals bij leden) toevoegen. | Claude (websiteronde 23-10) |
| 2 | fout | 1 | Ledenlogin (`CLUB_LEDEN_LOGIN`) staat uit, terwijl /ledenapp en de demo zeggen dat leden inloggen met e-mailadres en wachtwoord. Voor de lancering aanzetten of de tekst aanpassen. | Claude (websiteronde 23-10) |
| 3 | toevoeging | 1 | Geen telefoon of e-mail op de site (`AYG_CONTACT` leeg). Daardoor gaat alle hulp (ook wachtwoord vergeten) via het demoformulier. | Claude (websiteronde 23-10) |
| 4 | fout | 2 | /demo heeft de database nodig; zonder database toont hij "De demo is even niet beschikbaar". Na livegang controleren dat de live demo echt laadt. | Claude (websiteronde 23-10) |
| 5 | verbetering | 2 | Pakket Keten noemt "Eigen adres naam.aiyourgym.com (binnenkort)", maar elk pakket krijgt bij het aanmelden al een adres. Kiezen: in alle pakketten noemen of nergens. | Claude (websiteronde 23-10) |
| 6 | verbetering | 2 | Schermvoorbeelden tonen voorbeeldgym.aiyourgym.com in de adresbalk, terwijl die adressen nog uit staan. Mag als voorbeeld, maar kan verwarren. | Claude (websiteronde 23-10) |
| 7 | verbetering | 2 | Trainingsschema's is op de telefoon erg lang (ongeveer 15.900 px op 390). Idee: stappen 02 tot 07 inklapbaar maken of herhaalde schermen op de telefoon weglaten (zoals nu op Voor wie). | Claude (websiteronde 23-10) |
| 8 | verbetering | 2 | Held op de hoofdpagina: het dashboard loopt bewust over de rechterrand, maar op 390 en 1280 vallen de tegel Taken en de knop Check-in half weg. Kane kiest: zo laten of het venster binnen beeld houden. | Claude (websiteronde 23-10) |
| 9 | verbetering | 3 | Blikvanger trainingsschema's (hoofdpagina, 1280 en breder): het donkere 3D-vlak is erg hoog (ongeveer 930 px) met veel leeg boven het figuur. Lager vlak of figuur groter in beeld. | Claude (websiteronde 23-10) |
| 10 | verbetering | 3 | Plan een gratis demo: "binnen een werkdag" staat drie keer op een scherm (intro, formulier en zijpaneel). | Claude (websiteronde 23-10) |
| 11 | verbetering | 3 | Ledenapp: de rij telefoons snijdt op 1280 de eerste en laatste telefoon af aan de rand. Op brede schermen alle vier in beeld zetten. | Claude (websiteronde 23-10) |
| 12 | verbetering | 3 | In de schermvoorbeelden worden namen afgekapt met puntjes (Roemeense deadlift in de ledenapp op 390, kernpunten in de oefenkaart van de held). Bedoeld, maar langere voorbeeldnamen kiezen die passen. | Claude (websiteronde 23-10) |
