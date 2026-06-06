
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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
      vitamine_a_ug: n['vitamin-a_100g'] ? Number((n['vitamin-a_100g'] * 1000000).toFixed(1)) : null,
      vitamine_c_mg: n['vitamin-c_100g'] ? Number((n['vitamin-c_100g'] * 1000).toFixed(1)) : null,
      vitamine_d_ug: n['vitamin-d_100g'] ? Number((n['vitamin-d_100g'] * 1000000).toFixed(1)) : null,
      vitamine_e_mg: n['vitamin-e_100g'] ? Number((n['vitamin-e_100g'] * 1000).toFixed(1)) : null,
      vitamine_b12_ug: n['vitamin-b12_100g'] ? Number((n['vitamin-b12_100g'] * 1000000).toFixed(2)) : null,
      folaat_ug: n['folates_100g'] ? Number((n['folates_100g'] * 1000000).toFixed(1)) : null,
      calcium_mg: n['calcium_100g'] ? Number((n['calcium_100g'] * 1000).toFixed(1)) : null,
      ijzer_mg: n['iron_100g'] ? Number((n['iron_100g'] * 1000).toFixed(2)) : null,
      magnesium_mg: n['magnesium_100g'] ? Number((n['magnesium_100g'] * 1000).toFixed(1)) : null,
      kalium_mg: n['potassium_100g'] ? Number((n['potassium_100g'] * 1000).toFixed(1)) : null,
      natrium_mg: n['sodium_100g'] ? Number((n['sodium_100g'] * 1000).toFixed(1)) : null,
      zink_mg: n['zinc_100g'] ? Number((n['zinc_100g'] * 1000).toFixed(2)) : null,
    },
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')?.trim()

  if (!code) {
    return NextResponse.json({ error: 'Barcode vereist' }, { status: 400 })
  }

  try {
    const url = `https://world.openfoodfacts.org/api/v0/product/${code}.json`
    const res = await fetch(url, { next: { revalidate: 86400 } })
    const data = await res.json() as { status: number; product?: { product_name?: string; brands?: string; quantity?: string; image_url?: string; nutriments?: Record<string, number> } }

    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ error: 'Product niet gevonden' }, { status: 404 })
    }

    const p = data.product
    return NextResponse.json({
      product: {
        id: code,
        naam: p.product_name || 'Onbekend product',
        merk: p.brands || null,
        hoeveelheid: p.quantity || null,
        bron: 'open_food_facts' as const,
        per_100g: offNutrienten(p.nutriments),
        foto_url: p.image_url || null,
      }
    })
  } catch {
    return NextResponse.json({ error: 'Open Food Facts niet bereikbaar' }, { status: 503 })
  }
}
