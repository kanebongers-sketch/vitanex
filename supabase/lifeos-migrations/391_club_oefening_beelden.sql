-- ─── Fit Factory clubsoftware: tekeningen bij oefeningen ─────────────────────
-- 1. Vier kolommen op club_oefeningen: begin- en eindhouding (pad naar een SVG
--    in public/club/oefeningen), de bron en de licentie.
-- 2. Paden voor 45 oefeningen uit de startbibliotheek (382) waar een passende
--    tekening voor is. Handmatig gekoppeld op beweging en materiaal, zie
--    src/lib/club/training/beelden-koppeling.ts. Geen match is beter dan een
--    verkeerde: de rest blijft zonder tekening.
-- 3. 43 nieuwe, gangbare oefeningen waar wel een tekening voor is, met een
--    eigen korte Nederlandse uitleg en aandachtspunten (niets vertaald of
--    overgenomen uit de dataset).
--
-- Bron van de tekeningen: Everkinetic (everkinetic.com, github.com/everkinetic/data),
-- Greg Priday en bijdragers, licentie CC BY-SA 4.0. Aangepast door Fit Factory
-- (achtergrond weg, lijnkleur via CSS); zie public/club/oefeningen/LICENSE.txt.
-- Ophalen: node scripts/club/everkinetic-import.mjs
--
-- Idempotent: kolommen en controle met "if not exists", nieuwe oefeningen alleen
-- als de naam nog niet bestaat (hoofdletters tellen niet), paden alleen bij
-- oefeningen zonder beeld of met een beeld van Everkinetic. Opnieuw draaien is veilig.

alter table public.club_oefeningen add column if not exists beeld_start text;
alter table public.club_oefeningen add column if not exists beeld_eind text;
alter table public.club_oefeningen add column if not exists beeld_bron text;
alter table public.club_oefeningen add column if not exists beeld_licentie text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'club_oefeningen_beeld_pad') then
    alter table public.club_oefeningen add constraint club_oefeningen_beeld_pad check (
      (beeld_start is null or beeld_start ~ '^/club/oefeningen/[0-9]{4}-start\.svg$')
      and (beeld_eind is null or beeld_eind ~ '^/club/oefeningen/[0-9]{4}-eind\.svg$')
    );
  end if;
end $$;

do $$
declare
  uid uuid;
  toegevoegd int;
  bijgewerkt int;
