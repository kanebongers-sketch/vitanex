import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

// ─── AI Your Gym: geen vaste Nederlandse tekst op de website ────────────────
// Besluit Kane (24-10-2026): met Engels gekozen is de website 100% Engels. Elke
// zichtbare tekst komt daarom uit een woordenboek (src/lib/aiyourgym/taal/woorden).
// Deze test leest elk .ts- en .tsx-bestand van de website met de TypeScript-
// compiler en faalt op:
//  1. tekst in JSX (een JSX-tekstnode met letters);
//  2. een vaste tekst als JSX-kind ({'...'}, {x ? 'a' : 'b'}, `...`);
//  3. een vaste tekst in een attribuut dat de bezoeker ziet of hoort (aria-label,
//     alt, title, placeholder en de tekst-props van onze bouwstenen);
//  4. een vaste tekst als title of description in metadata;
//  5. een andere tekst in de code die er Nederlands uitziet (meer woorden, met
//     een Nederlands functiewoord), zoals een lijst met teksten in een component;
//  6. een waarde (geen type) uit inhoud/* die tekst bevat, buiten de woordenboeken.
// Uitzonderingen staan hieronder, elk met een reden. Tekst binnen een element
// met lang="nl" (de juridische teksten, besluit Kane: blijven Nederlands) telt niet.

const WORTEL = path.resolve(__dirname, '../../../..')

const MAPPEN = ['src/components/aiyourgym', 'src/app/(aiyourgym)/(website)']

/**
 * Club en de ledenapp worden per onderdeel omgezet (besluit Kane 24-10-2026:
 * heel AI Your Gym in twee talen). Een map of bestand komt op deze lijst zodra
 * het helemaal af is; daarna bewaakt deze test hem net als de website.
 */
