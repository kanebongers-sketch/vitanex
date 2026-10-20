// ─── Fit Factory Club, 3D-oefenbeelden: gedeelde richtingen (PUUR) ─────────
// Kleine bouwstukken die meerdere oefeningen in de bibliotheek delen.

export const VOOR = { x: 0, y: 0, z: 1 } as const

export const ACHTER = { x: 0, y: 0, z: -1 } as const

export const NEUTRAAL = { x: 0, y: 0, z: 1 } as const

export const CURL_ARM = { heffen: 4, opzij: 7, buig: VOOR } as const
