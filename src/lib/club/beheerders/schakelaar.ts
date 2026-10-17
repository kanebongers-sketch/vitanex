// ─── Club: schakelaar voor de eigen login van sportscholen ──────────────────
// UIT (false): alleen Kane komt in Club. De inlogpagina en de inlog-API geven
// een gewone 404 en een sessie van een eigenaar of clubmanager telt niet, ook
// als die al bestaat. Kane kan beheerders wel alvast klaarzetten.
//
// AAN (true): eigenaren en clubmanagers loggen in met hun persoonlijke link en
// pincode en zien alleen hun eigen sportschool. Pas aanzetten na de presentatie
// (besluit Kane): tot dan mag niemand behalve Kane iets van Club zien.

export const CLUB_EIGEN_LOGIN = false
