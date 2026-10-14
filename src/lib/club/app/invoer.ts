// ─── Fit Factory Club, ledenapp: invoer van de API nakijken (PUUR) ──────────

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID.test(v)
}

export interface TrainingInvoer {
  lidId: string
  schemaId: string
  dag: number
}

/** Body van POST /api/club/app/training: { lidId, schemaId, dag }. */
export function leesTrainingInvoer(body: unknown): TrainingInvoer | string {
  if (typeof body !== 'object' || body === null) return 'Ongeldig verzoek.'
  const b = body as Record<string, unknown>
  if (!isUuid(b.lidId)) return 'Onbekend lid.'
  if (!isUuid(b.schemaId)) return 'Onbekend schema.'
  if (typeof b.dag !== 'number' || !Number.isInteger(b.dag) || b.dag < 1 || b.dag > 7) return 'Onbekende trainingsdag.'
  return { lidId: b.lidId, schemaId: b.schemaId, dag: b.dag }
}
