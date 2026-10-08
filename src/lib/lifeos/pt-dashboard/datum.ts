// Dagsleutels (YYYY-MM-DD) leesbaar maken — tijdzone-vast (UTC-middag), zodat
// "8 okt" nooit "7 okt" wordt in een andere tijdzone. PUUR.

const DAG_KORT = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
const DAG_LANG = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

/** "wo 8 okt" */
export function dagKort(dag: string): string {
  return DAG_KORT.format(new Date(`${dag}T12:00:00Z`))
}

/** "8 oktober 2026" */
export function dagLang(dag: string): string {
  return DAG_LANG.format(new Date(`${dag}T12:00:00Z`))
}

/** "vandaag", "morgen", "gisteren", "3 dagen te laat", of de korte datum. */
export function relatief(dag: string, vandaag: string): string {
  const verschil = Math.round((Date.parse(`${dag}T12:00:00Z`) - Date.parse(`${vandaag}T12:00:00Z`)) / 86_400_000)
  if (verschil === 0) return 'vandaag'
  if (verschil === 1) return 'morgen'
  if (verschil === -1) return 'gisteren'
  if (verschil < 0) return `${-verschil} dagen te laat`
  return dagKort(dag)
}

/** Voor een datum in het verleden: "vandaag", "gisteren", of de korte datum. */
export function geleden(dag: string, vandaag: string): string {
  if (dag === vandaag) return 'vandaag'
  const verschil = Math.round((Date.parse(`${vandaag}T12:00:00Z`) - Date.parse(`${dag}T12:00:00Z`)) / 86_400_000)
  return verschil === 1 ? 'gisteren' : dagKort(dag)
}
