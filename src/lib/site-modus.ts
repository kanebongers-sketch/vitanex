// ─── Site-modus ─────────────────────────────────────────────────────────────
// Schakelaar voor de publieke MentaForce-site (landing met het brein, contact,
// voorwaarden, registreren, uitnodigingen, Google-login).
//
// UIT (false) sinds 09-10-2026: MentaForce is weer de consumenten-app en de site
// is gewoon zichtbaar en vindbaar. De Fit Factory PT-app en LifeOS staan op
// fitfactorypt.nl en hebben hier niets mee te maken.
//
// AAN (true) = verbergen: de publieke pagina's sturen dan door naar het
// inlogscherm, registreren en Google-login verdwijnen, en elke response krijgt
// een noindex. Er wordt niets verwijderd.

export const SITE_VERBORGEN = false

// ─── MentaForce offline (besluit Kane, 11-10-2026) ──────────────────────────
// Het domein mentaforce.nl is losgekoppeld. AAN (true): op elk ander domein dan
// fitfactorypt.nl stuurt elke pagina door naar fitfactorypt.nl; er is nergens
// meer een MentaForce-scherm te zien. API's en bestanden blijven werken (de
// PT-app en LifeOS gebruiken ze), localhost blijft bruikbaar om te ontwikkelen.
// De code blijft staan: terug online = deze schakelaar op false.
export const MENTAFORCE_OFFLINE = true
