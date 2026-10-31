// Bewaker: elke Supabase-query op een club_* of ayg_* tabel moet op de sportschool
// filteren (user_id of organisatie_id), anders staat er een lek tussen sportscholen.
// Legitieme uitzonderingen (platformoverzicht, cron, webhook, sessie op tokenhash)
// staan met een reden in tenant-filter-uitzonderingen.ts, bij voorkeur per functie.
// Daarnaast: de waarde van dat filter mag niet uit de request komen (body, json,
// searchParams enz.), want dan kiest de bezoeker zelf de sportschool.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { TENANT_UITZONDERINGEN, type TenantUitzondering } from './tenant-filter-uitzonderingen'

const ROOT = path.resolve(__dirname, '../../..')
// Een vaste tabelnaam club_* of ayg_* zoeken we in heel src; een dynamische
// tabelnaam alleen in de mappen van AI Your Gym (elders is dat LifeOS of de PT-app).
const ALLE_BRONNEN = 'src'
const AYG_MAPPEN = ['src/lib/club/', 'src/lib/aiyourgym/', 'src/app/(aiyourgym)/', 'src/components/club/', 'src/components/aiyourgym/']
const QUERY_METHODEN = new Set(['select', 'insert', 'update', 'delete', 'upsert'])
const FILTER_METHODEN = new Set(['eq', 'in', 'match', 'or', 'filter', 'contains'])
const TENANT_KOLOM = /\b(user_id|organisatie_id)\b/
// Voor een invoegpayload: ook userId/orgId in een hulpfunctie of eerder gebouwde rijen telt.
const PAYLOAD_TENANT = /\b(user_id|organisatie_id|userId|organisatieId|orgId)\b/
const RPC_TENANT = /\b(p_user\w*|p_org\w*|p_organisatie\w*|user_id|organisatie_id)\b/
const TABEL = /^(club|ayg)_/
// Namen die op invoer van de bezoeker wijzen. Een sportschool komt uit de sessie (t.userId), nooit hieruit.
const ONVEILIGE_BRON = /\b(body|json|formData|searchParams|request|req|payload)\b|\.nextUrl\b|\.headers\b/
const GEEN_SUPABASE = /^(Array|Buffer|Object|Uint8Array|Int8Array|Uint16Array|Uint32Array|Float32Array|Float64Array|String|Set|Map|Date)$/

export interface Hit {
  readonly bestand: string
  readonly regel: number
  readonly tabel: string
  readonly soort: 'query' | 'rpc' | 'bron'
  /** Naam van de dichtstbijzijnde functie met een naam, of '<bestand>' op het hoogste niveau. */
  readonly functie: string
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
    // const { userId } = body: elke naam erft de tekst van wat uitgepakt wordt.
    if (ts.isVariableDeclaration(n) && ts.isObjectBindingPattern(n.name) && n.initializer) {
      for (const e of n.name.elements) if (ts.isIdentifier(e.name)) m.set(e.name.text, n.initializer.getText(sf))
    }
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

// Een naam die uit een toegangs- of sessiefunctie komt (vereisClubToegang(req) enz.) is vertrouwd,
// ook al staat req in de aanroep: de sportschool volgt dan uit de sessie.
const VERTROUWD = /\b(vereis\w*|eis[A-Z]\w*|\w*[Tt]oegang\w*|\w*[Ss]essie\w*|adresVanVerzoek)\s*\(/

/** Tekst plus, een niveau diep, de initializers van de losse namen erin (niet van eigenschappen). */
function uitbreiden(tekst: string, inits: Map<string, string>): string {
  const namen = tekst.match(/(?<![.\w$])[A-Za-z_$][\w$]*/g) ?? []
  const extra = namen.map((id) => inits.get(id) ?? '').filter((init) => !VERTROUWD.test(init))
  return [tekst, ...extra].join(' ')
}

function waardeTekst(a: ts.Expression | undefined, bron: ts.SourceFile, inits: Map<string, string>): string {
  return a ? uitbreiden(a.getText(bron), inits) : ''
}

/** De waarden die een payload of rpc-argument aan een sportschoolkolom geeft. */
function tenantWaarden(args: readonly ts.Expression[], bron: ts.SourceFile, inits: Map<string, string>, sleutel: RegExp): string {
  const tekst = args.map((a) => (ts.isIdentifier(a) ? a.text + ' ' + (inits.get(a.text) ?? '') : a.getText(bron))).join(' ')
  return [...tekst.matchAll(sleutel)].map((m) => uitbreiden(m[1], inits)).join(' ')
}
const PAYLOAD_WAARDE = /\b(?:user_id|organisatie_id)\s*:\s*([^,}\n]+)/g
const RPC_WAARDE = /\b(?:p_user\w*|p_org\w*|p_organisatie\w*|user_id|organisatie_id)\s*:\s*([^,}\n]+)/g

type Filteruitkomst = 'geen' | 'ok' | 'onveilig'

