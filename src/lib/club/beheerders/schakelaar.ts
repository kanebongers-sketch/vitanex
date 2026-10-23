// ─── Club: schakelaar voor de eigen login van sportscholen ──────────────────
// AAN (true): eigenaren, clubmanagers en medewerkers loggen in met hun
// persoonlijke link en pincode en zien alleen hun eigen sportschool.
// Aangezet op 23-10-2026 (besluit Kane): een sportschool moet zich kunnen
// aanmelden en meteen alles instellen.
//
// UIT (false): alleen de platform-eigenaar komt in Club. De inlogpagina en de
// inlog-API geven een gewone 404 en een sessie van een eigenaar of clubmanager
// telt niet, ook als die al bestaat.

export const CLUB_EIGEN_LOGIN = true
