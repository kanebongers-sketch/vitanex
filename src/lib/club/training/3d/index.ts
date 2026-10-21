// ─── Fit Factory Club, 3D-oefenbeelden: publieke ingang (PUUR) ──────────────
// Houdingen als data, kinematica en interpolatie. Het tekenen (three.js) staat
// in src/components/club/training/drie.

export { OEFENINGEN_3D, oefening3dOpNaam } from './oefeningen'
export { houdingOp, lusDuur, sleutelTijd, standTijd, startVoorSleutel } from './interpolatie'
export { houdingVan, standTijdVan } from './beweging'
export { getekendeSpieren, spierSterkte } from './spieren'
export { figuurIn } from './kinematica'
export type { Blik, Houding, Oefening3d, Sleutel } from './typen'
