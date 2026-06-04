import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function checkAuth(req: NextRequest): Promise<{ ok: boolean; error?: string }> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return { ok: false, error: 'Geen Bearer token' }
  const token = authHeader.slice(7)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { ok: false, error: 'Ongeldige sessie' }
  if (user.email?.toLowerCase() !== 'kanebongers@gmail.com') return { ok: false, error: 'Geen toegang' }
  return { ok: true }
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const EMPTY_STATS = {
  totaal: 0, per_status: {}, laatste_update: null,
  dag: { vandaag: 0, doel: 10, resterend: 10, datum: '' },
  history: [], rondesVandaag: [],
}

export async function GET(req: NextRequest) {
  const auth = await checkAuth(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 })

  try {
    const db = getServiceClient()
    const { data: contacten, error: cErr } = await db
      .from('agent_contacten')
      .select('r1_status, r2_status, r3_status')

    if (cErr) return NextResponse.json({ ...EMPTY_STATS, dag: { ...EMPTY_STATS.dag, datum: new Date().toLocaleDateString('nl-NL') } })

    const perStatus: Record<string, number> = { Nieuw: 0, 'Verstuurd 1': 0, 'Verstuurd 2': 0, 'Verstuurd 3': 0 }
    for (const c of contacten ?? []) {
      if (c.r3_status === 'verstuurd') perStatus['Verstuurd 3']++
      else if (c.r2_status === 'verstuurd') perStatus['Verstuurd 2']++
      else if (c.r1_status === 'verstuurd') perStatus['Verstuurd 1']++
      else perStatus['Nieuw']++
    }

    const vandaag = new Date().toLocaleDateString('nl-NL')
    const dagDoel = 10

    const rondesVandaag: number[] = []
    if (perStatus['Nieuw'] > 0) rondesVandaag.push(1)
    if (perStatus['Verstuurd 1'] > 0) rondesVandaag.push(2)
    if (perStatus['Verstuurd 2'] > 0) rondesVandaag.push(3)

    return NextResponse.json({
      totaal: contacten?.length ?? 0,
      per_status: perStatus,
      laatste_update: new Date().toISOString(),
      dag: { vandaag: 0, doel: dagDoel, resterend: dagDoel, datum: vandaag },
      history: [],
      rondesVandaag,
    })
  } catch {
    return NextResponse.json({ ...EMPTY_STATS, dag: { ...EMPTY_STATS.dag, datum: new Date().toLocaleDateString('nl-NL') } })
  }
}

const GH_TOKEN    = process.env.GITHUB_TOKEN || ''
const GH_REPO     = 'kanebongers-sketch/fitfactory-agent'
const GH_WORKFLOW = 'dagelijkse_agent.yml'

async function triggerWorkflow(stap: string, extraInputs: Record<string, string> = {}) {
  const res = await fetch(
    `https://api.github.com/repos/${GH_REPO}/actions/workflows/${GH_WORKFLOW}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `token ${GH_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main', inputs: { stap, ...extraInputs } }),
    }
  )
  return res.ok
}

export async function POST(req: NextRequest) {
  const auth = await checkAuth(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 })

  if (!GH_TOKEN) return NextResponse.json({ error: 'GITHUB_TOKEN niet geconfigureerd' }, { status: 500 })

  const body = await req.json()
  const { actie, stap, ronde } = body

  const geldigeStappen = ['zoek', 'ochtend_batch', 'alles', 'status', 'batch_status', 'preview', 'check_batch_callbacks']

  if (actie === 'trigger_workflow') {
    if (!stap || !geldigeStappen.includes(stap)) {
      return NextResponse.json({ error: 'Ongeldige stap' }, { status: 400 })
    }
    const ok = await triggerWorkflow(stap)
    return NextResponse.json({ ok, stap })
  }

  if (actie === 'verstuur') {
    return NextResponse.json({ error: 'Gebruik trigger_workflow met stap=ochtend_batch' }, { status: 400 })
  }

  const actieNaarStap: Record<string, string> = {
    zoek: 'zoek', status: 'status', preview: 'preview', scrape: 'zoek', filter: 'zoek', crm: 'status',
  }

  if (actie === 'preview' && !ronde) {
    return NextResponse.json({ error: 'Geef een ronde op' }, { status: 400 })
  }

  const mappedStap = actieNaarStap[actie]
  if (!mappedStap) return NextResponse.json({ error: 'Ongeldige actie' }, { status: 400 })

  const extraInputs: Record<string, string> = ronde ? { ronde: String(ronde) } : {}
  const ok = await triggerWorkflow(mappedStap, extraInputs)

  return NextResponse.json({
    ok,
    output: ok ? `Workflow '${mappedStap}' gestart via GitHub Actions` : 'GitHub Actions dispatch mislukt',
    stap: mappedStap,
  })
}
