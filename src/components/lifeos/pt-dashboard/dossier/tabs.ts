// De tabbladen van het klantdossier. Los van Dossier.tsx ('use client'), zodat
// de server-pagina ?tab=… kan lezen zonder een client-module te importeren.

export const DOSSIER_TABS = ['intake', 'metingen', 'logboek', 'notities'] as const
export type DossierTab = (typeof DOSSIER_TABS)[number]

export function leesDossierTab(v: unknown): DossierTab {
  return typeof v === 'string' && (DOSSIER_TABS as readonly string[]).includes(v) ? (v as DossierTab) : 'intake'
}
