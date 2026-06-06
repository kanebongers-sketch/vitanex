import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const naam = searchParams.get('naam')?.toLowerCase().trim()

  if (!naam) return NextResponse.json({ error: 'naam vereist' }, { status: 400 })

  try {
    const encoded = encodeURIComponent(naam)
    const res = await fetch(`https://exercisedb.io/api/v1/exercises/name/${encoded}?limit=3&offset=0`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 86400 }, // cache 24u
    })

    if (!res.ok) throw new Error('ExerciseDB niet bereikbaar')
    const data = await res.json() as Array<{
      name: string; gifUrl: string; bodyPart: string; target: string
      equipment: string; instructions: string[]; secondaryMuscles: string[]
    }>

    if (!data.length) return NextResponse.json({ gif_url: null, instructies: [] })

    const ex = data[0]
    return NextResponse.json({
      gif_url: ex.gifUrl,
      naam_en: ex.name,
      spiergroep: ex.target,
      lichaamsdeel: ex.bodyPart,
      uitrusting: ex.equipment,
      instructies: ex.instructions || [],
      secundaire_spieren: ex.secondaryMuscles || [],
    })
  } catch {
    return NextResponse.json({ gif_url: null, instructies: [] })
  }
}
