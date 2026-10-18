-- ─── Fit Factory clubsoftware: oefenbibliotheek uitgebreid ─────────────────
-- 31 veelgebruikte oefeningen die nog ontbraken: varianten van deadlift, split
-- squat en lunge, rows, presses, machines (leg press zittend, dips, biceps
-- curl, reverse fly, crunch) en romp, dragen en conditie. Elke oefening heeft
-- een RepDB-beeld dat precies de beweging en het materiaal laat zien (zelfde
-- stijl als de rest), plus spiergroep, materiaal, bewegingspatroon, belaste
-- zones en spieren. De coaching staat in src/lib/club/training/coaching/.
-- Koppeling: REPDB_KOPPELING_444 in src/lib/club/training/beelden-repdb.ts.
-- Bron beelden: RepDB, gratis versie (repdb.co), bronvermelding verplicht; zie
-- public/club/oefeningen-repdb/ATTRIBUTION.txt.
--
-- Voor elke sportschool met een oefenbibliotheek (Fit Factory, Voorbeeld Gym,
-- Test Gym); nieuwe sportscholen kopieren de actieve bibliotheek van Fit
-- Factory en krijgen ze zo ook.
--
-- Alleen toevoegen, niets verwijderen of overschrijven. Idempotent: een
-- oefening komt er alleen bij als de naam (hoofdletters tellen niet) in die
-- sportschool nog niet bestaat.
--
-- Tot slot een controle: elke actieve oefening moet een patroon, primaire
-- spieren en materiaal hebben, want het vervangen van oefeningen rekent daarop
-- (src/lib/club/training/oefening-kenmerken.ts).

do $$
declare
  toegevoegd int;
  zonder int;
