import { woordenboek } from '../../woordenboek'

// Dagwoorden en snelkeuzes voor de opvolgdatum van een lead. Los van LEADS,
// zodat de pure regels (src/lib/club/leads/regels.ts) hem kunnen lezen zonder
// kringverwijzing.

export const LEADS_DAGEN = woordenboek({
  nl: {
    dag: { vandaag: 'vandaag', morgen: 'morgen', gisteren: 'gisteren' },
    snelkeuze: { vandaag: 'Vandaag', morgen: 'Morgen', drieDagen: 'Over 3 dagen', week: 'Volgende week' },
  },
  en: {
    dag: { vandaag: 'today', morgen: 'tomorrow', gisteren: 'yesterday' },
    snelkeuze: { vandaag: 'Today', morgen: 'Tomorrow', drieDagen: 'In 3 days', week: 'Next week' },
  },
})