function tenantFilter(schakels: Schakel[], tabel: string, bron: ts.SourceFile, inits: Map<string, string>): Filteruitkomst {
  let gevonden = false
  let onveilig = false
  for (const s of schakels) {
    if (FILTER_METHODEN.has(s.naam) && s.args.length > 0) {
      const eerste = s.args[0]
      const tekst = s.naam === 'match' || s.naam === 'or'
      const t = tekst ? eerste.getText(bron) : ts.isStringLiteralLike(eerste) ? eerste.text : ''
      if (TENANT_KOLOM.test(t)) {
        gevonden = true
        if (ONVEILIGE_BRON.test(waardeTekst(tekst ? eerste : s.args[1], bron, inits))) onveilig = true
      }
      // club_organisaties.id IS de sportschool zelf: filter op het eigen id is dan de tenant-filter.
      if (tabel === 'club_organisaties' && s.naam === 'eq' && ts.isStringLiteralLike(eerste) && eerste.text === 'id'
        && s.args[1] && /user_?id|organisatie_?id|org_?id|organisatie\.id/i.test(s.args[1].getText(bron))) {
        gevonden = true
        if (ONVEILIGE_BRON.test(waardeTekst(s.args[1], bron, inits))) onveilig = true
      }
    }
    if ((s.naam === 'insert' || s.naam === 'upsert') && s.args[0] && PAYLOAD_TENANT.test(payloadTekst(s.args[0], bron, inits))) {
      gevonden = true
      if (ONVEILIGE_BRON.test(tenantWaarden([s.args[0]], bron, inits, PAYLOAD_WAARDE))) onveilig = true
    }
  }
  return !gevonden ? 'geen' : onveilig ? 'onveilig' : 'ok'
}

/** Naam van de dichtstbijzijnde functie met een naam (anonieme callbacks tellen bij hun ouder). */
function functieVan(n: ts.Node): string {
  for (let p: ts.Node | undefined = n.parent; p; p = p.parent) {
    if ((ts.isFunctionDeclaration(p) || ts.isMethodDeclaration(p)) && p.name && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) return p.name.text
    if ((ts.isArrowFunction(p) || ts.isFunctionExpression(p)) && ts.isVariableDeclaration(p.parent) && ts.isIdentifier(p.parent.name)) return p.parent.name.text
    if ((ts.isArrowFunction(p) || ts.isFunctionExpression(p)) && ts.isPropertyAssignment(p.parent) && ts.isIdentifier(p.parent.name)) return p.parent.name.text
  }
  return '<bestand>'
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
  const aygBestand = AYG_MAPPEN.some((m) => rel.startsWith(m))
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
        if (eerste && QUERY_METHODEN.has(eerste.naam) && (TABEL.test(tabel) || (tabel === '<dynamisch>' && aygBestand))) {
          const uitkomst = tenantFilter([...schakels, ...extraSchakels(laatste)], tabel, sf, inits)
          if (uitkomst !== 'ok') hits.push({ bestand: rel, regel: regelVan(n), tabel, soort: uitkomst === 'geen' ? 'query' : 'bron', functie: functieVan(n) })
        }
      }
      if (naam === 'rpc') {
        const f = tekstWaarde(n.arguments[0], consts) ?? '<dynamisch>'
        if (TABEL.test(f) || (f === '<dynamisch>' && aygBestand)) {
          const rest = Array.from(n.arguments).slice(1)
          const args = rest.map((a) => a.getText(sf)).join(' ')
          if (!RPC_TENANT.test(args)) hits.push({ bestand: rel, regel: regelVan(n), tabel: f, soort: 'rpc', functie: functieVan(n) })
          else if (ONVEILIGE_BRON.test(tenantWaarden(rest, sf, inits, RPC_WAARDE))) hits.push({ bestand: rel, regel: regelVan(n), tabel: f, soort: 'bron', functie: functieVan(n) })
        }
      }
    }
    ts.forEachChild(n, loop)
  }
  loop(sf)
  return hits
}

