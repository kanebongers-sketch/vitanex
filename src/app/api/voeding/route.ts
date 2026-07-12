import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { vandaagNL, datumMinusDagenNL } from '@/lib/utils/date-nl'
import { effectieveDoelen } from '@/lib/health/gezondheid-berekeningen'
import type { SupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/** Persoonlijke voedingsdoelen + dieetcontext, afgeleid uit het intake-profiel. */
interface VoedingDoelen {
  calorie_doel: number | null
  calorie_handmatig: boolean
  macros: { eiwit_g: number; koolhydraten_g: number; vet_g: number } | null
  dieetvoorkeur: string | null
  allergieen: string[]
  /** false wanneer er onvoldoende profieldata is om een calorie-doel te bepalen. */
  profiel_compleet: boolean
}

/**
 * Lost de effectieve calorie-/macrodoelen voor een gebruiker op via het gedeelde
 * contract (effectieveDoelen). Een handmatig calorie_doel wint; anders berekend
 * uit gewicht, lengte, leeftijd, geslacht, activiteit en fitnessdoel. Geeft ook
 * dieetvoorkeur en allergieën terug zodat de UI en AI-coach dit kunnen tonen.
 */
async function voedingDoelenVoorUser(admin: SupabaseClient, userId: string): Promise<VoedingDoelen> {
  const { data: profiel } = await admin
    .from('profiles')
    .select('gewicht_kg, lengte_cm, geboortedatum, geslacht, activiteitsniveau, fitness_doel, calorie_doel, dieetvoorkeur, allergieen')
    .eq('id', userId)
    .maybeSingle()

  const doelen = effectieveDoelen({
    gewicht_kg: profiel?.gewicht_kg ?? null,
    lengte_cm: profiel?.lengte_cm ?? null,
    geboortedatum: profiel?.geboortedatum ?? null,
    geslacht: profiel?.geslacht ?? null,
    activiteitsniveau: profiel?.activiteitsniveau ?? null,
    fitness_doel: profiel?.fitness_doel ?? null,
    calorie_doel: profiel?.calorie_doel ?? null,
  })

  return {
    calorie_doel: doelen.calorie_doel,
    calorie_handmatig: doelen.calorie_handmatig,
    macros: doelen.macros,
    dieetvoorkeur: profiel?.dieetvoorkeur ?? null,
    allergieen: Array.isArray(profiel?.allergieen) ? profiel.allergieen : [],
    profiel_compleet: doelen.calorie_doel !== null,
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const admin = createAdminClient()
    const { searchParams } = new URL(req.url)
    const dagenParam = searchParams.get('dagen')

    if (dagenParam !== null) {
      const dagenInt = parseInt(dagenParam, 10)
      if (!Number.isFinite(dagenInt) || dagenInt < 1 || dagenInt > 365) {
        return NextResponse.json({ error: 'dagen moet een getal zijn tussen 1 en 365.' }, { status: 400 })
      }
      const vanafStr = datumMinusDagenNL(dagenInt)
      const { data, error } = await admin
        .from('voeding_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('datum', vanafStr)
        .order('datum', { ascending: false })
        .order('aangemaakt_op', { ascending: false })

      if (error) {
        console.error('[voeding GET] DB fout:', error.message)
        return NextResponse.json({ error: 'Er is een fout opgetreden.' }, { status: 500 })
      }
      return NextResponse.json({ logs: data ?? [] })
    }

    const datum = searchParams.get('datum') ?? vandaagNL()
    const { data, error } = await admin
      .from('voeding_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('datum', datum)
      .order('aangemaakt_op', { ascending: true })

    if (error) {
      console.error('[voeding GET] DB fout:', error.message)
      return NextResponse.json({ error: 'Er is een fout opgetreden.' }, { status: 500 })
    }

    const doelen = await voedingDoelenVoorUser(admin, user.id)
    return NextResponse.json({ logs: data ?? [], doelen })
  } catch (err) {
    console.error('[voeding GET]', err)
    return NextResponse.json({ error: 'Er is een fout opgetreden.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const body: {
      datum?: string
      maaltijd_type?: unknown
      omschrijving?: unknown
      calorieen?: unknown
      eiwitten_g?: unknown
      koolhydraten_g?: unknown
      vetten_g?: unknown
      vezels_g?: unknown
      portie_gram?: unknown
      bron?: unknown
      foto_url?: unknown
      ai_analyse?: unknown
    } = await req.json()

    if (!body.maaltijd_type || typeof body.maaltijd_type !== 'string' || !body.maaltijd_type.trim()) {
      return NextResponse.json({ error: 'maaltijd_type is vereist.' }, { status: 400 })
    }
    if (!body.omschrijving || typeof body.omschrijving !== 'string' || !body.omschrijving.trim()) {
      return NextResponse.json({ error: 'omschrijving is vereist.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('voeding_logs')
      .insert({
        user_id: user.id,
        datum: typeof body.datum === 'string' ? body.datum : vandaagNL(),
        maaltijd_type: body.maaltijd_type.trim(),
        omschrijving: (body.omschrijving as string).trim(),
        calorieen: body.calorieen ?? null,
        eiwitten_g: body.eiwitten_g ?? null,
        koolhydraten_g: body.koolhydraten_g ?? null,
        vetten_g: body.vetten_g ?? null,
        vezels_g: body.vezels_g ?? null,
        portie_gram: body.portie_gram ?? null,
        bron: typeof body.bron === 'string' ? body.bron : 'manueel',
        foto_url: body.foto_url ?? null,
        ai_analyse: body.ai_analyse ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('[voeding POST] Opslaan mislukt:', error.message)
      return NextResponse.json({ error: 'Opslaan mislukt. Probeer opnieuw.' }, { status: 500 })
    }
    return NextResponse.json({ log: data }, { status: 201 })
  } catch (err) {
    console.error('[voeding POST]', err)
    return NextResponse.json({ error: 'Er is een fout opgetreden.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id vereist.' }, { status: 400 })

    const admin = createAdminClient()

    const { error } = await admin
      .from('voeding_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[voeding DELETE] Verwijderen mislukt:', error.message)
      return NextResponse.json({ error: 'Verwijderen mislukt. Probeer opnieuw.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[voeding DELETE]', err)
    return NextResponse.json({ error: 'Er is een fout opgetreden.' }, { status: 500 })
  }
}
