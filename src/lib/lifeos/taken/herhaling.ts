// ─── LifeOS — herhalende taken (puur) ───────────────────────────────────────
// Een herhaalregel en de rekensom "wanneer is de volgende keer". Geen DB, geen
// klok: `vandaag` komt erin, zodat dit zonder tijd-mocks te testen is.
//
// De volgende keer telt vanaf de geplande dag van de taak, niet vanaf het moment
// van afvinken: "elke maandag" blijft op maandag, ook als je hem dinsdag afvinkt.
// Loop je achter, dan springt hij door tot na vandaag — je krijgt niet drie
// achterstallige maandagen tegelijk.

export const HERHAAL_REGELS = ['dagelijks', 'werkdagen', 'wekelijks', 'tweewekelijks', 'maandelijks'] as const

export type HerhaalRegel = (typeof HERHAAL_REGELS)[number]

export function isHerhaalRegel(v: unknown): v is HerhaalRegel {
  return typeof v === 'string' && (HERHAAL_REGELS as readonly string[]).includes(v)
}

/** Leesbaar label: "elke week", "elke werkdag". */
export const HERHAAL_LABEL: Record<HerhaalRegel, string> = {
  dagelijks: 'elke dag',
  werkdagen: 'elke werkdag',
  wekelijks: 'elke week',
  tweewekelijks: 'elke 2 weken',
  maandelijks: 'elke maand',
}

function naarDatum(dag: string): Date {
  const [j, m, d] = dag.split('-').map(Number)
  return new Date(Date.UTC(j, m - 1, d))
}

function naarSleutel(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function plusDagen(dag: string, n: number): string {
  const d = naarDatum(dag)
  d.setUTCDate(d.getUTCDate() + n)
  return naarSleutel(d)
}

/** Zelfde dag van de maand, of de laatste dag als die maand korter is (31 jan → 28 feb). */
function plusMaand(dag: string): string {
  const [j, m, d] = dag.split('-').map(Number)
  const laatste = new Date(Date.UTC(j, m + 1, 0)).getUTCDate()
  return naarSleutel(new Date(Date.UTC(j, m, Math.min(d, laatste))))
}

function isWeekend(dag: string): boolean {
  const w = naarDatum(dag).getUTCDay()
  return w === 0 || w === 6
}

/** Eén stap vooruit volgens de regel. */
function stap(regel: HerhaalRegel, dag: string): string {
  switch (regel) {
    case 'dagelijks':
      return plusDagen(dag, 1)
    case 'werkdagen': {
      let volgende = plusDagen(dag, 1)
      while (isWeekend(volgende)) volgende = plusDagen(volgende, 1)
      return volgende
    }
    case 'wekelijks':
      return plusDagen(dag, 7)
    case 'tweewekelijks':
      return plusDagen(dag, 14)
    case 'maandelijks':
      return plusMaand(dag)
  }
}

/**
 * De dag van de volgende keer: minstens één stap na `basis` (de geplande dag, of
 * vandaag als de taak geen dag had), en altijd ná vandaag.
 */
export function volgendeKeer(regel: HerhaalRegel, basis: string | null, vandaag: string): string {
  let dag = stap(regel, basis ?? vandaag)
  // Begrensd: ook een jaren-oude basis loopt hooguit ~800 stappen (dagelijks).
  for (let i = 0; i < 1000 && dag <= vandaag; i++) dag = stap(regel, dag)
  return dag
}

/** De deadline schuift evenveel mee als de geplande dag (of null als er geen was). */
export function schuifDeadline(deadline: string | null, oudeDag: string | null, nieuweDag: string): string | null {
  if (deadline === null || oudeDag === null) return null
  const verschil = Math.round((naarDatum(deadline).getTime() - naarDatum(oudeDag).getTime()) / 86_400_000)
  return plusDagen(nieuweDag, verschil)
}
