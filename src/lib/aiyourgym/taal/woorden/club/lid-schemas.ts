import { woordenboek } from '../../woordenboek'

// Schema's die een lid zelf maakte, zoals de trainer ze in Club ziet (ledenkaart,
// schemalijst) en de instelling van de sportschool (besluit Kane 30-10-2026).

export const LID_SCHEMAS = woordenboek({
  nl: {
    chip: 'Door lid gemaakt',
    chipKort: 'Lid',
    vanLid: (voornaam: string) => `${voornaam} maakte dit schema zelf in de app.`,
    inApp: 'Dit ziet het lid nu in de app',
    eigenKop: (voornaam: string) => `Eigen schema's van ${voornaam}`,
    bekijken: 'Bekijken en aanpassen',
    overnemen: 'Overnemen als trainerschema',
    overnemenBezig: 'Overnemen...',
    overnemenVraag: 'Dit schema wordt een schema van de trainer. Het lid kan het daarna alleen aanpassen als jullie dat toestaan.',
    jaOvernemen: 'Ja, overnemen',
    annuleren: 'Annuleren',
    overgenomen: 'Overgenomen. Het lid ziet het nu als schema van de trainer.',
    instelling: {
      kop: "Schema's van leden",
      uitleg: 'Leden kunnen in de app zelf een schema maken, naast het schema van de trainer. Het schema van de trainer blijft herkenbaar.',
      trainerAanpassen: 'Leden mogen het schema van de trainer zelf aanpassen',
      hint: 'Standaard uit: een schema van de trainer verandert dan alleen via de trainer.',
      opgeslagen: 'Opgeslagen.',
      alleenEigenaar: 'Alleen de eigenaar kan dit aanpassen.',
    },
  },
  en: {
    chip: 'Made by member',
    chipKort: 'Member',
    vanLid: (voornaam: string) => `${voornaam} made this plan in the app.`,
    inApp: 'The member sees this plan in the app now',
    eigenKop: (voornaam: string) => `Own plans of ${voornaam}`,
    bekijken: 'View and edit',
    overnemen: 'Take over as trainer plan',
    overnemenBezig: 'Taking over...',
    overnemenVraag: 'This plan becomes a trainer plan. The member can then only edit it if you allow that.',
    jaOvernemen: 'Yes, take over',
    annuleren: 'Cancel',
    overgenomen: 'Taken over. The member now sees it as a plan from the trainer.',
    instelling: {
      kop: 'Plans made by members',
      uitleg: 'Members can build their own plan in the app, next to the plan from their trainer. The trainer plan stays recognisable.',
      trainerAanpassen: 'Members may edit the plan from their trainer',
      hint: 'Off by default: a trainer plan then only changes through the trainer.',
      opgeslagen: 'Saved.',
      alleenEigenaar: 'Only the owner can change this.',
    },
  },
})
