import { woordenboek } from '../../woordenboek'

// De behoudsscore van een lid (src/lib/club/leden/behoud.ts): de zin in
// mensentaal waarom een lid goed gaat of risico loopt, en de labels.

export const BEHOUD_TEKST = woordenboek({
  nl: {
    label: { goed: 'Goed', let_op: 'Let op', risico: 'Risico' },
    perWeek: {
      niet: 'niet',
      minderDanEen: 'minder dan 1x per week',
      elkeDag: 'elke dag',
      bijnaElkeDag: 'bijna elke dag',
      ongeveer: (keer: string) => `ongeveer ${keer}x per week`,
    },
    weken: (n: number) => `${n} weken`,
    dagen: (n: number) => (n === 1 ? '1 dag' : `${n} dagen`),
    kwamNuNiet: (was: string, duur: string) => `Kwam ${was}, nu al ${duur} niet`,
    kwamNu: (was: string, nu: string) => `Kwam ${was}, nu ${nu}`,
    komtVaker: (nu: string, was: string) => `Komt vaker: ${nu} (was ${was})`,
    nogNietSindsInschrijving: 'Nog niet geweest sinds de inschrijving',
    geenBezoek12Weken: 'Geen bezoek in de laatste 12 weken',
    alNietGeweest: (duur: string) => `Al ${duur} niet geweest`,
    nieuwLid: (freq: string) => `Nieuw lid, komt ${freq}`,
    komtWeinig: (freq: string) => `Komt weinig: ${freq}`,
    komt: (freq: string) => `Komt ${freq}`,
    komtStabiel: (freq: string) => `Komt ${freq}, stabiel`,
    altijdGekomen: 'Altijd gekomen bij een geboekte les',
    nietGekomen: (n: number) => `${n === 1 ? 'Een keer' : `${n} keer`} niet gekomen bij een geboekte les`,
  },
  en: {
    label: { goed: 'Good', let_op: 'Watch', risico: 'At risk' },
    perWeek: {
      niet: 'not at all',
      minderDanEen: 'less than once a week',
      elkeDag: 'every day',
      bijnaElkeDag: 'almost every day',
      ongeveer: (keer: string) => `about ${keer}x a week`,
    },
    weken: (n: number) => `${n} weeks`,
    dagen: (n: number) => (n === 1 ? '1 day' : `${n} days`),
    kwamNuNiet: (was: string, duur: string) => `Came ${was}, now not for ${duur}`,
    kwamNu: (was: string, nu: string) => `Came ${was}, now ${nu}`,
    komtVaker: (nu: string, was: string) => `Coming more often: ${nu} (was ${was})`,
    nogNietSindsInschrijving: 'Not been in since signing up',
    geenBezoek12Weken: 'No visits in the last 12 weeks',
    alNietGeweest: (duur: string) => `Not been in for ${duur}`,
    nieuwLid: (freq: string) => `New member, comes ${freq}`,
    komtWeinig: (freq: string) => `Rarely comes: ${freq}`,
    komt: (freq: string) => `Comes ${freq}`,
    komtStabiel: (freq: string) => `Comes ${freq}, steady`,
    altijdGekomen: 'Always turned up for a booked class',
    nietGekomen: (n: number) => `${n === 1 ? 'Once' : `${n} times`} did not turn up for a booked class`,
  },
})
