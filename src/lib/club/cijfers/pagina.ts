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

export async function haalAlles(vraag: PaginaVraag, plafond = 60_000): Promise<Opgehaald> {
  const rijen: unknown[] = []
  for (let van = 0; van < plafond; van += PAGINA) {
    const { data, error } = await vraag(van, van + PAGINA - 1)
    if (error) return { rijen, fout: error.message, code: error.code ?? null, afgekapt: false }
    const blok = data ?? []
    rijen.push(...blok)
    if (blok.length < PAGINA) return { rijen, fout: null, code: null, afgekapt: false }
  }
  return { rijen, fout: null, code: null, afgekapt: true }
}
