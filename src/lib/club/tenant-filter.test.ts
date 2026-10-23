// Bewaker: elke Supabase-query op een club_* of ayg_* tabel moet op de sportschool
// filteren (user_id of organisatie_id), anders staat er een lek tussen sportscholen.
// Legitieme uitzonderingen (platformoverzicht, cron, webhook, sessie op tokenhash)
// staan met een reden in tenant-filter-uitzonderingen.ts.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { TENANT_UITZONDERINGEN } from './tenant-filter-uitzonderingen'

const ROOT = path.resolve(__dirname, '../../..')
const MAPPEN = ['src/lib/club', 'src/app/(aiyourgym)', 'src/components/club']
const QUERY_METHODEN = new Set(['select', 'insert', 'update', 'delete', 'upsert'])
const FILTER_METHODEN = new Set(['eq', 'in', 'match', 'or', 'filter', 'contains'])
const TENANT_KOLOM = /\b(user_id|organisatie_id)\b/
// Voor een invoegpayload: ook userId/orgId in een hulpfunctie of eerder gebouwde rijen telt.
const PAYLOAD_TENANT = /\b(user_id|organisatie_id|userId|organisatieId|orgId)\b/
const RPC_TENANT = /\b(p_user\w*|p_org\w*|p_organisatie\w*|user_id|organisatie_id)\b/
const TABEL = /^(club|ayg)_/
const GEEN_SUPABASE = /^(Array|Buffer|Object|Uint8Array|Int8Array|Uint16Array|Uint32Array|Float32Array|Float64Array|String|Set|Map|Date)$/

export interface Hit {
  readonly bestand: string
  readonly regel: number
  readonly tabel: string
  readonly soort: 'query' | 'rpc'
}

function bestanden(map: string): string[] {
  const uit: string[] = []
  const loop = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) loop(p)
      else if (/\.tsx?$/.test(e.name) && !/\.(test|spec)\.tsx?$/.test(e.name) && !e.name.endsWith('.d.ts')) uit.push(p)
    }
  }
  loop(path.join(ROOT, map))
  return uit
}

function tekstWaarde(n: ts.Expression, consts: Map<string, string>): string | null {
  if (ts.isStringLiteralLike(n)) return n.text
  if (ts.isTemplateExpression(n)) return n.head.text + '${}'
  if (ts.isIdentifier(n)) return consts.get(n.text) ?? null
  if (ts.isAsExpression(n) || ts.isParenthesizedExpression(n)) return tekstWaarde(n.expression, consts)
  return null
}

function verzamelConsts(sf: ts.SourceFile): Map<string, string> {
  const m = new Map<string, string>()
  const loop = (n: ts.Node) => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) {
      const v = tekstWaarde(n.initializer, m)
      if (v !== null) m.set(n.name.text, v)
    }
    ts.forEachChild(n, loop)
  }
  loop(sf)
  return m
}

interface Schakel { naam: string; args: readonly ts.Expression[] }

/** Volgt de keten van .a().b().c() naar boven vanaf een aanroep. */
function keten(start: ts.CallExpression): { schakels: Schakel[]; laatste: ts.Node } {
  const schakels: Schakel[] = []
  let node: ts.Node = start
  for (;;) {
    let p: ts.Node = node.parent
    while (ts.isAwaitExpression(p) || ts.isParenthesizedExpression(p) || ts.isNonNullExpression(p) || ts.isAsExpression(p)) { node = p; p = p.parent }
    if (ts.isPropertyAccessExpression(p) && p.expression === node && ts.isCallExpression(p.parent) && p.parent.expression === p) {
      schakels.push({ naam: p.name.text, args: p.parent.arguments })
      node = p.parent
    } else return { schakels, laatste: node }
  }
}

/** Tekst van een argument plus, een niveau diep, de initializers van de variabelen erin. */
function payloadTekst(a: ts.Expression, bron: ts.SourceFile, inits: Map<string, string>): string {
  const t = a.getText(bron)
  const extra = (t.match(/[A-Za-z_$][\w$]*/g) ?? []).map((id) => inits.get(id) ?? '').join(' ')
  return t + ' ' + extra
}

function verzamelInits(sf: ts.SourceFile): Map<string, string> {
  const m = new Map<string, string>()
  const loop = (n: ts.Node) => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) m.set(n.name.text, n.initializer.getText(sf))
    // for (const rij of rijen): de lusvariabele erft de tekst van wat doorlopen wordt.
    if (ts.isForOfStatement(n) && ts.isVariableDeclarationList(n.initializer)) {
      const d = n.initializer.declarations[0]
      if (d && ts.isIdentifier(d.name)) m.set(d.name.text, n.expression.getText(sf) + ' ' + (ts.isIdentifier(n.expression) ? m.get(n.expression.text) ?? '' : ''))
    }
    ts.forEachChild(n, loop)
  }
  loop(sf)
  return m
}

function heeftTenantFilter(schakels: Schakel[], tabel: string, bron: ts.SourceFile, inits: Map<string, string>): boolean {
  for (const s of schakels) {
    if (FILTER_METHODEN.has(s.naam) && s.args.length > 0) {
      const eerste = s.args[0]
      const t = s.naam === 'match' || s.naam === 'or' ? eerste.getText(bron) : ts.isStringLiteralLike(eerste) ? eerste.text : ''
      if (TENANT_KOLOM.test(t)) return true
      // club_organisaties.id IS de sportschool zelf: filter op het eigen id is dan de tenant-filter.
      if (tabel === 'club_organisaties' && s.naam === 'eq' && ts.isStringLiteralLike(eerste) && eerste.text === 'id'
        && s.args[1] && /user_?id|organisatie_?id|orgId|organisatie\.id/i.test(s.args[1].getText(bron))) return true
    }
    if ((s.naam === 'insert' || s.naam === 'upsert') && s.args[0] && PAYLOAD_TENANT.test(payloadTekst(s.args[0], bron, inits))) return true
  }
  return false
}

