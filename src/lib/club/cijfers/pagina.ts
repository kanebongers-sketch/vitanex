// ─── Fit Factory Club: alles ophalen in pagina's ────────────────────────────
// Supabase geeft per verzoek hoogstens 1000 rijen. Voor cijfers halen we in
// blokken tot een plafond, zodat een grote vestiging nooit stilletjes wordt
// afgekapt zonder dat we het weten.

export const PAGINA = 1000

export interface PaginaAntwoord {
  data: unknown[] | null
  error: { message: string; code?: string } | null
}

export type PaginaVraag = (van: number, tot: number) => PromiseLike<PaginaAntwoord>

export interface Opgehaald {
  rijen: unknown[]
  fout: string | null
  /** De code van de eerste fout (bv. PGRST202 = functie bestaat niet). */
  code: string | null
  /** True als het plafond is bereikt en er mogelijk meer rijen zijn. */
  afgekapt: boolean
}

/** Na het eerste volle blok lopen zoveel blokken tegelijk; een kort blok betekent het einde. */
const GOLF = 4

export async function haalAlles(vraag: PaginaVraag, plafond = 60_000): Promise<Opgehaald> {
  const rijen: unknown[] = []
  for (let van = 0; van < plafond; ) {
    const golf = van === 0 ? 1 : GOLF
    const vanafs = Array.from({ length: golf }, (_, i) => van + i * PAGINA).filter((v) => v < plafond)
    const antwoorden = await Promise.all(vanafs.map((v) => vraag(v, v + PAGINA - 1)))
    for (const { data, error } of antwoorden) {
      if (error) return { rijen, fout: error.message, code: error.code ?? null, afgekapt: false }
      const blok = data ?? []
      rijen.push(...blok)
      if (blok.length < PAGINA) return { rijen, fout: null, code: null, afgekapt: false }
    }
    van += golf * PAGINA
  }
  return { rijen, fout: null, code: null, afgekapt: true }
}
