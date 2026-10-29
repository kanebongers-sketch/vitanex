import { woordenboek } from '../../woordenboek'

// De voorvertoning van de ledenapp in Club (Ledenapp in de hulpbalk): de kop,
// de knoppen naar poster, uitnodigen en instellingen, en de lege standen. De
// app zelf staat in woorden/ledenapp/.

export const APP_PAGINA = woordenboek({
  nl: {
    titel: 'Ledenapp',
    voorvertoning: 'voorvertoning',
    intro: 'Zo ziet een lid de app op zijn telefoon. Kies een lid om mee te kijken.',
    acties: 'Ledenapp',
    poster: 'Poster met QR-code',
    uitnodigen: 'Leden uitnodigen',
    uitnodigenUitleg: 'Bij Leden nodig je leden uit; op de ledenkaart staat de activatielink per lid',
    ledenFout: 'De leden konden niet worden geladen.',
    geenLeden: 'Deze vestiging heeft nog geen leden die kunnen trainen.',
    afspraken: 'Afspraken',
  },
  en: {
    titel: 'Member app',
    voorvertoning: 'preview',
    intro: 'This is how a member sees the app on their phone. Choose a member to look along.',
    acties: 'Member app',
    poster: 'Poster with QR code',
    uitnodigen: 'Invite members',
    uitnodigenUitleg: 'You invite members under Members; the activation link for each member is on their profile',
    ledenFout: 'The members could not be loaded.',
    geenLeden: 'This location has no members who can train yet.',
    afspraken: 'Appointments',
  },
})
