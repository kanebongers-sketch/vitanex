
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface OFFProduct {
  code?: string
  product_name?: string
  brands?: string
  quantity?: string
  image_url?: string
  image_front_url?: string
  image_front_small_url?: string
  image_small_url?: string
  nutriments?: Record<string, number>
}

interface OFFResponse {
  products: OFFProduct[]
  count: number
}

interface USDANutrient {
  nutrientId: number
  nutrientName: string
  value: number
  unitName: string
}

interface USDAFood {
  fdcId: number
  description: string
  dataType: string
  brandOwner?: string
  foodNutrients: USDANutrient[]
}

interface USDAResponse {
  foods: USDAFood[]
  totalHits: number
}

function offNutrienten(n: Record<string, number> = {}) {
  return {
    calorieen: Math.round(n['energy-kcal_100g'] || n['energy-kcal'] || 0),
    eiwitten_g: Number((n['proteins_100g'] || 0).toFixed(1)),
    koolhydraten_g: Number((n['carbohydrates_100g'] || 0).toFixed(1)),
    suikers_g: Number((n['sugars_100g'] || 0).toFixed(1)),
    vetten_g: Number((n['fat_100g'] || 0).toFixed(1)),
    verzadigd_vet_g: Number((n['saturated-fat_100g'] || 0).toFixed(1)),
    vezels_g: Number((n['fiber_100g'] || 0).toFixed(1)),
    zout_mg: Number(((n['salt_100g'] || 0) * 1000).toFixed(1)),
    micronutrienten: {
      vitamine_a_ug:   n['vitamin-a_100g']   ? Number((n['vitamin-a_100g']   * 1000000).toFixed(1))  : null,
      vitamine_c_mg:   n['vitamin-c_100g']   ? Number((n['vitamin-c_100g']   * 1000).toFixed(1))     : null,
      vitamine_d_ug:   n['vitamin-d_100g']   ? Number((n['vitamin-d_100g']   * 1000000).toFixed(1))  : null,
      vitamine_e_mg:   n['vitamin-e_100g']   ? Number((n['vitamin-e_100g']   * 1000).toFixed(1))     : null,
      vitamine_b12_ug: n['vitamin-b12_100g'] ? Number((n['vitamin-b12_100g'] * 1000000).toFixed(2)) : null,
      folaat_ug:       n['folates_100g']     ? Number((n['folates_100g']     * 1000000).toFixed(1))  : null,
      calcium_mg:      n['calcium_100g']     ? Number((n['calcium_100g']     * 1000).toFixed(1))     : null,
      ijzer_mg:        n['iron_100g']        ? Number((n['iron_100g']        * 1000).toFixed(2))     : null,
      magnesium_mg:    n['magnesium_100g']   ? Number((n['magnesium_100g']   * 1000).toFixed(1))     : null,
      kalium_mg:       n['potassium_100g']   ? Number((n['potassium_100g']   * 1000).toFixed(1))     : null,
      natrium_mg:      n['sodium_100g']      ? Number((n['sodium_100g']      * 1000).toFixed(1))     : null,
      zink_mg:         n['zinc_100g']        ? Number((n['zinc_100g']        * 1000).toFixed(2))     : null,
    },
  }
}

function usdaNutrienten(nutrients: USDANutrient[]) {
  const find = (id: number) => nutrients.find(n => n.nutrientId === id)?.value ?? 0
  return {
    calorieen: Math.round(find(1008)),
    eiwitten_g: Number(find(1003).toFixed(1)),
    koolhydraten_g: Number(find(1005).toFixed(1)),
    suikers_g: Number(find(2000).toFixed(1)),
    vetten_g: Number(find(1004).toFixed(1)),
    verzadigd_vet_g: Number(find(1258).toFixed(1)),
    vezels_g: Number(find(1079).toFixed(1)),
    zout_mg: Number((find(1093) * 2.5).toFixed(1)),
    micronutrienten: {
      vitamine_a_ug:   find(1104) ? Number(find(1104).toFixed(1))  : null,
      vitamine_c_mg:   find(1162) ? Number(find(1162).toFixed(1))  : null,
      vitamine_d_ug:   find(1114) ? Number(find(1114).toFixed(1))  : null,
      vitamine_e_mg:   find(1109) ? Number(find(1109).toFixed(1))  : null,
      vitamine_b12_ug: find(1178) ? Number(find(1178).toFixed(2))  : null,
      folaat_ug:       find(1190) ? Number(find(1190).toFixed(1))  : null,
      calcium_mg:      find(1087) ? Number(find(1087).toFixed(1))  : null,
      ijzer_mg:        find(1089) ? Number(find(1089).toFixed(2))  : null,
      magnesium_mg:    find(1090) ? Number(find(1090).toFixed(1))  : null,
      kalium_mg:       find(1092) ? Number(find(1092).toFixed(1))  : null,
      natrium_mg:      find(1093) ? Number(find(1093).toFixed(1))  : null,
      zink_mg:         find(1095) ? Number(find(1095).toFixed(2))  : null,
    },
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()
  const bron = searchParams.get('bron') || 'off'

  if (!q || q.length < 2) {
    return NextResponse.json({ resultaten: [] })
  }

  if (bron === 'usda') {
    try {
      const apiKey = process.env.USDA_API_KEY || 'DEMO_KEY'
      const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&api_key=${apiKey}&pageSize=20&dataType=Foundation,SR%20Legacy,Branded`
      const res = await fetch(url, { next: { revalidate: 3600 } })
      if (!res.ok) throw new Error('USDA unavailable')
      const data = await res.json() as USDAResponse
      const resultaten = (data.foods || []).slice(0, 20).map(food => ({
        id: String(food.fdcId),
        naam: food.description,
        merk: food.brandOwner || null,
        hoeveelheid: null as string | null,
        bron: 'usda' as const,
        per_100g: usdaNutrienten(food.foodNutrients),
        foto_url: null as string | null,
      }))
      return NextResponse.json({ resultaten, totaal: data.totalHits })
    } catch {
      return NextResponse.json({ resultaten: [], fout: 'USDA niet bereikbaar' })
    }
  }

  // Default: Open Food Facts
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&json=1&fields=code,product_name,brands,quantity,image_url,image_front_url,image_front_small_url,image_small_url,nutriments&page_size=20&lc=nl,en`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error('OFF unavailable')
    const data = await res.json() as OFFResponse
    const resultaten = (data.products || [])
      .filter(p => p.product_name)
      .slice(0, 20)
      .map(p => ({
        id: p.code || '',
        naam: p.product_name || 'Onbekend',
        merk: p.brands || null,
        hoeveelheid: p.quantity || null,
        bron: 'open_food_facts' as const,
        per_100g: offNutrienten(p.nutriments),
        foto_url: p.image_front_small_url || p.image_small_url || p.image_front_url || p.image_url || null,
      }))
    return NextResponse.json({ resultaten, totaal: data.count })
  } catch {
    return NextResponse.json({ resultaten: [], fout: 'Open Food Facts niet bereikbaar' })
  }
}