export const CLUB_KLAAR = [
  // Stap 1: de schil (kop, menu, submenu, hulpbalk, zoeken en Ctrl K).
  'src/components/club/shell',
  'src/app/(aiyourgym)/(club)/club/layout.tsx',
  'src/app/(aiyourgym)/(club)/club/nieuw',
  // Stap 2: Vandaag en Taken.
  'src/components/club/vandaag',
  'src/components/club/taken',
  'src/components/club/checkin',
  'src/components/club/automatisering/Opvolglijst.tsx',
  'src/components/club/automatisering/OpvolgTaak.tsx',
  'src/components/club/automatisering/Afgehandeld.tsx',
  'src/components/club/automatisering/KopieerKnop.tsx',
  'src/components/club/automatisering/stuur.ts',
  'src/components/club/sluiting/SluitingMelding.tsx',
  'src/components/club/sluiting/SluitingenBinnenkort.tsx',
  'src/app/(aiyourgym)/(club)/club/page.tsx',
  'src/app/(aiyourgym)/(club)/club/loading.tsx',
  'src/app/(aiyourgym)/(club)/club/taken',
  'src/app/(aiyourgym)/(club)/club/checkin',
  'src/app/(aiyourgym)/(club)/club/opvolgen',
  // Stap 3: ledenkaart en ledenlijst.
  'src/components/club/leden',
  'src/app/(aiyourgym)/(club)/club/leden',
  // Stap 4: ledenapp.
  'src/components/club/app',
  'src/components/club/ledenlogin',
  'src/components/club/ledenapp-pwa',
  'src/components/club/training/repspeler',
  'src/app/(aiyourgym)/(club)/mijn/page.tsx',
  'src/app/(aiyourgym)/(club)/mijn/layout.tsx',
  'src/app/(aiyourgym)/(club)/mijn/inloggen',
  'src/app/(aiyourgym)/(club)/mijn/aanvragen',
  'src/app/(aiyourgym)/(club)/mijn/start',
  // Stap 5: rooster en reserveren.
  'src/components/club/rooster',
  'src/components/club/afspraken',
  'src/components/club/agenda',
  'src/app/(aiyourgym)/(club)/club/rooster',
  'src/app/(aiyourgym)/(club)/club/afspraken',
  'src/app/(aiyourgym)/(club)/club/agenda',
  // Stap 6: startwizard.
  'src/components/club/start',
  'src/app/(aiyourgym)/(club)/club/start',
  // Stap 7: Training en schema-editor.
  'src/components/club/training',
  'src/components/club/intakevragen',
  'src/app/(aiyourgym)/(club)/club/training',
  'src/app/(aiyourgym)/(club)/club/beheer/intake',
  // Stap 8b: cijfers en instellingen.
  'src/components/club/cijfers',
  'src/components/club/rapporten',
  'src/components/club/instellingen',
  'src/components/club/beheer',
  'src/components/club/huisstijl',
  'src/components/club/bedrijf',
  'src/components/club/lidmaatschappen',
  'src/components/club/sluiting',
  'src/components/club/automatisering',
  'src/components/club/meldingen',
  'src/app/(aiyourgym)/(club)/club/cijfers',
  'src/app/(aiyourgym)/(club)/club/rapporten',
  'src/app/(aiyourgym)/(club)/club/instellingen',
  'src/app/(aiyourgym)/(club)/club/beheer',
  'src/app/(aiyourgym)/(club)/club/huisstijl',
  // Stap 8a: leads en personeel.
  'src/components/club/leads',
  'src/components/club/personeel',
  'src/app/(aiyourgym)/(club)/club/leads',
  'src/app/(aiyourgym)/(club)/club/personeel',
  // Stap 8d: overige schermen.
  'src/components/club/hulp',
  'src/components/club/kladblok',
  'src/components/club/platform',
  'src/components/club/systeem',
  'src/components/club/widget',
  'src/components/club/inloggen',
  'src/components/club/abonnement',
  'src/components/club/ontwerp',
  'src/app/(aiyourgym)/(club)/club/hulp',
  'src/app/(aiyourgym)/(club)/club/notities',
  'src/app/(aiyourgym)/(club)/club/platform',
  'src/app/(aiyourgym)/(club)/club/systeem',
  'src/app/(aiyourgym)/(club)/club/koppelingen',
  'src/app/(aiyourgym)/(club)/club/app',
  'src/app/(aiyourgym)/(club)/clubinloggen',
  'src/app/(aiyourgym)/(club)/widget',
  'src/app/(aiyourgym)/(club)/error.tsx',
  'src/app/(aiyourgym)/(club)/not-found.tsx',
  'src/app/(aiyourgym)/(club)/layout.tsx',
  // Het instellingencentrum (29-10-2026).
  'src/components/club/instelcentrum',
  'src/app/(aiyourgym)/(club)/club/beheer/page.tsx',
  // Stap 8c: ledenapp-onderdelen (voortgang, challenges, voeding, betalen, berichten, community, health).
  'src/components/club/health',
  'src/app/(aiyourgym)/(club)/mijn/koppelingen',
  'src/components/club/voortgang',
  'src/components/club/challenges',
  'src/components/club/voeding',
  'src/components/club/betalen',
  'src/components/club/berichten',
  'src/components/club/community',
  'src/app/(aiyourgym)/(club)/mijn/community',
  'src/app/(aiyourgym)/(club)/club/challenges',
  'src/app/(aiyourgym)/(club)/club/voeding',
  'src/app/(aiyourgym)/(club)/club/berichten',
  'src/app/(aiyourgym)/(club)/club/community',
]

/** Bestanden en mappen die buiten de controle vallen, met reden. */
const OVERSLAAN: Record<string, string> = {
  'src/components/aiyourgym/inhoud/': 'Nederlandse bron van de woordenboeken; regel 6 bewaakt dat componenten hem niet rechtstreeks tonen',
  'src/components/aiyourgym/merk/': 'logo, letters en paden, geen zichtbare tekst behalve de merknaam',
  'src/components/aiyourgym/demo/stappen.ts': 'Nederlandse bron van DEMO in woorden/website/demo.ts; regel 6 bewaakt dat alleen het woordenboek hem leest',
  'src/components/aiyourgym/contrast.test.ts': 'test',
  'src/components/aiyourgym/tokens.testhulp.ts': 'hulp voor de contrasttests, alleen foutmeldingen voor ontwikkelaars',
  'src/components/club/shell/fonts.ts': 'letters, geen tekst',
  'src/components/club/training/drie/stof-glsl.ts': 'shadercode (GLSL), geen tekst',
  'src/components/club/training/illustratie/VergelijkRij.tsx': 'oud prototype (eigen tekening tegen RepDB), nergens meer in gebruik',
}