// Alleen een aanroep .from( of .rpc( kan een hit geven. Bestanden zonder zo'n aanroep slaan
// we over voordat de (dure) TypeScript-parser draait; dat scheelt ruim 80% van het werk.
const KAN_QUERY = /\.\s*(from|rpc)\s*\(/
// Buiten AI Your Gym telt alleen een vaste tabelnaam: zonder club_ of ayg_ in de tekst geen hit.
const KAN_TABEL = /\b(club|ayg)_/

let cache: Hit[] | null = null

/** Scant een keer per testrun; de twee tests hieronder delen het resultaat. */
function alleHits(): Hit[] {
  if (cache) return cache
  cache = bestanden(ALLE_BRONNEN).flatMap((p) => {
    const rel = path.relative(ROOT, p).split(path.sep).join('/')
    const tekst = fs.readFileSync(p, 'utf8')
    const kan = KAN_QUERY.test(tekst) && (KAN_TABEL.test(tekst) || AYG_MAPPEN.some((m) => rel.startsWith(m)))
    return kan ? scan(p, tekst) : []
  })
  return cache
}

// Een uitzondering met functies dekt alleen de querys in die functie; zonder functie het hele bestand.
// Een onveilige bron ('bron') is nooit met een uitzondering te dekken: dat moet altijd gefixt worden.
const past = (u: TenantUitzondering, h: Hit) => u.bestand === h.bestand && u.tabel === h.tabel && (!u.functies || u.functies.includes(h.functie))
const gedekt = (h: Hit) => h.soort !== 'bron' && TENANT_UITZONDERINGEN.some((u) => past(u, h))

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

  it('scanner herkent een sportschool die uit de request komt', () => {
    const p = path.join(ROOT, 'src/lib/club/voorbeeld.ts')
    const uitBody = "async function f(a:any,req:any){ const body = await req.json(); return a.from('club_leden').select('*').eq('user_id', body.userId) }"
    const uitgepakt = "async function f(a:any,body:any){ const { userId } = body; return a.from('club_leden').select('*').eq('user_id', userId) }"
    const zoekterm = "async function f(a:any,url:URL){ return a.from('club_leden').select('*').eq('user_id', url.searchParams.get('org')) }"
    const invoegen = "async function f(a:any,body:any){ return a.from('club_leden').insert({ user_id: body.org, naam: 'x' }) }"
    const rpc = "async function f(a:any,body:any){ return a.rpc('club_x', { p_user: body.org }) }"
    const uitSessie = "async function haal(a:any,t:any){ return a.from('club_leden').select('*').eq('user_id', t.userId) }"
    for (const code of [uitBody, uitgepakt, zoekterm, invoegen, rpc]) expect(scan(p, code).map((h) => h.soort), code).toEqual(['bron'])
    expect(scan(p, uitSessie)).toHaveLength(0)
  })

  it('een hit kent zijn functie, zodat een uitzondering per query kan', () => {
    const p = path.join(ROOT, 'src/lib/club/voorbeeld.ts')
    const code = "export async function vindOpToken(a:any,h:string){ return a.from('club_lid_sessies').select('*').eq('token_hash', h) }\nconst ook = async (a:any) => a.from('club_leden').select('id')"
    expect(scan(p, code).map((h) => h.functie)).toEqual(['vindOpToken', 'ook'])
  })

  it('scant ook buiten src/lib/club, maar een dynamische tabel alleen binnen AI Your Gym', () => {
    const ayg = path.join(ROOT, 'src/lib/aiyourgym/voorbeeld.ts')
    const lifeos = path.join(ROOT, 'src/lib/lifeos/voorbeeld.ts')
    expect(scan(ayg, "a.from('ayg_aanmeldingen').select('*')")).toHaveLength(1)
    expect(scan(ayg, "a.from(tabel).select('*')")).toHaveLength(1)
    expect(scan(lifeos, "a.from(tabel).select('*')")).toHaveLength(0)
    expect(scan(lifeos, "a.from('club_leden').select('*')")).toHaveLength(1)
  })

  it('elke club_*/ayg_*-query filtert op sportschool, of staat met reden in de uitzonderingen', () => {
    const zonder = alleHits().filter((h) => !gedekt(h))
    const melding = zonder.map((h) => `${h.bestand}:${h.regel} (${h.functie}) ${h.soort} op ${h.tabel}`)
    expect(melding, 'Query zonder user_id/organisatie_id. Voeg het filter toe, of zet de query met reden in tenant-filter-uitzonderingen.ts').toEqual([])
  }, 30_000) // scant alle bronbestanden; in een volle testrun duurt dat soms langer dan 5 seconden

  it('de uitzonderingenlijst bevat geen verouderde regels', () => {
    const hits = alleHits()
    const oud = TENANT_UITZONDERINGEN.filter((u) => !hits.some((h) => h.soort !== 'bron' && past(u, h)))
    expect(oud.map((u) => `${u.bestand} ${u.tabel}`), 'Uitzondering zonder passende query meer: verwijder de regel').toEqual([])
    const losseFuncties = TENANT_UITZONDERINGEN.flatMap((u) => (u.functies ?? [])
      .filter((f) => !hits.some((h) => h.soort !== 'bron' && h.bestand === u.bestand && h.tabel === u.tabel && h.functie === f))
      .map((f) => `${u.bestand} ${u.tabel} ${f}`))
    expect(losseFuncties, 'Functie in een uitzondering zonder query zonder filter meer: haal hem uit functies').toEqual([])
    for (const u of TENANT_UITZONDERINGEN) {
      expect(u.reden.trim().length, `reden ontbreekt: ${u.bestand}`).toBeGreaterThan(10)
      expect(u.reden.includes('\n'), `reden is een regel: ${u.bestand}`).toBe(false)
    }
  })
})
