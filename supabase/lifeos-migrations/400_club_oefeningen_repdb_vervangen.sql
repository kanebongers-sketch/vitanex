-- ─── Fit Factory clubsoftware: overal dezelfde beeldstijl (alleen RepDB) ─────
-- Besluit eigenaar: in de oefenbibliotheek staan alleen nog RepDB-illustraties.
-- 1. Vijf nieuwe oefeningen met een RepDB-beeld, als dichtstbijzijnde vervanger
--    van een oefening zonder passend RepDB-beeld. Eigen korte Nederlandse uitleg
--    en aandachtspunten (niets vertaald of overgenomen uit de dataset).
-- 2. Sumo squat met dumbbell krijgt alsnog een RepDB-beeld: RepDB toont dezelfde
--    beweging met een dumbbell tussen de benen. Die oefening blijft actief.
-- 3. In club_schema_oefeningen gaan verwijzingen van een oude oefening naar de
--    vervanger, zodat bestaande schema's het nieuwe beeld krijgen.
-- 4. De 16 oude oefeningen gaan op inactief. Er wordt niets verwijderd.
--
-- Keuze per oefening: zelfde beweging, zo dicht mogelijk materiaal. Zie
-- REPDB_VERVANGING en REPDB_KOPPELING_400 in src/lib/club/training/beelden-repdb.ts.
-- Bron: RepDB, gratis versie (repdb.co); zie public/club/oefeningen-repdb/ATTRIBUTION.txt.
-- Ophalen: node scripts/club/repdb-import.mjs
--
-- Idempotent: nieuwe oefeningen alleen als de naam nog niet bestaat (hoofdletters
-- tellen niet), beeldpaden alleen bij oefeningen zonder beeld of met een beeld
-- van Everkinetic of RepDB, verwijzingen alleen als de oude oefening nog ergens
-- in een schema staat. Opnieuw draaien is veilig.

do $$
declare
  uid uuid;
  toegevoegd int;
  bijgewerkt int;
  omgezet int;
  uitgezet int;