begin
  select user_id into uid from public.pt_lead_links limit 1;
  if uid is null then raise exception 'Geen LifeOS-gebruiker gevonden (pt_lead_links leeg).'; end if;

  -- ── Nieuwe oefeningen, meteen met hun tekeningen ──
  insert into public.club_oefeningen
    (user_id, naam, spiergroep, materiaal, niveau, patroon, belast, uitleg, aandachtspunten, beeld_start, beeld_eind, beeld_bron, beeld_licentie)
  select uid, v.naam, v.spiergroep, v.materiaal, v.niveau, v.patroon, v.belast::text[], v.uitleg, v.aandachtspunten,
         v.beeld_start, v.beeld_eind, 'Everkinetic', 'CC BY-SA 4.0'
  from (values
    ('Schouders ophalen met dumbbells','schouders','dumbbell',1,'isolatie','{nek}',
     'Sta rechtop met een dumbbell naast elk been en je armen gestrekt. Trek je schouders recht omhoog richting je oren, houd even vast en laat ze rustig zakken.',
     'Niet met je schouders rollen, gewoon recht op en neer. Houd je nek lang en kijk recht vooruit.',
     '/club/oefeningen/0005-start.svg','/club/oefeningen/0005-eind.svg'),
    ('Upright row met dumbbells','schouders','dumbbell',2,'isolatie','{schouder}',
     'Houd de dumbbells voor je bovenbenen met je handpalmen naar je toe. Trek ze langs je lichaam omhoog tot je ellebogen op schouderhoogte zijn en laat ze gecontroleerd zakken.',
     'De ellebogen gaan voor, de handen volgen. Niet hoger dan schouderhoogte als je schouders gevoelig zijn.',
     '/club/oefeningen/0016-start.svg','/club/oefeningen/0016-eind.svg'),
    ('Front raise met dumbbells','schouders','dumbbell',1,'isolatie','{schouder}',
     'Sta met een dumbbell voor elk bovenbeen. Til om en om een arm gestrekt naar voren op tot net boven schouderhoogte en laat hem langzaam zakken.',
     'Geen zwaai vanuit je rug: kies liever een lichter gewicht. Een kleine buiging in de elleboog.',
     '/club/oefeningen/0033-start.svg','/club/oefeningen/0033-eind.svg'),
    ('Reverse fly liggend op een bank','schouders','dumbbell',1,'isolatie','{}',
     'Lig op je buik op een bank die zo hoog staat dat je armen vrij kunnen hangen. Til de dumbbells zijwaarts op tot schouderhoogte en laat ze rustig zakken.',
     'De bank neemt je onderrug het werk uit handen. Licht gewicht, ellebogen licht gebogen en vast.',
     '/club/oefeningen/0023-start.svg','/club/oefeningen/0023-eind.svg'),
    ('Reverse fly met elastiek','schouders','band',1,'isolatie','{}',
     'Maak het elastiek vast op borsthoogte en pak de uiteinden met gestrekte armen voor je. Breng je armen wijd naar achteren tot ze naast je lichaam zijn en laat ze gecontroleerd terug.',
     'Knijp je schouderbladen samen aan het eind van de beweging. Schouders laag, niet ophalen.',
     '/club/oefeningen/0020-start.svg','/club/oefeningen/0020-eind.svg'),
    ('Schuin bankdrukken met barbell','borst','barbell',2,'duwen_horizontaal','{schouder}',
     'Lig op een schuine bank en pak de stang iets breder dan schouderbreedte. Laat de stang zakken tot je bovenste borst en duw hem recht omhoog.',
     'Werk met een spotter of veiligheidssteunen bij zwaar gewicht. Billen op de bank, voeten stevig op de grond.',
     '/club/oefeningen/0043-start.svg','/club/oefeningen/0043-eind.svg'),
    ('Bankdrukken met smalle greep','triceps','barbell',2,'duwen_horizontaal','{schouder,elleboog}',
     'Lig op de bank en pak de stang met je handen ongeveer op schouderbreedte. Laat hem zakken naar je onderste borst met je ellebogen langs je lichaam en duw hem weer omhoog.',
     'Te smal pakken belast je polsen: schouderbreedte is genoeg. Werk met een spotter bij zwaar gewicht.',
     '/club/oefeningen/0049-start.svg','/club/oefeningen/0049-eind.svg'),
    ('Schuine dumbbell fly','borst','dumbbell',2,'isolatie','{schouder}',
     'Lig op een schuine bank met de dumbbells boven je borst en je handpalmen naar elkaar. Laat je armen in een wijde boog zakken en breng ze langs dezelfde weg terug.',
     'De ellebogen blijven licht gebogen. Stop bij een lichte rek in de borst, niet verder.',
     '/club/oefeningen/0062-start.svg','/club/oefeningen/0062-eind.svg'),
    ('Cable crossover','borst','kabel',2,'isolatie','{schouder}',
     'Zet de kabels hoog, pak de grepen en zet een stap naar voren met je romp licht voorover. Breng je handen in een boog naar beneden en naar elkaar toe voor je lichaam en laat ze rustig terug.',
     'De beweging komt uit je schouders, niet uit je ellebogen. Houd je romp stil.',
     '/club/oefeningen/0048-start.svg','/club/oefeningen/0048-eind.svg'),
    ('Dips voor de borst','borst','geen',3,'duwen_verticaal','{schouder,elleboog}',
     'Steun met gestrekte armen tussen de leggers en leun iets voorover. Zak gecontroleerd door je ellebogen te buigen en duw jezelf weer omhoog.',
     'Niet dieper dan je schouders toelaten. Nog te zwaar? Begin op de dipmachine of met een elastiek als hulp.',
     '/club/oefeningen/0054-start.svg','/club/oefeningen/0054-eind.svg'),
    ('Push-up met voeten verhoogd','borst','bank',2,'duwen_horizontaal','{schouder,pols}',
     'Zet je voeten op een bank en je handen iets breder dan je schouders op de grond. Zak met een recht lichaam tot je borst vlak boven de grond is en duw jezelf terug.',
     'Zwaarder dan een gewone push-up en meer voor de bovenste borst. Laat je heupen niet zakken.',
     '/club/oefeningen/0075-start.svg','/club/oefeningen/0075-eind.svg'),
    ('Pullover met dumbbell','borst','dumbbell',2,'isolatie','{schouder}',
     'Lig op een bank en houd een dumbbell met beide handen boven je borst. Laat hem met licht gebogen armen in een boog achter je hoofd zakken en breng hem terug boven je borst.',
     'Alleen zo ver als je schouders comfortabel toelaten. Houd je onderrug op de bank.',
     '/club/oefeningen/0046-start.svg','/club/oefeningen/0046-eind.svg'),
    ('Bankdrukken in de smith machine','borst','machine',1,'duwen_horizontaal','{schouder}',
     'Zet de bank zo dat de stang boven het midden van je borst hangt. Draai de stang los uit de haken, laat hem zakken tot je borst en duw hem weer omhoog.',
     'De geleiding geeft houvast, maar zet de veiligheidsstops wel op de juiste hoogte. Schouderbladen samen.',
     '/club/oefeningen/0078-start.svg','/club/oefeningen/0078-eind.svg'),
    ('T-bar row','rug','machine',2,'trekken_horizontaal','{rug}',
     'Sta over de T-bar met je knieën licht gebogen en buig voorover tot je borst bijna horizontaal is. Trek de grepen naar je borst en laat ze gecontroleerd zakken.',
     'Houd je rug recht, ook als je moe wordt. Kies een versie met borststeun als je onderrug gevoelig is.',
     '/club/oefeningen/0029-start.svg','/club/oefeningen/0029-eind.svg'),
    ('Lat pulldown met V-greep','rug','kabel',1,'trekken_verticaal','{schouder}',
     'Zit met je knieën onder de steun en pak de V-greep met je handpalmen naar elkaar. Trek de greep naar je bovenste borst en laat hem rustig terug omhoog.',
     'Leun een klein beetje achterover, niet meer. Trek met je ellebogen naar beneden, niet met je handen.',
     '/club/oefeningen/0096-start.svg','/club/oefeningen/0096-eind.svg'),
    ('Lat pulldown met onderhandse greep','rug','kabel',1,'trekken_verticaal','{schouder,elleboog}',
     'Pak de stang op schouderbreedte met je handpalmen naar je toe. Trek hem naar je bovenste borst met je ellebogen dicht langs je lichaam en laat hem gecontroleerd terug.',
     'Je biceps werken flink mee. Niet aan de stang hangen of zwaaien.',
     '/club/oefeningen/0093-start.svg','/club/oefeningen/0093-eind.svg'),
    ('Pull-up met neutrale greep','rug','geen',3,'trekken_verticaal','{schouder,elleboog}',
     'Hang aan de parallelle handgrepen met je handpalmen naar elkaar. Trek jezelf op tot je kin boven je handen komt en zak rustig tot je armen gestrekt zijn.',
     'Vaak prettiger voor schouders en ellebogen dan een gewone pull-up. Geen zwaai: liever minder herhalingen.',
     '/club/oefeningen/0090-start.svg','/club/oefeningen/0090-eind.svg'),
    ('Barbell row met onderhandse greep','rug','barbell',2,'trekken_horizontaal','{rug,elleboog}',
     'Buig vanuit je heupen voorover met je knieën licht gebogen en pak de stang met je handpalmen naar voren. Trek de stang naar je buik met je ellebogen langs je lichaam en laat hem gecontroleerd zakken.',
     'Rug recht en stil: kom niet omhoog om het gewicht te halen. Begin licht.',
     '/club/oefeningen/0026-start.svg','/club/oefeningen/0026-eind.svg'),
    ('Good morning','onderrug','barbell',3,'heupscharnier','{rug}',
     'Leg een stang op je bovenrug en sta met je knieën licht gebogen. Buig vanuit je heupen voorover met een rechte rug tot je romp bijna horizontaal is en kom weer rechtop.',
     'Een techniekoefening: begin met een lege stang of een stok. Stop eerder als je rug krom wordt.',
     '/club/oefeningen/0101-start.svg','/club/oefeningen/0101-eind.svg'),
    ('Lunge met barbell','benen','barbell',3,'lunge','{knie}',
     'Leg de stang op je bovenrug en zet een flinke pas naar voren. Zak tot je achterste knie bijna de grond raakt en duw jezelf terug naar de start.',
     'Vraagt goede balans: beheers eerst de lunge met dumbbells. Voorste knie in lijn met je tenen.',
     '/club/oefeningen/0114-start.svg','/club/oefeningen/0114-eind.svg'),
    ('Achterwaartse lunge met dumbbells','benen','dumbbell',2,'lunge','{knie}',
     'Sta met een dumbbell in elke hand. Stap met een been naar achteren en zak tot je achterste knie bijna de grond raakt, kom dan terug naar de start.',
     'Vaak vriendelijker voor de knie dan naar voren stappen. Houd je romp rechtop.',
     '/club/oefeningen/0129-start.svg','/club/oefeningen/0129-eind.svg'),
    ('Step-up met dumbbells','benen','dumbbell',2,'lunge','{knie}',
     'Sta voor een bank of opstapje met een dumbbell in elke hand. Stap op door je voorste been te strekken en stap gecontroleerd weer af.',
     'Duw vanuit de hiel van het bovenste been en zet niet af met het onderste. Kies een hoogte waarbij je knie niet boven je heup komt.',
     '/club/oefeningen/0137-start.svg','/club/oefeningen/0137-eind.svg'),
    ('Squat met dumbbells','benen','dumbbell',1,'squat','{knie}',
     'Sta met je voeten iets breder dan je heupen en een dumbbell naast elk been. Zak alsof je gaat zitten en kom weer omhoog.',
     'Borst omhoog en hielen aan de grond. Knieën in de richting van je tenen.',
     '/club/oefeningen/0130-start.svg','/club/oefeningen/0130-eind.svg'),
    ('Squat in de smith machine','benen','machine',2,'squat','{knie,rug}',
     'Ga onder de stang staan met de stang op je bovenrug en draai hem los uit de haken. Zak tot je bovenbenen ongeveer horizontaal zijn en duw jezelf terug omhoog.',
     'Zet je voeten iets voor de stang zodat je recht kunt zakken. Veiligheidsstops op de juiste hoogte.',
     '/club/oefeningen/0124-start.svg','/club/oefeningen/0124-eind.svg'),
    ('Sumo squat met dumbbell','benen','dumbbell',1,'squat','{knie,heup}',
     'Sta breed met je tenen schuin naar buiten en houd een dumbbell met beide handen tussen je benen. Zak recht naar beneden en kom weer omhoog.',
     'Knieën naar buiten, in lijn met je tenen. Houd je romp rechtop.',
     '/club/oefeningen/0152-start.svg','/club/oefeningen/0152-eind.svg'),
    ('Squat met elastiek','benen','band',1,'squat','{knie}',
     'Sta op het elastiek met je voeten op schouderbreedte en houd de uiteinden bij je schouders. Zak tot je bovenbenen ongeveer horizontaal zijn en kom weer omhoog.',
     'Handig voor thuis. Houd je voeten plat zodat het elastiek niet wegschiet.',
     '/club/oefeningen/0155-start.svg','/club/oefeningen/0155-eind.svg'),
    ('Leg curl staand','benen','machine',1,'isolatie','{}',
     'Sta aan de machine met het kussen net boven je enkel en houd de handgrepen vast. Buig je knie en breng je hiel naar je bil, laat hem rustig zakken. Wissel daarna van been.',
     'Bovenbeen en heup blijven stil. Laat het gewicht niet vallen op de weg terug.',
     '/club/oefeningen/0120-start.svg','/club/oefeningen/0120-eind.svg'),
    ('Adductie aan de kabel','benen','kabel',1,'isolatie','{heup}',
     'Maak een enkelband vast aan een lage kabel en sta er zijwaarts naast, met de band om het been aan de kant van de kabel. Trek dat been langs je standbeen naar binnen en laat het gecontroleerd terug.',
     'Houd je vast voor je balans. Kleine, rustige beweging.',
     '/club/oefeningen/0135-start.svg','/club/oefeningen/0135-eind.svg'),
    ('Kuitpers in de leg press','kuiten','machine',1,'isolatie','{enkel}',
     'Zit in de leg press met je voorvoeten op de onderrand van het plateau en je benen bijna gestrekt. Duw het plateau weg door op je tenen te komen en laat je hielen rustig terugzakken.',
     'Haal de vergrendeling pas los als je voeten stevig staan. Zet je knieën niet op slot.',
     '/club/oefeningen/0273-start.svg','/club/oefeningen/0273-eind.svg'),
    ('Concentratiecurl','biceps','dumbbell',1,'isolatie','{}',
     'Zit op een bank met je elleboog tegen de binnenkant van je bovenbeen. Krul de dumbbell naar je schouder en laat hem langzaam zakken.',
     'Je bovenarm blijft stil tegen je been. Strek onderin helemaal uit.',
     '/club/oefeningen/0220-start.svg','/club/oefeningen/0220-eind.svg'),
    ('Curl met EZ-stang','biceps','barbell',1,'isolatie','{elleboog}',
     'Sta rechtop en pak de EZ-stang op de schuine handgrepen, handpalmen naar voren. Krul de stang naar je borst en laat hem gecontroleerd zakken.',
     'De schuine greep is vaak prettiger voor je polsen. Ellebogen naast je lichaam en niet zwaaien.',
     '/club/oefeningen/0226-start.svg','/club/oefeningen/0226-eind.svg'),
    ('Preacher curl met barbell','biceps','barbell',2,'isolatie','{elleboog}',
     'Zet de bank zo dat je bovenarmen plat op het kussen liggen. Krul de stang omhoog en laat hem langzaam zakken tot je armen bijna gestrekt zijn.',
     'Onderin niet op slot en de stang niet laten vallen: daar is de elleboog kwetsbaar.',
     '/club/oefeningen/0239-start.svg','/club/oefeningen/0239-eind.svg'),
    ('Curl op een schuine bank','biceps','dumbbell',2,'isolatie','{elleboog,schouder}',
     'Zit op een schuine bank met je armen recht naar beneden. Krul om en om een dumbbell omhoog en laat hem langzaam zakken.',
     'Je bovenarm blijft achter je lichaam hangen. Kies een licht gewicht: de rek onderin is stevig.',
     '/club/oefeningen/0214-start.svg','/club/oefeningen/0214-eind.svg'),
    ('Biceps curl met elastiek','biceps','band',1,'isolatie','{}',
     'Sta op het elastiek en houd de uiteinden vast met je handpalmen naar voren. Krul om en om je handen naar je schouders en laat ze rustig terug.',
     'Ellebogen naast je lichaam. Korter vastpakken maakt het zwaarder.',
     '/club/oefeningen/0261-start.svg','/club/oefeningen/0261-eind.svg'),
    ('Triceps pushdown met touw','triceps','kabel',1,'isolatie','{elleboog}',
     'Sta voor een hoge kabel met een touw. Houd je ellebogen naast je lichaam, duw het touw naar beneden en trek de uiteinden onderin iets uit elkaar.',
     'Alleen je onderarmen bewegen. Hang niet voorover om meer gewicht te halen.',
     '/club/oefeningen/0206-start.svg','/club/oefeningen/0206-eind.svg'),
    ('Eenarmige triceps extension boven het hoofd','triceps','dumbbell',2,'isolatie','{elleboog,schouder}',
     'Zit rechtop met een dumbbell in een hand achter je hoofd, elleboog naar het plafond. Strek je arm omhoog en laat de dumbbell gecontroleerd terug achter je hoofd zakken.',
     'Je bovenarm blijft stil naast je hoofd. Ondersteun hem met je andere hand als dat helpt.',
     '/club/oefeningen/0173-start.svg','/club/oefeningen/0173-eind.svg'),
    ('Triceps extension liggend met dumbbell','triceps','dumbbell',2,'isolatie','{elleboog}',
     'Lig op een bank en houd een dumbbell met beide handen boven je borst. Buig je ellebogen en laat hem in een boog achter je hoofd zakken, strek dan weer.',
     'Je ellebogen wijzen naar het plafond en blijven op hun plek. Rustig tempo.',
     '/club/oefeningen/0181-start.svg','/club/oefeningen/0181-eind.svg'),
    ('Leg raise liggend','buik','geen',2,'core','{rug}',
     'Lig op je rug met je handen onder je billen. Til je gestrekte benen op tot ze ongeveer recht omhoog wijzen en laat ze langzaam zakken tot net boven de grond.',
     'Houd je onderrug tegen de grond. Lukt dat niet, buig dan je knieën een beetje.',
     '/club/oefeningen/0021-start.svg','/club/oefeningen/0021-eind.svg'),
    ('Crunch met draai','buik','geen',1,'core','{nek}',
     'Lig op je rug met je knieën gebogen en je handen bij je oren. Rol op en breng een elleboog richting de andere knie, zak terug en wissel van kant.',
     'Draai vanuit je romp en trek niet aan je hoofd. Rustig tempo.',
     '/club/oefeningen/0289-start.svg','/club/oefeningen/0289-eind.svg'),
    ('Fietsende crunch','buik','geen',2,'core','{nek}',
     'Lig op je rug met je benen opgetild en je handen bij je oren. Breng om en om een elleboog naar de andere knie terwijl je het andere been strekt, alsof je fietst.',
     'Liever langzaam en gecontroleerd dan snel. Je onderrug blijft op de grond.',
     '/club/oefeningen/0284-start.svg','/club/oefeningen/0284-eind.svg'),
    ('Crunch met benen op een bank','buik','bank',1,'core','{nek}',
     'Lig op je rug met je onderbenen op een bank en je knieën in een rechte hoek. Rol je schouders van de grond door je buik aan te spannen en zak rustig terug.',
     'Je onderrug blijft plat op de grond. Kijk schuin omhoog, kin niet op je borst.',
     '/club/oefeningen/0291-start.svg','/club/oefeningen/0291-eind.svg'),
    ('Reverse crunch','buik','geen',1,'core','{}',
     'Lig op je rug met je armen naast je en je knieën gebogen boven je heupen. Rol je bekken op zodat je billen net van de grond komen en zak gecontroleerd terug.',
     'Het werk komt uit je buik, niet uit een zwaai van je benen. Een kleine beweging is genoeg.',
     '/club/oefeningen/0287-start.svg','/club/oefeningen/0287-eind.svg'),
    ('Zijwaarts buigen met dumbbell','buik','dumbbell',1,'core','{rug}',
     'Sta rechtop met een dumbbell in een hand. Buig zijwaarts naar de kant van de dumbbell en kom weer rechtop door je andere zij aan te spannen. Wissel na de set van hand.',
     'Alleen zijwaarts, niet voor of achterover. Rustig en niet te ver.',
     '/club/oefeningen/0294-start.svg','/club/oefeningen/0294-eind.svg')
  ) as v(naam, spiergroep, materiaal, niveau, patroon, belast, uitleg, aandachtspunten, beeld_start, beeld_eind)
  where not exists (
    select 1 from public.club_oefeningen o where o.user_id = uid and lower(o.naam) = lower(v.naam)
  );
  get diagnostics toegevoegd = row_count;

  -- ── Paden bij alle gekoppelde oefeningen (bestaand en nieuw) ──
  update public.club_oefeningen o
  set beeld_start = '/club/oefeningen/' || v.id || '-start.svg',
      beeld_eind = '/club/oefeningen/' || v.id || '-eind.svg',
      beeld_bron = 'Everkinetic',
      beeld_licentie = 'CC BY-SA 4.0'
  from (values
    ('Chest press machine','0066'),
    ('Push-up','0077'),
    ('Bankdrukken met barbell','0042'),
    ('Dumbbell bankdrukken','0055'),
    ('Schuin bankdrukken met dumbbells','0061'),
    ('Dumbbell fly','0056'),
    ('Pull-up','0087'),
    ('Seated cable row','0025'),
    ('Eenarmige dumbbell row','0024'),
    ('Inverted row','0086'),
    ('Straight arm pulldown','0092'),
    ('Back extension','0103'),
    ('Superman','0105'),
    ('Lateral raise','0018'),
    ('Reverse fly','0032'),
    ('Dumbbell curl','0224'),
    ('Hammer curl','0227'),
    ('Barbell curl','0211'),
    ('Curl aan de kabel','0212'),
    ('Preacher curl machine','0236'),
    ('Triceps pushdown','0205'),
    ('Triceps extension boven het hoofd','0198'),
    ('Skull crusher','0183'),
    ('Dips aan de brug','0172'),
    ('Push-up met smalle handen','0188'),
    ('Triceps kickback','0204'),
    ('Leg press','0127'),
    ('Back squat','0122'),
    ('Front squat','0138'),
    ('Hack squat','0123'),
    ('Lunge met dumbbells','0115'),
    ('Walking lunge','0121'),
    ('Leg extension','0142'),
    ('Leg curl liggend','0117'),
    ('Leg curl zittend','0119'),
    ('Roemeense deadlift met dumbbells','0107'),
    ('Roemeense deadlift met barbell','0118'),
    ('Deadlift','0099'),
    ('Adductor machine','0157'),
    ('Abductor machine','0156'),
    ('Glute bridge','0109'),
    ('Kickback aan de kabel','0112'),
    ('Calf raise staand','0282'),
    ('Calf raise zittend','0279'),
    ('Zijplank','0113'),
    ('Schouders ophalen met dumbbells','0005'),
    ('Upright row met dumbbells','0016'),
    ('Front raise met dumbbells','0033'),
    ('Reverse fly liggend op een bank','0023'),
    ('Reverse fly met elastiek','0020'),
    ('Schuin bankdrukken met barbell','0043'),
    ('Bankdrukken met smalle greep','0049'),
    ('Schuine dumbbell fly','0062'),
    ('Cable crossover','0048'),
    ('Dips voor de borst','0054'),
    ('Push-up met voeten verhoogd','0075'),
    ('Pullover met dumbbell','0046'),
    ('Bankdrukken in de smith machine','0078'),
    ('T-bar row','0029'),
    ('Lat pulldown met V-greep','0096'),
    ('Lat pulldown met onderhandse greep','0093'),
    ('Pull-up met neutrale greep','0090'),
    ('Barbell row met onderhandse greep','0026'),
    ('Good morning','0101'),
    ('Lunge met barbell','0114'),
    ('Achterwaartse lunge met dumbbells','0129'),
    ('Step-up met dumbbells','0137'),
    ('Squat met dumbbells','0130'),
    ('Squat in de smith machine','0124'),
    ('Sumo squat met dumbbell','0152'),
    ('Squat met elastiek','0155'),
    ('Leg curl staand','0120'),
    ('Adductie aan de kabel','0135'),
    ('Kuitpers in de leg press','0273'),
    ('Concentratiecurl','0220'),
    ('Curl met EZ-stang','0226'),
    ('Preacher curl met barbell','0239'),
    ('Curl op een schuine bank','0214'),
    ('Biceps curl met elastiek','0261'),
    ('Triceps pushdown met touw','0206'),
    ('Eenarmige triceps extension boven het hoofd','0173'),
    ('Triceps extension liggend met dumbbell','0181'),
    ('Leg raise liggend','0021'),
    ('Crunch met draai','0289'),
    ('Fietsende crunch','0284'),
    ('Crunch met benen op een bank','0291'),
    ('Reverse crunch','0287'),
    ('Zijwaarts buigen met dumbbell','0294')
  ) as v(naam, id)
  where o.user_id = uid
    and lower(o.naam) = lower(v.naam)
    and (o.beeld_bron is null or o.beeld_bron = 'Everkinetic');
  get diagnostics bijgewerkt = row_count;

  raise notice 'Oefeningen toegevoegd: %, met beeld bijgewerkt: %', toegevoegd, bijgewerkt;
end $$;
