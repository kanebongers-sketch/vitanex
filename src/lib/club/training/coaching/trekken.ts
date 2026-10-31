import type { CoachingBoek } from './typen'

// Trekoefeningen: rug (roeien en verticaal trekken) en biceps
export const COACHING_TREKKEN: CoachingBoek = {
  'Assisted pull-up': {
    kernpunten: [
      { punt: 'Eerst schouders omlaag', uitleg: 'Trek je schouders weg van je oren voordat je armen buigen. Zo start je vanuit je rug en niet vanuit je nek.' },
      { punt: 'Ellebogen naar je zij', uitleg: 'Denk aan je ellebogen naar je broekzakken trekken. Je voelt het dan breed onder je oksels.' },
      { punt: 'Borst naar de stang', uitleg: 'Breng je borst richting de stang in plaats van je kin eroverheen te strekken. Je nek blijft lang.' },
      { punt: 'Rustig helemaal uithangen', uitleg: 'Zak in 2 tot 3 tellen tot je armen gestrekt zijn. Het platform mag je niet omhoog laten stuiteren.' },
    ],
    opstelling: [
      'Kies het tegengewicht: meer kilo betekent meer hulp. Begin zo dat je 8 tot 12 nette herhalingen haalt.',
      'Pak de grepen iets breder dan schouderbreedte met je handpalmen van je af en zet knieen of voeten stevig op het platform.',
    ],
    stappen: [
      'Hang met gestrekte armen en zet je schouders laag.',
      'Trek je ellebogen omlaag en naar achteren tot je kin boven de grepen is.',
      'Zak gecontroleerd terug tot je armen weer gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Kin vooruit steken om boven te komen', beter: 'Hoofd neutraal en borst omhoog. Haal je de stang niet, neem dan meer tegengewicht.' },
      { fout: 'Halve herhalingen, nooit helemaal gestrekt', beter: 'Ga elke keer terug tot gestrekte armen, dan train je je rug over de hele lengte.' },
      { fout: 'Schouders schieten omhoog onderin', beter: 'Blijf actief hangen: schouders net weg van je oren houden, ook als je gestrekt bent.' },
    ],
    ademhaling: 'Adem uit terwijl je omhoog trekt en adem in tijdens het zakken.',
    tempo: '1 tel omhoog, kort stil, 2 tot 3 tellen omlaag.',
    makkelijker: 'Neem meer tegengewicht, of begin met de lat pulldown om de beweging te leren.',
    zwaarder: 'Bouw het tegengewicht per week iets af tot je de gewone pull-up haalt.',
  },

  'Barbell curl': {
    kernpunten: [
      { punt: 'Ellebogen naast je lijf', uitleg: 'Je ellebogen blijven op dezelfde plek. Alleen je onderarmen bewegen, dan doen je biceps het werk.' },
      { punt: 'Niet zwaaien', uitleg: 'Heupen en rug blijven stil. Zwaai je mee, dan is het gewicht te zwaar en neemt je onderrug het over.' },
      { punt: 'Pols in het verlengde', uitleg: 'Houd je polsen recht, niet naar je toe gekruld en niet naar achteren geknikt.' },
      { punt: 'Rustig zakken', uitleg: 'Laat de stang in 2 tot 3 tellen zakken. Die weg naar beneden is minstens zo belangrijk als omhoog.' },
    ],
    opstelling: [
      'Sta rechtop met je voeten op heupbreedte en je knieen ontspannen.',
      'Pak de stang op schouderbreedte met je handpalmen naar voren. Buik licht aangespannen, schouders laag.',
    ],
    stappen: [
      'Begin met de stang tegen je bovenbenen en je armen bijna gestrekt.',
      'Krul de stang naar je borst zonder dat je ellebogen naar voren komen.',
      'Knijp kort aan en laat de stang gecontroleerd zakken tot je armen bijna gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Achterover leunen om de stang op te zwiepen', beter: 'Neem minder gewicht en zet je billen en buik vast. Je bovenlichaam staat stil.' },
      { fout: 'Ellebogen schuiven naar voren bovenin', beter: 'Stop bovenin voordat je ellebogen naar voren schuiven. Dan blijft de spanning op je biceps.' },
      { fout: 'Stang valt omlaag', beter: 'Rem de stang af. Laat hem niet in je armen vallen, dat belast je ellebogen.' },
    ],
    ademhaling: 'Adem uit tijdens het omhoog krullen en adem in als de stang zakt.',
    tempo: '1 tel omhoog, kort stil, 2 tot 3 tellen omlaag.',
    makkelijker: 'Gebruik een EZ-stang of dumbbells, dat is vaak prettiger voor je polsen.',
    zwaarder: 'Laat de stang in 4 tellen zakken of houd halverwege 2 tellen stil.',
  },

  'Barbell row': {
    kernpunten: [
      { punt: 'Rug recht, buik vast', uitleg: 'Je onderrug blijft neutraal van stuit tot nek. Zet je buik vast alsof je een stoot opvangt.' },
      { punt: 'Buig vanuit je heupen', uitleg: 'Duw je billen naar achteren tot je romp schuin staat. Je voelt rek achter in je bovenbenen.' },
      { punt: 'Trek naar je navel', uitleg: 'De stang gaat naar je onderste ribben of navel. Ellebogen gaan schuin naar achteren langs je lichaam.' },
      { punt: 'Romp blijft stil', uitleg: 'Je romp blijft op dezelfde hoek staan. Kom je omhoog om het gewicht te halen, dan is het te zwaar.' },
    ],
    opstelling: [
      'Sta met je voeten op heupbreedte en pak de stang net buiten je benen met je handpalmen naar je toe.',
      'Knieen licht gebogen, heupen naar achteren tot je romp ongeveer 45 graden of lager staat.',
    ],
    stappen: [
      'Laat de stang hangen met gestrekte armen onder je schouders.',
      'Trek de stang naar je navel en breng je schouderbladen naar elkaar.',
      'Laat de stang gecontroleerd zakken tot je armen weer gestrekt zijn, zonder je rug te bewegen.',
    ],
    fouten: [
      { fout: 'Onderrug wordt bol', beter: 'Neem minder gewicht, borst iets naar voren en buik vast. Blijft je rug niet recht, kies dan de row met borststeun.' },
      { fout: 'Stang ver voor je lichaam', beter: 'Houd de stang dicht langs je benen en trek hem naar je navel. Ver voor je lichaam trekt hij aan je onderrug.' },
      { fout: 'Rukken met de hele romp', beter: 'Elke herhaling begint stil. Trek met je ellebogen, niet met een zwiep vanuit je heupen.' },
    ],
    ademhaling: 'Adem in en zet je buik vast voor je trekt, adem uit als de stang bij je buik is.',
    tempo: '1 tel omhoog, kort stil, 2 tellen omlaag.',
    makkelijker: 'Doe de row op een schuine bank, dan draagt de bank je romp.',
    zwaarder: 'Houd bovenin 2 tellen vast met je schouderbladen samen.',
  },

  'Barbell row met onderhandse greep': {
    kernpunten: [
      { punt: 'Rug recht en stil', uitleg: 'Je romp blijft schuin en stil staan. Je onderrug houdt zijn natuurlijke holling.' },
      { punt: 'Ellebogen langs je lijf', uitleg: 'Met de onderhandse greep schuren je ellebogen bijna langs je zij. Zo werk je onderin je brede rugspier.' },
      { punt: 'Trek naar je buik', uitleg: 'De stang komt laag, bij je navel of iets eronder. Hoger trekken maakt het een schouderoefening.' },
      { punt: 'Begin licht', uitleg: 'Je biceps werken flink mee en de greep vraagt meer van je ellebogen. Bouw het gewicht rustig op.' },
    ],
    opstelling: [
      'Pak de stang op schouderbreedte met je handpalmen naar voren, van je af gekeerd.',
      'Knieen licht gebogen, heupen naar achteren en romp schuin voorover met een rechte rug.',
    ],
    stappen: [
      'Laat de stang hangen met gestrekte armen.',
      'Trek je ellebogen langs je zij naar achteren tot de stang je buik raakt.',
      'Laat de stang rustig zakken tot je armen gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Omhoog komen om het gewicht te halen', beter: 'Blijf op dezelfde hoek. Lukt dat niet, haal er gewicht af.' },
      { fout: 'Curlen in plaats van roeien', beter: 'Je polsen blijven recht en je ellebogen leiden. Denk aan je ellebogen naar je heupen.' },
      { fout: 'Onderrug wordt rond', beter: 'Borst iets naar voren, buik vast. Blijft je rug niet recht, neem dan minder gewicht of de row met borststeun.' },
    ],
    ademhaling: 'Adem in en zet je buik vast, adem uit terwijl je de stang naar je buik trekt.',
    tempo: '1 tel omhoog, kort stil, 2 tellen omlaag.',
    makkelijker: 'Doe de row op een schuine bank met dumbbells, dan draagt de bank je romp.',
    zwaarder: 'Laat de stang in 3 tot 4 tellen zakken.',
  },

  'Biceps curl met elastiek': {
    kernpunten: [
      { punt: 'Ellebogen naast je lijf', uitleg: 'Je ellebogen blijven tegen je zij. Komen ze naar voren, dan helpt je schouder mee.' },
      { punt: 'Helemaal omhoog krullen', uitleg: 'Het elastiek is bovenin het zwaarst. Ga door tot je hand bij je schouder is en knijp kort aan.' },
      { punt: 'Rustig terug', uitleg: 'Laat het elastiek je arm niet terugtrekken. Jij bepaalt het tempo, ook naar beneden.' },
    ],
    opstelling: [
      'Controleer het elastiek op scheurtjes en ga er met beide voeten midden op staan, op heupbreedte.',
      'Pak de uiteinden met je handpalmen naar voren. Korter vastpakken maakt het zwaarder.',
    ],
    stappen: [
      'Begin met je armen bijna gestrekt naast je lichaam.',
      'Krul een hand naar je schouder zonder dat je elleboog naar voren komt.',
      'Laat rustig terug en wissel van arm.',
    ],
    fouten: [
      { fout: 'Elastiek schiet terug', beter: 'Rem de weg naar beneden af in 2 tellen. Zo blijft er spanning op je biceps.' },
      { fout: 'Polsen knikken naar achteren', beter: 'Houd je pols recht in het verlengde van je onderarm.' },
      { fout: 'Achterover leunen', beter: 'Sta rechtop met je buik licht vast. Is het te zwaar, pak het elastiek dan langer vast.' },
    ],
    ademhaling: 'Adem uit als je omhoog krult en adem in als je terug laat zakken.',
    tempo: '1 tel omhoog, kort stil, 2 tellen omlaag.',
    makkelijker: 'Pak het elastiek langer vast of neem een lichter elastiek.',
    zwaarder: 'Pak korter vast, neem een zwaarder elastiek of krul beide armen tegelijk.',
  },

  'Chin-up': {
    kernpunten: [
      { punt: 'Start vanuit stil hangen', uitleg: 'Elke herhaling begint zonder zwaai. Zo trekken je rug en biceps, niet je momentum.' },
      { punt: 'Schouders weg van je oren', uitleg: 'Zet je schouders eerst laag. Je nek blijft lang en ontspannen tijdens het optrekken.' },
      { punt: 'Borst naar de stang', uitleg: 'Trek je borst omhoog richting de stang tot je kin erboven is.' },
      { punt: 'Gecontroleerd zakken', uitleg: 'Laat je in 2 tot 3 tellen zakken tot gestrekte armen. Niet laten vallen, dat belast je ellebogen.' },
    ],
    opstelling: [
      'Pak de stang op schouderbreedte met je handpalmen naar je toe.',
      'Hang met gestrekte armen, benen stil en licht gekruist of gestrekt, buik aangespannen.',
    ],
    stappen: [
      'Trek je schouders omlaag vanuit stil hangen.',
      'Trek je ellebogen naar je zij tot je kin boven de stang is.',
      'Zak rustig terug tot je armen gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Meezwaaien met de benen', beter: 'Buik vast en benen stil. Liever minder herhalingen dan meezwaaien.' },
      { fout: 'Alleen het bovenste stuk', beter: 'Ga elke keer terug tot gestrekte armen. Halve herhalingen tellen niet.' },
      { fout: 'Kin over de stang reiken', beter: 'Hoofd neutraal. Kom je er niet, neem dan de assisted variant.' },
    ],
    ademhaling: 'Adem uit tijdens het optrekken en adem in terwijl je zakt.',
    tempo: '1 tel omhoog, kort stil, 2 tot 3 tellen omlaag.',
    makkelijker: 'Gebruik de assisted pull-up machine met dezelfde greep, of doe alleen het zakken vanuit boven.',
    zwaarder: 'Houd bovenin 2 tellen vast of doe ze met een gewichtsvest.',
  },

  'Concentratiecurl': {
    kernpunten: [
      { punt: 'Elleboog tegen je been', uitleg: 'Je bovenarm leunt tegen de binnenkant van je bovenbeen. Zo kun je niet valsspelen met je schouder.' },
      { punt: 'Helemaal uitstrekken', uitleg: 'Laat je arm onderin bijna gestrekt hangen. Je pakt dan de hele lengte van je biceps mee.' },
      { punt: 'Bovenin aanknijpen', uitleg: 'Draai je pink iets omhoog en knijp een tel aan. Je voelt je biceps volledig samentrekken.' },
    ],
    opstelling: [
      'Zit op het einde van een bank met je voeten breed en plat op de grond.',
      'Leun iets voorover en zet je elleboog tegen de binnenkant van je bovenbeen, de dumbbell hangt tussen je benen.',
    ],
    stappen: [
      'Begin met je arm bijna gestrekt en je handpalm naar voren.',
      'Krul de dumbbell naar je schouder zonder dat je bovenarm beweegt.',
      'Knijp kort aan en laat de dumbbell langzaam zakken.',
    ],
    fouten: [
      { fout: 'Elleboog los van je been', beter: 'Houd je bovenarm tegen je been gedrukt, dan blijft je schouder buiten spel.' },
      { fout: 'Romp mee omhoog bewegen', beter: 'Je romp blijft stil. Alleen je onderarm beweegt.' },
      { fout: 'Te snel naar beneden', beter: 'Neem 3 tellen voor het zakken. Licht gewicht en volle controle werkt hier het best.' },
    ],
    ademhaling: 'Adem uit als je krult en adem in als de dumbbell zakt.',
    tempo: '1 tel omhoog, 1 tel stil, 3 tellen omlaag.',
    zwaarder: 'Houd bovenin 2 tellen vast of doe na de laatste herhaling nog een paar halve onderin.',
  },

  'Curl aan de kabel': {
    kernpunten: [
      { punt: 'Ellebogen naast je lijf', uitleg: 'Je ellebogen blijven tegen je zij. Komen ze naar voren, dan neemt je schouder het over.' },
      { punt: 'Een stap van de kabel', uitleg: 'Sta net zo ver dat het gewicht onderin al los van de stapel is. Dan blijft de spanning er de hele tijd op.' },
      { punt: 'Gecontroleerd terug', uitleg: 'Laat de kabel je armen niet terugtrekken. Rem af tot je armen bijna gestrekt zijn.' },
    ],
    opstelling: [
      'Zet de katrol helemaal laag en hang er een rechte stang, EZ-stang of touw aan.',
      'Sta rechtop met je voeten op heupbreedte, een kleine stap van het toestel, en pak de greep met je handpalmen naar voren.',
    ],
    stappen: [
      'Begin met je armen bijna gestrekt en de greep voor je bovenbenen.',
      'Krul de greep naar je borst zonder je ellebogen te verplaatsen.',
      'Knijp kort aan en laat rustig terug.',
    ],
    fouten: [
      { fout: 'Leunen naar achteren', beter: 'Sta rechtop met je buik vast. Leun je, dan is het gewicht te zwaar.' },
      { fout: 'Gewicht tikt onderin op de stapel', beter: 'Stop net voordat de plaatjes elkaar raken. Zo houd je spanning.' },
      { fout: 'Polsen krullen mee', beter: 'Houd je pols recht. Je biceps doen het werk, niet je onderarmen.' },
    ],
    ademhaling: 'Adem uit tijdens het krullen en adem in als je de greep laat zakken.',
    tempo: '1 tel omhoog, kort stil, 2 tot 3 tellen omlaag.',
    makkelijker: 'Gebruik het touw met je duimen omhoog, dat is vaak prettiger voor je polsen.',
    zwaarder: 'Doe hem met een arm tegelijk en een handgreep, of houd bovenin 2 tellen vast.',
  },

  'Curl met EZ-stang': {
    kernpunten: [
      { punt: 'Pak de schuine grepen', uitleg: 'Je handen staan iets naar binnen gedraaid. Dat is vaak prettiger voor je polsen en ellebogen.' },
      { punt: 'Ellebogen naast je lijf', uitleg: 'Je bovenarmen blijven stil langs je romp. Alleen je onderarmen bewegen.' },
      { punt: 'Niet zwaaien', uitleg: 'Heupen en rug staan stil. Zwaai je mee, dan neem je te veel gewicht.' },
      { punt: 'Rustig zakken', uitleg: 'Laat de stang in 2 tot 3 tellen terugkomen tot je armen bijna gestrekt zijn.' },
    ],
    opstelling: [
      'Sta rechtop met je voeten op heupbreedte en je knieen ontspannen.',
      'Pak de EZ-stang op de binnenste of buitenste schuine handgrepen, handpalmen naar voren, schouders laag.',
    ],
    stappen: [
      'Begin met de stang voor je bovenbenen.',
      'Krul de stang naar je borst zonder dat je ellebogen naar voren komen.',
      'Laat de stang gecontroleerd zakken tot je armen bijna gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Heupen duwen de stang omhoog', beter: 'Billen en buik vast. Elke herhaling begint stil onderin.' },
      { fout: 'Ellebogen komen ver naar voren', beter: 'Stop bovenin voordat je ellebogen gaan schuiven. Dan blijft de spanning op je biceps.' },
      { fout: 'Onderin niet uitstrekken', beter: 'Ga terug tot je armen bijna gestrekt zijn, anders train je maar een half stuk.' },
    ],
    ademhaling: 'Adem uit als je omhoog krult en adem in als de stang zakt.',
    tempo: '1 tel omhoog, kort stil, 2 tot 3 tellen omlaag.',
    zwaarder: 'Laat de stang in 4 tellen zakken of houd halverwege 2 tellen stil.',
  },

  'Curl op een schuine bank': {
    kernpunten: [
      { punt: 'Armen achter je lijf', uitleg: 'Je bovenarmen hangen recht naar beneden, iets achter je romp. Daardoor staat je biceps extra op rek.' },
      { punt: 'Bovenarm blijft stil', uitleg: 'Alleen je onderarm beweegt. Komt je elleboog naar voren, dan helpt je schouder mee.' },
      { punt: 'Licht gewicht', uitleg: 'De rek onderin is stevig. Kies een gewicht waarmee je die rek rustig kunt afremmen.' },
      { punt: 'Schouders tegen de bank', uitleg: 'Je rug en schouders blijven tegen het kussen. Zo blijft je borst open en je schouder rustig.' },
    ],
    opstelling: [
      'Zet de rugleuning op ongeveer 45 tot 60 graden en ga zitten met je rug en hoofd tegen de bank.',
      'Laat je armen met een dumbbell in elke hand recht naar beneden hangen, handpalmen naar voren.',
    ],
    stappen: [
      'Begin met je armen gestrekt naast de bank.',
      'Krul beide dumbbells tegelijk naar je schouders terwijl je bovenarmen stil blijven hangen.',
      'Laat ze langzaam zakken tot je armen weer gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Elleboog schuift naar voren', beter: 'Houd je bovenarm verticaal. Stop bovenin net voordat je elleboog gaat bewegen.' },
      { fout: 'Onderin laten vallen', beter: 'Rem de laatste centimeters af. Juist daar is je elleboog kwetsbaar.' },
      { fout: 'Schouders komen van de bank', beter: 'Leg je achterhoofd en schouders tegen de bank en houd je borst open.' },
    ],
    ademhaling: 'Adem uit tijdens het krullen en adem in terwijl de dumbbell zakt.',
    tempo: '1 tel omhoog, kort stil, 3 tellen omlaag.',
    makkelijker: 'Zet de bank rechter, dan is de rek onderin minder groot.',
    zwaarder: 'Houd bovenin 2 tellen vast of laat de dumbbells in 4 tellen zakken.',
  },

  'Dumbbell curl': {
    kernpunten: [
      { punt: 'Ellebogen naast je lijf', uitleg: 'Je ellebogen blijven op dezelfde plek tegen je zij. Dan doen je biceps het werk.' },
      { punt: 'Draai je pink omhoog', uitleg: 'Houd je handpalm naar boven en draai bovenin je pink iets op. Je voelt je biceps dan helemaal aanspannen.' },
      { punt: 'Niet zwaaien met je rug', uitleg: 'Je romp staat stil. Moet je zwaaien, dan is het gewicht te zwaar.' },
      { punt: 'Langzaam zakken', uitleg: 'Neem 2 tot 3 tellen om de dumbbell terug te laten zakken tot je arm bijna gestrekt is.' },
    ],
    opstelling: [
      'Sta rechtop met je voeten op heupbreedte, knieen ontspannen en buik licht vast.',
      'Houd een dumbbell in elke hand naast je lichaam met je handpalmen naar voren.',
    ],
    stappen: [
      'Begin met je armen bijna gestrekt naast je lichaam.',
      'Krul de dumbbells naar je schouders, tegelijk of om en om.',
      'Knijp kort aan en laat ze gecontroleerd zakken.',
    ],
    fouten: [
      { fout: 'Zwaaien met romp en heupen', beter: 'Sta stil met je buik vast. Kies een gewicht waarmee je 8 tot 12 nette herhalingen haalt.' },
      { fout: 'Ellebogen naar voren en omhoog', beter: 'Houd je ellebogen bij je zij. Bovenin stop je als je onderarm verticaal staat.' },
      { fout: 'Pols knikt naar achteren', beter: 'Houd je pols recht in het verlengde van je onderarm.' },
    ],
    ademhaling: 'Adem uit als je omhoog krult en adem in als je laat zakken.',
    tempo: '1 tel omhoog, kort stil, 2 tot 3 tellen omlaag.',
    makkelijker: 'Ga zitten op een bank met rugleuning, dan is zwaaien lastiger.',
    zwaarder: 'Laat de dumbbells in 4 tellen zakken of houd halverwege 2 tellen stil.',
  },

  'Eenarmige dumbbell row': {
    kernpunten: [
      { punt: 'Rug plat als een tafel', uitleg: 'Je rug ligt vlak en stil van heup tot nek. Leg er in gedachten een glas water op.' },
      { punt: 'Trek naar je heup', uitleg: 'De dumbbell gaat in een kleine boog naar je heupbot, niet recht naar je oksel. Zo werk je je brede rugspier.' },
      { punt: 'Romp niet opendraaien', uitleg: 'Je schouders blijven evenwijdig aan de bank. Draai je open, dan is het gewicht te zwaar.' },
      { punt: 'Onderin laten rekken', uitleg: 'Laat je schouderblad onderin iets naar voren zakken. Je voelt dan rek in je rug.' },
    ],
    opstelling: [
      'Zet je linkerknie en linkerhand op de bank, je rechtervoet staat ernaast op de grond.',
      'Je steunhand staat onder je schouder, rug vlak, nek in het verlengde van je rug. Pak de dumbbell met je rechterhand.',
    ],
    stappen: [
      'Laat de dumbbell met een gestrekte arm onder je schouder hangen.',
      'Trek je elleboog langs je zij omhoog tot de dumbbell bij je heup is.',
      'Laat hem gecontroleerd zakken en doe daarna de andere kant.',
    ],
    fouten: [
      { fout: 'Romp draait open bij elke herhaling', beter: 'Houd je borst naar de bank gericht en neem minder gewicht.' },
      { fout: 'Hoofd omhoog naar de spiegel', beter: 'Kijk schuin naar de grond voor je. Je nek blijft in het verlengde van je rug.' },
      { fout: 'Schouder trekt naar je oor', beter: 'Trek met je elleboog naar je heup, niet omhoog naar je oor.' },
    ],
    ademhaling: 'Adem uit terwijl je de dumbbell omhoog trekt en adem in als hij zakt.',
    tempo: '1 tel omhoog, kort stil, 2 tellen omlaag.',
    makkelijker: 'Neem een lichtere dumbbell en houd bovenin een tel stil om de beweging te voelen.',
    zwaarder: 'Laat de dumbbell in 3 tot 4 tellen zakken of houd bovenin 2 tellen vast.',
  },

  'Hammer curl': {
    kernpunten: [
      { punt: 'Duimen omhoog', uitleg: 'Je handpalmen kijken naar elkaar, de hele herhaling. Zo train je ook je onderarm.' },
      { punt: 'Ellebogen naast je lijf', uitleg: 'Je ellebogen blijven op hun plek tegen je zij. Alleen je onderarm beweegt.' },
      { punt: 'Schouders stil', uitleg: 'Je schouders blijven laag en ontspannen. Trekken ze op, dan neem je te zwaar.' },
      { punt: 'Rustig naar beneden', uitleg: 'Neem 2 tot 3 tellen om te zakken. Hier valt vaak de meeste winst.' },
    ],
    opstelling: [
      'Sta rechtop met je voeten op heupbreedte en een dumbbell in elke hand naast je bovenbenen.',
      'Je duimen wijzen naar voren en je handpalmen naar je lichaam.',
    ],
    stappen: [
      'Begin met je armen bijna gestrekt naast je lichaam.',
      'Krul de dumbbell met je duim voorop naar je schouder.',
      'Laat hem rustig zakken, om en om of beide tegelijk.',
    ],
    fouten: [
      { fout: 'Dumbbell draait naar binnen', beter: 'Houd je duim de hele tijd omhoog, ook bovenin.' },
      { fout: 'Zwaaien vanuit je rug', beter: 'Buik vast en stil staan. Liever een lichter gewicht en nette herhalingen.' },
      { fout: 'Dumbbell over je borst naar binnen', beter: 'Krul recht naar voren omhoog naar dezelfde schouder.' },
    ],
    ademhaling: 'Adem uit als je omhoog krult en adem in als je laat zakken.',
    tempo: '1 tel omhoog, kort stil, 3 tellen omlaag.',
    makkelijker: 'Doe hem zittend op een bank met rugleuning.',
    zwaarder: 'Krul beide armen tegelijk en houd halverwege 2 tellen stil.',
  },

  'Inverted row': {
    kernpunten: [
      { punt: 'Lichaam als een plank', uitleg: 'Van hielen tot hoofd een rechte lijn. Billen en buik vast, je heupen zakken niet door.' },
      { punt: 'Borst naar de stang', uitleg: 'Je borst gaat naar de stang, niet je kin. Zo blijft je nek ontspannen.' },
      { punt: 'Schouderbladen samen', uitleg: 'Knijp bovenin je schouderbladen naar elkaar toe. Je voelt het tussen je schouders.' },
      { punt: 'Gecontroleerd zakken', uitleg: 'Zak in 2 tellen terug tot je armen gestrekt zijn. Niet laten vallen.' },
    ],
    opstelling: [
      'Zet een stang in het rek of de Smith machine op ongeveer heuphoogte.',
      'Hang eronder met je handen iets breder dan schouderbreedte, handpalmen van je af, hielen op de grond en lichaam recht.',
    ],
    stappen: [
      'Hang met gestrekte armen en een gestrekt lichaam onder de stang.',
      'Trek je borst naar de stang en breng je schouderbladen samen.',
      'Zak rustig terug tot je armen gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Heupen hangen door', beter: 'Span je billen aan en houd je buik vast. Je lichaam beweegt als een geheel.' },
      { fout: 'Kin naar voren steken', beter: 'Hoofd in het verlengde van je lichaam en trek met je borst naar de stang.' },
      { fout: 'Schouders trekken naar je oren', beter: 'Houd je schouders laag en trek met je ellebogen naar achteren.' },
    ],
    ademhaling: 'Adem uit terwijl je jezelf omhoog trekt en adem in tijdens het zakken.',
    tempo: '1 tel omhoog, kort stil, 2 tellen omlaag.',
    makkelijker: 'Zet de stang hoger of buig je knieen met je voeten plat, dan sta je rechter en is het lichter.',
    zwaarder: 'Zet de stang lager of leg je voeten op een bank.',
  },

  'Lat pulldown': {
    kernpunten: [
      { punt: 'Borst omhoog', uitleg: 'Zit rechtop met je borst naar de stang. Zo trek je met je rug en niet met je armen.' },
      { punt: 'Ellebogen naar beneden', uitleg: 'Denk aan je ellebogen naar je broekzakken trekken. Je handen zijn alleen haken.' },
      { punt: 'Naar je bovenste borst', uitleg: 'De stang komt voor je gezicht langs tot net onder je sleutelbeenderen. Je borst gaat er iets naar toe.' },
      { punt: 'Rustig terug omhoog', uitleg: 'Laat de stang gecontroleerd terug tot je armen gestrekt zijn en je rek voelt onder je oksels.' },
    ],
    opstelling: [
      'Zet het kussen zo dat je bovenbenen er stevig onder klemmen en je voeten plat op de grond staan.',
      'Pak de stang iets breder dan schouderbreedte met je handpalmen van je af en ga zitten met gestrekte armen.',
    ],
    stappen: [
      'Zet je schouders laag en leun hooguit een klein beetje achterover.',
      'Trek je ellebogen omlaag tot de stang bij je bovenste borst is.',
      'Laat de stang rustig omhoog tot je armen gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Ver achterover leunen en rukken', beter: 'Blijf bijna rechtop zitten. Moet je leunen om de stang te halen, dan is het gewicht te zwaar.' },
      { fout: 'Stang achter je hoofd trekken', beter: 'Trek altijd voor je gezicht langs naar je borst. Dat is veiliger voor je schouders.' },
      { fout: 'Schouders blijven bij je oren', beter: 'Begin elke herhaling met je schouders omlaag zetten, daarna pas je armen buigen.' },
    ],
    ademhaling: 'Adem uit terwijl je de stang omlaag trekt en adem in als hij terug omhoog gaat.',
    tempo: '1 tel omlaag, kort stil, 2 tot 3 tellen omhoog.',
    zwaarder: 'Houd de stang onderin 2 tellen vast of laat hem in 4 tellen terug omhoog.',
  },

  'Lat pulldown met onderhandse greep': {
    kernpunten: [
      { punt: 'Ellebogen dicht langs je lijf', uitleg: 'Met deze greep trek je je ellebogen recht omlaag langs je zij. Je voelt het onderin je brede rugspier.' },
      { punt: 'Borst omhoog', uitleg: 'Zit rechtop met je borst naar de stang. Je schouders blijven laag.' },
      { punt: 'Niet hangen of zwaaien', uitleg: 'Je romp blijft stil. Je biceps helpen veel mee, dus het gewicht mag niet je lichaam meetrekken.' },
      { punt: 'Gecontroleerd terug', uitleg: 'Laat de stang rustig omhoog tot je armen gestrekt zijn. Niet laten wegschieten.' },
    ],
    opstelling: [
      'Klem je bovenbenen onder het kussen met je voeten plat op de grond.',
      'Pak de stang op schouderbreedte met je handpalmen naar je toe.',
    ],
    stappen: [
      'Zit met gestrekte armen en zet je schouders laag.',
      'Trek de stang naar je bovenste borst met je ellebogen dicht langs je lichaam.',
      'Laat de stang gecontroleerd terug omhoog.',
    ],
    fouten: [
      { fout: 'Achterover vallen om de stang te halen', beter: 'Bijna rechtop blijven zitten. Neem minder gewicht als je moet leunen.' },
      { fout: 'Polsen krullen naar binnen', beter: 'Houd je polsen recht. Je trekt met je ellebogen, niet met een curl.' },
      { fout: 'Onderin de armen niet strekken', beter: 'Ga elke keer terug tot gestrekte armen, dan train je je rug over de hele lengte.' },
    ],
    ademhaling: 'Adem uit terwijl je omlaag trekt en adem in als de stang omhoog gaat.',
    tempo: '1 tel omlaag, kort stil, 2 tot 3 tellen omhoog.',
    zwaarder: 'Houd onderin 2 tellen vast met je borst naar de stang.',
  },

  'Lat pulldown met V-greep': {
    kernpunten: [
      { punt: 'Trek met je ellebogen', uitleg: 'Je handen houden alleen de greep vast. Je ellebogen gaan naar beneden en iets naar achteren.' },
      { punt: 'Klein beetje achterover', uitleg: 'Leun een klein beetje achterover, niet meer. De greep komt dan netjes naar je bovenste borst.' },
      { punt: 'Borst naar de greep', uitleg: 'Breng je borst iets omhoog naar de greep. Je schouderbladen gaan omlaag en naar elkaar.' },
      { punt: 'Rustig omhoog', uitleg: 'Laat de greep gecontroleerd terug tot je armen gestrekt zijn en je rek voelt in je rug.' },
    ],
    opstelling: [
      'Hang de V-greep aan de kabel en klem je bovenbenen onder het kussen.',
      'Pak de greep met je handpalmen naar elkaar en zit rechtop met gestrekte armen.',
    ],
    stappen: [
      'Zet je schouders laag en leun een klein beetje achterover.',
      'Trek de greep naar je bovenste borst met je ellebogen langs je lichaam.',
      'Laat de greep rustig terug omhoog tot je armen gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Te ver achterover, het wordt een row', beter: 'Blijf op dezelfde kleine hoek zitten. Je romp beweegt niet mee.' },
      { fout: 'Trekken met handen en onderarmen', beter: 'Denk aan je ellebogen naar je heupen. Je handen zijn alleen haken.' },
      { fout: 'Schouders rollen naar voren onderin', beter: 'Houd je borst open en schouders laag, ook als de greep bij je borst is.' },
    ],
    ademhaling: 'Adem uit terwijl je de greep omlaag trekt en adem in als hij omhoog gaat.',
    tempo: '1 tel omlaag, kort stil, 2 tot 3 tellen omhoog.',
    zwaarder: 'Laat de greep in 4 tellen terug omhoog.',
  },

  'Preacher curl machine': {
    kernpunten: [
      { punt: 'Bovenarmen plat op het kussen', uitleg: 'Je oksels liggen net tegen de rand van het kussen. Je bovenarmen blijven daar liggen.' },
      { punt: 'Onderin niet op slot', uitleg: 'Strek bijna helemaal uit, maar laat je ellebogen niet doorklikken. Daar is je elleboog kwetsbaar.' },
      { punt: 'Rustig tempo', uitleg: 'Geen ruk onderin en geen zwiep bovenin. Het toestel geeft de lijn, jij geeft de controle.' },
    ],
    opstelling: [
      'Stel de stoel zo in dat je bovenarmen plat op het kussen liggen en je oksels tegen de bovenrand zitten.',
      'Zorg dat je ellebogen in lijn zijn met het draaipunt van het toestel en pak de grepen.',
    ],
    stappen: [
      'Begin met je armen bijna gestrekt.',
      'Buig je ellebogen tot de grepen bij je schouders zijn en knijp kort aan.',
      'Laat de grepen rustig terug tot je armen bijna gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Stoel te hoog of te laag', beter: 'Stel hem zo in dat je ellebogen bij het draaipunt liggen. Dan loopt de beweging soepel.' },
      { fout: 'Billen van de stoel om te duwen', beter: 'Blijf zitten met je borst tegen het kussen. Neem minder gewicht.' },
      { fout: 'Onderin laten vallen', beter: 'Rem de laatste centimeters af en stop net voor gestrekt.' },
    ],
    ademhaling: 'Adem uit als je de grepen naar je toe krult en adem in als je terug laat gaan.',
    tempo: '1 tel omhoog, kort stil, 3 tellen omlaag.',
    zwaarder: 'Doe hem met een arm tegelijk of houd bovenin 2 tellen vast.',
  },

  'Preacher curl met barbell': {
    kernpunten: [
      { punt: 'Bovenarmen plat op het kussen', uitleg: 'Je oksels zitten tegen de bovenrand en je bovenarmen liggen helemaal op het kussen.' },
      { punt: 'Onderin niet op slot', uitleg: 'Stop net voordat je armen gestrekt zijn. Gestrekt met gewicht trekt hard aan je elleboog.' },
      { punt: 'Langzaam zakken', uitleg: 'Neem 3 tellen voor de weg naar beneden. Zo blijft je biceps in controle.' },
      { punt: 'Polsen recht', uitleg: 'Je polsen blijven in het verlengde van je onderarm. Niet krullen met je handen.' },
    ],
    opstelling: [
      'Stel de zitting zo in dat je bovenarmen plat op het kussen liggen en je oksels tegen de bovenrand komen.',
      'Pak de stang op schouderbreedte met je handpalmen naar boven. Een EZ-stang kan prettiger zijn voor je polsen.',
    ],
    stappen: [
      'Pak de stang uit de houder en begin met je armen bijna gestrekt op het kussen.',
      'Krul de stang omhoog tot je onderarmen bijna verticaal staan.',
      'Laat hem in 3 tellen zakken tot je armen bijna gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Stang valt de laatste centimeters', beter: 'Rem juist onderin extra af. Daar is je elleboog het kwetsbaarst.' },
      { fout: 'Romp komt los van het kussen', beter: 'Borst tegen het kussen houden. Til je jezelf mee, neem dan minder gewicht.' },
      { fout: 'Bovenin helemaal doorkrullen', beter: 'Stop als je onderarmen bijna verticaal staan. Verder haalt de spanning eraf.' },
    ],
    ademhaling: 'Adem uit als je de stang omhoog krult en adem in terwijl hij zakt.',
    tempo: '1 tel omhoog, kort stil, 3 tellen omlaag.',
    makkelijker: 'Gebruik een EZ-stang of de preacher curl machine.',
    zwaarder: 'Laat de stang in 4 tot 5 tellen zakken.',
  },

  'Pull-up': {
    kernpunten: [
      { punt: 'Start vanuit stil hangen', uitleg: 'Elke herhaling begint zonder zwaai. Zo trekt je rug het gewicht, niet je momentum.' },
      { punt: 'Eerst schouders omlaag', uitleg: 'Zet je schouders laag voordat je armen buigen. Je nek blijft lang en ontspannen.' },
      { punt: 'Ellebogen naar je zij', uitleg: 'Trek je ellebogen naar je ribben. Je voelt het breed onder je oksels.' },
      { punt: 'Rustig helemaal zakken', uitleg: 'Laat je in 2 tot 3 tellen zakken tot je armen gestrekt zijn.' },
    ],
    opstelling: [
      'Pak de stang iets breder dan schouderbreedte met je handpalmen van je af.',
      'Hang met gestrekte armen, buik en billen licht aangespannen, benen stil.',
    ],
    stappen: [
      'Trek je schouders omlaag vanuit stil hangen.',
      'Trek jezelf op tot je kin boven de stang is.',
      'Zak in 2 tot 3 tellen terug tot je armen gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Zwaaien en schoppen met de benen', beter: 'Buik vast en benen stil. Liever 3 nette herhalingen dan 8 met zwaai.' },
      { fout: 'Halverwege stoppen', beter: 'Ga elke keer terug tot gestrekte armen. Lukt dat niet, kies de assisted variant.' },
      { fout: 'Kin over de stang reiken', beter: 'Hoofd neutraal en borst naar de stang. Je nek blijft lang.' },
    ],
    ademhaling: 'Adem uit terwijl je optrekt en adem in terwijl je zakt.',
    tempo: '1 tel omhoog, kort stil, 2 tot 3 tellen omlaag.',
    makkelijker: 'Gebruik de assisted pull-up machine of een elastiek, of oefen alleen het zakken vanuit boven.',
    zwaarder: 'Houd bovenin 2 tellen vast of doe ze met een gewichtsvest.',
  },

  'Pull-up met neutrale greep': {
    kernpunten: [
      { punt: 'Handpalmen naar elkaar', uitleg: 'Je pakt de parallelle grepen vast. Dat is vaak prettiger voor schouders en ellebogen.' },
      { punt: 'Schouders laag', uitleg: 'Zet je schouders omlaag voordat je optrekt. Je nek blijft ontspannen.' },
      { punt: 'Borst naar je handen', uitleg: 'Trek je borst richting je handen tot je kin erboven is. Ellebogen gaan langs je zij.' },
      { punt: 'Geen zwaai', uitleg: 'Elke herhaling begint stil. Liever minder herhalingen dan meezwaaien.' },
    ],
    opstelling: [
      'Pak de parallelle handgrepen met je handpalmen naar elkaar.',
      'Hang met gestrekte armen, buik aangespannen en benen stil.',
    ],
    stappen: [
      'Trek je schouders omlaag vanuit stil hangen.',
      'Trek jezelf op tot je kin boven je handen komt.',
      'Zak rustig terug tot je armen gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Benen gebruiken om omhoog te komen', beter: 'Benen stil en buik vast. Lukt het niet netjes, gebruik dan een elastiek of de assisted machine.' },
      { fout: 'Onderin niet helemaal uithangen', beter: 'Ga terug tot gestrekte armen met je schouders net weg van je oren.' },
      { fout: 'Snel naar beneden vallen', beter: 'Neem 2 tot 3 tellen voor het zakken. Dat spaart je ellebogen en traint je rug.' },
    ],
    ademhaling: 'Adem uit terwijl je optrekt en adem in terwijl je zakt.',
    tempo: '1 tel omhoog, kort stil, 2 tot 3 tellen omlaag.',
    makkelijker: 'Gebruik een elastiek onder je knieen of voeten, of de assisted pull-up machine.',
    zwaarder: 'Houd bovenin 2 tellen vast of voeg gewicht toe met een vest.',
  },

  'Row met elastiek': {
    kernpunten: [
      { punt: 'Rechtop met borst open', uitleg: 'Zit of sta rechtop met je borst iets naar voren. Je rug blijft neutraal.' },
      { punt: 'Schouderbladen samen', uitleg: 'Knijp aan het einde je schouderbladen naar elkaar. Je voelt het tussen je schouders.' },
      { punt: 'Schouders laag', uitleg: 'Trek je ellebogen naar achteren, niet je schouders naar je oren.' },
      { punt: 'Langzaam terug', uitleg: 'Laat het elastiek niet wegschieten. Rem de weg terug af tot je armen gestrekt zijn.' },
    ],
    opstelling: [
      'Controleer het elastiek op scheurtjes en zet het stevig vast op borsthoogte, of leg het om je voeten als je zit.',
      'Pak de uiteinden met gestrekte armen en neem zoveel afstand dat er al lichte spanning op staat.',
    ],
    stappen: [
      'Begin met gestrekte armen en je schouders laag.',
      'Trek je ellebogen langs je zij naar achteren tot je handen bij je buik zijn.',
      'Knijp kort aan en laat langzaam terug.',
    ],
    fouten: [
      { fout: 'Achterover leunen om te trekken', beter: 'Romp stil houden. Is het te zwaar, ga dan dichter bij het vastzetpunt staan.' },
      { fout: 'Ellebogen wijd naar buiten', beter: 'Houd je ellebogen dicht langs je zij, dan werk je je rug in plaats van je schouders.' },
      { fout: 'Elastiek schiet terug', beter: 'Neem 2 tellen voor de weg terug.' },
    ],
    ademhaling: 'Adem uit terwijl je naar je toe trekt en adem in als je terug laat gaan.',
    tempo: '1 tel trekken, 1 tel stil, 2 tellen terug.',
    makkelijker: 'Ga dichter bij het vastzetpunt staan of neem een lichter elastiek.',
    zwaarder: 'Neem meer afstand of een zwaarder elastiek en houd 2 tellen vast.',
  },

  'Row op een schuine bank': {
    kernpunten: [
      { punt: 'Borst op de bank', uitleg: 'Je borst blijft de hele tijd tegen de bank. Zo heeft je onderrug rust en trekt alleen je rug.' },
      { punt: 'Ellebogen naast je romp', uitleg: 'Trek tot je ellebogen naast je lichaam zijn, niet ver erachter.' },
      { punt: 'Schouders weg van je oren', uitleg: 'Trek met je ellebogen naar achteren. Je schouders blijven laag.' },
      { punt: 'Onderin uithangen', uitleg: 'Laat je armen helemaal strekken en je schouderbladen iets uit elkaar gaan. Dan voel je rek in je rug.' },
    ],
    opstelling: [
      'Zet de rugleuning op ongeveer 30 tot 45 graden en lig met je borst erop.',
      'Zet je voeten stevig op de grond of tegen de voetsteun en laat een dumbbell in elke hand recht naar beneden hangen.',
    ],
    stappen: [
      'Laat de dumbbells hangen met gestrekte armen.',
      'Trek beide dumbbells omhoog tot je ellebogen naast je romp zijn en knijp je schouderbladen samen.',
      'Laat ze gecontroleerd zakken.',
    ],
    fouten: [
      { fout: 'Borst komt van de bank', beter: 'Houd contact met de bank. Kom je omhoog, dan is het gewicht te zwaar.' },
      { fout: 'Hoofd omhoog en nek in de knik', beter: 'Laat je hoofd in het verlengde van je rug, kijk naar de grond of laat je kin net over de rand.' },
      { fout: 'Schouders trekken op', beter: 'Denk aan je ellebogen naar je heupen, niet je handen naar je oksels.' },
    ],
    ademhaling: 'Adem uit terwijl je de dumbbells omhoog trekt en adem in als ze zakken.',
    tempo: '1 tel omhoog, 1 tel stil, 2 tellen omlaag.',
    zwaarder: 'Houd bovenin 2 tellen vast of roei om en om met een pauze bovenin.',
  },

  'Seated cable row': {
    kernpunten: [
      { punt: 'Zit rechtop', uitleg: 'Je romp staat rechtop en blijft stil. Niet met je rug meezwaaien om gewicht te halen.' },
      { punt: 'Trek naar je buik', uitleg: 'De greep komt naar je navel. Je ellebogen gaan langs je zij naar achteren.' },
      { punt: 'Schouderbladen samen', uitleg: 'Knijp aan het einde je schouderbladen naar elkaar zonder je schouders op te trekken.' },
      { punt: 'Gecontroleerd terug', uitleg: 'Laat de greep rustig terug tot je armen gestrekt zijn en je schouders iets naar voren gaan.' },
    ],
    opstelling: [
      'Zet je voeten tegen de steun met je knieen licht gebogen, niet op slot.',
      'Pak de greep, vaak de V-greep, en ga rechtop zitten met gestrekte armen en een neutrale rug.',
    ],
    stappen: [
      'Begin rechtop met gestrekte armen en je schouders laag.',
      'Trek de greep naar je buik en breng je schouderbladen samen.',
      'Laat de greep gecontroleerd terug zonder je romp mee te laten gaan.',
    ],
    fouten: [
      { fout: 'Ver voorover en achterover zwaaien', beter: 'Romp stil en rechtop. Een klein beetje meebewegen mag, een roeibootbeweging niet.' },
      { fout: 'Onderrug wordt bol bij het terugkomen', beter: 'Blijf rechtop zitten met je borst open, ook als je armen gestrekt zijn.' },
      { fout: 'Schouders trekken naar je oren', beter: 'Houd je schouders laag en trek met je ellebogen naar achteren.' },
    ],
    ademhaling: 'Adem uit terwijl je naar je buik trekt en adem in als de greep terug gaat.',
    tempo: '1 tel trekken, 1 tel stil, 2 tellen terug.',
    makkelijker: 'Gebruik de seated row machine met borststeun, dan hoef je je romp niet zelf stil te houden.',
    zwaarder: 'Houd bij je buik 2 tellen vast of laat de greep in 4 tellen terug.',
  },

  'Seated row machine': {
    kernpunten: [
      { punt: 'Borst tegen de steun', uitleg: 'Je borst blijft de hele tijd tegen het kussen. Zo trekt je rug en blijft je onderrug rustig.' },
      { punt: 'Schouderbladen samen', uitleg: 'Knijp aan het einde je schouderbladen kort naar elkaar. Je voelt het midden in je rug.' },
      { punt: 'Niet rukken', uitleg: 'Trek rustig en laat rustig terug. Een ruk aan het begin haalt het werk uit je rug.' },
    ],
    opstelling: [
      'Stel de borststeun zo in dat je de grepen net met gestrekte armen kunt pakken.',
      'Stel de stoel zo in dat de grepen ongeveer op borsthoogte zitten en zet je voeten plat.',
    ],
    stappen: [
      'Pak de grepen met gestrekte armen en je borst tegen de steun.',
      'Trek de grepen naar je toe tot je ellebogen naast je romp zijn en knijp je schouderbladen samen.',
      'Laat rustig terug tot je armen gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Borst komt los van de steun', beter: 'Houd contact met het kussen. Til je jezelf eraf, neem dan minder gewicht.' },
      { fout: 'Steun te ver, armen niet gestrekt', beter: 'Zet de steun dichterbij of verder weg tot je de grepen net met gestrekte armen haalt.' },
      { fout: 'Schouders trekken op bij het trekken', beter: 'Houd je schouders laag en denk aan je ellebogen naar achteren.' },
    ],
    ademhaling: 'Adem uit terwijl je de grepen naar je toe trekt en adem in als je terug laat gaan.',
    tempo: '1 tel trekken, 1 tel stil, 2 tellen terug.',
    zwaarder: 'Trek met een arm tegelijk of houd 2 tellen vast met je schouderbladen samen.',
  },

  'Straight arm pulldown': {
    kernpunten: [
      { punt: 'Armen bijna gestrekt', uitleg: 'Je ellebogen houden de hele tijd dezelfde lichte buiging. Buig je ze meer, dan wordt het een triceps-oefening.' },
      { punt: 'Duw in een boog', uitleg: 'Breng de stang in een halve cirkel van hoofdhoogte naar je bovenbenen. Je voelt het onder je oksels.' },
      { punt: 'Romp blijft stil', uitleg: 'Je staat licht voorover en blijft op die hoek. Niet meebuigen om de stang omlaag te krijgen.' },
      { punt: 'Schouders laag', uitleg: 'Houd je schouders weg van je oren, ook als de stang bovenin is.' },
    ],
    opstelling: [
      'Zet de katrol hoog met een rechte stang of touw en pak die op schouderbreedte.',
      'Doe een stap achteruit, buig iets voorover vanuit je heupen met een rechte rug en houd je armen bijna gestrekt voor je op hoofdhoogte.',
    ],
    stappen: [
      'Begin met de stang op hoofdhoogte en je armen bijna gestrekt.',
      'Duw de stang in een boog naar je bovenbenen.',
      'Laat hem gecontroleerd terug omhoog tot je rek voelt onder je oksels.',
    ],
    fouten: [
      { fout: 'Ellebogen buigen en strekken', beter: 'Zet je ellebogen vast in een lichte buiging. Alleen je schouders bewegen.' },
      { fout: 'Romp buigt mee naar beneden', beter: 'Blijf op dezelfde hoek staan met je buik vast. Neem minder gewicht.' },
      { fout: 'Stang schiet terug omhoog', beter: 'Rem de weg omhoog af in 2 tellen. Dan blijft je rug aan het werk.' },
    ],
    ademhaling: 'Adem uit terwijl je de stang naar beneden duwt en adem in als hij omhoog gaat.',
    tempo: '1 tel omlaag, kort stil, 2 tellen omhoog.',
    makkelijker: 'Gebruik een touw en een licht gewicht om de beweging te voelen.',
    zwaarder: 'Houd onderin 2 tellen vast met je handen tegen je bovenbenen.',
  },

  'T-bar row': {
    kernpunten: [
      { punt: 'Rug recht, ook als je moe bent', uitleg: 'Je onderrug blijft neutraal van stuit tot nek. Bij de laatste herhalingen gaat dit vaak mis.' },
      { punt: 'Buig vanuit je heupen', uitleg: 'Billen naar achteren en knieen licht gebogen tot je romp ongeveer 45 graden voorover staat.' },
      { punt: 'Trek naar je borst', uitleg: 'Trek de grepen naar je onderste borst met je ellebogen langs je zij naar achteren.' },
      { punt: 'Romp blijft stil', uitleg: 'Je romp houdt dezelfde hoek. Kom je omhoog om het gewicht te halen, dan is het te zwaar.' },
    ],
    opstelling: [
      'Sta over de stang met je voeten op heupbreedte, de schijven voor je en de greep onder je borst.',
      'Buig je knieen licht, duw je heupen naar achteren en pak de greep met een rechte rug en je buik vast.',
    ],
    stappen: [
      'Til de stang een klein stukje op en laat je armen gestrekt hangen.',
      'Trek de greep naar je borst en breng je schouderbladen samen.',
      'Laat hem gecontroleerd zakken tot je armen gestrekt zijn, zonder dat de schijven de grond raken.',
    ],
    fouten: [
      { fout: 'Onderrug wordt rond', beter: 'Borst iets naar voren, buik vast en minder gewicht. Bij een gevoelige onderrug kies je de versie met borststeun.' },
      { fout: 'Rechtop komen bij elke herhaling', beter: 'Blijf op dezelfde hoek staan. Je armen en rug bewegen, je romp niet.' },
      { fout: 'Schijven tikken op de grond', beter: 'Stop net voor de grond. Zo blijft de spanning op je rug en raak je niet uit je houding.' },
    ],
    ademhaling: 'Adem in en zet je buik vast voor je trekt, adem uit als de greep bij je borst is.',
    tempo: '1 tel omhoog, kort stil, 2 tellen omlaag.',
    makkelijker: 'Kies een T-bar met borststeun of de row op een schuine bank.',
    zwaarder: 'Houd bovenin 2 tellen vast met je schouderbladen samen.',
  },
}
