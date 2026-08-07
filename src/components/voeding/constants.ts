// ─── Voeding — constanten ───────────────────────────────────────────────────
// RDI (EU aanbevolen dagelijkse inname), micronutrient-metadata en de
// maaltijd-indeling. Geëxtraheerd uit de monolithische voeding-pagina.

import { Sunrise, Apple, Sun, Cookie, Moon, type LucideIcon } from 'lucide-react'
import type { MaaltijdType } from './types'

/** EU aanbevolen dagelijkse inname, per nutrient-sleutel. */
export const RDI: Record<string, number> = {
  calorieen: 2000, eiwitten_g: 50, koolhydraten_g: 260, suikers_g: 90,
  vetten_g: 70, verzadigd_vet_g: 20, vezels_g: 25, zout_mg: 6000,
  vitamine_a_ug: 800, vitamine_c_mg: 80, vitamine_d_ug: 5, vitamine_e_mg: 12,
  vitamine_b12_ug: 2.5, folaat_ug: 200, calcium_mg: 800, ijzer_mg: 14,
  magnesium_mg: 375, kalium_mg: 2000, natrium_mg: 2000, zink_mg: 10,
}

export const MICRO_META: Record<string, { label: string; eenheid: string; rdi_key: string }> = {
  vitamine_a_ug:   { label: 'Vitamine A',   eenheid: 'μg', rdi_key: 'vitamine_a_ug'   },
  vitamine_c_mg:   { label: 'Vitamine C',   eenheid: 'mg', rdi_key: 'vitamine_c_mg'   },
  vitamine_d_ug:   { label: 'Vitamine D',   eenheid: 'μg', rdi_key: 'vitamine_d_ug'   },
  vitamine_e_mg:   { label: 'Vitamine E',   eenheid: 'mg', rdi_key: 'vitamine_e_mg'   },
  vitamine_b12_ug: { label: 'Vitamine B12', eenheid: 'μg', rdi_key: 'vitamine_b12_ug' },
  folaat_ug:       { label: 'Folaat',       eenheid: 'μg', rdi_key: 'folaat_ug'       },
  calcium_mg:      { label: 'Calcium',      eenheid: 'mg', rdi_key: 'calcium_mg'      },
  ijzer_mg:        { label: 'IJzer',        eenheid: 'mg', rdi_key: 'ijzer_mg'        },
  magnesium_mg:    { label: 'Magnesium',    eenheid: 'mg', rdi_key: 'magnesium_mg'    },
  kalium_mg:       { label: 'Kalium',       eenheid: 'mg', rdi_key: 'kalium_mg'       },
  natrium_mg:      { label: 'Natrium',      eenheid: 'mg', rdi_key: 'natrium_mg'      },
  zink_mg:         { label: 'Zink',         eenheid: 'mg', rdi_key: 'zink_mg'         },
}

export const MAALTIJD_VOLGORDE: MaaltijdType[] = ['ontbijt', 'tussendoortje_1', 'lunch', 'tussendoortje_2', 'diner', 'avondsnack']
export const MAALTIJD_ICOON: Record<string, LucideIcon> = { ontbijt: Sunrise, tussendoortje_1: Apple, lunch: Sun, tussendoortje_2: Cookie, diner: Moon, avondsnack: Cookie }
export const MAALTIJD_KLEUR: Record<string, string> = { ontbijt: 'var(--mf-amber)', tussendoortje_1: 'var(--mf-amber)', lunch: 'var(--mf-green)', tussendoortje_2: 'var(--mf-amber-dark)', diner: 'var(--mf-purple)', avondsnack: 'var(--mf-red)' }
export const MAALTIJD_LABEL: Record<string, string> = { ontbijt: 'Ontbijt', tussendoortje_1: 'Tuss. 1', lunch: 'Lunch', tussendoortje_2: 'Tuss. 2', diner: 'Diner', avondsnack: 'Avond' }
export const MAALTIJD_VOL_LABEL: Record<string, string> = { ontbijt: 'Ontbijt', tussendoortje_1: 'Tussendoortje 1', lunch: 'Lunch', tussendoortje_2: 'Tussendoortje 2', diner: 'Diner', avondsnack: 'Avondsnack' }
export const DOEL_KCAL = 2000
export const ML_PER_GLAS = 250