begin
  select user_id into uid from public.pt_lead_links limit 1;
  if uid is null then raise exception 'Geen LifeOS-gebruiker gevonden (pt_lead_links leeg).'; end if;

  -- ── 1. Nieuwe oefeningen, meteen met hun RepDB-beeld ──
  insert into public.club_oefeningen
    (user_id, naam, spiergroep, materiaal, niveau, patroon, belast, spieren_primair, spieren_secundair,
     uitleg, aandachtspunten, beeld_start, beeld_eind, beeld_bron, beeld_licentie)
  select uid, v.naam, v.spiergroep, v.materiaal, v.niveau, v.patroon, v.belast::text[],
         v.primair::text[], v.secundair::text[], v.uitleg, v.aandachtspunten,
         '/club/oefeningen-repdb/' || v.id || '-start.webp',
         '/club/oefeningen-repdb/' || v.id || '-eind.webp',
         'RepDB', 'RepDB gratis (bronvermelding)'
  from (values
    ('Adductie staand met elastiek','benen','band',1,'isolatie','{heup}','{adductoren}','{}',
     'Maak het elastiek laag vast en doe de lus om de enkel aan de kant van het anker. Sta zijwaarts met een hand tegen de muur, begin met je werkbeen iets naar buiten en trek het gestrekt naar binnen langs je standbeen. Laat het rustig terugkomen.',
     'Je bovenlichaam blijft recht, alleen je been beweegt. Tenen naar voren en de weg terug net zo langzaam als de weg naar binnen.',
     'banded-standing-hip-adduction'),
    ('Calf raise met lichaamsgewicht','kuiten','geen',1,'isolatie','{enkel}','{kuiten}','{}',
     'Sta rechtop met je voeten op heupbreedte. Kom via je voorvoeten zo hoog mogelijk op je tenen, houd even vast en laat je hielen rustig zakken tot op de grond.',
     'Knieen recht maar niet op slot. Duw vooral via je grote teen omhoog en houd een muur vast als je balans wiebelt.',
     'bodyweight-calf-raise'),
    ('Squat met elastiek boven de knieen','benen','band',1,'squat','{knie}','{quadriceps,bilspieren}','{abductoren,hamstrings}',
     'Doe een minibandje om je benen net boven je knieen en sta op schouderbreedte. Zak in een squat tot je bovenbenen ongeveer horizontaal zijn en kom weer omhoog, terwijl je de knieen tegen het elastiek in naar buiten blijft duwen.',
     'Laat het elastiek je knieen niet naar binnen trekken. Borst omhoog en je gewicht verdeeld over je hele voet.',
     'banded-squat'),
    ('Thruster met barbell','hele_lichaam','barbell',3,'squat','{knie,schouder,pols}','{quadriceps,bilspieren,voorste_schouder}','{triceps,middelste_schouder,trapezius,adductoren}',
     'Houd de stang voor op je schouders met je handen net buiten schouderbreedte. Zak in een front squat en duw de stang in een vloeiende beweging vanuit je benen recht boven je hoofd. Laat hem gecontroleerd terugkomen op je schouders.',
     'Begin licht: de techniek is belangrijker dan het gewicht. Ellebogen hoog in de squat en bovenin geen holle rug.',
     'thruster'),
    ('Walking lunge met lichaamsgewicht','benen','geen',1,'lunge','{knie}','{quadriceps,bilspieren}','{hamstrings,adductoren,abductoren}',
     'Zet je handen in je zij en stap een flinke pas naar voren. Zak tot je achterste knie bijna de grond raakt, duw via je voorste hiel omhoog en stap door naar de volgende lunge.',
     'Loop op heupbreedte, niet op een lijn. Romp rechtop en elke stap even rustig, ook aan het eind van de baan.',
     'walking-lunge')
  ) as v(naam, spiergroep, materiaal, niveau, patroon, belast, primair, secundair, uitleg, aandachtspunten, id)
  where not exists (
    select 1 from public.club_oefeningen o where o.user_id = uid and lower(o.naam) = lower(v.naam)
  );
  get diagnostics toegevoegd = row_count;

  -- ── 2. Sumo squat met dumbbell: alsnog een RepDB-beeld ──
  update public.club_oefeningen o
  set beeld_start = '/club/oefeningen-repdb/db-sumo-squat-start.webp',
      beeld_eind = '/club/oefeningen-repdb/db-sumo-squat-eind.webp',
      beeld_bron = 'RepDB',
      beeld_licentie = 'RepDB gratis (bronvermelding)'
  where o.user_id = uid
    and lower(o.naam) = lower('Sumo squat met dumbbell')
    and (o.beeld_bron is null or o.beeld_bron in ('Everkinetic', 'RepDB'));
  get diagnostics bijgewerkt = row_count;

  -- ── 3 en 4. Oude oefening naar vervanger: schema's omzetten, oude op inactief ──
  create temporary table vervanging (oud text, nieuw text) on commit drop;
  insert into vervanging values
    ('Cable fly','Cable crossover'),
    ('Row met elastiek','Seated cable row'),
    ('Dips aan de brug','Dips voor de borst'),
    ('Walking lunge','Walking lunge met lichaamsgewicht'),
    ('Calf raise op een trede','Calf raise met lichaamsgewicht'),
    ('Thruster met dumbbells','Thruster met barbell'),
    ('Reverse fly liggend op een bank','Reverse fly'),
    ('Reverse fly met elastiek','Band pull-apart'),
    ('Step-up met dumbbells','Step-up'),
    ('Squat met elastiek','Squat met elastiek boven de knieen'),
    ('Leg curl staand','Leg curl liggend'),
    ('Adductie aan de kabel','Adductie staand met elastiek'),
    ('Kuitpers in de leg press','Calf raise staand'),
    ('Biceps curl met elastiek','Curl aan de kabel'),
    ('Triceps pushdown met touw','Triceps pushdown'),
    ('Crunch met benen op een bank','Crunch');

  -- Elke vervanger moet bestaan en een RepDB-beeld hebben, anders stoppen.
  if exists (
    select 1 from vervanging v
    where not exists (
      select 1 from public.club_oefeningen n
      where n.user_id = uid and lower(n.naam) = lower(v.nieuw) and n.beeld_bron = 'RepDB'
    )
  ) then
    raise exception 'Niet elke vervangende oefening bestaat met een RepDB-beeld.';
  end if;

  update public.club_schema_oefeningen s
  set oefening_id = n.id
  from vervanging v
  join public.club_oefeningen o on o.user_id = uid and lower(o.naam) = lower(v.oud)
  join public.club_oefeningen n on n.user_id = uid and lower(n.naam) = lower(v.nieuw)
  where s.oefening_id = o.id;
  get diagnostics omgezet = row_count;

  update public.club_oefeningen o
  set actief = false
  from vervanging v
  where o.user_id = uid and lower(o.naam) = lower(v.oud) and o.actief;
  get diagnostics uitgezet = row_count;

  -- Vervangers staan aan (voor het geval een trainer er een had uitgezet).
  update public.club_oefeningen n
  set actief = true
  from vervanging v
  where n.user_id = uid and lower(n.naam) = lower(v.nieuw) and not n.actief;

  raise notice 'Nieuw: % (verwacht 5), Sumo squat met RepDB-beeld: %, schemaregels omgezet: %, op inactief: % (verwacht 16)',
    toegevoegd, bijgewerkt, omgezet, uitgezet;
end $$;
