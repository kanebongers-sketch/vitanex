import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Free Exercise DB — geen API-key nodig, 800+ oefeningen met foto's
// https://github.com/yuhonas/free-exercise-db
const EXERCISES_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises.json'
const IMG_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises'

interface Exercise {
  id: string
  name: string
  primaryMuscles: string[]
  secondaryMuscles: string[]
  equipment: string
  category: string
  instructions: string[]
  images: string[]
  level: string
}

// Scoort hoe goed `query` overeenkomt met de oefening-naam.
// Geeft 0–100 terug; hogere score = betere match.
function scoreMatch(query: string, name: string): number {
  const q = query.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim()
  const n = name.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim()

  if (q === n) return 100
  if (n === q) return 100

  // Exacte substring-match
  if (n.includes(q) || q.includes(n)) return 80

  // Woord-overlap score
  const qWords = q.split(/\s+/).filter(Boolean)
  const nWords = n.split(/\s+/).filter(Boolean)
  const hits = qWords.filter(w => nWords.some(nw => nw.startsWith(w) || w.startsWith(nw)))
  const ratio = hits.length / Math.max(qWords.length, nWords.length)
  return Math.round(ratio * 60)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const naam = searchParams.get('naam')?.trim()
  if (!naam) return NextResponse.json({ error: 'naam vereist' }, { status: 400 })

  try {
    // Gecached door Next.js voor 24 uur — wordt niet elke request opnieuw gefetcht
    const res = await fetch(EXERCISES_URL, { next: { revalidate: 86400 } })
    if (!res.ok) throw new Error('Free Exercise DB niet bereikbaar')
    const exercises = await res.json() as Exercise[]

    let best: Exercise | null = null
    let bestScore = 0

    for (const ex of exercises) {
      const score = scoreMatch(naam, ex.name)
      if (score > bestScore) {
        bestScore = score
        best = ex
      }
      if (score === 100) break
    }

    if (!best || bestScore < 20 || !best.images?.length) {
      return NextResponse.json({ gif_url: null, instructies: [] })
    }

    // Afbeeldings-URL: images[0] is een relatief pad zoals "0001/images/0.jpg"
    const imageUrl = `${IMG_BASE}/${best.images[0]}`

    return NextResponse.json({
      gif_url: imageUrl,
      naam_en: best.name,
      spiergroep: best.primaryMuscles[0] ?? null,
      lichaamsdeel: best.category,
      uitrusting: best.equipment,
      instructies: best.instructions ?? [],
      secundaire_spieren: best.secondaryMuscles ?? [],
    })
  } catch {
    return NextResponse.json({ gif_url: null, instructies: [] })
  }
}