/** Teksten die in beide talen gelijk zijn. */
const ALTIJD_GOED: Record<string, string> = {
  'AI Your Gym': 'merknaam',
  'AI': 'merknaam (deel van het woordmerk)',
  'Your Gym': 'merknaam (deel van het woordmerk)',
  'NL': 'taalkeuze',
  'EN': 'taalkeuze',
  'RepDB': 'bronvermelding oefendata (merknaam)',
  'repdb.co': 'bronvermelding oefendata',
  'Exercise data by RepDB (repdb.co)': 'verplichte bronvermelding, Engels in beide talen',
  'Kernhal': 'naam van de verzonnen voorbeeldsportschool op de website (mockups/voorbeeld.ts)',
  'Club': 'productnaam',
  'Start': 'pakketnaam uit pakketten.ts',
  'Keten': 'pakketnaam uit pakketten.ts',
  'Stripe': 'merknaam',
  'aiyourgym.com': 'domein',
  'QR': 'afkorting, in beide talen gelijk',
  'kg': 'eenheid',
  'RPE': 'vakterm, in beide talen gelijk',
  'RIR': 'vakterm, in beide talen gelijk',
  'x': 'teken (keer)',
  'Website': 'label van het onzichtbare lokveld tegen robots (aria-hidden), in beide talen gelijk',
  'CSV': 'bestandsformaat',
  'cm': 'eenheid',
  'kcal': 'eenheid (kilocalorie), in beide talen gelijk',
  'KCAL': 'eenheid (kilocalorie) in kapitalen, in beide talen gelijk',
  'g/kg': 'eenheid (gram per kilo lichaamsgewicht)',
  'CLUB': 'woordmerk naast het logo van de sportschool, in beide talen gelijk',
  'Ctrl K': 'sneltoets',
  'Enter': 'naam van een toets op het toetsenbord, in beide talen gelijk',
  'Esc': 'naam van een toets op het toetsenbord, in beide talen gelijk',
}

/** Per bestand toegestane teksten (exact), met reden. */
const PER_BESTAND: Record<string, Record<string, string>> = {
  'src/app/(aiyourgym)/(club)/club/beheer/widget/page.tsx': {
    'CLUB_WIDGET_ACTIEF=1': 'naam van een instelling in Render (alleen voor de platform-eigenaar)',
  },
  'src/app/(aiyourgym)/(club)/club/beheer/meldingen/page.tsx': {
    'CLUB_MAILS_ACTIEF=1': 'naam van een instelling in Render (alleen voor de platform-eigenaar)',
    CLUB_RESEND_API_KEY: 'naam van een instelling in Render (alleen voor de platform-eigenaar)',
    CLUB_RESEND_FROM: 'naam van een instelling in Render (alleen voor de platform-eigenaar)',
  },
  'src/components/club/app/training/toestel.ts': { 'input, textarea, [data-geen-veeg': 'css-selector, geen tekst' },
  'src/components/aiyourgym/mockups/HeldDashboard.tsx': { SB: 'initialen in de demodata', 'Sanne Bakker': 'naam uit de demodata' },
  'src/components/aiyourgym/mockups/WerkvloerSchermen.tsx': { 'Mo de Vries': 'naam uit de demodata' },
  'src/components/aiyourgym/mockups/WizardScherm.tsx': { 'club/start': 'pad in de nagebootste adresbalk (/club/start)' },
  'src/components/club/shell/FitFactoryLogo.tsx': { 'Fit Factory': 'naam van de sportschool in het logo (eigennaam)' },
  'src/components/club/hulp/MeldFormulier.tsx': { 'club/rooster': 'voorbeeld van een pad in Club (/club/rooster), in beide talen gelijk' },
  'src/components/club/training/EditorDag.tsx': { 'Alt + N': 'sneltoets' },
  'src/components/club/training/EditorWerkbalk.tsx': { Ctrl: 'naam van een toets', Alt: 'naam van een toets', 'Ctrl+S': 'sneltoets' },
  'src/components/club/training/IntakeDetail.tsx': { BMI: 'afkorting, in beide talen gelijk' },
  'src/components/club/training/IntakeMetingen.tsx': { BMI: 'afkorting, in beide talen gelijk' },
  'src/components/club/training/OefeningBeeld.tsx': { 'RepDB (repdb.co': 'bronvermelding (merknaam), zonder het slothaakje dat de test weglaat', Everkinetic: 'bronvermelding (merknaam)', 'CC BY-SA 4.0': 'naam van de licentie' },
  'src/components/club/health/MetingenUitApps.tsx': { 'Metingen uit apps bekeken': 'regel in het actielogboek (niet in beeld), net als de andere logregels in het Nederlands' },
  'src/components/club/training/SchemaPrint.tsx': { 'github.com/everkinetic/data, creativecommons.org/licenses/by-sa/4.0': 'bronvermelding met adressen (de test laat de haakjes weg)', sec: 'eenheid (seconden), in beide talen gelijk' },
}

