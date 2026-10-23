// ─── Club: schakelaar voor de eigen login van leden ─────────────────────────
// AAN (true): leden activeren hun account een keer met de link of QR van de
// sportschool en loggen daarna in de ledenapp in met e-mailadres en wachtwoord.
// Ze zien alleen hun eigen gegevens. Aangezet op 23-10-2026 (besluit Kane:
// alles moet werken).
//
// UIT (false): /mijn, de inlogpagina's en de leden-API (/api/club/lid) geven een
// gewone 404; alleen de platform-eigenaar kan /mijn?lid=<id> openen als
// voorvertoning en een bestaande ledensessie telt niet.

export const CLUB_LEDEN_LOGIN = true
