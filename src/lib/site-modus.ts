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
