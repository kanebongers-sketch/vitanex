import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { vandaagNL } from '@/lib/utils/date-nl'

// ─── Validatiegrenzen (systeemgrens — valideer user input hier) ────────────────
const GEWICHT_MIN = 20
const GEWICHT_MAX = 400
const VETPERCENTAGE_MIN = 0
const VETPERCENTAGE_MAX = 70

interface MetingInvoer {
  gewicht_kg?: unknown
  vetpercentage?: unknown
  notitie?: unknown
}

/** Valideert een numerieke waarde binnen grenzen. Null bij ongeldige input. */
function geldigGetal(waarde: unknown, min: number, max: number): number | null {
  if (typeof waarde !== 'number' || !Number.isFinite(waarde)) return null
  if (waarde < min || waarde > max) return null
  return waarde
}

/**
 * GET — geschiedenis van lichaamsmetingen voor de ingelogde gebruiker,
 * aflopend op datum (nieuwste eerst).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('lichaamsmetingen')
      .select('id, datum, gewicht_kg, vetpercentage, notitie, aangemaakt_op')
      .eq('user_id', user.id)
      .order('datum', { ascending: false })

    if (error) {
      console.error('[lichaamsmetingen GET] DB fout:', error.message)
      return NextResponse.json({ error: 'Er is een fout opgetreden.' }, { status: 500 })
    }

    return NextResponse.json(
      { metingen: data ?? [] },
      { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=30' } },
    )
  } catch (err) {
    console.error('[lichaamsmetingen GET]', err)
    return NextResponse.json({ error: 'Er is een fout opgetreden.' }, { status: 500 })
  }
}

/**
 * POST — upsert van de meting van vandaag op (user_id, datum). Werkt daarnaast
 * profiles.gewicht_kg en profiles.vetpercentage bij naar de nieuwste waarde.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const body: MetingInvoer = await req.json()

    const gewicht = geldigGetal(body.gewicht_kg, GEWICHT_MIN, GEWICHT_MAX)
    if (gewicht === null) {
      return NextResponse.json(
        { error: `Gewicht moet tussen ${GEWICHT_MIN} en ${GEWICHT_MAX} kg liggen.` },
        { status: 400 },
      )
    }

    // Vetpercentage is optioneel; alleen valideren wanneer ingevuld.
    let vet: number | null = null
    if (body.vetpercentage !== undefined && body.vetpercentage !== null && body.vetpercentage !== '') {
      vet = geldigGetal(body.vetpercentage, VETPERCENTAGE_MIN, VETPERCENTAGE_MAX)
      if (vet === null) {
        return NextResponse.json(
          { error: `Vetpercentage moet tussen ${VETPERCENTAGE_MIN} en ${VETPERCENTAGE_MAX}% liggen.` },
          { status: 400 },
        )
      }
    }

    const notitie =
      typeof body.notitie === 'string' && body.notitie.trim() ? body.notitie.trim().slice(0, 280) : null

    const admin = createAdminClient()
    const vandaag = vandaagNL()

    const { data: meting, error: upsertError } = await admin
      .from('lichaamsmetingen')
      .upsert(
        { user_id: user.id, datum: vandaag, gewicht_kg: gewicht, vetpercentage: vet, notitie },
        { onConflict: 'user_id,datum' },
      )
      .select('id, datum, gewicht_kg, vetpercentage, notitie, aangemaakt_op')
      .single()

    if (upsertError) {
      console.error('[lichaamsmetingen POST] Upsert mislukt:', upsertError.message)
      return NextResponse.json({ error: 'Opslaan mislukt. Probeer opnieuw.' }, { status: 500 })
    }

    // Profiel bijwerken naar de nieuwste waarde (gewicht altijd, vet alleen indien ingevuld).
    const profielUpdate: { gewicht_kg: number; vetpercentage?: number } = { gewicht_kg: gewicht }
    if (vet !== null) profielUpdate.vetpercentage = vet

    const { error: profielError } = await admin
      .from('profiles')
      .update(profielUpdate)
      .eq('id', user.id)

    if (profielError) {
      console.error('[lichaamsmetingen POST] Profiel bijwerken mislukt:', profielError.message)
      // Meting is opgeslagen; profielsync faalde — geen harde fout voor de gebruiker.
    }

    return NextResponse.json({ meting }, { status: 201 })
  } catch (err) {
    console.error('[lichaamsmetingen POST]', err)
    return NextResponse.json({ error: 'Er is een fout opgetreden.' }, { status: 500 })
  }
}
