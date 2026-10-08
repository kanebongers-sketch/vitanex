// ─── PT-app — voorstel bij een bestandsnaam (PUUR) ──────────────────────────
// Kane sleept de map met Fit Factory PT-documenten in één keer naar LifeOS. Voor
// de bestandsnamen die we kennen, staat er meteen een nette titel, categorie en
// korte beschrijving klaar; alles blijft aanpasbaar vóór het uploaden.
// Alleen de NAMEN staan hier (de repo is openbaar) — geen inhoud. De
// beschrijvingen zeggen niet meer dan wat de naam en Kane's indeling vertellen.

import { TITEL_MAX, type DocCategorie } from './documenten'

export interface DocSuggestie {
  titel: string
  categorie: DocCategorie
  beschrijving: string | null
  /** Plek binnen de categorie (PT Academy dag 1, 2, 3 …); 0 = geen voorkeur. */
  volgorde: number
}

/** "Kopie van Fit_Factory-Guide (1).pdf" → "fit factory guide". */
function kern(bestandsnaam: string): string {
  return bestandsnaam
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/^kopie van\s+/i, '')
    .replace(/\s*\(\d+\)\s*$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/** De nette, generieke titel voor een onbekende naam: zonder extensie, "Kopie van" en "(1)". */
function generiekeTitel(bestandsnaam: string): string {
  const t = bestandsnaam
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/^kopie van\s+/i, '')
    .replace(/\s*\(\d+\)\s*$/, '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return (t || 'Document').slice(0, TITEL_MAX)
}

type Regel = (k: string, ext: string) => DocSuggestie | null

/** "Fit Factory PT Academy Dag 2" → dag 2, op volgorde 2. */
function academy(k: string): DocSuggestie | null {
  if (!k.includes('academy')) return null
  const dag = /dag\s*(\d{1,2})/.exec(k)?.[1]
  return dag
    ? { titel: `PT Academy — Dag ${dag}`, categorie: 'academy', beschrijving: `De presentatie van dag ${dag} van de Fit Factory PT Academy.`, volgorde: Number(dag) }
    : { titel: 'PT Academy', categorie: 'academy', beschrijving: 'Presentatie van de Fit Factory PT Academy.', volgorde: 0 }
}

const REGELS: readonly Regel[] = [
  academy,
  (k) =>
    k.includes('protocol')
      ? { titel: 'PT Protocol 2026', categorie: 'protocollen', beschrijving: 'Het interne protocol van Fit Factory Personal Training. Intern — niet met klanten delen.', volgorde: 1 }
      : null,
  (k, ext) =>
    k.includes('intake')
      ? ext === 'docx'
        ? { titel: 'Intakeformulier (Word)', categorie: 'klant', beschrijving: 'Het intakeformulier als Word-bestand, om digitaal in te vullen met een nieuwe klant.', volgorde: 2 }
        : { titel: 'Intakeformulier', categorie: 'klant', beschrijving: 'Het intakeformulier om met een nieuwe klant door te nemen.', volgorde: 1 }
      : null,
  (k) =>
    k.includes('abonnement')
      ? k.includes('intern')
        ? { titel: 'Abonnementen (intern)', categorie: 'protocollen', beschrijving: 'Het interne overzicht van de PT-abonnementen. Niet met klanten delen.', volgorde: 2 }
        : k.includes('klant')
          ? { titel: 'Abonnementen voor klanten', categorie: 'klant', beschrijving: 'Het overzicht van de PT-abonnementen om aan klanten te laten zien.', volgorde: 3 }
          : { titel: 'Abonnementen', categorie: 'overig', beschrijving: null, volgorde: 0 }
      : null,
  (k) =>
    k.includes('guide')
      ? /english|engels|\ben\b/.test(k)
        ? { titel: 'Fit Guide (English)', categorie: 'klant', beschrijving: 'De Fit Guide in het Engels, voor klanten die liever Engels lezen.', volgorde: 5 }
        : { titel: 'Fit Guide', categorie: 'klant', beschrijving: 'De Fit Guide van Fit Factory, om met klanten te delen.', volgorde: 4 }
      : null,
  (k) =>
    k.includes('handleiding')
      ? { titel: 'Handleiding Personal Training', categorie: 'handleiding', beschrijving: 'De handleiding personal training van Fit Factory.', volgorde: 1 }
      : null,
]

/**
 * Een voorstel voor titel, categorie en beschrijving bij een bestandsnaam. Bekende
 * Fit Factory PT-namen krijgen een nette titel; al het andere wordt "Overig" met
 * de bestandsnaam als titel (zonder extensie, "Kopie van" of "(1)").
 */
export function suggestieVoorBestand(bestandsnaam: string): DocSuggestie {
  const k = kern(bestandsnaam)
  const ext = /\.([a-z0-9]{2,5})$/i.exec(bestandsnaam)?.[1].toLowerCase() ?? ''
  for (const regel of REGELS) {
    const s = regel(k, ext)
    if (s) return s
  }
  return { titel: generiekeTitel(bestandsnaam), categorie: 'overig', beschrijving: null, volgorde: 0 }
}

/**
 * Lijkt dit een dubbele download, zoals "… (1).docx"? Dan waarschuwt de upload.
 * "Kopie van …" telt bewust niet: dat is vaak gewoon het enige exemplaar.
 */
export function lijktKopie(bestandsnaam: string): boolean {
  return /\(\d+\)\s*\.[a-z0-9]{2,5}$/i.test(bestandsnaam)
}
