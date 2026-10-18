// De invoer van het demo-formulier zoals de pagina hem bijhoudt (alles als tekst,
// de server en leesDemoAanvraag maken er nette waarden van).

export interface DemoInvoer {
  naam: string
  sportschool: string
  email: string
  telefoon: string
  vestigingen: string
  soort: string
  moment: string
  opmerking: string
  akkoord: boolean
  /** Lokveld tegen robots, blijft leeg. */
  website: string
}

export type WijzigDemo = <K extends keyof DemoInvoer>(veld: K, waarde: DemoInvoer[K]) => void

export const LEEG: DemoInvoer = {
  naam: '',
  sportschool: '',
  email: '',
  telefoon: '',
  vestigingen: '1',
  soort: '',
  moment: '',
  opmerking: '',
  akkoord: false,
  website: '',
}