/** Waarden uit inhoud/* die geen zichtbare tekst zijn of alleen oefennamen/demodata geven. */
const INHOUD_WAARDEN: Record<string, string> = {
  renderVoor: 'kiest een render (beeld) bij een oefening',
  srcSetVan: 'bouwt een srcset (beeld)',
  OEFENRENDERS: 'de Blender-renders (beelden en slugs) voor het schemascherm; namen gaan via PRODUCTSCHERMEN.schema.naam, spierlabels worden niet getoond',
  frameUrl: 'bouwt de URL van een frame van een render (beeld)',
  toonBereik: 'toont een getallenbereik (8 tot 12) via de taal van de aanroeper',
  voorbeeldOefeningen: 'oefennamen (blijven gelijk) met de coaching in de taal die de aanroeper meegeeft (siteCoaching)',
  aantalMetCoaching: 'getal',
  START_MINUTEN: 'getal',
  aantalNieuw: 'getal',
  // Lijsten die de pagina alleen gebruikt voor volgorde en sleutels; de tekst komt uit het woordenboek.
  DOELGROEPEN: 'volgorde en sleutels; tekst uit het woordenboek van de pagina',
  START_STAPPEN: 'aantal en volgorde; tekst uit START_SECTIE',
  SCHEMA_STAPPEN: 'volgorde en sleutels; tekst uit TRAININGSSCHEMAS',
  HOOFDSTUKKEN: 'volgorde en sleutels; tekst uit FUNCTIES',
  GERUSTSTELLING: 'alleen het aantal punten; tekst uit ACTIE',
  NIEUW: 'datums en sleutels; elke tekst gaat via puntTekst en maandSamenvatting met de taal',
  korteDatum: 'datum in de taal van de aanroeper (formaat.ts)',
  maandNaam: 'maandnaam in de taal van de aanroeper',
  maandSamenvatting: 'samenvatting in de taal van de aanroeper',
  puntTekst: 'tekst in de taal van de aanroeper',
}

/** Waarden uit Club met Nederlandse tekst (coaching, gezondheidsvragen, labels). */
const CLUB_TEKST = /^(COACHING_[A-Z_]+|coachingVoor|PARQ_VRAGEN|[A-Z_]+_LABELS?)$/

