import type { CoachingBoek } from './typen'

// Billen, kuiten, onderrug en hele lichaam
export const COACHING_ROMP_BILLEN: CoachingBoek = {
  'Abductor machine': {
    kernpunten: [
      { punt: 'Bekken stil op de zitting', uitleg: 'Je billen blijven plat op het kussen. Schuiven of wippen haalt het werk weg uit de zijkant van je heup.' },
      { punt: 'Duw met je knieën naar buiten', uitleg: 'Denk aan je knieën die uit elkaar gaan, niet je voeten. Je voelt het aan de buitenkant van je heup en bil.' },
      { punt: 'Langzaam terug', uitleg: 'Laat de kussens niet terugklappen. Juist het rustig terugkomen houdt de spanning op je bilspieren.' },
      { punt: 'Licht voorover leunen', uitleg: 'Een klein stukje voorover met een rechte rug legt meer werk bij je bilspieren. Rechtop werkt vooral de zijkant van je heup.' },
    ],
    opstelling: [
      'Stel de startstand zo in dat je benen gesloten zijn maar het gewicht nog net niet op de stapel rust.',
      'Zit diep in de stoel, voeten op de steunen en de kussens aan de buitenkant van je knieën. Pak de handvatten vast.',
    ],
    stappen: [
      'Span je buik licht aan en zet je bekken vast op de zitting.',
      'Duw je knieën naar buiten tot je de maximale opening hebt die je zonder wippen haalt.',
      'Houd een tel vast en laat je benen rustig terugkomen tot vlak voor de stapel.',
    ],
    fouten: [
      { fout: 'Heupen komen los van de zitting', beter: 'Kies minder gewicht en houd je billen plat op het kussen. De beweging zit alleen in je heupgewricht.' },
      { fout: 'Gewicht klapt terug op de stapel', beter: 'Laat het gewicht tussen de herhalingen niet rusten. Stop net voordat de platen elkaar raken.' },
      { fout: 'Kort en snel heen en weer bewegen', beter: 'Maak de hele opening en neem de tijd terug. Liever minder gewicht met volle beweging.' },
    ],
    ademhaling: 'Adem uit als je je benen naar buiten duwt, adem in als ze terugkomen.',
    tempo: '1 tel naar buiten, kort vasthouden, 2 tellen terug.',
    zwaarder: 'Houd bovenin 2 tot 3 tellen vast of maak na de laatste herhaling nog kleine pulsjes in de open stand.',
  },

  'Back extension': {
    kernpunten: [
      { punt: 'Buig vanuit je heupen', uitleg: 'Je scharniert over het kussen als een deur. De rug blijft lang, de beweging zit in je heupen.' },
      { punt: 'Stop bij een rechte lijn', uitleg: 'Bovenin is je lichaam recht van hoofd tot hielen. Verder achterover doorbuigen geeft druk op je onderrug.' },
      { punt: 'Billen aanspannen bovenin', uitleg: 'Knijp je billen aan om omhoog te komen. Dan deelt je onderrug het werk met je bilspieren en hamstrings.' },
      { punt: 'Kin licht ingetrokken', uitleg: 'Kijk schuin naar de grond. Zo blijft je nek in het verlengde van je rug.' },
    ],
    opstelling: [
      'Stel het kussen zo in dat de bovenrand net onder je heupbotten zit, zodat je vrij kunt buigen.',
      'Haak je hielen achter de voetsteun en kruis je armen voor je borst of leg je handen bij je oren.',
    ],
    stappen: [
      'Start in een rechte lijn met je buik licht aangespannen.',
      'Zak rustig voorover vanuit je heupen tot je een rek in je hamstrings voelt.',
      'Kom terug omhoog door je billen aan te spannen tot je weer een rechte lijn bent.',
    ],
    fouten: [
      { fout: 'Te ver achterover doorbuigen', beter: 'Stop als je recht bent. Holle rug bovenin voegt niets toe en belast je onderrug.' },
      { fout: 'Kussen te hoog, onder de buik', beter: 'Zet het kussen lager zodat je heupen vrij kunnen bewegen. Anders buig je alleen in je rug.' },
      { fout: 'Omhoog zwiepen met vaart', beter: 'Kom gecontroleerd omhoog en houd bovenin kort stil. Geen schwung uit je bovenlichaam.' },
    ],
    ademhaling: 'Adem in als je voorover zakt, adem uit als je omhoog komt.',
    tempo: '2 tellen omlaag, 1 tel omhoog, kort stil bovenin.',
    makkelijker: 'Maak de beweging kleiner of houd alleen de rechte lijn een aantal seconden vast.',
    zwaarder: 'Houd een halterschijf tegen je borst of pauzeer 2 tellen bovenin.',
  },

  'Battle ropes': {
    kernpunten: [
      { punt: 'Lage, stevige houding', uitleg: 'Knieën licht gebogen, heupen iets naar achteren. Zo vang je de kracht op met je benen en niet met je onderrug.' },
      { punt: 'Romp blijft stil', uitleg: 'Je armen maken de golf, je bovenlichaam niet. Buik aangespannen alsof iemand er zacht tegen duwt.' },
      { punt: 'Golven tot aan het anker', uitleg: 'Maak de golven groot genoeg dat ze tot het einde van het touw lopen. Dan doen je schouders echt werk.' },
      { punt: 'Blijf ademen', uitleg: 'Bij korte harde blokken houd je snel je adem in. Adem ritmisch door, dan houd je het blok vol.' },
    ],
    opstelling: [
      'Sta zo ver van het anker dat het touw net niet strak staat, met een kleine boog op de grond.',
      'Voeten op heupbreedte, knieën licht gebogen, pak de uiteinden vast met je duimen boven.',
    ],
    stappen: [
      'Zak in je lichte squat en span je buik aan.',
      'Beweeg je armen om en om snel op en neer vanuit je schouders, ellebogen licht gebogen.',
      'Houd het tempo vast tot het einde van het blok en zet het touw dan rustig neer.',
    ],
    fouten: [
      { fout: 'Rechtop staan met gestrekte benen', beter: 'Zak door je knieën en duw je heupen iets naar achteren. Je benen dempen de beweging.' },
      { fout: 'Hele bovenlichaam beweegt mee', beter: 'Zet je romp vast en laat alleen je armen werken. Maak de golven kleiner als je gaat zwaaien.' },
      { fout: 'Te lange blokken, slordige golven', beter: 'Werk in korte blokken, bijvoorbeeld 20 tot 30 seconden, met rust ertussen. Kwaliteit boven duur.' },
    ],
    ademhaling: 'Adem kort en ritmisch door, nooit je adem vasthouden tijdens een blok.',
    tempo: 'Snel en explosief, in korte blokken met rust ertussen.',
    makkelijker: 'Ga dichter bij het anker staan of maak tegelijk met beide armen rustige golven.',
    zwaarder: 'Combineer de golven met kleine squats of stap verder weg zodat het touw zwaarder wordt.',
  },

  'Bird dog': {
    kernpunten: [
      { punt: 'Rug als een tafel', uitleg: 'Je rug blijft vlak en stil, alsof er een glas water op ligt. Er mag niets gaan schuiven of draaien.' },
      { punt: 'Lang maken, niet hoog tillen', uitleg: 'Duw je hand naar voren en je hiel naar achteren. Optillen boven heuphoogte geeft een holle rug.' },
      { punt: 'Heupen blijven recht', uitleg: 'Je bekken kantelt niet naar de kant van het opgetilde been. Beide heupen wijzen naar de grond.' },
      { punt: 'Handen onder de schouders', uitleg: 'Duw de grond weg met je steunhand. Zo zakt je schouder niet in en blijft je bovenrug stevig.' },
    ],
    opstelling: [
      'Kom op handen en knieën: handen onder je schouders, knieën onder je heupen, rug vlak.',
      'Kijk naar de grond net voor je handen zodat je nek in het verlengde blijft.',
    ],
    stappen: [
      'Span je buik licht aan zonder je rug te bewegen.',
      'Strek tegelijk je rechterarm naar voren en je linkerbeen naar achteren tot ze horizontaal zijn.',
      'Houd 2 tot 3 tellen vast, breng ze rustig terug en wissel van kant.',
    ],
    fouten: [
      { fout: 'Been te hoog, holle onderrug', beter: 'Til je been tot heuphoogte en niet verder. Denk aan lang maken in plaats van omhoog.' },
      { fout: 'Heup draait open naar opzij', beter: 'Houd beide heupbotten naar de grond gericht. Maak de beweging kleiner tot je stil blijft.' },
      { fout: 'Snel wisselen zonder pauze', beter: 'Houd elke kant kort vast. De oefening werkt door het stilhouden, niet door de snelheid.' },
    ],
    ademhaling: 'Adem uit terwijl je arm en been strekt, adem rustig door tijdens het vasthouden.',
    tempo: '2 tellen strekken, 2 tot 3 tellen vasthouden, 2 tellen terug.',
    makkelijker: 'Strek eerst alleen een arm of alleen een been, en voeg ze samen als dat stil blijft.',
    zwaarder: 'Breng elleboog en knie onder je buik naar elkaar toe tussen de herhalingen, of houd langer vast.',
  },

  Burpee: {
    kernpunten: [
      { punt: 'Plank met strakke buik', uitleg: 'Als je voeten naar achteren gaan, land je in een rechte plank. Je heupen zakken niet door naar de grond.' },
      { punt: 'Handen plat, schouders erboven', uitleg: 'Zet je handen stevig op schouderbreedte neer. Dan vang je je gewicht op zonder je polsen te overbelasten.' },
      { punt: 'Zacht landen', uitleg: 'Land op je voorvoeten met licht gebogen knieën. Hoor je een harde klap, dan land je te stijf.' },
      { punt: 'Voeten dichtbij je handen', uitleg: 'Spring met je voeten terug tot vlak achter je handen. Zo kom je makkelijk en met een rechte rug omhoog.' },
    ],
    opstelling: [
      'Sta rechtop met je voeten op heupbreedte en vrije ruimte voor en achter je.',
    ],
    stappen: [
      'Zak door je knieën en zet je handen plat op de grond voor je voeten.',
      'Spring met beide voeten naar achteren in een plank, buik aangespannen.',
      'Spring je voeten terug naar je handen en kom omhoog met een sprongetje, armen boven je hoofd.',
    ],
    fouten: [
      { fout: 'Heupen zakken door in de plank', beter: 'Span je buik en billen aan voordat je voeten landen. Rustiger tempo helpt om de plank strak te houden.' },
      { fout: 'Met een ronde rug naar de grond', beter: 'Zak via je knieën en heupen, borst vooruit. Je rug blijft lang, ook als je snel gaat.' },
      { fout: 'Hard en stijf landen na de sprong', beter: 'Land op je voorvoeten en veer door je knieën. Hoe stiller je landt, hoe beter.' },
    ],
    ademhaling: 'Adem uit als je je voeten naar achteren springt en bij de sprong omhoog, adem in daartussen.',
    tempo: 'Vlot maar gecontroleerd, elke plank en landing netjes.',
    makkelijker: 'Stap je voeten een voor een naar achteren en terug, en sla de sprong aan het eind over.',
    zwaarder: 'Voeg een push-up toe in de plank of spring bovenin met je knieën naar je borst.',
  },

  'Calf raise op een trede': {
    kernpunten: [
      { punt: 'Helemaal op je tenen', uitleg: 'Kom zo hoog mogelijk, alsof je op je grote teen staat. De laatste centimeters zijn het zwaarst en het nuttigst.' },
      { punt: 'Hielen diep onder de trede', uitleg: 'Laat je hielen zakken tot je een rek in je kuit voelt. Zo train je over de volle lengte van de spier.' },
      { punt: 'Knieën recht, niet op slot', uitleg: 'Je benen blijven recht maar niet op slot. Buig je knieën niet om omhoog te komen, dat doen je kuiten.' },
      { punt: 'Houd je vast', uitleg: 'Een hand aan de leuning of muur voor je balans. Dan kun je je volledig op je kuiten richten.' },
    ],
    opstelling: [
      'Zet je voorvoeten op de rand van een trede of plateau, hielen vrij in de lucht.',
      'Voeten op heupbreedte met je tenen recht naar voren, een hand aan de leuning of muur.',
    ],
    stappen: [
      'Laat je hielen rustig zakken tot onder de trede en voel de rek in je kuiten.',
      'Duw jezelf via je voorvoet omhoog tot je zo hoog mogelijk op je tenen staat.',
      'Houd bovenin een tel vast en zak weer langzaam naar beneden.',
    ],
    fouten: [
      { fout: 'Veren onderin', beter: 'Stop kort onderin in de rek voordat je omhoog komt. Veren laat je pees het werk doen in plaats van je spier.' },
      { fout: 'Gewicht op de buitenkant van je voet', beter: 'Duw vooral via je grote teen omhoog. Zo blijft je enkel recht en stabiel.' },
      { fout: 'Te snel, halve beweging', beter: 'Neem de volle weg van diep onder de trede tot hoog op je tenen, en tel rustig mee.' },
    ],
    ademhaling: 'Adem uit als je omhoog komt, adem in als je hielen zakken.',
    tempo: '1 tel omhoog, 1 tel stil, 3 tellen omlaag.',
    makkelijker: 'Doe het op de vlakke grond zonder dat je hielen onder de trede zakken.',
    zwaarder: 'Doe het op een been, of houd een dumbbell vast in de hand aan de kant van je standbeen.',
  },

  'Calf raise staand': {
    kernpunten: [
      { punt: 'Volle beweging', uitleg: 'Van hielen diep onder de rand tot zo hoog mogelijk op je tenen. Zo train je je kuit over de hele lengte.' },
      { punt: 'Knieën recht, niet op slot', uitleg: 'Houd je knieën licht ontspannen maar buig ze niet tijdens de beweging. De kuit doet het werk, niet je benen.' },
      { punt: 'Niet veren onderin', uitleg: 'Wacht een tel in de rek voor je omhoog duwt. Zo werkt je kuitspier echt en niet de achillespees als veer.' },
      { punt: 'Lichaam lang en rechtop', uitleg: 'Schouders onder de kussens, rug recht, heupen boven je voeten. Niet naar voren hangen.' },
    ],
    opstelling: [
      'Stel de schouderkussens zo in dat je met licht gebogen knieën net onder de kussens past.',
      'Zet je voorvoeten op de rand, hielen vrij, voeten op heupbreedte met de tenen recht vooruit.',
    ],
    stappen: [
      'Strek je benen tot het gewicht loskomt en ga rechtop staan.',
      'Laat je hielen rustig zakken tot onder de rand en voel de rek.',
      'Duw jezelf via je voorvoeten zo hoog mogelijk omhoog, houd kort vast en zak weer.',
    ],
    fouten: [
      { fout: 'Omhoog stuiteren vanuit de rek', beter: 'Pauzeer een tel onderin en duw dan rustig omhoog. Minder gewicht als dat niet lukt.' },
      { fout: 'Knieën buigen om mee te duwen', beter: 'Houd de hoek in je knie gelijk. Als je benen meeduwen is het gewicht te zwaar.' },
      { fout: 'Alleen het bovenste stukje doen', beter: 'Zak echt tot onder de rand. Gebruik liever minder gewicht met de volle beweging.' },
    ],
    ademhaling: 'Adem uit als je omhoog duwt, adem in als je hielen zakken.',
    tempo: '1 tel omhoog, 1 tel stil bovenin, 2 tot 3 tellen omlaag, tel stil onderin.',
    zwaarder: 'Houd 2 tellen vast in de rek onderin en 2 tellen bovenin, of doe de laatste set op een been.',
  },

  'Calf raise zittend': {
    kernpunten: [
      { punt: 'Kussen net boven je knieën', uitleg: 'Het kussen ligt op je bovenbenen vlak boven de knie. Op de knieschijf zelf geeft het onnodig druk.' },
      { punt: 'Hielen zo hoog mogelijk', uitleg: 'Duw je hielen omhoog tot je echt op je voorvoet staat. Je voelt het diep onder in je kuit.' },
      { punt: 'Kort vasthouden bovenin', uitleg: 'Een tel stil in de hoogste stand. Dat is het stuk dat je zittend het makkelijkst overslaat.' },
      { punt: 'Rustig zakken in de rek', uitleg: 'Laat je hielen langzaam zakken tot onder de rand. Niet laten vallen en niet terugveren.' },
    ],
    opstelling: [
      'Zit rechtop met je voorvoeten op de rand en je hielen vrij. Stel het kussen zo in dat het strak op je bovenbenen ligt.',
      'Duw je hielen omhoog en haal de vergrendeling los voor je eerste herhaling.',
    ],
    stappen: [
      'Laat je hielen rustig zakken tot je een rek in je kuiten voelt.',
      'Duw via je voorvoeten je hielen zo hoog mogelijk omhoog.',
      'Houd een tel vast en zak weer gecontroleerd naar de rek.',
    ],
    fouten: [
      { fout: 'Kussen op de knieschijf', beter: 'Schuif het kussen naar je bovenbenen, net boven je knie. Dat is prettiger en veiliger met zwaar gewicht.' },
      { fout: 'Korte snelle pompjes', beter: 'Maak de hele beweging van diep onderin tot hoog bovenin, met een pauze aan beide kanten.' },
      { fout: 'Met je handen het kussen omhoog trekken', beter: 'Leg je handen alleen op het kussen voor houvast. Lukt het niet zonder trekken, neem dan minder gewicht.' },
    ],
    ademhaling: 'Adem uit als je hielen omhoog gaan, adem in als ze zakken.',
    tempo: '1 tel omhoog, 1 tel stil, 2 tot 3 tellen omlaag.',
    zwaarder: 'Houd bovenin 2 tellen vast en onderin 2 tellen in de rek.',
  },

  'Farmer walk': {
    kernpunten: [
      { punt: 'Schouders laag en naar achter', uitleg: 'Trek je schouders weg van je oren. Zo houd je het gewicht met je hele rug en niet alleen met je nek.' },
      { punt: 'Rechtop, kijk vooruit', uitleg: 'Je loopt lang en trots, kin licht ingetrokken. Niet naar een kant hangen en niet voorover buigen.' },
      { punt: 'Stevig knijpen', uitleg: 'Knijp de handvatten vast alsof je ze wilt platdrukken. Een stevige greep maakt je hele lichaam stabieler.' },
      { punt: 'Korte, rustige passen', uitleg: 'Zet je voeten kort en gecontroleerd neer. Grote passen laten de gewichten slingeren.' },
    ],
    opstelling: [
      'Zet de gewichten naast je voeten en pak ze op zoals bij een deadlift: door je knieën, rug recht.',
      'Kies een vaste afstand of tijd en zorg dat de looproute vrij is.',
    ],
    stappen: [
      'Kom rechtop met de gewichten naast je, schouders laag en buik aangespannen.',
      'Loop met korte, rustige passen de afstand af zonder dat de gewichten slingeren.',
      'Stop, zak door je knieën en zet de gewichten met een rechte rug neer.',
    ],
    fouten: [
      { fout: 'Schouders kruipen omhoog', beter: 'Druk je schouders bewust omlaag voordat je begint te lopen en controleer het onderweg.' },
      { fout: 'Romp hangt naar een kant', beter: 'Sta recht tussen beide gewichten in. Kies twee gelijke gewichten en span je zijkant aan.' },
      { fout: 'Met ronde rug neerzetten', beter: 'Zak door je knieën en heupen om de gewichten neer te zetten, net zo netjes als bij het oppakken.' },
    ],
    ademhaling: 'Adem rustig en gelijkmatig door, houd je buik licht aangespannen.',
    tempo: 'Rustig wandeltempo met korte, gecontroleerde passen.',
    makkelijker: 'Kies lichtere gewichten of een kortere afstand.',
    zwaarder: 'Draag maar een gewicht aan een kant, dan moet je romp harder werken om recht te blijven.',
  },

  'Glute bridge': {
    kernpunten: [
      { punt: 'Duw door je hielen', uitleg: 'Je gewicht zit op je hielen, niet op je tenen. Zo voel je het in je billen en minder voor in je bovenbenen.' },
      { punt: 'Billen aanknijpen bovenin', uitleg: 'Bovenin knijp je je billen stevig aan. Je heupen zijn dan gestrekt zonder dat je rug hol trekt.' },
      { punt: 'Ribben omlaag', uitleg: 'Houd je onderste ribben laag en je buik licht aan. Dan komt de beweging uit je heupen en niet uit je onderrug.' },
      { punt: 'Knieën boven je voeten', uitleg: 'Laat je knieën niet naar binnen vallen. Ze wijzen dezelfde kant op als je tenen.' },
    ],
    opstelling: [
      'Lig op je rug met je knieën gebogen en je voeten plat op heupbreedte, hielen ongeveer een handlengte van je billen.',
      'Leg je armen naast je lichaam met de handpalmen op de grond.',
    ],
    stappen: [
      'Span je buik licht aan en duw je hielen in de grond.',
      'Til je heupen op tot je een rechte lijn bent van schouders tot knieën, en knijp je billen aan.',
      'Houd een tel vast en laat je heupen rustig terug zakken tot net boven de grond.',
    ],
    fouten: [
      { fout: 'Holle rug bovenin', beter: 'Stop als je recht bent en knijp je billen aan. Je ribben blijven laag, je heupen gaan niet verder omhoog.' },
      { fout: 'Voeten te ver van je billen', beter: 'Zet je voeten dichterbij. Te ver weg verschuift het werk naar je hamstrings en die kunnen gaan krampen.' },
      { fout: 'Knieën vallen naar binnen', beter: 'Duw je knieën licht naar buiten. Een elastiek om je knieën helpt je dat te voelen.' },
    ],
    ademhaling: 'Adem uit als je je heupen optilt, adem in als je zakt.',
    tempo: '1 tel omhoog, 2 tellen vasthouden, 2 tellen omlaag.',
    makkelijker: 'Maak de beweging kleiner en houd bovenin korter vast.',
    zwaarder: 'Leg een halterschijf of dumbbell op je heupen, of doe het op een been.',
  },

  'Glute bridge op een been': {
    kernpunten: [
      { punt: 'Heupen blijven waterpas', uitleg: 'Beide heupbotten op dezelfde hoogte. Zakt de vrije kant, dan werkt je bil van het standbeen te weinig.' },
      { punt: 'Duw door de hiel', uitleg: 'Je standvoet staat plat en je duwt vooral via je hiel. Zo komt het werk in je bil en niet in je knie.' },
      { punt: 'Minder hoog is prima', uitleg: 'Ga zo hoog als je kunt zonder te kantelen of hol te trekken. Een nette kleine beweging is beter.' },
      { punt: 'Vrije been stil houden', uitleg: 'Het gestrekte been zweeft rustig mee. Niet zwaaien om omhoog te komen.' },
    ],
    opstelling: [
      'Lig op je rug met een voet plat op de grond, hiel dicht bij je bil, en strek het andere been in het verlengde van je bovenbeen.',
      'Leg je armen naast je met de handpalmen op de grond voor steun.',
    ],
    stappen: [
      'Span je buik aan en duw je hiel in de grond.',
      'Til je heupen op terwijl je bekken recht blijft en knijp je bil aan.',
      'Houd een tel vast, zak rustig terug en doe alle herhalingen voor je wisselt.',
    ],
    fouten: [
      { fout: 'Bekken kantelt naar de vrije kant', beter: 'Maak de beweging kleiner tot je heupen recht blijven. Leg eventueel je handen op je heupbotten als controle.' },
      { fout: 'Duwen met de onderrug', beter: 'Houd je ribben laag en stop als je bil volledig aangespannen is. Verder omhoog maakt alleen je rug hol.' },
      { fout: 'Kramp in de hamstring', beter: 'Zet je standvoet dichter bij je billen en duw meer via je hiel.' },
    ],
    ademhaling: 'Adem uit als je omhoog komt, adem in als je zakt.',
    tempo: '1 tel omhoog, 2 tellen vasthouden, 2 tellen omlaag.',
    makkelijker: 'Houd je vrije been gebogen met de voet in de lucht, of doe de gewone glute bridge.',
    zwaarder: 'Zet je schouders op een bank, of leg een gewicht op de heup van je standbeen.',
  },

  'Good morning': {
    kernpunten: [
      { punt: 'Heupen naar achteren', uitleg: 'Je buigt niet voorover maar duwt je billen naar de muur achter je. Je romp kantelt vanzelf mee.' },
      { punt: 'Rug blijft recht', uitleg: 'Van hoofd tot stuitje een lange lijn. Zodra je rug rond wordt, stop je en kom je terug omhoog.' },
      { punt: 'Knieën licht gebogen', uitleg: 'Een kleine buiging die gelijk blijft. Niet verder door je knieën zakken, dan wordt het een squat.' },
      { punt: 'Stang vast op je bovenrug', uitleg: 'Trek de stang in je schouders en houd je schouderbladen bij elkaar. Zo blijft je bovenrug stevig.' },
    ],
    opstelling: [
      'Begin met een stok of lege stang. Leg de stang op je bovenrug zoals bij een squat, niet op je nek.',
      'Voeten op heupbreedte, knieën licht gebogen, ellebogen iets naar beneden.',
    ],
    stappen: [
      'Adem in, span je buik aan en duw je heupen naar achteren.',
      'Laat je romp voorover kantelen met een rechte rug tot je een rek in je hamstrings voelt of je romp bijna horizontaal is.',
      'Duw je heupen naar voren en kom rechtop, billen aangespannen.',
    ],
    fouten: [
      { fout: 'Ronde onderrug onderin', beter: 'Ga minder diep. Je beweging stopt waar je rug nog recht is, ook als dat ver boven horizontaal is.' },
      { fout: 'Knieën buigen steeds verder', beter: 'Zet de lichte kniebuiging vast aan het begin en houd die gelijk. Alleen je heupen bewegen.' },
      { fout: 'Te snel naar te veel gewicht', beter: 'Dit is een techniekoefening. Bouw rustig op en houd elke herhaling netjes.' },
    ],
    ademhaling: 'Adem in en span je buik aan voor je zakt, adem uit als je bijna rechtop staat.',
    tempo: '3 tellen omlaag, kort stil, 1 tot 2 tellen omhoog.',
    makkelijker: 'Doe de beweging met een stok langs je rug om te voelen of je rug recht blijft.',
  },

  'Hip thrust machine': {
    kernpunten: [
      { punt: 'Duw vanuit je hielen', uitleg: 'Je voeten staan plat en je gewicht ligt op je hielen. Dan voel je het in je billen in plaats van je bovenbenen.' },
      { punt: 'Geen holle rug bovenin', uitleg: 'Stop als je heupen gestrekt zijn. Verder omhoog gaat alleen via je onderrug.' },
      { punt: 'Kin licht naar je borst', uitleg: 'Kijk naar voren, niet naar het plafond. Dat helpt je ribben laag te houden.' },
      { punt: 'Billen vol aanspannen', uitleg: 'Knijp bovenin je billen een tel stevig aan. Dat is het belangrijkste moment van de herhaling.' },
    ],
    opstelling: [
      'Ga met je bovenrug tegen het rugkussen zitten en zet de riem of het kussen over je heupen, op de heupbotten.',
      'Zet je voeten op heupbreedte zo neer dat je onderbenen bovenin recht omhoog staan.',
    ],
    stappen: [
      'Span je buik aan en duw je hielen in het plateau.',
      'Duw je heupen omhoog tot je recht bent van schouders tot knieën en knijp je billen aan.',
      'Houd een tel vast en zak rustig terug tot het gewicht net niet rust.',
    ],
    fouten: [
      { fout: 'Holle rug bovenin', beter: 'Houd je ribben laag en je kin licht ingetrokken. Stop als je billen volledig aangespannen zijn.' },
      { fout: 'Voeten te dicht of te ver', beter: 'Verplaats je voeten tot je scheenbenen bovenin rechtop staan. Dan zit het werk het meest in je billen.' },
      { fout: 'Gewicht laten vallen', beter: 'Zak in 2 tellen terug en laat het gewicht niet rusten tussen de herhalingen.' },
    ],
    ademhaling: 'Adem uit als je je heupen omhoog duwt, adem in als je zakt.',
    tempo: '1 tel omhoog, 1 tel vasthouden, 2 tellen omlaag.',
    zwaarder: 'Houd bovenin 3 tellen vast of doe de laatste herhalingen met een been.',
  },

  'Hip thrust met barbell': {
    kernpunten: [
      { punt: 'Kin naar je borst', uitleg: 'Je blik volgt je romp en kijkt naar voren. Zo blijven je ribben laag en trekt je rug niet hol.' },
      { punt: 'Scheenbenen rechtop bovenin', uitleg: 'Zet je voeten zo dat je onderbenen bovenin verticaal staan. Dan werken je billen het meest.' },
      { punt: 'Knijp bovenin je billen aan', uitleg: 'Je heupen strekken volledig door je billen, niet door je onderrug. Houd dat moment een tel vast.' },
      { punt: 'Bank onder je schouderbladen', uitleg: 'De rand van de bank zit net onder je schouderbladen. Je bovenrug draait eromheen als een scharnier.' },
    ],
    opstelling: [
      'Zit op de grond met je bovenrug tegen een vaste bank en rol de stang met een kussen over je heupen.',
      'Voeten plat op iets meer dan heupbreedte, handen op de stang om hem stil te houden.',
    ],
    stappen: [
      'Span je buik aan, kin licht naar je borst, en duw je hielen in de grond.',
      'Duw je heupen omhoog tot je recht bent van schouders tot knieën en knijp je billen aan.',
      'Houd kort vast en zak gecontroleerd tot je billen bijna de grond raken.',
    ],
    fouten: [
      { fout: 'Hoofd naar achteren, holle rug', beter: 'Houd je kin licht naar je borst en kijk vooruit. Je romp en hoofd bewegen als een geheel.' },
      { fout: 'Stang rolt naar je buik', beter: 'Houd de stang met beide handen stil op je heupbotten en gebruik altijd een dik kussen.' },
      { fout: 'Duwen via je tenen', beter: 'Zet je gewicht op je hielen. Til eventueel je tenen een klein stukje op om dat te voelen.' },
    ],
    ademhaling: 'Adem in onderin en span je buik aan, adem uit als je bovenin bent.',
    tempo: '1 tel omhoog, 1 tel vasthouden, 2 tellen omlaag.',
    makkelijker: 'Begin met een lege stang of doe de beweging zonder gewicht met je schouders op de bank.',
    zwaarder: 'Zet een elastiek om je knieën en duw die naar buiten, of houd bovenin 3 tellen vast.',
  },

  'Kettlebell swing': {
    kernpunten: [
      { punt: 'Kracht uit je heupen', uitleg: 'Je heupen knallen naar voren en de bel zweeft mee. Je armen zijn alleen touwen, ze tillen niets.' },
      { punt: 'Scharnieren, niet squatten', uitleg: 'Het is een heupscharnier, geen squat. Billen naar de muur achter je, knieën maar licht gebogen.' },
      { punt: 'Rug recht, borst open', uitleg: 'Ook als de bel tussen je benen door zwaait blijft je rug lang. Schouders weg van je oren.' },
      { punt: 'Bovenin rechtop en strak', uitleg: 'Bovenin sta je als een plank: billen en buik aangespannen. Niet achterover leunen.' },
    ],
    opstelling: [
      'Zet de bel een halve meter voor je voeten. Voeten iets breder dan heupbreedte.',
      'Duw je heupen naar achteren en pak de bel met beide handen, rug recht.',
    ],
    stappen: [
      'Til de bel licht op en zwaai hem krachtig naar achteren tussen je benen, onderarmen tegen je bovenbenen.',
      'Strek je heupen explosief naar voren zodat de bel tot ongeveer borsthoogte zweeft.',
      'Laat de bel terugvallen en vang hem op door je heupen weer naar achteren te duwen.',
    ],
    fouten: [
      { fout: 'Squatten in plaats van scharnieren', beter: 'Duw je billen naar achteren en houd je scheenbenen bijna rechtop. Je knieën buigen maar een klein beetje.' },
      { fout: 'Bel omhoog tillen met de armen', beter: 'Ontspan je armen en laat je heupen het werk doen. De bel stopt vanzelf als je heupen gestrekt zijn.' },
      { fout: 'Ronde rug onderin', beter: 'Houd je borst open en je blik een paar meter voor je. Kies een lichtere bel tot je rug recht blijft.' },
      { fout: 'Achterover leunen bovenin', beter: 'Eindig rechtop met je billen aangespannen. Je lichaam vormt een rechte lijn, niet een boog.' },
    ],
    ademhaling: 'Adem kort in als de bel naar achteren zwaait, adem krachtig uit als je heupen naar voren gaan.',
    tempo: 'Explosief omhoog, de bel vrij laten vallen, ritmisch doorgaan.',
    makkelijker: 'Oefen eerst de heupscharnier met een deadlift van de kettlebell, zonder te zwaaien.',
    zwaarder: 'Kies een zwaardere bel of zwaai met een hand.',
  },

  'Kickback aan de kabel': {
    kernpunten: [
      { punt: 'Romp blijft stil', uitleg: 'Alleen je been beweegt. Je bovenlichaam en bekken staan vast, alsof je tegen een muur leunt.' },
      { punt: 'Knijp je bil aan', uitleg: 'Denk aan je bil die het been naar achteren duwt. Je voelt het hoog in je bil, niet in je onderrug.' },
      { punt: 'Niet te ver naar achteren', uitleg: 'Stop als je bil volledig aangespannen is. Verder zwaaien gaat via een holle rug.' },
      { punt: 'Rustig terugkomen', uitleg: 'Laat het gewicht niet terugtrekken. Breng je been gecontroleerd naar voren tot naast je standbeen.' },
    ],
    opstelling: [
      'Zet de katrol op de laagste stand en maak een enkelband om je enkel vast.',
      'Sta tegenover de kabel, houd je vast aan het rek, buig licht voorover met een rechte rug en zet je standbeen licht gebogen.',
    ],
    stappen: [
      'Span je buik aan en zet je bekken vast.',
      'Breng je been met een lichte kniebuiging naar achteren tot je bil volledig aangespannen is.',
      'Houd een tel vast en breng je been rustig terug naar voren.',
    ],
    fouten: [
      { fout: 'Holle rug bij elke herhaling', beter: 'Maak de beweging kleiner en span je buik aan. Je been gaat niet hoger dan je bil kan halen.' },
      { fout: 'Zwaaien met vaart', beter: 'Kies minder gewicht en houd bovenin een tel vast. Je moet elke herhaling kunnen stoppen.' },
      { fout: 'Bekken draait open', beter: 'Houd beide heupbotten naar de kabel gericht. Je been gaat recht naar achteren, niet naar buiten.' },
    ],
    ademhaling: 'Adem uit als je je been naar achteren duwt, adem in als het terugkomt.',
    tempo: '1 tel naar achteren, 1 tel vasthouden, 2 tellen terug.',
    makkelijker: 'Doe het zonder kabel op handen en knieën met een gebogen knie.',
    zwaarder: 'Pauzeer 2 tellen bovenin of verhoog het gewicht met behoud van een stille romp.',
  },

  'Kuitpers in de leg press': {
    kernpunten: [
      { punt: 'Voeten eerst stevig neer', uitleg: 'Haal de vergrendeling pas los als je voorvoeten goed op de rand staan. Wegglijden is hier het grootste risico.' },
      { punt: 'Knieën niet op slot', uitleg: 'Je benen zijn bijna gestrekt met een kleine buiging. Zo staat er geen gewicht direct op je kniegewricht.' },
      { punt: 'Volle beweging', uitleg: 'Laat je hielen rustig terug komen tot je de rek voelt, en duw dan zo ver mogelijk weg op je tenen.' },
      { punt: 'Alleen je enkels bewegen', uitleg: 'Je knieën en heupen blijven in dezelfde stand. Alles wat je duwt, duw je met je kuiten.' },
    ],
    opstelling: [
      'Zet de rugleuning in een comfortabele stand en ga met je rug en billen stevig tegen het kussen zitten.',
      'Zet je voorvoeten op heupbreedte op de onderrand van het plateau, hielen vrij.',
    ],
    stappen: [
      'Strek je benen tot ze bijna recht zijn en haal de vergrendeling los.',
      'Laat je hielen rustig terug komen tot je een rek in je kuiten voelt.',
      'Duw het plateau weg door zo hoog mogelijk op je tenen te komen, houd kort vast en zak weer.',
    ],
    fouten: [
      { fout: 'Knieën helemaal op slot', beter: 'Houd een kleine buiging in je knieën. Zo blijft de belasting op je kuiten en niet op je kniegewricht.' },
      { fout: 'Hele voet op het plateau', beter: 'Alleen je voorvoeten staan op de rand. Staan je hielen erop, dan kunnen je enkels niet vrij bewegen.' },
      { fout: 'Kort en snel heen en weer', beter: 'Neem de hele beweging en een pauze onderin. Minder gewicht levert hier vaak meer op.' },
    ],
    ademhaling: 'Adem uit als je het plateau wegduwt, adem in als je hielen terugkomen.',
    tempo: '1 tel duwen, 1 tel vasthouden, 2 tot 3 tellen terug.',
    zwaarder: 'Doe het met een been tegelijk of houd 2 tellen vast in de rek.',
  },

  'Medicine ball slam': {
    kernpunten: [
      { punt: 'Helemaal lang maken bovenin', uitleg: 'Bal hoog boven je hoofd en kom op je tenen. Hoe langer je je maakt, hoe meer kracht je in de slam hebt.' },
      { punt: 'Gooi met je hele lichaam', uitleg: 'De kracht komt uit je buik en heupen, niet alleen uit je armen. Je romp klapt mee naar beneden.' },
      { punt: 'Door je knieën bij het oppakken', uitleg: 'Zak met je heupen en een rechte rug om de bal te pakken. Nooit met een ronde rug van de grond rukken.' },
      { punt: 'Bal voor je voeten', uitleg: 'Mik op de grond vlak voor je tenen. Zo stuitert hij niet tegen je gezicht en hoef je niet ver te reiken.' },
    ],
    opstelling: [
      'Gebruik een slamball die niet stuitert en sta met je voeten op heupbreedte.',
      'Houd de bal met beide handen voor je borst en zorg voor vrije ruimte om je heen.',
    ],
    stappen: [
      'Til de bal boven je hoofd en strek je hele lichaam uit.',
      'Gooi de bal met kracht voor je voeten op de grond, buik aanspannen en knieën licht buigen.',
      'Zak door je knieën met een rechte rug, pak de bal op en begin opnieuw.',
    ],
    fouten: [
      { fout: 'Met ronde rug de bal oppakken', beter: 'Zak door je knieën en heupen alsof je een deadlift doet. Neem daar gerust een seconde extra voor.' },
      { fout: 'Alleen met je armen gooien', beter: 'Laat je romp en heupen meeklappen. Je buik doet het meeste werk bij het naar beneden gaan.' },
      { fout: 'Stuiterende bal gebruiken', beter: 'Kies een echte slamball of een zachte bal zonder stuit. Een stuiterende bal kan terugkaatsen naar je gezicht.' },
    ],
    ademhaling: 'Adem in als je de bal optilt, adem krachtig uit bij de slam.',
    tempo: 'Explosief naar beneden, rustig en gecontroleerd weer oppakken.',
    makkelijker: 'Kies een lichtere bal en maak de beweging kleiner, vanaf borsthoogte.',
    zwaarder: 'Kies een zwaardere bal of doe zo veel mogelijk nette slams in een vaste tijd.',
  },

  Superman: {
    kernpunten: [
      { punt: 'Klein bewegen is genoeg', uitleg: 'Armen en benen gaan maar een paar centimeter omhoog. Hoger tillen geeft vooral een knik in je onderrug.' },
      { punt: 'Kijk naar de grond', uitleg: 'Je hoofd blijft in het verlengde van je rug. Opkijken trekt je nek onnodig hol.' },
      { punt: 'Lang maken', uitleg: 'Reik met je handen naar voren en je voeten naar achteren. Denk aan lengte, niet aan hoogte.' },
      { punt: 'Billen licht aanspannen', uitleg: 'Je billen helpen je benen optillen. Zo hoeft je onderrug niet alles alleen te doen.' },
    ],
    opstelling: [
      'Lig op je buik op een mat met je armen gestrekt boven je hoofd en je benen gestrekt op heupbreedte.',
      'Leg je voorhoofd op de mat of een opgevouwen handdoek.',
    ],
    stappen: [
      'Span je billen en buik licht aan.',
      'Til tegelijk je armen, borst en benen een klein stukje van de grond, blik naar beneden.',
      'Houd 2 tot 3 tellen vast en zak rustig terug.',
    ],
    fouten: [
      { fout: 'Zo hoog mogelijk tillen', beter: 'Til alleen een paar centimeter. Je moet het in je hele achterkant voelen, niet als een kneep in je onderrug.' },
      { fout: 'Hoofd omhoog, nek hol', beter: 'Houd je blik op de mat. Je nek blijft lang en ontspannen.' },
      { fout: 'Omhoog zwiepen', beter: 'Kom rustig omhoog en houd vast. De oefening werkt door het vasthouden, niet door de vaart.' },
    ],
    ademhaling: 'Adem uit als je optilt en adem rustig door tijdens het vasthouden.',
    tempo: '1 tel omhoog, 2 tot 3 tellen vasthouden, 2 tellen omlaag.',
    makkelijker: 'Til om en om een arm en het tegenovergestelde been op in plaats van alles tegelijk.',
    zwaarder: 'Houd langer vast, bijvoorbeeld 5 tot 10 seconden per herhaling.',
  },

  'Thruster met dumbbells': {
    kernpunten: [
      { punt: 'Romp rechtop', uitleg: 'Houd je borst omhoog in de squat. Zo blijven de dumbbells boven je schouders en niet voor je.' },
      { punt: 'Knieën in lijn met je tenen', uitleg: 'Duw je knieën licht naar buiten bij het zakken. Niet naar binnen laten vallen.' },
      { punt: 'Druk vanuit je benen door', uitleg: 'De kracht uit je benen loopt door in de druk boven je hoofd. Een vloeiende beweging, geen twee losse.' },
      { punt: 'Bovenin ribben laag', uitleg: 'Armen gestrekt naast je oren zonder dat je rug hol trekt. Buik blijft aangespannen.' },
    ],
    opstelling: [
      'Kies lichte dumbbells. Houd ze op je schouders met je handpalmen naar elkaar toe en ellebogen iets naar voren.',
      'Voeten op schouderbreedte, tenen licht naar buiten.',
    ],
    stappen: [
      'Zak in een squat tot je bovenbenen ongeveer horizontaal zijn, borst omhoog.',
      'Kom krachtig omhoog en druk de dumbbells in dezelfde beweging boven je hoofd.',
      'Breng de dumbbells gecontroleerd terug naar je schouders en zak direct in de volgende squat.',
    ],
    fouten: [
      { fout: 'Voorover vallen in de squat', beter: 'Houd je ellebogen hoog en je borst open. Ga minder diep als je romp naar voren kantelt.' },
      { fout: 'Holle rug bij het drukken', beter: 'Span je buik en billen aan bovenin. Je armen gaan omhoog, je ribben blijven laag.' },
      { fout: 'Dumbbells vallen op je schouders', beter: 'Laat ze rustig zakken en vang ze op met je armen voordat je weer in de squat gaat.' },
    ],
    ademhaling: 'Adem in tijdens het zakken, adem uit als je omhoog komt en drukt.',
    tempo: '2 tellen omlaag, explosief omhoog en doordrukken.',
    makkelijker: 'Doe de squat en de schouderpress los na elkaar, of gebruik maar een dumbbell met twee handen.',
    zwaarder: 'Gebruik zwaardere dumbbells of een barbell, of doe het in een vaste tijd.',
  },

  'Turkish get-up': {
    kernpunten: [
      { punt: 'Kijk naar de bel', uitleg: 'Je ogen volgen de bel tot je staat. Zo weet je altijd waar het gewicht is en blijft je arm boven je.' },
      { punt: 'Arm gestrekt, pols recht', uitleg: 'Je arm staat als een paal boven je schouder. De pols buigt niet door en je elleboog blijft gestrekt.' },
      { punt: 'Schouder in de kom', uitleg: 'Trek je schouder licht omlaag en naar achteren. Een stevige schouder draagt de bel veilig.' },
      { punt: 'Stap voor stap, geen haast', uitleg: 'Elke stap is een vaste houding. Kom eerst stil in die stand voordat je naar de volgende gaat.' },
    ],
    opstelling: [
      'Leer de stappen eerst zonder gewicht of met een schoen op je vuist. Lig op je rug, de bel in je rechterhand gestrekt boven je borst.',
      'Zet je rechtervoet plat met de knie gebogen, linkerarm en linkerbeen schuin naast je op de grond.',
    ],
    stappen: [
      'Rol op je linker elleboog en duw daarna door naar je linkerhand.',
      'Til je heupen op en zwaai je linkerbeen onder je door naar een knielende houding.',
      'Kom rechtop op je knie en sta op met een lunge, bel steeds gestrekt boven je.',
      'Ga dezelfde weg terug tot je weer op je rug ligt en wissel van kant.',
    ],
    fouten: [
      { fout: 'Arm buigt of zakt weg', beter: 'Houd je elleboog gestrekt en de bel boven je schouder. Lukt dat niet, neem dan een lichter gewicht.' },
      { fout: 'Stappen in een keer doorrennen', beter: 'Stop kort in elke houding. Het stilstaan tussen de stappen is juist de training.' },
      { fout: 'Ogen van de bel af', beter: 'Blijf naar de bel kijken tot je rechtop staat. Pas dan mag je blik naar voren.' },
    ],
    ademhaling: 'Adem rustig door en adem uit bij elke overgang naar de volgende stap.',
    tempo: 'Langzaam en gecontroleerd, kort stilstaan in elke tussenhouding.',
    makkelijker: 'Oefen alleen het eerste deel, tot aan zitten op je hand, en ga dan weer terug.',
    zwaarder: 'Kies een zwaardere bel als je elke stap met een gestrekte arm en stille schouder haalt.',
  },

  'Zijwaarts stappen met elastiek': {
    kernpunten: [
      { punt: 'Knieën naar buiten', uitleg: 'Duw je knieën tegen het elastiek in. Ze mogen niet naar binnen vallen, ook niet bij het bijtrekken.' },
      { punt: 'Elastiek blijft gespannen', uitleg: 'Zet je volgende voet nooit zo dicht bij dat het elastiek slap hangt. De spanning houdt je bil aan het werk.' },
      { punt: 'Laag en stil blijven', uitleg: 'Je blijft in dezelfde lichte squat. Niet op en neer wippen en niet heen en weer wiegen.' },
      { punt: 'Tenen naar voren', uitleg: 'Je voeten wijzen recht vooruit. Draaien je tenen naar buiten, dan doen andere spieren het werk.' },
    ],
    opstelling: [
      'Zet een elastiek om je benen net boven je knieën.',
      'Sta met je voeten op heupbreedte, zak een klein stukje door je knieën en duw je heupen iets naar achteren.',
    ],
    stappen: [
      'Stap met je linkervoet zijwaarts, ongeveer een schouderbreedte.',
      'Trek je rechtervoet rustig bij tot heupbreedte, met spanning op het elastiek.',
      'Herhaal een vast aantal stappen en loop dan dezelfde weg terug.',
    ],
    fouten: [
      { fout: 'Knieën vallen naar binnen', beter: 'Duw je knieën actief naar buiten en maak kleinere stappen tot dat lukt.' },
      { fout: 'Romp wiegt mee bij elke stap', beter: 'Houd je bovenlichaam stil en je buik aangespannen. Alleen je benen bewegen.' },
      { fout: 'Rechtop gaan staan', beter: 'Blijf in je lichte squat zitten. Rechtop staan haalt het werk weg uit je billen.' },
    ],
    ademhaling: 'Adem rustig en gelijkmatig door tijdens het stappen.',
    tempo: 'Rustige, gecontroleerde stappen, elke stap even neerzetten.',
    makkelijker: 'Gebruik een lichter elastiek of schuif het hoger op je bovenbenen.',
    zwaarder: 'Zet het elastiek om je enkels of voeten, of zak dieper in de squat.',
  },
}
