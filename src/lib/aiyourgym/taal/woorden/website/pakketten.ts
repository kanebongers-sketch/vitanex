// De teksten van de pakketten (src/lib/aiyourgym/pakketten.ts) per taal, voor de
// prijzenpagina, het aanmelden en de prijs op maat. Het Nederlands is de bron in
// pakketten.ts; het Engels zegt precies hetzelfde. De pakketnamen (Start, Club,
// Keten) zijn productnamen en blijven gelijk tot Kane anders beslist.

import { PAKKETTEN, type PakketSleutel } from '@/lib/aiyourgym/pakketten'
import { woordenboek } from '../../woordenboek'

function nl(sleutel: PakketSleutel) {
  const p = PAKKETTEN.find((x) => x.sleutel === sleutel)
  if (!p) throw new Error(`Onbekend pakket ${sleutel}`)
  return { voorWie: p.voorWie, inbegrepen: p.inbegrepen }
}

export const PAKKET_TEKST = woordenboek({
  nl: {
    start: nl('start'),
    club: nl('club'),
    keten: nl('keten'),
    aanbevolen: 'Aanbevolen',
    prijsOpMaat: 'Prijs op maat',
    onbeperkt: 'Onbeperkt aantal vestigingen',
    eenVestiging: 'Een vestiging',
    eenVestigingCijfer: '1 vestiging',
    totVestigingen: (max: number) => `Tot ${max} vestigingen`,
    weetNiet: 'Weet ik nog niet',
  },
  en: {
    start: {
      voorWie: 'For a gym with one location.',
      inbegrepen: ['Members and check-in', 'Group classes and booking', 'Member app in your own branding', 'Leads and follow-up', 'Your own address, such as aiyourgym.com/yourgym'],
    },
    club: {
      voorWie: 'Everything for trainers, coaching and member retention.',
      inbegrepen: [
        'Everything in Start',
        'Intakes and training programmes with coaching',
        'Appointments and staff rota',
        'Challenges, badges and automations',
        'Monthly figures',
        'Personal help with setting up',
      ],
    },
    keten: {
      voorWie: 'For chains with several locations.',
      inbegrepen: ['Everything in Club', 'Unlimited locations', 'Permissions per role and club managers', 'Personal help with setting up'],
    },
    aanbevolen: 'Recommended',
    prijsOpMaat: 'Tailored price',
    onbeperkt: 'Unlimited locations',
    eenVestiging: 'One location',
    eenVestigingCijfer: '1 location',
    totVestigingen: (max: number) => `Up to ${max} locations`,
    weetNiet: 'Not sure yet',
  },
})

/** Voor wie en wat erin zit, in een taal. */
export function pakketTekst(sleutel: PakketSleutel, taal: 'nl' | 'en'): { voorWie: string; inbegrepen: readonly string[] } {
  return PAKKET_TEKST[taal][sleutel]
}

/** "Een vestiging", "Tot 3 vestigingen" of "Onbeperkt aantal vestigingen" in een taal. */
export function vestigingenTekst(max: number | null, taal: 'nl' | 'en', cijfer = false): string {
  const t = PAKKET_TEKST[taal]
  if (max === null) return t.onbeperkt
  if (max === 1) return cijfer ? t.eenVestigingCijfer : t.eenVestiging
  return t.totVestigingen(max)
}
