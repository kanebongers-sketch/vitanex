// ─── Coaching: uitbreiding migratie 500, deel B (kettlebell, staand, sprongen) ─
// Opdracht Kane (05-11-2026): "Nog meer oefeningen!". Eigen tekst van Fit
// Factory, zelfde opbouw en regels als de rest (coaching.test.ts).

import type { CoachingBoek } from './typen'

export const COACHING_UITBREIDING_500_B: CoachingBoek = {
  'Kettlebell clean': {
    kernpunten: [
      { punt: 'Heupen geven de vaart', uitleg: 'Net als bij de swing komt de kracht uit je heupen. Je arm trekt de bel alleen dicht langs je lichaam.' },
      { punt: 'Bel om je hand heen', uitleg: 'De bel draait om je hand heen naar je onderarm. Hij slaat niet over je pols.' },
      { punt: 'Elleboog tegen je romp', uitleg: 'In de eindhouding ligt je elleboog tegen je ribben en de bel op je onderarm.' },
    ],
    opstelling: [
      'Sta met je voeten iets breder dan je heupen en de kettlebell een stukje voor je.',
      'Buig door je heupen en pak het handvat met een hand.',
    ],
    stappen: [
      'Zwaai de bel tussen je benen naar achteren.',
      'Strek je heupen krachtig en trek de bel dicht langs je lichaam omhoog.',
      'Laat je hand om het handvat draaien zodat de bel rustig op je onderarm landt, en zwaai terug.',
    ],
    fouten: [
      { fout: 'Bel klapt op je onderarm', beter: 'Houd hem dichter bij je lichaam en draai je hand er eerder omheen.' },
      { fout: 'Squatten in plaats van scharnieren', beter: 'Duw je heupen naar achteren. Je knieen buigen maar een beetje.' },
    ],
    ademhaling: 'Adem kort in als de bel naar achteren gaat en uit als hij op je onderarm landt.',
    tempo: 'Vloeiend, een clean per zwaai.',
    makkelijker: 'Leer eerst de kettlebell swing met twee handen.',
    zwaarder: 'Kies een zwaardere bel of doe een clean met twee bellen tegelijk.',
  },
  'Kettlebell snatch': {
    kernpunten: [
      { punt: 'Leer eerst de swing', uitleg: 'De snatch is de swing die doorgaat tot boven je hoofd. Zonder goede swing geen goede snatch.' },
      { punt: 'Hand doorsteken', uitleg: 'Steek bovenin je hand door het handvat. Dan landt de bel zacht op je onderarm.' },
      { punt: 'Arm gestrekt bovenin', uitleg: 'Bovenin staat je arm gestrekt boven je schouder en is de bel stil.' },
    ],
    opstelling: [
      'Sta met je voeten iets breder dan je heupen en de kettlebell een stukje voor je.',
      'Buig door je heupen en pak het handvat met een hand.',
    ],
    stappen: [
      'Zwaai de bel tussen je benen naar achteren.',
      'Strek je heupen explosief en laat de bel dicht langs je lichaam omhoog gaan.',
      'Steek je hand door tot je arm gestrekt boven je hoofd staat, en laat de bel terug in de swing vallen.',
    ],
    fouten: [
      { fout: 'Bel slaat op je onderarm', beter: 'Steek je hand eerder door en houd de bel dichter bij je lichaam.' },
      { fout: 'Arm doet al het werk', beter: 'Laat je heupen de vaart geven. Je arm stuurt alleen.' },
    ],
    ademhaling: 'Adem kort in als de bel naar achteren gaat en uit als hij bovenin stil staat.',
    tempo: 'Vloeiend, een snatch per zwaai, bovenin kort stil.',
    makkelijker: 'Oefen eerst de kettlebell clean.',
    zwaarder: 'Kies een zwaardere bel of doe meer herhalingen per minuut.',
  },
  'Eenarmige kettlebell swing': {
    kernpunten: [
      { punt: 'Romp draait niet mee', uitleg: 'Je schouders blijven recht naar voren. De bel probeert je te draaien, je buik houdt tegen.' },
      { punt: 'Schouder laag', uitleg: 'Trek je schouder naar beneden. Je arm is als een touw aan de bel.' },
      { punt: 'Kracht uit je heupen', uitleg: 'Duw je heupen krachtig naar voren. Je arm tilt de bel niet op.' },
    ],
    opstelling: [
      'Sta met je voeten iets breder dan je heupen en de kettlebell een stukje voor je.',
      'Buig door je heupen en pak het handvat met een hand.',
    ],
    stappen: [
      'Zwaai de bel tussen je benen naar achteren.',
      'Strek je heupen krachtig zodat de bel tot borsthoogte zweeft.',
      'Laat de bel terugvallen en vang hem op met je heupen in de volgende swing.',
    ],
    fouten: [
      { fout: 'Romp draait open', beter: 'Span je buik harder aan en kies een lichtere bel.' },
      { fout: 'Schouder trekt omhoog', beter: 'Duw je schouder laag en laat je arm los hangen.' },
    ],
    ademhaling: 'Adem in als de bel naar achteren gaat en uit als je heupen strekken.',
    tempo: 'Vloeiend, een swing per seconde ongeveer.',
    makkelijker: 'Kies de kettlebell swing met twee handen.',
    zwaarder: 'Wissel van hand bovenin de swing.',
  },
  'Kettlebell press': {
    kernpunten: [
      { punt: 'Pols recht onder de bel', uitleg: 'Je pols staat recht en de bel ligt op je onderarm. Zo duw je in een rechte lijn.' },
      { punt: 'Billen en buik aan', uitleg: 'Span alles aan voordat je drukt. Je romp leunt niet opzij of achterover.' },
      { punt: 'Gecontroleerd terug', uitleg: 'Laat de bel rustig terugzakken naar de rekhouding.' },
    ],
    opstelling: [
      'Sta met je voeten op heupbreedte.',
      'Houd de kettlebell in de rekhouding op schouderhoogte, de bel tegen je onderarm en je elleboog tegen je ribben.',
    ],
    stappen: [
      'Span je billen en buik aan.',
      'Druk de bel recht omhoog tot je arm gestrekt is.',
      'Laat hem gecontroleerd terugzakken naar je schouder.',
    ],
    fouten: [
      { fout: 'Opzij leunen', beter: 'Kies een lichtere bel en span je billen harder aan.' },
      { fout: 'Pols knikt naar achteren', beter: 'Houd je knokkels naar het plafond en je pols recht.' },
    ],
    ademhaling: 'Adem in onderin, uit tijdens het drukken.',
    tempo: '1 tel omhoog, 2 tellen omlaag.',
    makkelijker: 'Kies een lichtere bel of de dumbbell shoulder press zittend.',
    zwaarder: 'Houd bovenin 2 tellen vast.',
  },
  'Kettlebell halo': {
    kernpunten: [
      { punt: 'Dicht langs je hoofd', uitleg: 'De bel draait in een kleine cirkel dicht langs je hoofd en nek.' },
      { punt: 'Romp blijft stil', uitleg: 'Alleen je armen en schouders bewegen. Je romp en heupen staan stil.' },
      { punt: 'Wissel van richting', uitleg: 'Draai om de beurt de ene en de andere kant op.' },
    ],
    opstelling: [
      'Sta met je voeten op heupbreedte.',
      'Houd de kettlebell omgekeerd aan de horens voor je borst.',
    ],
    stappen: [
      'Breng de bel langs een kant van je hoofd naar achteren.',
      'Draai hem achter je hoofd langs naar de andere kant.',
      'Breng hem terug voor je borst en draai de volgende keer de andere kant op.',
    ],
    fouten: [
      { fout: 'Romp draait mee', beter: 'Span je buik aan en kies een lichtere bel.' },
      { fout: 'Te grote cirkel', beter: 'Houd de bel dicht bij je hoofd.' },
    ],
    ademhaling: 'Adem rustig door, uit als de bel achter je hoofd is.',
    tempo: 'Ongeveer 3 tellen per cirkel.',
    makkelijker: 'Kies een lichtere bel of doe het zittend.',
    zwaarder: 'Kies een zwaardere bel of doe het halfknielend.',
  },
  'Cossack squat': {
    kernpunten: [
      { punt: 'Hiel blijft op de grond', uitleg: 'De hiel van je gebogen been blijft plat op de grond. Zo zak je veilig door.' },
      { punt: 'Ander been gestrekt', uitleg: 'Je andere been is gestrekt met je tenen omhoog. Je voelt de rek aan de binnenkant.' },
      { punt: 'Zo diep als je heup toelaat', uitleg: 'Ga niet dieper dan je met een rechte rug kunt. Dat wordt vanzelf meer.' },
    ],
    opstelling: [
      'Sta heel breed met je tenen licht naar buiten.',
      'Strek je armen naar voren voor je evenwicht.',
    ],
    stappen: [
      'Zak naar een kant door dat been te buigen.',
      'Je andere been strekt zich met je tenen omhoog.',
      'Duw je terug naar het midden en zak naar de andere kant.',
    ],
    fouten: [
      { fout: 'Hiel komt los', beter: 'Zak minder diep of zet je voeten iets smaller.' },
      { fout: 'Rug wordt bol', beter: 'Borst omhoog en handen voor je borst.' },
    ],
    ademhaling: 'Adem in tijdens het zakken en uit tijdens het omhoog komen.',
    tempo: '2 tellen naar de kant, 1 tel terug.',
    makkelijker: 'Houd je vast aan een paal of zak minder diep.',
    zwaarder: 'Houd een kettlebell voor je borst.',
  },
  'Curtsy lunge': {
    kernpunten: [
      { punt: 'Voet schuin achter', uitleg: 'Je achterste voet gaat schuin achter je standbeen langs. Zo werkt je bil aan de zijkant mee.' },
      { punt: 'Heupen naar voren', uitleg: 'Je heupen blijven recht naar voren gericht. Ze draaien niet mee met je been.' },
      { punt: 'Knie boven je voet', uitleg: 'Je voorste knie wijst dezelfde kant op als je tenen.' },
    ],
    opstelling: [
      'Sta rechtop met je voeten op heupbreedte.',
      'Strek je armen naar voren of houd je handen in je zij.',
    ],
    stappen: [
      'Zet een voet schuin achter je andere been.',
      'Zak tot je achterste knie bijna de vloer raakt.',
      'Duw jezelf terug omhoog en zet je voet weer naast de andere.',
    ],
    fouten: [
      { fout: 'Heupen draaien mee', beter: 'Houd je heupen recht naar voren. Zet je voet minder ver over.' },
      { fout: 'Voorste knie zakt naar binnen', beter: 'Duw je knie naar buiten boven je voet.' },
    ],
    ademhaling: 'Adem in tijdens het zakken en uit tijdens het omhoog komen.',
    tempo: '2 tellen omlaag, 1 tel omhoog.',
    makkelijker: 'Houd je vast aan een muur of zak minder diep.',
    zwaarder: 'Houd een dumbbell in elke hand.',
  },
  'Pistol squat naar een bank': {
    kernpunten: [
      { punt: 'Hiel op de grond', uitleg: 'De hiel van je standbeen blijft de hele beweging op de grond.' },
      { punt: 'Gecontroleerd zitten', uitleg: 'Je zakt langzaam op de bank, niet ploffen. Zit kort en kom weer omhoog.' },
      { punt: 'Armen naar voren', uitleg: 'Je armen naar voren houden je in evenwicht.' },
    ],
    opstelling: [
      'Zet een bank achter je en sta er op een been voor.',
      'Strek je andere been naar voren een stukje boven de vloer.',
    ],
    stappen: [
      'Zak op je standbeen tot je kort op de bank zit.',
      'Houd je vrije been gestrekt naar voren.',
      'Duw jezelf op hetzelfde been weer omhoog.',
    ],
    fouten: [
      { fout: 'Ploffen op de bank', beter: 'Zak langzamer of kies een hogere bank.' },
      { fout: 'Knie zakt naar binnen', beter: 'Houd je knie boven je voet. Kies een hogere bank.' },
    ],
    ademhaling: 'Adem in tijdens het zakken en uit tijdens het omhoog komen.',
    tempo: '3 tellen omlaag, kort zitten, 1 tel omhoog.',
    makkelijker: 'Kies een hogere bank of houd je vast aan een paal.',
    zwaarder: 'Kies een lagere bank of houd een kettlebell voor je borst.',
  },
  'Step-down': {
    kernpunten: [
      { punt: 'Langzaam zakken', uitleg: 'Je standbeen buigt langzaam. Het werk zit in de weg naar beneden.' },
      { punt: 'Knie boven je voet', uitleg: 'Je knie blijft boven je voet en zakt niet naar binnen.' },
      { punt: 'Alleen aantikken', uitleg: 'Je andere hiel tikt de vloer alleen aan. Je zet er geen gewicht op.' },
    ],
    opstelling: [
      'Sta met een been op een box, je andere voet hangt voor de box.',
      'Strek je armen naar voren of houd je handen in je zij.',
    ],
    stappen: [
      'Buig je standbeen langzaam tot je andere hiel de vloer aantikt.',
      'Duw jezelf door je standbeen terug omhoog.',
      'Doe daarna hetzelfde met je andere been.',
    ],
    fouten: [
      { fout: 'Knie zakt naar binnen', beter: 'Kies een lagere box en duw je knie naar buiten.' },
      { fout: 'Gewicht op de voet op de vloer', beter: 'Tik alleen aan en kom direct terug omhoog.' },
    ],
    ademhaling: 'Adem in tijdens het zakken en uit tijdens het omhoog komen.',
    tempo: '3 tellen omlaag, 1 tel omhoog.',
    makkelijker: 'Kies een lagere box.',
    zwaarder: 'Kies een hogere box of houd dumbbells vast.',
  },
  'Calf raise op een been': {
    kernpunten: [
      { punt: 'Zo hoog mogelijk', uitleg: 'Duw jezelf helemaal op je tenen. Bovenin houd je kort vast.' },
      { punt: 'Gewicht op je grote teen', uitleg: 'Je enkel rolt niet naar buiten. Je gewicht blijft op de binnenkant van je voet.' },
      { punt: 'Langzaam omlaag', uitleg: 'Zak rustig terug tot je hiel net boven de grond is.' },
    ],
    opstelling: [
      'Sta op een been met je handen in je zij.',
      'Til je andere voet een stukje op.',
    ],
    stappen: [
      'Duw jezelf zo hoog mogelijk op je tenen.',
      'Houd bovenin kort vast.',
      'Zak langzaam terug en doe daarna je andere been.',
    ],
    fouten: [
      { fout: 'Enkel rolt naar buiten', beter: 'Duw door je grote teen omhoog.' },
      { fout: 'Te snel en te klein', beter: 'Gebruik de hele beweging en ga rustig.' },
    ],
    ademhaling: 'Adem uit tijdens het omhoog duwen en in tijdens het zakken.',
    tempo: '1 tel omhoog, 1 tel vast, 2 tellen omlaag.',
    makkelijker: 'Doe het op twee benen.',
    zwaarder: 'Sta met je voorvoet op een trede of houd een dumbbell vast.',
  },
  'Tibialis raise': {
    kernpunten: [
      { punt: 'Hielen op de grond', uitleg: 'Je hielen blijven op de grond. Alleen je tenen en voorvoet gaan omhoog.' },
      { punt: 'Benen gestrekt', uitleg: 'Je benen blijven gestrekt en je rug tegen de muur.' },
      { punt: 'Afstand bepaalt zwaarte', uitleg: 'Hoe verder je voeten van de muur, hoe zwaarder het is.' },
    ],
    opstelling: [
      'Leun met je rug tegen een muur.',
      'Zet je voeten een stap naar voren op heupbreedte.',
    ],
    stappen: [
      'Til je tenen zo hoog mogelijk op.',
      'Houd kort vast.',
      'Laat je voeten rustig zakken.',
    ],
    fouten: [
      { fout: 'Knieen buigen', beter: 'Houd je benen gestrekt. Zet je voeten dichter bij de muur.' },
      { fout: 'Te klein bewegen', beter: 'Til je tenen zo hoog als je kunt.' },
    ],
    ademhaling: 'Adem rustig door.',
    tempo: '1 tel omhoog, 1 tel vast, 1 tel omlaag.',
    makkelijker: 'Zet je voeten dichter bij de muur.',
    zwaarder: 'Zet je voeten verder van de muur of doe een been tegelijk.',
  },
  'Wall slide': {
    kernpunten: [
      { punt: 'Alles tegen de muur', uitleg: 'Je onderrug, ellebogen en handen blijven tegen de muur.' },
      { punt: 'Van W naar Y', uitleg: 'Je armen beginnen in een W en schuiven omhoog naar een Y.' },
      { punt: 'Alleen zo hoog als het lukt', uitleg: 'Komt iets los van de muur, dan stop je daar. Je bereik wordt vanzelf groter.' },
    ],
    opstelling: [
      'Sta met je rug tegen de muur en je voeten een kleine stap ervan af.',
      'Zet je armen in een W tegen de muur met je ellebogen op schouderhoogte.',
    ],
    stappen: [
      'Schuif je armen langzaam omhoog tot een Y.',
      'Houd kort vast zonder dat iets loskomt.',
      'Schuif ze rustig terug naar de W.',
    ],
    fouten: [
      { fout: 'Onderrug komt los', beter: 'Span je buik aan en ga minder hoog.' },
      { fout: 'Schouders trekken op', beter: 'Duw je schouders omlaag terwijl je schuift.' },
    ],
    ademhaling: 'Adem uit tijdens het omhoog schuiven en in tijdens het terugkomen.',
    tempo: '3 tellen omhoog, 3 tellen omlaag.',
    makkelijker: 'Doe het liggend op je rug op de vloer.',
    zwaarder: 'Houd de Y 3 tellen vast.',
  },
  'Jumping jack': {
    kernpunten: [
      { punt: 'Zacht landen', uitleg: 'Land op je voorvoeten met licht gebogen knieen. Zo vang je de landing op.' },
      { punt: 'Vast ritme', uitleg: 'Spring in een vast tempo. Niet te hoog, wel doorlopen.' },
      { punt: 'Armen helemaal omhoog', uitleg: 'Je armen gaan boven je hoofd en terug langs je lichaam.' },
    ],
    opstelling: [
      'Sta rechtop met je voeten bij elkaar en je armen langs je lichaam.',
    ],
    stappen: [
      'Spring naar een spreidstand terwijl je armen boven je hoofd gaan.',
      'Spring terug naar voeten bij elkaar en armen langs je lichaam.',
      'Ga door in een vast ritme.',
    ],
    fouten: [
      { fout: 'Hard landen op je hielen', beter: 'Blijf op je voorvoeten en buig je knieen een beetje.' },
      { fout: 'Armen half omhoog', beter: 'Breng je armen helemaal boven je hoofd.' },
    ],
    ademhaling: 'Adem rustig in en uit in je eigen ritme.',
    tempo: 'Ongeveer een sprong per seconde, op tijd.',
    makkelijker: 'Stap om de beurt opzij in plaats van te springen.',
    zwaarder: 'Spring sneller of zak bij elke landing in een kleine squat.',
  },
  'High knees': {
    kernpunten: [
      { punt: 'Op je voorvoeten', uitleg: 'Je landt op je voorvoeten en blijft licht. Je hielen raken de grond nauwelijks.' },
      { punt: 'Knieen tot heuphoogte', uitleg: 'Trek je knieen zo hoog als je kunt, het liefst tot heuphoogte.' },
      { punt: 'Romp rechtop', uitleg: 'Leun niet naar achteren. Je romp blijft rechtop en je armen bewegen mee.' },
    ],
    opstelling: [
      'Sta rechtop met je voeten op heupbreedte en je armen gebogen zoals bij hardlopen.',
    ],
    stappen: [
      'Ren op de plaats en trek om de beurt je knieen hoog op.',
      'Beweeg je armen mee zoals bij hardlopen.',
      'Houd het tempo vast tot de tijd om is.',
    ],
    fouten: [
      { fout: 'Achterover leunen', beter: 'Houd je romp rechtop en span je buik aan.' },
      { fout: 'Knieen te laag', beter: 'Ga liever iets langzamer met hoge knieen.' },
    ],
    ademhaling: 'Adem rustig en ritmisch door.',
    tempo: 'Snel, op tijd.',
    makkelijker: 'Marcheer op de plaats met hoge knieen.',
    zwaarder: 'Ga sneller of doe kortere blokken op vol tempo.',
  },
  'Skater jump': {
    kernpunten: [
      { punt: 'Zacht landen', uitleg: 'Land op een gebogen been en vang je landing op. Je knie blijft boven je voet.' },
      { punt: 'Achterste voet zweeft', uitleg: 'Je andere voet zwaait achter je langs zonder de vloer te raken.' },
      { punt: 'Eerst stabiel, dan ver', uitleg: 'Begin met korte sprongen en spring pas verder als je stil kunt landen.' },
    ],
    opstelling: [
      'Sta op een been met een lichte kniebuiging.',
      'Houd je romp licht voorover en je armen los.',
    ],
    stappen: [
      'Spring zijwaarts naar je andere been.',
      'Land zacht met een gebogen knie en laat je andere voet achter je langs zwaaien.',
      'Spring direct terug naar de andere kant.',
    ],
    fouten: [
      { fout: 'Knie zakt naar binnen bij de landing', beter: 'Spring korter en duw je knie boven je voet.' },
      { fout: 'Hard landen', beter: 'Land op je voorvoet en buig door je knie.' },
    ],
    ademhaling: 'Adem rustig en ritmisch door.',
    tempo: 'Vloeiend heen en weer, op tijd.',
    makkelijker: 'Stap opzij in plaats van te springen.',
    zwaarder: 'Spring verder en houd elke landing een tel stil.',
  },
  'Broad jump': {
    kernpunten: [
      { punt: 'Armen zwaaien mee', uitleg: 'Zwaai je armen naar achteren en dan krachtig naar voren. Dat geeft extra afstand.' },
      { punt: 'Zacht landen', uitleg: 'Land met gebogen knieen op twee voeten en vang de landing op.' },
      { punt: 'Knieen boven je voeten', uitleg: 'Bij afzet en landing blijven je knieen boven je voeten.' },
    ],
    opstelling: [
      'Sta met je voeten op heupbreedte.',
      'Houd je armen los langs je lichaam.',
    ],
    stappen: [
      'Zwaai je armen naar achteren en zak een stukje door je knieen.',
      'Spring zo ver mogelijk vooruit terwijl je armen naar voren zwaaien.',
      'Land zacht op twee voeten, sta stil en loop terug voor de volgende sprong.',
    ],
    fouten: [
      { fout: 'Landen met gestrekte benen', beter: 'Buig je knieen bij de landing en zak een beetje door.' },
      { fout: 'Knieen zakken naar binnen', beter: 'Spring minder ver en duw je knieen naar buiten.' },
    ],
    ademhaling: 'Adem in voor de sprong en uit bij de landing.',
    tempo: 'Een sprong, stil landen, rustig terug.',
    makkelijker: 'Kies de squat jump op de plaats.',
    zwaarder: 'Doe drie sprongen achter elkaar.',
  },
}
