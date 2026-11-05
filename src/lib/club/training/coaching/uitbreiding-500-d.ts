// ─── Coaching: uitbreiding migratie 500, deel D (kabel, stang, elastiek, landmine) ─
// Opdracht Kane (05-11-2026): "Nog meer oefeningen!". Eigen tekst van Fit
// Factory, zelfde opbouw en regels als de rest (coaching.test.ts).

import type { CoachingBoek } from './typen'

export const COACHING_UITBREIDING_500_D: CoachingBoek = {
  'Cable fly van laag naar hoog': {
    kernpunten: [
      { punt: 'Vaste kleine buiging', uitleg: 'Je ellebogen houden de hele beweging dezelfde kleine buiging. Je armen strekken of buigen niet.' },
      { punt: 'Boog naar boven', uitleg: 'Je handen gaan in een boog van naast je heupen omhoog tot voor je borst.' },
      { punt: 'Borst open', uitleg: 'Je borst blijft open en je schouders laag. Zo werkt vooral het bovenste deel van je borst.' },
    ],
    opstelling: [
      'Zet beide kabels op de laagste stand en pak een handvat in elke hand.',
      'Stap een kleine pas naar voren tussen de torens, een voet iets voor de andere.',
    ],
    stappen: [
      'Begin met je armen laag naast je heupen, handpalmen naar voren.',
      'Breng je handen in een boog omhoog tot ze voor je borst bij elkaar komen.',
      'Laat ze langs dezelfde boog rustig terug zakken.',
    ],
    fouten: [
      { fout: 'Armen buigen en drukken', beter: 'Houd de buiging in je ellebogen vast. Het is een boog, geen duw.' },
      { fout: 'Schouders trekken op', beter: 'Duw je schouders laag en stop op borsthoogte.' },
    ],
    ademhaling: 'Adem uit tijdens het omhoog brengen en in tijdens het terug zakken.',
    tempo: '1 tel omhoog, 1 tel vast, 2 tellen terug.',
    makkelijker: 'Kies minder gewicht of doe een arm tegelijk.',
    zwaarder: 'Houd bovenin 2 tellen vast.',
  },
  'Cable fly van hoog naar laag': {
    kernpunten: [
      { punt: 'Licht voorover', uitleg: 'Je romp leunt licht voorover en blijft stil. Zo trek je de kabels in een mooie lijn.' },
      { punt: 'Vaste kleine buiging', uitleg: 'Je ellebogen houden dezelfde kleine buiging. Het werk komt uit je borst.' },
      { punt: 'Handen voor je heupen', uitleg: 'Je handen komen onderin voor je heupen bij elkaar.' },
    ],
    opstelling: [
      'Zet beide kabels hoog en pak een handvat in elke hand.',
      'Stap een pas naar voren met een voet iets voor de andere en leun licht voorover.',
    ],
    stappen: [
      'Begin met je armen hoog en wijd opzij.',
      'Breng je handen in een boog omlaag tot ze voor je heupen bij elkaar komen.',
      'Laat ze rustig terug omhoog gaan tot je een rek in je borst voelt.',
    ],
    fouten: [
      { fout: 'Romp beweegt mee', beter: 'Zet je voeten steviger en kies minder gewicht.' },
      { fout: 'Armen drukken naar beneden', beter: 'Houd de buiging in je ellebogen vast. Het is een boog.' },
    ],
    ademhaling: 'Adem uit tijdens het omlaag brengen en in tijdens het terugkomen.',
    tempo: '1 tel omlaag, 1 tel vast, 2 tellen terug.',
    makkelijker: 'Kies minder gewicht of doe een arm tegelijk.',
    zwaarder: 'Houd onderin 2 tellen vast.',
  },
  'Front raise aan de kabel': {
    kernpunten: [
      { punt: 'Niet zwaaien', uitleg: 'Je romp blijft stil. Zwaai je, dan is het gewicht te zwaar.' },
      { punt: 'Tot schouderhoogte', uitleg: 'Til je armen tot schouderhoogte. Hoger voegt weinig toe.' },
      { punt: 'Armen bijna gestrekt', uitleg: 'Je ellebogen zijn licht gebogen en blijven zo.' },
    ],
    opstelling: [
      'Zet de kabel laag met een rechte stang en sta met je rug naar de toren.',
      'Laat de kabel tussen je benen door lopen en pak de stang bovenhands.',
    ],
    stappen: [
      'Til je armen voor je op tot schouderhoogte.',
      'Houd kort vast.',
      'Laat de stang rustig zakken naar je bovenbenen.',
    ],
    fouten: [
      { fout: 'Romp leunt naar achteren', beter: 'Kies minder gewicht en span je buik aan.' },
      { fout: 'Schouders trekken op', beter: 'Duw je schouders laag tijdens het optillen.' },
    ],
    ademhaling: 'Adem uit tijdens het optillen en in tijdens het zakken.',
    tempo: '1 tel omhoog, 1 tel vast, 2 tellen omlaag.',
    makkelijker: 'Kies de front raise met dumbbells en minder gewicht.',
    zwaarder: 'Houd bovenin 2 tellen vast.',
  },
  'Reverse fly aan de kabel': {
    kernpunten: [
      { punt: 'Kabels kruisen', uitleg: 'Je linkerhand pakt de rechterkabel en andersom. Zo trek je wijd opzij naar achteren.' },
      { punt: 'Schouders laag', uitleg: 'Trek je schouders niet op. Het werk zit achter in je schouders.' },
      { punt: 'Armen licht gebogen', uitleg: 'Je ellebogen zijn licht gebogen en blijven in die hoek.' },
    ],
    opstelling: [
      'Zet beide kabels op schouderhoogte en ga in het midden staan.',
      'Pak met je linkerhand de rechterkabel en met je rechterhand de linker, armen gekruist voor je.',
    ],
    stappen: [
      'Trek je armen wijd opzij naar achteren tot ze in lijn met je schouders zijn.',
      'Houd kort vast.',
      'Laat je armen rustig terug kruisen voor je borst.',
    ],
    fouten: [
      { fout: 'Schouders trekken op', beter: 'Duw je schouders laag en kies minder gewicht.' },
      { fout: 'Romp leunt naar achteren', beter: 'Sta rechtop en span je buik aan.' },
    ],
    ademhaling: 'Adem uit tijdens het opzij trekken en in tijdens het terugkomen.',
    tempo: '1 tel open, 1 tel vast, 2 tellen terug.',
    makkelijker: 'Kies de band pull-apart.',
    zwaarder: 'Houd de open stand 2 tellen vast.',
  },
  'Triceps pushdown met een arm': {
    kernpunten: [
      { punt: 'Elleboog op zijn plek', uitleg: 'Je elleboog blijft tegen je zij. Alleen je onderarm beweegt.' },
      { punt: 'Helemaal strekken', uitleg: 'Strek je arm onderin helemaal en span je triceps kort aan.' },
      { punt: 'Rustig terug', uitleg: 'Laat het handvat rustig terugkomen tot je onderarm net boven horizontaal is.' },
    ],
    opstelling: [
      'Zet de kabel hoog met een D-handvat.',
      'Sta voor de toren met het handvat in een hand en je elleboog tegen je zij.',
    ],
    stappen: [
      'Duw het handvat omlaag tot je arm gestrekt is.',
      'Span kort aan.',
      'Laat het handvat rustig terugkomen en wissel na de set van arm.',
    ],
    fouten: [
      { fout: 'Elleboog gaat naar voren', beter: 'Houd je elleboog tegen je zij. Kies minder gewicht.' },
      { fout: 'Leunen op het handvat', beter: 'Sta rechtop. Je romp helpt niet mee.' },
    ],
    ademhaling: 'Adem uit tijdens het omlaag duwen en in tijdens het terugkomen.',
    tempo: '1 tel omlaag, 1 tel vast, 2 tellen terug.',
    makkelijker: 'Kies de triceps pushdown met twee handen.',
    zwaarder: 'Houd onderin 2 tellen vast.',
  },
  'Bayesian curl aan de kabel': {
    kernpunten: [
      { punt: 'Elleboog achter je romp', uitleg: 'Je arm begint licht achter je lichaam. Zo staat je biceps onderin al op rek.' },
      { punt: 'Elleboog blijft stil', uitleg: 'Je elleboog beweegt niet naar voren tijdens het curlen.' },
      { punt: 'Halve pas naar voren', uitleg: 'Stap een halve pas weg van de toren. Dan is er onderin al spanning.' },
    ],
    opstelling: [
      'Zet de kabel laag met een D-handvat en sta met je rug naar de toren.',
      'Pak het handvat met een hand en stap een halve pas naar voren, je arm licht achter je.',
    ],
    stappen: [
      'Curl het handvat omhoog naar je schouder.',
      'Span bovenin kort aan.',
      'Laat het handvat rustig zakken tot je arm weer achter je hangt en wissel na de set.',
    ],
    fouten: [
      { fout: 'Elleboog schiet naar voren', beter: 'Houd je elleboog achter je romp. Kies minder gewicht.' },
      { fout: 'Romp draait mee', beter: 'Sta stevig met je voeten en houd je schouders recht.' },
    ],
    ademhaling: 'Adem uit tijdens het omhoog curlen en in tijdens het zakken.',
    tempo: '1 tel omhoog, 1 tel vast, 2 tellen omlaag.',
    makkelijker: 'Kies de curl aan de kabel met twee handen.',
    zwaarder: 'Zak 3 tellen en houd onderin een tel stil.',
  },
  'Woodchop aan de kabel': {
    kernpunten: [
      { punt: 'Draai uit romp en heupen', uitleg: 'De beweging komt uit je romp en heupen. Je armen blijven lang en sturen alleen.' },
      { punt: 'Achterste voet draait mee', uitleg: 'Je achterste voet draait mee op je voorvoet. Zo blijft je knie vrij.' },
      { punt: 'Gecontroleerd terug', uitleg: 'Laat de kabel rustig terugkomen. Je laat je niet terugtrekken.' },
    ],
    opstelling: [
      'Zet de kabel hoog en sta er zijwaarts naast met je voeten iets breder dan je heupen.',
      'Pak het handvat met beide handen boven je schouder.',
    ],
    stappen: [
      'Trek het handvat diagonaal omlaag over je lichaam naar je andere knie.',
      'Draai je romp en heupen mee.',
      'Laat het handvat rustig terug omhoog gaan en wissel na de set van kant.',
    ],
    fouten: [
      { fout: 'Trekken met de armen', beter: 'Houd je armen lang en draai vanuit je romp.' },
      { fout: 'Voeten staan vast', beter: 'Laat je achterste voet meedraaien.' },
    ],
    ademhaling: 'Adem uit tijdens het omlaag trekken en in tijdens het terugkomen.',
    tempo: '1 tel omlaag, 2 tellen terug.',
    makkelijker: 'Kies minder gewicht en een kleinere draai.',
    zwaarder: 'Doe het halfknielend zodat je heupen minder helpen.',
  },
  'Eenarmige seated cable row': {
    kernpunten: [
      { punt: 'Romp draait niet mee', uitleg: 'Je romp blijft recht naar voren. Alleen je arm en schouderblad bewegen.' },
      { punt: 'Elleboog langs je lichaam', uitleg: 'Trek het handvat naar je zij met je elleboog dicht langs je romp.' },
      { punt: 'Schouderblad naar achteren', uitleg: 'Aan het eind trek je je schouderblad naar achteren. Daar voel je je rug.' },
    ],
    opstelling: [
      'Zit aan het roeistation met je voeten tegen de plaat en je knieen licht gebogen.',
      'Pak een D-handvat met een hand en zit rechtop.',
    ],
    stappen: [
      'Trek het handvat naar je zij.',
      'Trek je schouderblad naar achteren en houd kort vast.',
      'Laat je arm rustig terug strekken en wissel na de set.',
    ],
    fouten: [
      { fout: 'Romp draait mee', beter: 'Kies minder gewicht en houd je schouders recht.' },
      { fout: 'Achterover leunen', beter: 'Zit rechtop. Je romp beweegt niet.' },
    ],
    ademhaling: 'Adem uit tijdens het trekken en in tijdens het terugkomen.',
    tempo: '1 tel trekken, 1 tel vast, 2 tellen terug.',
    makkelijker: 'Kies de seated cable row met twee handen.',
    zwaarder: 'Houd de eindstand 2 tellen vast.',
  },
  'Lat pulldown met brede greep': {
    kernpunten: [
      { punt: 'Borst omhoog', uitleg: 'Je borst gaat naar de stang toe. Zo trek je met je rug en niet met je armen.' },
      { punt: 'Ellebogen omlaag en opzij', uitleg: 'Denk aan je ellebogen naar je heupen trekken. De stang volgt vanzelf.' },
      { punt: 'Niet ver achterover', uitleg: 'Leun maar een klein stukje naar achteren. Je romp blijft stil.' },
    ],
    opstelling: [
      'Zit aan het latstation met je knieen onder de kussens.',
      'Pak de stang heel breed bovenhands.',
    ],
    stappen: [
      'Trek de stang naar je bovenste borst.',
      'Houd kort vast met je schouderbladen naar beneden.',
      'Laat de stang gecontroleerd terug omhoog tot je armen gestrekt zijn.',
    ],
    fouten: [
      { fout: 'Ver achterover leunen', beter: 'Kies minder gewicht en zit rechtop.' },
      { fout: 'Stang achter je nek', beter: 'Trek de stang altijd voor je naar je borst.' },
    ],
    ademhaling: 'Adem uit tijdens het trekken en in tijdens het terugkomen.',
    tempo: '1 tel omlaag, 1 tel vast, 2 tellen omhoog.',
    makkelijker: 'Kies de lat pulldown met een gewone greep.',
    zwaarder: 'Houd onderin 2 tellen vast.',
  },
  'Hanging leg raise': {
    kernpunten: [
      { punt: 'Niet zwaaien', uitleg: 'Je hangt stil voordat je begint. Zwaaien neemt het werk van je buik over.' },
      { punt: 'Bekken kantelen', uitleg: 'Kantel je bekken bovenin naar je toe. Dan werkt je buik en niet alleen je heupbuigers.' },
      { punt: 'Langzaam omlaag', uitleg: 'Laat je benen langzaam zakken. Snel laten vallen zet je aan het zwaaien.' },
    ],
    opstelling: [
      'Hang aan de optrekstang met je handen op schouderbreedte en gestrekte armen.',
      'Laat je benen gestrekt naar beneden hangen.',
    ],
    stappen: [
      'Til je gestrekte benen op tot heuphoogte of hoger.',
      'Kantel je bekken bovenin naar je toe.',
      'Laat je benen langzaam zakken tot je weer stil hangt.',
    ],
    fouten: [
      { fout: 'Zwaaien met het hele lichaam', beter: 'Wacht tot je stil hangt en ga langzamer omlaag.' },
      { fout: 'Benen alleen tot halverwege', beter: 'Buig je knieen als je niet tot heuphoogte komt.' },
    ],
    ademhaling: 'Adem uit tijdens het optillen en in tijdens het zakken.',
    tempo: '1 tel omhoog, 1 tel vast, 2 tellen omlaag.',
    makkelijker: 'Kies de hanging knee raise.',
    zwaarder: 'Til je voeten tot aan de stang.',
  },
  'Scapula pull-up': {
    kernpunten: [
      { punt: 'Armen blijven gestrekt', uitleg: 'Je ellebogen buigen niet. Alleen je schouderbladen bewegen.' },
      { punt: 'Schouders omlaag', uitleg: 'Trek je schouderbladen omlaag en naar elkaar. Je komt een paar centimeter omhoog.' },
      { punt: 'Rustig terug', uitleg: 'Laat je schouders rustig terug omhoog komen tot je weer los hangt.' },
    ],
    opstelling: [
      'Pak de optrekstang op schouderbreedte en hang met gestrekte armen.',
    ],
    stappen: [
      'Trek je schouderbladen omlaag en naar elkaar.',
      'Houd kort vast.',
      'Laat je schouders rustig terug omhoog komen.',
    ],
    fouten: [
      { fout: 'Ellebogen buigen', beter: 'Houd je armen gestrekt. Het is een kleine beweging.' },
      { fout: 'Zwaaien', beter: 'Hang eerst stil en ga dan pas bewegen.' },
    ],
    ademhaling: 'Adem uit tijdens het omlaag trekken en in tijdens het terugkomen.',
    tempo: '1 tel omlaag, 2 tellen vast, 1 tel terug.',
    makkelijker: 'Laat je tenen de grond raken of gebruik een elastiek.',
    zwaarder: 'Houd de stand 3 tellen vast.',
  },
  'Dead hang': {
    kernpunten: [
      { punt: 'Schouders licht actief', uitleg: 'Laat je schouders niet helemaal in je oren zakken. Houd ze licht actief.' },
      { punt: 'Stil hangen', uitleg: 'Hang stil zonder te zwaaien en adem rustig door.' },
      { punt: 'Rustig afstappen', uitleg: 'Stap gecontroleerd af. Niet laten vallen.' },
    ],
    opstelling: [
      'Pak de optrekstang op schouderbreedte bovenhands.',
      'Hang met gestrekte armen en je voeten los van de grond.',
    ],
    stappen: [
      'Hang stil met gestrekte armen.',
      'Houd vast en adem rustig door.',
      'Stap rustig af als de tijd om is.',
    ],
    fouten: [
      { fout: 'Schouders zakken helemaal in', beter: 'Trek je schouders een klein stukje omlaag.' },
      { fout: 'Adem inhouden', beter: 'Adem rustig door.' },
    ],
    ademhaling: 'Adem rustig en diep door.',
    tempo: 'Vasthouden, op tijd.',
    makkelijker: 'Laat je tenen de grond raken.',
    zwaarder: 'Hang langer of aan een hand tegelijk.',
  },
  'Clamshell met elastiek': {
    kernpunten: [
      { punt: 'Bekken blijft stil', uitleg: 'Je bekken rolt niet naar achteren. Alleen je bovenste knie gaat open.' },
      { punt: 'Voeten tegen elkaar', uitleg: 'Je voeten blijven de hele beweging tegen elkaar.' },
      { punt: 'Kleine beweging', uitleg: 'Open je knie zo ver als lukt zonder dat je bekken meedraait.' },
    ],
    opstelling: [
      'Lig op je zij met je knieen gebogen en je hoofd op je arm.',
      'Doe een elastiek net boven je knieen.',
    ],
    stappen: [
      'Open je bovenste knie terwijl je voeten tegen elkaar blijven.',
      'Houd kort vast.',
      'Sluit je knie rustig en wissel na de set van kant.',
    ],
    fouten: [
      { fout: 'Bekken rolt naar achteren', beter: 'Leg je bovenste hand op je heup en houd die stil.' },
      { fout: 'Te snel', beter: 'Ga langzaam en houd elke keer een tel vast.' },
    ],
    ademhaling: 'Adem uit tijdens het openen en in tijdens het sluiten.',
    tempo: '1 tel open, 1 tel vast, 1 tel dicht.',
    makkelijker: 'Doe het zonder elastiek.',
    zwaarder: 'Kies een zwaarder elastiek.',
  },
  'Meadows row': {
    kernpunten: [
      { punt: 'Elleboog wijd naar achteren', uitleg: 'Trek je elleboog wijd en hoog naar achteren. Zo werkt je bovenrug mee.' },
      { punt: 'Steun op je knie', uitleg: 'Je vrije onderarm steunt op je voorste knie. Dat houdt je romp stil.' },
      { punt: 'Rug lang', uitleg: 'Je rug blijft lang en recht, ook als het zwaar wordt.' },
    ],
    opstelling: [
      'Sta dwars naast het uiteinde van een landmine-stang in een gespreide stand.',
      'Leun voorover en pak het uiteinde van de stang bovenhands, je andere onderarm op je voorste knie.',
    ],
    stappen: [
      'Trek de stang omhoog met je elleboog wijd naar achteren.',
      'Houd kort vast.',
      'Laat de stang rustig zakken tot je arm gestrekt is en wissel na de set.',
    ],
    fouten: [
      { fout: 'Romp draait open', beter: 'Steun steviger op je knie en kies minder gewicht.' },
      { fout: 'Rug wordt bol', beter: 'Borst iets vooruit en heupen naar achteren.' },
    ],
    ademhaling: 'Adem uit tijdens het trekken en in tijdens het zakken.',
    tempo: '1 tel omhoog, 1 tel vast, 2 tellen omlaag.',
    makkelijker: 'Kies de eenarmige dumbbell row.',
    zwaarder: 'Houd bovenin 2 tellen vast.',
  },
  'Landmine rotatie': {
    kernpunten: [
      { punt: 'Armen blijven lang', uitleg: 'Je armen blijven gestrekt. De draai komt uit je romp en heupen.' },
      { punt: 'Heupen draaien mee', uitleg: 'Je heupen en voeten draaien een beetje mee. Zo blijft je onderrug vrij.' },
      { punt: 'Rustig en gecontroleerd', uitleg: 'Laat de stang niet naar beneden vallen. Je remt hem elke kant af.' },
    ],
    opstelling: [
      'Sta voor het uiteinde van een landmine-stang met je voeten iets breder dan je heupen.',
      'Pak het uiteinde met beide handen voor je met gestrekte armen.',
    ],
    stappen: [
      'Breng de stang in een boog naar je ene heup.',
      'Breng hem terug omhoog voor je.',
      'Breng hem in een boog naar je andere heup.',
    ],
    fouten: [
      { fout: 'Armen buigen', beter: 'Houd je armen gestrekt en kies minder gewicht.' },
      { fout: 'Stang valt naar beneden', beter: 'Rem de stang af en ga langzamer.' },
    ],
    ademhaling: 'Adem uit tijdens het naar beneden brengen en in tijdens het omhoog komen.',
    tempo: '2 tellen naar de kant, 2 tellen terug.',
    makkelijker: 'Kies een kleinere boog of een lege stang.',
    zwaarder: 'Doe een schijf op de stang.',
  },
  'Leg press met een been': {
    kernpunten: [
      { punt: 'Knie in lijn met je voet', uitleg: 'Je knie wijst dezelfde kant op als je tenen en zakt niet naar binnen.' },
      { punt: 'Niet op slot', uitleg: 'Strek je been bovenin bijna helemaal, maar zet je knie niet op slot.' },
      { punt: 'Halve gewicht', uitleg: 'Kies ongeveer de helft van het gewicht dat je met twee benen gebruikt.' },
    ],
    opstelling: [
      'Zit in de leg press met je rug tegen het kussen.',
      'Zet een voet midden op de plaat en laat je andere been ontspannen op de vloer rusten.',
    ],
    stappen: [
      'Laat de plaat zakken tot je knie ongeveer haaks is.',
      'Duw de plaat weer weg vanuit je hiel.',
      'Doe alle herhalingen en wissel dan van been.',
    ],
    fouten: [
      { fout: 'Knie zakt naar binnen', beter: 'Kies minder gewicht en duw je knie naar buiten.' },
      { fout: 'Billen komen los van het kussen', beter: 'Zak minder diep. Je onderrug blijft tegen het kussen.' },
    ],
    ademhaling: 'Adem in tijdens het zakken en uit tijdens het wegduwen.',
    tempo: '2 tellen omlaag, 1 tel omhoog.',
    makkelijker: 'Kies de leg press met twee benen.',
    zwaarder: 'Houd onderin 2 tellen stil.',
  },
}
