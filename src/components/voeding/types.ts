// ─── Voeding — gedeelde types ───────────────────────────────────────────────
// Geëxtraheerd uit de voeding-pagina (was één bestand van 1378 regels). Deze
// vormen worden door de pagina én de losse schermen/onderdelen gedeeld.

export interface AiAnalyse {
  gerecht: string
  beschrijving: string
  portie_gram: number
  calorieen: number
  macros: { eiwitten_g: number; koolhydraten_g: number; vetten_g: number; vezels_g: number }
  ingredienten: string[]
  maaltijd_type: string
  gezondheid_score: number
  tips: string
  betrouwbaarheid: 'laag' | 'gemiddeld' | 'hoog'
}

export type MaaltijdType = 'ontbijt' | 'tussendoortje_1' | 'lunch' | 'tussendoortje_2' | 'diner' | 'avondsnack'

export interface VoedingLog {
  id: string
  datum: string
  maaltijd_type: MaaltijdType
  omschrijving: string
  calorieen: number | null
  eiwitten_g: number | null
  koolhydraten_g: number | null
  vetten_g: number | null
  vezels_g: number | null
  portie_gram: number | null
  bron: 'foto' | 'manueel'
  foto_url: string | null
  ai_analyse: AiAnalyse | null
}

export interface NutrientenPer100g {
  calorieen: number
  eiwitten_g: number
  koolhydraten_g: number
  suikers_g: number
  vetten_g: number
  verzadigd_vet_g: number
  vezels_g: number
  zout_mg: number
  micronutrienten: Record<string, number | null>
}

export interface ZoekResultaat {
  id: string
  naam: string
  merk: string | null
  hoeveelheid?: string | null
  bron: 'open_food_facts' | 'usda'
  per_100g: NutrientenPer100g
  foto_url: string | null
}

export interface DagTotaal {
  calorieen: number
  eiwitten_g: number
  koolhydraten_g: number
  vetten_g: number
  vezels_g: number
}

/** Persoonlijke voedingsdoelen + dieetcontext uit het intake-profiel (via /api/voeding). */
export interface VoedingDoelen {
  calorie_doel: number | null
  calorie_handmatig: boolean
  macros: { eiwit_g: number; koolhydraten_g: number; vet_g: number } | null
  dieetvoorkeur: string | null
  allergieen: string[]
  profiel_compleet: boolean
}

export type Scherm = 'overzicht' | 'analyseren' | 'bevestigen' | 'manueel' | 'zoeken' | 'detail'

/** Het invulformulier (handmatig + foto-correctie). Waarden zijn strings zoals in de inputs. */
export interface VoedingForm {
  maaltijd_type: MaaltijdType
  omschrijving: string
  calorieen: string
  eiwitten_g: string
  koolhydraten_g: string
  vetten_g: string
  vezels_g: string
  portie_gram: string
}
