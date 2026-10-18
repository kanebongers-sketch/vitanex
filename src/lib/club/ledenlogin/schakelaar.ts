// ─── Club: schakelaar voor de eigen login van leden ─────────────────────────
// UIT (false): /mijn, de inlogpagina's en de leden-API (/api/club/lid) geven een
// gewone 404. Alleen Kane kan /mijn?lid=<id> openen als voorvertoning. Een
// bestaande ledensessie telt niet. De sportschool kan links wel alvast maken.
//
// AAN (true): leden loggen in met hun persoonlijke link en pincode en zien
// alleen hun eigen gegevens. Pas aanzetten na de presentatie (besluit Kane).

export const CLUB_LEDEN_LOGIN = false
