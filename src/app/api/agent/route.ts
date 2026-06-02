import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)
const AGENT_DIR = 'C:\\Users\\Kaneb\\fitfactory-agent'
const CRM_STATUS = path.join(AGENT_DIR, 'crm_status.json')
const DAGLOG = path.join(AGENT_DIR, 'dag_log.json')

function laadDagLog() {
  if (!fs.existsSync(DAGLOG)) return { vandaag: 0, datum: '', history: [] as {datum:string,verstuurd:number,followup:number}[] }
  return JSON.parse(fs.readFileSync(DAGLOG, 'utf-8'))
}

export async function GET() {
  try {
    const crm = fs.existsSync(CRM_STATUS)
      ? JSON.parse(fs.readFileSync(CRM_STATUS, 'utf-8'))
      : { totaal: 0, per_status: {}, bedrijven: [], laatste_update: null }

    const daglog = laadDagLog()
    const vandaag = new Date().toLocaleDateString('nl-NL')

    // Tel hoeveel er vandaag al verstuurd zijn
    const vandaagVerstuurd = daglog.datum === vandaag ? daglog.vandaag : 0
    const dagDoel = 10
    const resterend = Math.max(0, dagDoel - vandaagVerstuurd)

    // Bereken welke rondes vandaag actief zijn
    const rondesVandaag: number[] = []
    const nieuw = crm.per_status?.['Nieuw'] ?? 0
    if (nieuw > 0) rondesVandaag.push(1)
    for (let r = 2; r <= 5; r++) {
      if ((crm.per_status?.[`Verstuurd ${r-1}`] ?? 0) > 0) rondesVandaag.push(r)
    }

    return NextResponse.json({
      ...crm,
      dag: { vandaag: vandaagVerstuurd, doel: dagDoel, resterend, datum: vandaag },
      history: daglog.history ?? [],
      rondesVandaag,
    })
  } catch {
    return NextResponse.json({ error: 'Kan CRM niet lezen' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const body = await req.json()
  const { actie, ronde, aantal } = body

  if (actie === 'verstuur') {
    return NextResponse.json({ error: 'Versturen kan alleen via de terminal' }, { status: 403 })
  }

  // Dagelijkse limiet check voor preview
  if (actie === 'preview' && !ronde) {
    return NextResponse.json({ error: 'Geef een ronde op' }, { status: 400 })
  }

  const toegestaan = ['status', 'preview', 'zoek', 'scrape', 'filter', 'crm']
  if (!toegestaan.includes(actie)) {
    return NextResponse.json({ error: 'Ongeldige actie' }, { status: 400 })
  }

  const maxEmails = aantal ?? 10
  const cmd = ronde
    ? `cd "${AGENT_DIR}" && set PYTHONIOENCODING=utf-8 && python -W ignore main.py ${actie} ${ronde}`
    : `cd "${AGENT_DIR}" && set PYTHONIOENCODING=utf-8 && python -W ignore main.py ${actie}`

  try {
    const { stdout, stderr } = await execAsync(cmd, {
      shell: 'cmd.exe',
      timeout: 300_000,
      maxBuffer: 1024 * 1024 * 10,
    })
    const output = (stdout || stderr || '').trim()

    // Update daglog na succesvol versturen
    if (actie === 'stuur_dag' && output.includes('emails verstuurd')) {
      const match = output.match(/(\d+)\/\d+ emails verstuurd/)
      const verstuurd = match ? parseInt(match[1]) : 0
      const daglog = laadDagLog()
      const vandaag = new Date().toLocaleDateString('nl-NL')
      const vandaagVerstuurd = daglog.datum === vandaag ? daglog.vandaag + verstuurd : verstuurd
      const history = daglog.history ?? []
      const bestaand = history.findIndex((h: {datum:string}) => h.datum === vandaag)
      if (bestaand >= 0) history[bestaand].verstuurd = vandaagVerstuurd
      else history.unshift({ datum: vandaag, verstuurd: vandaagVerstuurd, followup: ronde > 1 ? verstuurd : 0 })
      fs.writeFileSync(DAGLOG, JSON.stringify({ vandaag: vandaagVerstuurd, datum: vandaag, history: history.slice(0, 30) }, null, 2))
    }

    return NextResponse.json({ ok: true, output, maxEmails })
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; message?: string }
    return NextResponse.json({ ok: false, output: err.stdout || err.stderr || err.message }, { status: 500 })
  }
}
