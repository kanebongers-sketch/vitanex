import { woordenboek } from '../../woordenboek'

// Leden · Ledenapp in Club (ontwerp 03-11-2026): wat je in de app zet
// (Berichten, Community, Challenges) en Bekijk als lid, de voorvertoning. De
// app zelf staat in woorden/ledenapp/.

export const APP_PAGINA = woordenboek({
  nl: {
    titel: 'Ledenapp',
    voorvertoning: 'voorvertoning',
    intro: 'Wat je leden in de app zien, en wat je erin zet.',
    bekijkAlsLid: 'Bekijk als lid',
    bekijkUitleg: 'Kies een lid en kijk mee op zijn telefoon.',
    inDeApp: 'In de app',
    secties: {
      berichten: { titel: 'Berichten', leeg: 'Nog geen berichten.', aantal: (n: number) => (n === 1 ? '1 bericht' : `${n} berichten`), openen: 'Berichten openen' },
      community: { titel: 'Community', aantal: (n: number) => (n === 1 ? '1 groep' : `${n} groepen`), beoordelen: (n: number) => `${n} te beoordelen`, openen: 'Community openen' },
      challenges: { titel: 'Challenges', aantal: (n: number) => (n === 1 ? '1 challenge' : `${n} challenges`), openen: 'Challenges openen', starten: 'Challenge starten' },
      fout: 'Kon niet geladen worden.',
    },
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
    intro: 'What your members see in the app, and what you put in it.',
    bekijkAlsLid: 'View as member',
    bekijkUitleg: 'Choose a member and look along on their phone.',
    inDeApp: 'In the app',
    secties: {
      berichten: { titel: 'Messages', leeg: 'No messages yet.', aantal: (n: number) => (n === 1 ? '1 message' : `${n} messages`), openen: 'Open messages' },
      community: { titel: 'Community', aantal: (n: number) => (n === 1 ? '1 group' : `${n} groups`), beoordelen: (n: number) => `${n} to review`, openen: 'Open community' },
      challenges: { titel: 'Challenges', aantal: (n: number) => (n === 1 ? '1 challenge' : `${n} challenges`), openen: 'Open challenges', starten: 'Start a challenge' },
      fout: 'Could not be loaded.',
    },
    acties: 'Member app',
    poster: 'Poster with QR code',
    uitnodigen: 'Invite members',
    uitnodigenUitleg: 'You invite members under Members; the activation link for each member is on their profile',
    ledenFout: 'The members could not be loaded.',
    geenLeden: 'This location has no members who can train yet.',
    afspraken: 'Appointments',
  },
})
