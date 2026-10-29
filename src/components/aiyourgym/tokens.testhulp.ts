// Hulp voor de contrasttests van de website (contrast.test.ts, voorpagina/kleur.test.ts):
// rekent een css-token uit tot een hex-kleur. Sinds obsidian iron (besluit Kane
// 29-10-2026) lopen de accenten via --iron-accent, dus veel tokens zijn var(--...) of
// color-mix(in srgb, ...). Die rekenen we hier uit, zodat de tests de echte kleur
// controleren en streng blijven als de tint verandert.

export type TokenMap = Readonly<Record<string, string>>

const HEX = /^#([0-9a-f]{6})$/i

function hexNaarRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbNaarHex(rgb: readonly number[]): string {
  return `#${rgb.map((k) => Math.round(k).toString(16).padStart(2, '0')).join('')}`
}

/** Splitst op komma's die niet tussen haakjes staan. */
function splitsArgumenten(binnen: string): string[] {
  const delen: string[] = []
  let diepte = 0
  let begin = 0
  for (let i = 0; i < binnen.length; i++) {
    if (binnen[i] === '(') diepte++
    else if (binnen[i] === ')') diepte--
    else if (binnen[i] === ',' && diepte === 0) {
      delen.push(binnen.slice(begin, i).trim())
      begin = i + 1
    }
  }
  delen.push(binnen.slice(begin).trim())
  return delen
}

/**
 * Rekent een waarde uit tot een hex-kleur: hex, var(--naam[, terugval]) en
 * color-mix(in srgb, a p%, b) met twee dekkende kleuren. Gooit een fout bij iets anders.
 */
export function losOp(waarde: string, tokens: TokenMap, diepte = 0): string {
  if (diepte > 20) throw new Error(`Te diep genest: ${waarde}`)
  const w = waarde.trim()
  if (HEX.test(w)) return w.toLowerCase()
  const varMatch = w.match(/^var\(--([\w-]+)\s*(?:,\s*(.+))?\)$/)
  if (varMatch) {
    const bron = tokens[varMatch[1]] ?? varMatch[2]
    if (bron === undefined) throw new Error(`Token --${varMatch[1]} bestaat niet`)
    return losOp(bron, tokens, diepte + 1)
  }
  const mix = w.match(/^color-mix\(in srgb,\s*(.+)\)$/)
  if (mix) {
    const [a, b] = splitsArgumenten(mix[1])
    const deelA = a.match(/^(.+?)\s+([\d.]+)%$/)
    if (!deelA || !b) throw new Error(`Onbekende color-mix: ${w}`)
    const p = Number.parseFloat(deelA[2]) / 100
    const ka = hexNaarRgb(losOp(deelA[1], tokens, diepte + 1))
    const kb = hexNaarRgb(losOp(b, tokens, diepte + 1))
    return rgbNaarHex(ka.map((k, i) => k * p + kb[i] * (1 - p)))
  }
  throw new Error(`Geen dekkende kleur: ${w}`)
}

/** Alle tokens die tot een dekkende kleur uit te rekenen zijn; de rest (rgba, verlopen) blijft zoals hij is. */
export function losAllesOp(tokens: TokenMap, context: TokenMap = {}): Record<string, string> {
  const alles = { ...context, ...tokens }
  return Object.fromEntries(
    Object.entries(tokens).map(([k, w]) => {
      try {
        return [k, losOp(w, alles)]
      } catch {
        return [k, w]
      }
    }),
  )
}

/** Hoe ver de kanalen uit elkaar liggen: 0 is zuiver grijs. Iron is koel grijs, dus klein. */
export function kleurigheid(hex: string): number {
  const rgb = hexNaarRgb(hex)
  return Math.max(...rgb) - Math.min(...rgb)
}

/** Zit er groen in de kleur: het groene kanaal hoger dan rood en blauw. */
export function isGroenig(hex: string): boolean {
  const [r, g, b] = hexNaarRgb(hex)
  return g > r + 6 && g >= b
}
