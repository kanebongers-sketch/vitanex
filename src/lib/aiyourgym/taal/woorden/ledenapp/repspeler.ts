import { woordenboek } from '../../woordenboek'

// De rep-speler (besluit Kane 24-10-2026): de Blender-render, altijd op 1
// seconde heen en 1 terug (besluit Kane 29-10-2026), met de teller, de rust na de set en de coaching eronder. Ook in
// de oefenbibliotheek van Club en het oefeningblad van de ledenapp.

export const REPSPELER = woordenboek({
  nl: {
    figuur: (naam: string) => `${naam}, meetrainen`,
    beeld: (naam: string) => `Uitvoering van ${naam}`,
    bediening: 'Bediening',
    pauze: 'Pauze',
    verder: 'Verder',
    nogEenKeer: 'Nog een keer',
    start: 'Start',
    laden: 'Even laden',
    opnieuw: 'Opnieuw beginnen',
    tikUit: 'Tikje per fase uitzetten',
    tikAan: 'Tikje per fase aanzetten',
    tempoSr: 'Tempo uit het schema: ',
    fase: {
      omlaag: 'omlaag',
      omhoog: 'omhoog',
      vast: 'vast',
      vasthouden: 'vasthouden',
    },
    teller: {
      klaarVraag: 'Klaar?',
      klaar: 'Klaar',
      pauze: 'Pauze',
      tijdOm: 'Tijd is om, set klaar',
      nogSeconden: (sec: number) => `Nog ${sec} seconden`,
      setKlaar: (reps: number) => `${reps} van ${reps}, set klaar`,
      herhaling: (rep: number, reps: number) => `Herhaling ${rep} van ${reps}`,
      set: (nr: number) => `Set ${nr}`,
      van: (sets: number) => ` van ${sets}`,
    },
    na: {
      label: 'Set klaar',
      setKlaar: 'Set klaar',
      rust: 'Rust',
      rustOm: 'Rust is om, ga maar',
      vastleggen: 'Set vastleggen',
      vastleggenNr: (nr: number) => `Set ${nr} vastleggen`,
    },
    coaching: {
      kernpunten: 'Kernpunten',
      letOp: 'Let op',
      fout: 'Fout: ',
      beter: 'Beter: ',
      ademhaling: 'Ademhaling',
      tempo: 'Tempo',
    },
  },
  en: {
    figuur: (naam: string) => `${naam}, train along`,
    beeld: (naam: string) => `How to do ${naam}`,
    bediening: 'Controls',
    pauze: 'Pause',
    verder: 'Resume',
    nogEenKeer: 'Once more',
    start: 'Start',
    laden: 'Loading',
    opnieuw: 'Start again',
    tikUit: 'Turn off the tick per phase',
    tikAan: 'Turn on a tick per phase',
    tempoSr: 'Tempo from the programme: ',
    fase: {
      omlaag: 'down',
      omhoog: 'up',
      vast: 'hold',
      vasthouden: 'hold',
    },
    teller: {
      klaarVraag: 'Ready?',
      klaar: 'Done',
      pauze: 'Paused',
      tijdOm: 'Time is up, set done',
      nogSeconden: (sec: number) => `${sec} seconds to go`,
      setKlaar: (reps: number) => `${reps} of ${reps}, set done`,
      herhaling: (rep: number, reps: number) => `Rep ${rep} of ${reps}`,
      set: (nr: number) => `Set ${nr}`,
      van: (sets: number) => ` of ${sets}`,
    },
    na: {
      label: 'Set done',
      setKlaar: 'Set done',
      rust: 'Rest',
      rustOm: 'Rest is over, off you go',
      vastleggen: 'Log set',
      vastleggenNr: (nr: number) => `Log set ${nr}`,
    },
    coaching: {
      kernpunten: 'Key points',
      letOp: 'Watch out for',
      fout: 'Mistake: ',
      beter: 'Better: ',
      ademhaling: 'Breathing',
      tempo: 'Tempo',
    },
  },
})

/** Een fasewoord uit de render ("omlaag") in de gekozen taal; een onbekend woord blijft zoals het is. */
export function faseWoord(woord: string, fase: Readonly<Record<string, string>>): string {
  return fase[woord] ?? woord
}