/** Zoekt bij een keten die in een variabele belandt de latere schakels op diezelfde variabele. */
function extraSchakels(laatste: ts.Node): Schakel[] {
  const p = laatste.parent
  let naam: string | null = null
  if (ts.isVariableDeclaration(p) && ts.isIdentifier(p.name)) naam = p.name.text
  else if (ts.isBinaryExpression(p) && p.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isIdentifier(p.left)) naam = p.left.text
  if (!naam) return []
  let scope: ts.Node = laatste
  while (scope.parent && !ts.isFunctionLike(scope) && !ts.isSourceFile(scope)) scope = scope.parent
  const uit: Schakel[] = []
  const loop = (n: ts.Node) => {
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)) {
      let wortel: ts.Expression = n.expression.expression
      while (ts.isCallExpression(wortel) && ts.isPropertyAccessExpression(wortel.expression)) wortel = wortel.expression.expression
      if (ts.isIdentifier(wortel) && wortel.text === naam) uit.push({ naam: n.expression.name.text, args: n.arguments })
    }
    ts.forEachChild(n, loop)
  }
  loop(scope)
  return uit
}

export function scan(bestandsPad: string, tekst: string): Hit[] {
  const rel = path.relative(ROOT, bestandsPad).split(path.sep).join('/')
  const sf = ts.createSourceFile(bestandsPad, tekst, ts.ScriptTarget.Latest, true, bestandsPad.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const consts = verzamelConsts(sf)
  const inits = verzamelInits(sf)
  const hits: Hit[] = []
  const regelVan = (n: ts.Node) => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1
  const loop = (n: ts.Node) => {
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.arguments.length > 0) {
      const naam = n.expression.name.text
      const ontvanger = n.expression.expression.getText(sf)
      if (naam === 'from' && !GEEN_SUPABASE.test(ontvanger)) {
        const tabel = tekstWaarde(n.arguments[0], consts) ?? '<dynamisch>'
        const { schakels, laatste } = keten(n)
        const eerste = schakels[0]
        if (eerste && QUERY_METHODEN.has(eerste.naam) && (TABEL.test(tabel) || tabel === '<dynamisch>')) {
          if (!heeftTenantFilter([...schakels, ...extraSchakels(laatste)], tabel, sf, inits)) hits.push({ bestand: rel, regel: regelVan(n), tabel, soort: 'query' })
        }
      }
      if (naam === 'rpc') {
        const f = tekstWaarde(n.arguments[0], consts) ?? '<dynamisch>'
        if (TABEL.test(f) || f === '<dynamisch>') {
          const args = Array.from(n.arguments).slice(1).map((a) => a.getText(sf)).join(' ')
          if (!RPC_TENANT.test(args)) hits.push({ bestand: rel, regel: regelVan(n), tabel: f, soort: 'rpc' })
        }
      }
    }
    ts.forEachChild(n, loop)
  }
  loop(sf)
  return hits
}

function alleHits(): Hit[] {
  return MAPPEN.flatMap(bestanden).flatMap((p) => scan(p, fs.readFileSync(p, 'utf8')))
}

const gedekt = (h: Hit) => TENANT_UITZONDERINGEN.some((u) => u.bestand === h.bestand && u.tabel === h.tabel)

describe('tenant-filter', () => {
  it('scanner herkent een ontbrekend filter en een aanwezig filter', () => {
    const p = path.join(ROOT, 'src/lib/club/voorbeeld.ts')
    const slecht = "async function f(a:any,id:string){ return a.from('club_leden').select('*').eq('id', id) }"
    const goed = "async function f(a:any,id:string,u:string){ return a.from('club_leden').select('*').eq('id', id)\n.eq('user_id', u) }"
    const viaVariabele = "async function f(a:any,u:string){ let q = a.from('club_leden').select('*'); q = q.eq('user_id', u); return q }"
    expect(scan(p, slecht)).toHaveLength(1)
    expect(scan(p, goed)).toHaveLength(0)
    expect(scan(p, viaVariabele)).toHaveLength(0)
    expect(scan(p, "a.rpc('club_x', { p_id: 1 })")).toHaveLength(1)
    expect(scan(p, "a.rpc('club_x', { p_user: u })")).toHaveLength(0)
  })

  it('elke club_*/ayg_*-query filtert op sportschool, of staat met reden in de uitzonderingen', () => {
    const zonder = alleHits().filter((h) => !gedekt(h))
    const melding = zonder.map((h) => `${h.bestand}:${h.regel} ${h.soort} op ${h.tabel}`)
    expect(melding, 'Query zonder user_id/organisatie_id. Voeg het filter toe, of zet de query met reden in tenant-filter-uitzonderingen.ts').toEqual([])
  })

  it('de uitzonderingenlijst bevat geen verouderde regels', () => {
    const hits = alleHits()
    const oud = TENANT_UITZONDERINGEN.filter((u) => !hits.some((h) => h.bestand === u.bestand && h.tabel === u.tabel))
    expect(oud.map((u) => `${u.bestand} ${u.tabel}`), 'Uitzondering zonder passende query meer: verwijder de regel').toEqual([])
    for (const u of TENANT_UITZONDERINGEN) expect(u.reden.trim().length, `reden ontbreekt: ${u.bestand}`).toBeGreaterThan(10)
  })
})
