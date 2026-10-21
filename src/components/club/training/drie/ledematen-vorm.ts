// ─── Fit Factory Club, 3D-oefenbeelden: vorm van armen en benen ─────────────
// Per lidmaat een doorsnede per hoogte (breedte, voorkant, achterkant) plus
// spierbuiken als zachte bulten op een plek en hoek. Hoek 0 is de voorkant, 90
// de binnenkant, -90 de buitenkant, 180 de achterkant. Maten in meter.

import { MATEN } from '@/lib/club/training/3d/maten'

export interface Bult {
  readonly t: number
  readonly dt: number
  readonly hoek: number
  readonly dh: number
  readonly h: number
}

export interface Lid {
  readonly lengte: number
  /** Rijen [t, halve breedte, voorkant, achterkant] in meter. */
  readonly doorsnede: readonly (readonly number[])[]
  readonly bulten: readonly Bult[]
  /** Lengte van de ronde doppen als deel van de straal. */
  readonly kapBoven: number
  readonly kapOnder: number
  readonly ringen: number
}

export const DIJ: Lid = {
  lengte: MATEN.dij,
  doorsnede: [
    [0, 0.092, 0.0899, 0.0942],
    [0.12, 0.0899, 0.0877, 0.092],
    [0.35, 0.0824, 0.0813, 0.0803],
    [0.6, 0.0728, 0.0706, 0.0663],
    [0.82, 0.0599, 0.0578, 0.0535],
    [0.94, 0.0535, 0.0503, 0.0492],
    [1, 0.0524, 0.0481, 0.0481],
  ],
  bulten: [
    { t: 0.55, dt: 0.38, hoek: -72, dh: 55, h: 0.011 },
    { t: 0.84, dt: 0.14, hoek: 52, dh: 42, h: 0.013 },
    { t: 0.42, dt: 0.36, hoek: -4, dh: 34, h: 0.008 },
    { t: 0.5, dt: 0.4, hoek: 180, dh: 62, h: 0.007 },
    { t: 0.2, dt: 0.26, hoek: 102, dh: 42, h: 0.008 },
    { t: 1.0, dt: 0.08, hoek: 0, dh: 30, h: 0.013 },
    { t: 0.62, dt: 0.3, hoek: -108, dh: 14, h: -0.003 },
  ],
  kapBoven: 0.7,
  kapOnder: 0.8,
  ringen: 24,
}

export const SCHEEN: Lid = {
  lengte: MATEN.scheen,
  doorsnede: [
    [0, 0.0515, 0.0473, 0.0483],
    [0.12, 0.0525, 0.041, 0.0588],
    [0.3, 0.0483, 0.0357, 0.063],
    [0.55, 0.0389, 0.0315, 0.0441],
    [0.8, 0.0305, 0.0273, 0.0305],
    [1, 0.0326, 0.0305, 0.0315],
  ],
  bulten: [
    { t: 0.28, dt: 0.21, hoek: 142, dh: 45, h: 0.012 },
    { t: 0.25, dt: 0.17, hoek: -145, dh: 40, h: 0.009 },
    { t: 0.36, dt: 0.3, hoek: -38, dh: 30, h: 0.005 },
    { t: 0.03, dt: 0.08, hoek: 0, dh: 50, h: 0.005 },
    { t: 0.985, dt: 0.05, hoek: 90, dh: 30, h: 0.007 },
    { t: 0.99, dt: 0.05, hoek: -90, dh: 30, h: 0.006 },
  ],
  kapBoven: 0.85,
  kapOnder: 0.6,
  ringen: 22,
}

export const BOVENARM: Lid = {
  lengte: MATEN.bovenarm,
  doorsnede: [
    [0, 0.039, 0.04, 0.042],
    [0.08, 0.044, 0.045, 0.047],
    [0.2, 0.045, 0.046, 0.049],
    [0.5, 0.041, 0.045, 0.046],
    [0.8, 0.038, 0.038, 0.04],
    [1, 0.036, 0.033, 0.036],
  ],
  bulten: [
    { t: 0.15, dt: 0.3, hoek: -90, dh: 80, h: 0.012 },
    { t: 0.12, dt: 0.24, hoek: -30, dh: 45, h: 0.008 },
    { t: 0.12, dt: 0.24, hoek: -150, dh: 45, h: 0.007 },
    { t: 0.58, dt: 0.3, hoek: 5, dh: 50, h: 0.01 },
    { t: 0.4, dt: 0.36, hoek: 172, dh: 45, h: 0.009 },
    { t: 0.36, dt: 0.25, hoek: -138, dh: 35, h: 0.007 },
    { t: 0.42, dt: 0.08, hoek: -90, dh: 30, h: -0.003 },
  ],
  kapBoven: 0.85,
  kapOnder: 0.8,
  ringen: 20,
}

export const ONDERARM: Lid = {
  lengte: MATEN.onderarm,
  doorsnede: [
    [0, 0.038, 0.034, 0.038],
    [0.2, 0.042, 0.036, 0.037],
    [0.5, 0.035, 0.03, 0.03],
    [0.8, 0.029, 0.022, 0.022],
    [1, 0.028, 0.018, 0.019],
  ],
  bulten: [
    { t: 0.24, dt: 0.26, hoek: -62, dh: 45, h: 0.009 },
    { t: 0.3, dt: 0.3, hoek: 60, dh: 50, h: 0.006 },
    { t: 0.0, dt: 0.09, hoek: 180, dh: 35, h: 0.008 },
  ],
  kapBoven: 0.85,
  kapOnder: 0.95,
  ringen: 16,
}