/** Toegestaan per bestand ("bestand naam"), met reden. */
const CLUB_TEKST_GOED: Record<string, string> = {
  'src/components/club/lidmaatschappen/LabelFormulier.tsx MAX_OMSCHRIJVING_LABEL': 'een getal (maximale lengte), geen tekst',
  'src/components/club/intakevragen/KernVeld.tsx PARQ_VRAGEN': 'alleen de sleutels; de vraag komt via vraagInTaal (woorden/club/intake.ts)',
  'src/app/(aiyourgym)/(club)/club/training/beelden/page.tsx coachingVoor': 'loopt via standaardCoachingIn (Engelse coaching van de Blender-oefeningen)',
  'src/components/aiyourgym/mockups/product/SchemaScherm.tsx coachingVoor': 'loopt via standaardCoachingIn (Engelse coaching van de Blender-oefeningen)',
  'src/components/aiyourgym/schemas/SchermenTrainer.tsx PARQ_VRAGEN': 'alleen volgorde en sleutels; de vraag komt uit SCHEMA_SCHERMEN.intake.parq',
  'src/app/(aiyourgym)/(website)/aiyourgym/(site)/demo/page.tsx coachingVoor':
    'live demo met Kernhal (de demo-sportschool): haar gegevens en coaching zijn Nederlands en dat staat er in het Engels bij (DEMO.gegevensNederlands)',
}

/** Attributen die de bezoeker ziet of hoort. */
const TEKST_ATTRIBUTEN = new Set([
  'aria-label',
  'aria-description',
  'aria-valuetext',
  'aria-roledescription',
  'alt',
  'title',
  'placeholder',
  // Tekst-props van de eigen bouwstenen (PaginaKop, SectieKop, AanmeldBand, SectieActie, ...).
  'label',
  'titel',
  'tekst',
  'zin',
  'kop',
  'lead',
  'omschrijving',
  'ondertitel',
  'beschrijving',
  'knop',
  'melding',
  'uitleg',
  'hint',
  'leeg',
])

/** Nederlandse functiewoorden die in het Engels niet (zo) voorkomen. */
const NL_WOORDEN = new Set(
  'de het een en je jouw jij jullie van voor met niet naar bij ook nog geen wat wordt worden zijn ons onze wij we hun dat die dit deze als maar dan al alle meer of uit zo hoe waar wie welke kun kan kunt moet mag wil zelf eigen nu per tot om over na door onder sportschool sportscholen leden lid gratis proberen bekijk plan probeer dagen klaar zonder alleen elke elk iedereen ga gaan komt staat zet maak kies vul'.split(' '),
)

function bestanden(map: string): string[] {
  const absoluut = path.join(WORTEL, map)
  if (statSync(absoluut).isFile()) return [map]
  return readdirSync(absoluut).flatMap((naam) => {
    const rel = `${map}/${naam}`
    if (statSync(path.join(WORTEL, rel)).isDirectory()) return bestanden(rel)
    return /\.tsx?$/.test(naam) && !/\.test\.tsx?$/.test(naam) ? [rel] : []
  })
}

function overgeslagen(rel: string): boolean {
  return Object.keys(OVERSLAAN).some((p) => rel === p || (p.endsWith('/') && rel.startsWith(p)))
}

interface Treffer {
  bestand: string
  regel: number
  soort: string
  tekst: string
}

const heeftLetters = (s: string) => /\p{L}{2,}/u.test(s)

function toegestaan(rel: string, tekst: string): boolean {
  // Zonder leestekens en scheidingstekens eromheen ('· cm' is 'cm').
  const schoon = tekst.replace(/\s+/g, ' ').replace(/^[^\p{L}\d]+|[^\p{L}\d.]+$/gu, '').trim()
  if (!heeftLetters(schoon)) return true
  if (schoon in ALTIJD_GOED) return true
  return Boolean(PER_BESTAND[rel]?.[schoon])
}

