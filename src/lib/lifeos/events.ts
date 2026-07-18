// ─── LifeOS — een piepklein signaal tussen de dashboard-kaarten ─────────────
// De kaarten op het dashboard zijn bewust losse client-eilanden: elk haalt zijn
// eigen data op, zodat een fout in de één de rest niet meesleept. De prijs
// daarvan is dat kaart B niet weet wanneer kaart A iets schreef. Meestal geeft
// niet uit — maar soms wél:
//
//   - het dagplan moet herrekenen als je een taak wijzigt (een taak die "niet
//     paste" past ineens wél zodra je een tijdsinschatting invult);
//   - de kennisgrafiek moet herladen als je een notitie of een [[link]] toevoegt;
//   - de welzijnsscore moet herladen als je stress of stemming logt (anders blijft
//     "x van 6 gemeten" achter terwijl het scherm belooft dat het bijwerkt).
//
// Zonder dit zag je die veranderingen pas na een volledige paginaherlaad — de
// handeling léék niet te werken terwijl 'ie server-side wél klopte.
//
// Bewust geen store, geen context, geen library: één set luisteraars per kanaal.
// Puur en synchroon; de aanroeper beslist wanneer 'ie meldt (ná een geslaagde
// schrijf, nooit optimistisch).

export type Kanaal = 'taken' | 'notities' | 'welzijn'

const luisteraars = new Map<Kanaal, Set<() => void>>()

/**
 * Meld dat er iets veranderde op `kanaal`. Elke geregistreerde luisteraar wordt
 * synchroon aangeroepen. Roep dit ná een geslaagde schrijf aan, niet ervoor.
 */
export function meldWijziging(kanaal: Kanaal): void {
  const set = luisteraars.get(kanaal)
  if (set === undefined) return
  // Kopie: een luisteraar die zich tijdens de melding afmeldt (unmount) mag de
  // lopende iteratie niet verstoren.
  for (const fn of [...set]) fn()
}

/**
 * Luister op wijzigingen op `kanaal`. Geeft een opzeg-functie terug — roep die
 * aan bij unmount (of in de effect-cleanup), anders lekt de luisteraar.
 */
export function luisterOpWijziging(kanaal: Kanaal, fn: () => void): () => void {
  let set = luisteraars.get(kanaal)
  if (set === undefined) {
    set = new Set()
    luisteraars.set(kanaal, set)
  }
  set.add(fn)
  return () => {
    set.delete(fn)
  }
}