begin
  insert into public.club_oefeningen
    (user_id, naam, spiergroep, materiaal, niveau, patroon, belast, spieren_primair, spieren_secundair,
     uitleg, aandachtspunten, beeld_start, beeld_eind, beeld_bron, beeld_licentie)
  select org.user_id, v.naam, v.spiergroep, v.materiaal, v.niveau, v.patroon, v.belast::text[],
         v.primair::text[], v.secundair::text[], v.uitleg, v.aandachtspunten,
         '/club/oefeningen-repdb/' || v.id || '-start.webp',
         '/club/oefeningen-repdb/' || v.id || '-eind.webp',
         'RepDB', 'RepDB gratis (bronvermelding)'
  from (select distinct user_id from public.club_oefeningen) as org
  cross join (values
    -- Benen en billen
    ('Trap bar deadlift','benen','barbell',2,'heupscharnier','{rug,knie}','{bilspieren,quadriceps}','{hamstrings,onderrug,trapezius,onderarmen}',
     'Sta midden in de trap bar en pak de handvatten naast je benen. Duw de vloer weg tot je rechtop staat en zet de stang gecontroleerd terug.',
     'Borst omhoog en rug lang, de stang blijft boven het midden van je voeten. Bovenin rechtop staan, niet achterover leunen.',
     'hex-bar-deadlift'),
    ('Sumo deadlift','benen','barbell',3,'heupscharnier','{rug,heup}','{bilspieren,quadriceps,adductoren}','{hamstrings,onderrug,trapezius}',
     'Sta breed met je tenen naar buiten en pak de stang tussen je knieen. Duw je knieen naar buiten, duw de vloer weg en kom rechtop.',
     'Schenen bijna verticaal en de stang blijft tegen je benen. Rug lang, niet bol trekken bij het loskomen van de vloer.',
     'sumo-deadlift'),
    ('Deadlift met kettlebell','benen','kettlebell',1,'heupscharnier','{rug}','{bilspieren,hamstrings}','{onderrug,quadriceps,onderarmen}',
     'Zet de kettlebell tussen je voeten. Duw je heupen naar achteren, pak het handvat met een rechte rug en kom rechtop door je heupen naar voren te brengen.',
     'Het is een heupbeweging, geen squat: knieen licht gebogen. Bovenin billen aanspannen zonder achterover te leunen.',
     'kettlebell-deadlift'),
    ('Pull-through aan de kabel','billen','kabel',1,'heupscharnier','{}','{bilspieren,hamstrings}','{onderrug}',
     'Zet de kabel laag met een touw en sta met je rug naar het toestel, het touw tussen je benen. Duw je heupen naar achteren en kom rechtop door je billen aan te spannen.',
     'Je armen blijven lang en trekken niet. Rug recht en bovenin niet doorduwen naar een holle rug.',
     'cable-pull-through'),
    ('Hip thrust met dumbbell','billen','dumbbell',1,'heupscharnier','{}','{bilspieren}','{hamstrings,quadriceps}',
     'Leun met je bovenrug tegen een bank en leg de dumbbell op je heupen. Duw je heupen omhoog tot je recht bent van knie tot schouder en zak rustig terug.',
     'Kin licht naar je borst en ribben laag, dan werken je billen en niet je onderrug. Bovenin kort vasthouden.',
     'dumbbell-hip-thrust'),
    ('Split squat met dumbbells','benen','dumbbell',2,'lunge','{knie}','{quadriceps,bilspieren}','{adductoren,hamstrings}',
     'Sta in een ruime spreidstand met een dumbbell in elke hand. Zak recht omlaag tot je achterste knie net boven de grond is en duw via je voorste voet omhoog.',
     'Je voeten blijven staan, alleen je lichaam gaat op en neer. Voorste knie in de lijn van je tenen.',
     'dumbbell-split-squat'),
    ('Split squat','benen','geen',1,'lunge','{knie}','{quadriceps,bilspieren}','{adductoren,hamstrings}',
     'Sta in een ruime spreidstand met je handen in je zij. Zak recht omlaag tot je achterste knie net boven de grond is en kom terug omhoog.',
     'Voeten op heupbreedte voor je balans. Romp rechtop en je gewicht vooral op je voorste been.',
     'split-squat'),
    ('Zijwaartse lunge','benen','geen',2,'lunge','{knie,heup}','{quadriceps,bilspieren,adductoren}','{hamstrings}',
     'Stap breed opzij en zak door het been waar je op stapt, het andere been blijft gestrekt. Duw jezelf terug naar het midden.',
     'Heupen naar achteren en borst omhoog. Beide voeten blijven plat op de grond en wijzen naar voren.',
     'side-lunge'),
    ('Nordic hamstring curl','benen','geen',3,'isolatie','{knie}','{hamstrings}','{bilspieren,kuiten}',
     'Kniel met je hielen vast onder een rol of laat iemand ze vasthouden. Laat je lichaam zo langzaam mogelijk naar voren zakken, vang je op met je handen en duw jezelf terug.',
     'Lichaam recht van knie tot hoofd, niet knikken in je heupen. Bouw het rustig op: deze oefening is erg zwaar voor je hamstrings.',
     'nordic-hamstring-curl'),
    ('Leg press zittend','benen','machine',1,'squat','{knie}','{quadriceps,bilspieren}','{hamstrings,adductoren}',
     'Zit met je rug tegen de leuning en zet je voeten op heupbreedte midden op de plaat. Buig je knieen gecontroleerd en duw de plaat weer weg.',
     'Onderrug blijft tegen de leuning. Bovenin je knieen niet op slot duwen.',
     'horizontal-leg-press'),
    -- Duwen
    ('Push-up met handen verhoogd','borst','bank',1,'duwen_horizontaal','{schouder,pols}','{borstspieren}','{triceps,voorste_schouder}',
     'Zet je handen iets breder dan je schouders op een bank of rek en je voeten naar achteren. Laat je borst naar de rand zakken en duw jezelf terug.',
     'Lichaam in een rechte lijn, buik en billen aan. Hoe hoger je handen, hoe lichter de oefening.',
     'incline-push-ups'),
    ('Schuin bankdrukken in de smith machine','borst','machine',1,'duwen_horizontaal','{schouder}','{borstspieren,voorste_schouder}','{triceps}',
     'Zet de schuine bank zo onder de stang dat hij boven je bovenste borst zakt. Laat de stang rustig zakken tot je borst en druk hem weer omhoog.',
     'Schouderbladen naar achteren en omlaag tegen de bank. Ellebogen iets onder schouderhoogte, niet wijd naar buiten.',
     'smith-machine-incline-bench-press'),
    ('Arnold press','schouders','dumbbell',2,'duwen_verticaal','{schouder}','{voorste_schouder,middelste_schouder}','{triceps,trapezius}',
     'Zit rechtop met de dumbbells voor je schouders, handpalmen naar je toe. Draai je handen naar buiten terwijl je de dumbbells boven je hoofd drukt en draai terug op de weg omlaag.',
     'Rug tegen de leuning en ribben laag, geen holle rug. Begin licht: de draai maakt het zwaarder dan een gewone press.',
     'arnold-press'),
    ('Assisted dips','borst','machine',1,'duwen_verticaal','{schouder,elleboog}','{borstspieren,triceps}','{voorste_schouder}',
     'Kniel op het kussen en pak de handvatten. Zak tot je bovenarmen ongeveer horizontaal zijn en duw jezelf omhoog tot je armen bijna gestrekt zijn.',
     'Meer gewicht op het toestel betekent meer hulp. Schouders laag, weg van je oren.',
     'assisted-dips'),
    ('Dips machine','triceps','machine',1,'isolatie','{schouder,elleboog}','{triceps}','{borstspieren,voorste_schouder}',
     'Zit met je rug tegen de leuning en pak de handvatten naast je. Duw ze omlaag tot je armen gestrekt zijn en laat ze rustig terugkomen.',
     'Ellebogen wijzen naar achteren en blijven dicht bij je lichaam. Schouders laag en borst omhoog.',
     'seated-dip-machine'),
    ('Triceps extension boven het hoofd aan de kabel','triceps','kabel',1,'isolatie','{elleboog,schouder}','{triceps}','{}',
     'Zet de kabel laag met een touw, draai je rug naar het toestel en breng het touw achter je hoofd. Strek je armen schuin omhoog en buig ze rustig terug.',
     'Ellebogen blijven op dezelfde plek en wijzen naar voren. Buik aan, geen holle rug.',
     'cable-overhead-tricep-extension'),
    -- Trekken
    ('Voorovergebogen row met dumbbells','rug','dumbbell',2,'trekken_horizontaal','{rug}','{latissimus,rhomboideus}','{biceps,achterste_schouder,trapezius}',
     'Buig voorover vanuit je heupen met een rechte rug, de dumbbells hangen onder je schouders. Trek ze naar je heupen en laat ze gecontroleerd zakken.',
     'Romp blijft stil, niet omhoog zwaaien. Ellebogen langs je lichaam naar achteren.',
     'bent-over-db-row'),
    ('TRX row','rug','overig',1,'trekken_horizontaal','{}','{rhomboideus,latissimus}','{biceps,achterste_schouder}',
     'Pak de handvatten en leun achterover met gestrekte armen en een recht lichaam. Trek je borst naar de handvatten en laat jezelf rustig terugzakken.',
     'Lichaam blijft een plank, heupen zakken niet. Hoe verder je voeten naar voren staan, hoe zwaarder.',
     'trx-row'),
    ('Negatieve pull-up','rug','geen',2,'trekken_verticaal','{schouder,elleboog}','{latissimus}','{biceps,rhomboideus,onderarmen}',
     'Begin bovenin met je kin boven de stang, bijvoorbeeld door op een bank te stappen. Laat jezelf in 3 tot 5 tellen zakken tot je armen gestrekt zijn.',
     'Zo langzaam mogelijk, de hele weg omlaag. Stap terug omhoog in plaats van op te trekken.',
     'negative-pull-ups'),
    ('Eenarmige lat pulldown','rug','kabel',2,'trekken_verticaal','{schouder}','{latissimus}','{biceps,achterste_schouder,rhomboideus}',
     'Zit onder de kabel en pak een handvat met een hand. Trek je elleboog omlaag naar je zij en laat het handvat gecontroleerd terug omhoog gaan.',
     'Romp blijft recht, niet wegdraaien. Bovenin je arm helemaal laten strekken.',
     'one-arm-lat-pulldown'),
    ('Seated cable row met brede greep','rug','kabel',1,'trekken_horizontaal','{}','{rhomboideus,latissimus}','{achterste_schouder,biceps,trapezius}',
     'Zit met je voeten tegen de steun en pak de brede stang met gestrekte armen. Trek de stang naar je onderste borst met je ellebogen naar buiten en laat hem terugkomen.',
     'Romp blijft stil en rechtop. Knijp je schouderbladen samen aan het eind van elke herhaling.',
     'wide-grip-seated-cable-row'),
    ('Biceps curl machine','biceps','machine',1,'isolatie','{}','{biceps}','{onderarmen}',
     'Stel de zitting zo in dat je bovenarmen plat op het kussen liggen. Buig je armen tot de handvatten bij je schouders zijn en laat ze rustig terugzakken.',
     'Ellebogen blijven op het kussen. Onderin je armen bijna helemaal strekken.',
     'machine-bicep-curl'),
    ('Hammer curl aan de kabel','biceps','kabel',1,'isolatie','{}','{biceps,onderarmen}','{}',
     'Zet de kabel laag met een touw en pak de uiteinden met je duimen omhoog. Buig je armen tot je handen bij je schouders zijn en laat ze rustig zakken.',
     'Ellebogen blijven naast je lichaam. Niet meezwaaien met je rug.',
     'cable-hammer-curl'),
    -- Schouders
    ('Reverse fly machine','schouders','machine',1,'isolatie','{}','{achterste_schouder}','{rhomboideus,trapezius}',
     'Zit met je borst tegen het kussen en pak de handvatten op schouderhoogte. Breng je armen in een wijde boog naar achteren en laat ze rustig terugkomen.',
     'Armen licht gebogen en schouders laag. Kies een licht gewicht: de achterkant van je schouder doet het werk.',
     'machine-reverse-fly'),
    ('Exorotatie aan de kabel','schouders','kabel',1,'isolatie','{}','{achterste_schouder}','{rhomboideus}',
     'Zet de kabel op ellebooghoogte en sta er zijwaarts naast. Houd je elleboog in een rechte hoek tegen je zij en draai je onderarm naar buiten, weg van het toestel.',
     'Elleboog blijft tegen je zij, alleen je onderarm draait. Licht gewicht en een rustig tempo.',
     'cable-external-rotation'),
    ('Schouders ophalen met barbell','schouders','barbell',1,'isolatie','{nek}','{trapezius}','{onderarmen}',
     'Sta rechtop met de stang aan gestrekte armen voor je bovenbenen. Trek je schouders recht omhoog naar je oren, houd kort vast en laat ze rustig zakken.',
     'Recht omhoog, niet rollen. Armen blijven gestrekt en je kin blijft in dezelfde stand.',
     'shrug'),
    -- Romp, dragen en conditie
    ('Crunch machine','buik','machine',1,'core','{}','{rechte_buikspier}','{schuine_buikspieren}',
     'Zit met je voeten onder de rollen en pak de handvatten bij je schouders. Rol je romp naar voren en omlaag en kom rustig terug.',
     'De beweging komt uit je buik, niet uit je armen. Adem uit terwijl je oprolt.',
     'machine-seated-crunch'),
    ('Hollow hold','buik','geen',2,'core','{rug}','{rechte_buikspier,diepe_buikspier}','{heupbuigers}',
     'Lig op je rug, druk je onderrug in de mat en til je schouders en gestrekte benen een stukje op. Houd deze houding vast en adem rustig door.',
     'Je onderrug blijft tegen de grond. Komt hij los, buig dan je knieen of til je benen hoger.',
     'hollow-body-hold'),
    ('Suitcase carry','buik','kettlebell',2,'core','{}','{schuine_buikspieren,onderarmen}','{diepe_buikspier,trapezius,abductoren}',
     'Pak een kettlebell in een hand en loop rechtop een vaste afstand of tijd. Wissel daarna van hand.',
     'Niet scheef hangen naar de kant van het gewicht. Schouders recht en rustig doorlopen.',
     'suitcase-carry'),
    ('Slee duwen','hele_lichaam','overig',2,'explosief','{knie}','{quadriceps,bilspieren}','{kuiten,hart_longen}',
     'Pak de palen van de slee met gestrekte armen en leun naar voren. Duw de slee vooruit met korte, krachtige passen.',
     'Lichaam in een schuine rechte lijn en armen gestrekt. Zet af via je voorvoeten.',
     'sled-push'),
    ('Wall ball','hele_lichaam','overig',2,'explosief','{knie,schouder}','{quadriceps,bilspieren,voorste_schouder}','{triceps,hart_longen}',
     'Houd een medicijnbal voor je borst en sta voor een muur. Zak in een squat, kom krachtig omhoog en gooi de bal tegen een doel op de muur; vang hem en zak direct door.',
     'De kracht komt uit je benen, je armen maken de worp af. Vang de bal voor je borst, niet boven je hoofd.',
     'wall-ball')
  ) as v(naam, spiergroep, materiaal, niveau, patroon, belast, primair, secundair, uitleg, aandachtspunten, id)
  where not exists (
    select 1 from public.club_oefeningen o where o.user_id = org.user_id and lower(o.naam) = lower(v.naam)
  );
  get diagnostics toegevoegd = row_count;

  -- Controle: het vervangen van oefeningen rekent op deze velden.
  select count(*) into zonder
  from public.club_oefeningen
  where actief and (patroon is null or cardinality(spieren_primair) = 0 or materiaal is null);
  if zonder > 0 then
    raise exception '% actieve oefeningen zonder patroon, primaire spieren of materiaal.', zonder;
  end if;

  raise notice 'Nieuwe oefeningen: % (31 per sportschool met een bibliotheek)', toegevoegd;
end $$;