/** Ziet deze tekst er Nederlands uit (meerdere woorden, met een Nederlands functiewoord)? */
function lijktNederlands(tekst: string): boolean {
  const stukken = tekst.trim().split(/\s+/)
  // Een los woord, pad of sleutel (zoals /voor-wie) of een rij css-klassen is geen zin.
  if (stukken.length < 2) return false
  // Een pad of zoekstring (/club/leden/, ?v= &q=) is geen zin.
  if (stukken.filter((s) => !/[/?&=]/.test(s)).length < 2) return false
  // Een rij css-klassen, ook met een open modifier (club-leden-behoud--${label}) is geen zin.
  if (stukken.every((s) => /^[a-z0-9]+(-{1,2}[a-z0-9]*)+$/.test(s))) return false
  const woorden = tekst.toLowerCase().match(/\p{L}+/gu) ?? []
  if (woorden.length < 2) return false
  return woorden.some((w) => NL_WOORDEN.has(w))
}

/** Teksten die een expressie als resultaat oplevert (niet die erin als argument gaan). */
function resultaatTeksten(e: ts.Expression): ts.Node[] {
  if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e) || ts.isTemplateExpression(e)) return [e]
  if (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isSatisfiesExpression(e)) return resultaatTeksten(e.expression)
  if (ts.isConditionalExpression(e)) return [...resultaatTeksten(e.whenTrue), ...resultaatTeksten(e.whenFalse)]
  if (ts.isBinaryExpression(e)) {
    const k = e.operatorToken.kind
    if (k === ts.SyntaxKind.AmpersandAmpersandToken) return resultaatTeksten(e.right)
    if (k === ts.SyntaxKind.BarBarToken || k === ts.SyntaxKind.QuestionQuestionToken || k === ts.SyntaxKind.PlusToken) {
      return [...resultaatTeksten(e.left), ...resultaatTeksten(e.right)]
    }
  }
  return []
}

/** De letterlijke tekst van een string- of templateliteral (zonder de ${...}-delen). */
function letterlijk(n: ts.Node): string {
  if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) return n.text
  if (ts.isTemplateExpression(n)) return [n.head.text, ...n.templateSpans.map((s) => s.literal.text)].join(' ')
  return ''
}

function binnenLangNl(n: ts.Node): boolean {
  for (let p: ts.Node | undefined = n.parent; p; p = p.parent) {
    if (ts.isJsxElement(p)) {
      // De attributen van het element zelf (zoals aria-label) staan nog in de taal van de pagina.
      if (n.getStart() >= p.openingElement.getStart() && n.getEnd() <= p.openingElement.getEnd()) continue
      const lang = p.openingElement.attributes.properties.find((a) => ts.isJsxAttribute(a) && a.name.getText() === 'lang')
      if (lang && ts.isJsxAttribute(lang) && lang.initializer && ts.isStringLiteral(lang.initializer)) {
        return lang.initializer.text === 'nl'
      }
    }
  }
  return false
}

/** Staat deze literal op een plek die geen tekst voor de bezoeker is? */
function technischePlek(n: ts.Node): boolean {
  const p = n.parent
  if (!p) return true
  if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isExternalModuleReference(p)) return true
  if (ts.isLiteralTypeNode(p)) return true
  if (ts.isPropertyAssignment(p) && p.name === n) return true
  if (ts.isElementAccessExpression(p) && p.argumentExpression === n) return true
  if (ts.isCaseClause(p)) return true
  if (ts.isBinaryExpression(p) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(p.operatorToken.kind)) return true
  if (ts.isJsxAttribute(p)) return !TEKST_ATTRIBUTEN.has(p.name.getText())
  if (ts.isExpressionStatement(p)) return true // 'use client'
  return false
}

