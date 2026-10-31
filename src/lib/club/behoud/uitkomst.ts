// ─── Club, behoud: wat een contactmoment opleverde (PUUR) ───────────────────
// Bij Gedaan op een opvolgtaak (lid) en bij een contactmoment met een lead
// kiest de medewerker een uitkomst uit een vaste lijst. Kolommen
// club_opvolgtaken.uitkomst en club_lead_historie.uitkomst (migratie 482).

export const LID_UITKOMSTEN = ['bereikt_blijft', 'bereikt_twijfelt', 'niet_bereikt', 'wil_opzeggen', 'opgezegd'] as const
export type LidUitkomst = (typeof LID_UITKOMSTEN)[number]

export const LEAD_UITKOMSTEN = ['niet_bereikt', 'bereikt_twijfelt', 'afspraak_gemaakt', 'geen_interesse', 'lid_geworden'] as const
export type LeadUitkomst = (typeof LEAD_UITKOMSTEN)[number]

export function isLidUitkomst(v: unknown): v is LidUitkomst {
  return typeof v === 'string' && (LID_UITKOMSTEN as readonly string[]).includes(v)
}

export function isLeadUitkomst(v: unknown): v is LeadUitkomst {
  return typeof v === 'string' && (LEAD_UITKOMSTEN as readonly string[]).includes(v)
}
