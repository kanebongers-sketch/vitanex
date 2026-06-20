import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { vandaagNL, datumMinusDagenNL } from '@/lib/date-nl'

export const dynamic = 'force-dynamic'

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
    return NextResponse.json({ logs: data ?? [] })
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