function controleer(rel: string): Treffer[] {
  const bron = readFileSync(path.join(WORTEL, rel), 'utf8')
  const sf = ts.createSourceFile(rel, bron, ts.ScriptTarget.Latest, true, rel.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const treffers: Treffer[] = []
  const gemeld = new Set<ts.Node>()
  const meld = (n: ts.Node, soort: string, tekst: string) => {
    if (gemeld.has(n) || binnenLangNl(n) || toegestaan(rel, tekst)) return
    gemeld.add(n)
    treffers.push({ bestand: rel, regel: sf.getLineAndCharacterOfPosition(n.getStart()).line + 1, soort, tekst: tekst.replace(/\s+/g, ' ').trim() })
  }

  const bezoek = (n: ts.Node): void => {
    if (ts.isJsxText(n)) meld(n, 'JSX-tekst', n.text)
    else if (ts.isJsxExpression(n) && n.expression && (ts.isJsxElement(n.parent) || ts.isJsxFragment(n.parent))) {
      for (const t of resultaatTeksten(n.expression)) meld(t, 'JSX-kind', letterlijk(t))
    } else if (ts.isJsxAttribute(n) && TEKST_ATTRIBUTEN.has(n.name.getText()) && n.initializer) {
      const init = n.initializer
      const kandidaten = ts.isStringLiteral(init) ? [init] : ts.isJsxExpression(init) && init.expression ? resultaatTeksten(init.expression) : []
      for (const t of kandidaten) meld(t, `attribuut ${n.name.getText()}`, letterlijk(t))
    } else if (ts.isPropertyAssignment(n) && ['title', 'description', 'alt'].includes(n.name.getText())) {
      for (const t of resultaatTeksten(n.initializer)) meld(t, `metadata ${n.name.getText()}`, letterlijk(t))
    } else if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateExpression(n)) && !technischePlek(n)) {
      const tekst = letterlijk(n)
      if (lijktNederlands(tekst)) meld(n, 'tekst in code', tekst)
    } else if (ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier) && n.moduleSpecifier.text.startsWith('@/lib/club/')) {
      // Nederlandse teksten uit Club (coaching, gezondheidsvragen, labels) horen via een woordenboek te lopen.
      const namen = n.importClause && !n.importClause.isTypeOnly ? n.importClause.namedBindings : undefined
      if (namen && ts.isNamedImports(namen)) {
        for (const el of namen.elements) {
          const naam = (el.propertyName ?? el.name).text
          if (!el.isTypeOnly && CLUB_TEKST.test(naam) && !CLUB_TEKST_GOED[`${rel} ${naam}`]) meld(el, 'Club-tekst rechtstreeks', `${naam} uit ${n.moduleSpecifier.text}`)
        }
      }
    } else if (ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier) && /aiyourgym\/(inhoud\/|demo\/stappen$)/.test(n.moduleSpecifier.text)) {
      const namen = n.importClause && !n.importClause.isTypeOnly ? n.importClause.namedBindings : undefined
      if (namen && ts.isNamedImports(namen)) {
        for (const el of namen.elements) {
          if (el.isTypeOnly) continue
          const naam = (el.propertyName ?? el.name).text
          if (!(naam in INHOUD_WAARDEN)) meld(el, 'inhoud rechtstreeks', `${naam} uit ${n.moduleSpecifier.text}`)
        }
      }
    }
    ts.forEachChild(n, bezoek)
  }
  bezoek(sf)
  return treffers
}

const ALLE = [...MAPPEN, ...CLUB_KLAAR].flatMap(bestanden).filter((b) => !overgeslagen(b))

describe('website AI Your Gym: geen vaste Nederlandse tekst', () => {
  it('vindt de bestanden van de website', () => {
    expect(ALLE.length).toBeGreaterThan(50)
    expect(ALLE).toContain('src/components/aiyourgym/site/AanmeldBand.tsx')
  })

  it('elke zichtbare tekst komt uit een woordenboek', () => {
    const treffers = ALLE.flatMap(controleer)
    const lijst = treffers.map((t) => `${t.bestand}:${t.regel} [${t.soort}] ${t.tekst}`)
    // Een eigen fout, zodat de hele lijst in beeld komt (expect kort lange lijsten in).
    if (lijst.length > 0) throw new Error(`${lijst.length} vaste teksten:\n${lijst.join('\n')}`)
    expect(lijst).toEqual([])
  }, 30_000) // leest honderden bestanden met de TypeScript-compiler; in een volle testrun duurt dat langer dan 5 seconden

  it('de uitzonderingen per bestand bestaan nog', () => {
    const weg = Object.keys(PER_BESTAND).filter((b) => !ALLE.includes(b))
    expect(weg).toEqual([])
  })
})
