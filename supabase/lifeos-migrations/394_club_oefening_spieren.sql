-- ─── Fit Factory clubsoftware: spieren per oefening ──────────────────────────
-- Fijner dan de grove spiergroep: niet "benen" maar quadriceps, hamstrings en
-- bilspieren. Twee kolommen op club_oefeningen:
--   spieren_primair    waar de oefening vooral op werkt (minstens een)
--   spieren_secundair  spieren die meewerken
-- Alleen sleutels uit de vaste lijst (src/lib/club/training/spieren.ts), en een
-- spier staat nooit in beide lijsten.
--
-- Daarna de spieren voor alle 146 oefeningen uit de startbibliotheek (382 en
-- 391), op naam. Ingedeeld volgens gangbare oefenfysiologie: primair is de
-- spier die de beweging vooral draagt, secundair wat duidelijk meehelpt of
-- stabiliseert. Bij cardio is "hart en longen" primair.
--
-- Idempotent: kolommen en controles met "if not exists", en de spieren worden
-- alleen ingevuld bij oefeningen die nog geen primaire spieren hebben. Opnieuw
-- draaien is veilig en overschrijft niets wat een trainer heeft aangepast.

alter table public.club_oefeningen add column if not exists spieren_primair text[] not null default '{}';
alter table public.club_oefeningen add column if not exists spieren_secundair text[] not null default '{}';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'club_oefeningen_spieren_lijst') then
    alter table public.club_oefeningen add constraint club_oefeningen_spieren_lijst check (
      spieren_primair <@ array['borstspieren','voorste_schouder','middelste_schouder','achterste_schouder','trapezius','latissimus','rhomboideus','onderrug','biceps','triceps','onderarmen','rechte_buikspier','schuine_buikspieren','diepe_buikspier','heupbuigers','bilspieren','quadriceps','hamstrings','adductoren','abductoren','kuiten','scheenbeenspier','hart_longen']::text[]
      and spieren_secundair <@ array['borstspieren','voorste_schouder','middelste_schouder','achterste_schouder','trapezius','latissimus','rhomboideus','onderrug','biceps','triceps','onderarmen','rechte_buikspier','schuine_buikspieren','diepe_buikspier','heupbuigers','bilspieren','quadriceps','hamstrings','adductoren','abductoren','kuiten','scheenbeenspier','hart_longen']::text[]
    );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'club_oefeningen_spieren_apart') then
    alter table public.club_oefeningen add constraint club_oefeningen_spieren_apart check (
      not (spieren_primair && spieren_secundair)
      and cardinality(spieren_primair) <= 6
      and cardinality(spieren_secundair) <= 8
    );
  end if;
end $$;

do $$
declare
  bijgewerkt int;
begin
  update public.club_oefeningen o
  set spieren_primair = v.primair::text[], spieren_secundair = v.secundair::text[]
  from (values
    ('Chest press machine', '{borstspieren}', '{voorste_schouder,triceps}'),
    ('Push-up', '{borstspieren}', '{voorste_schouder,triceps,rechte_buikspier}'),
    ('Push-up op knieën', '{borstspieren}', '{voorste_schouder,triceps,rechte_buikspier}'),
    ('Bankdrukken met barbell', '{borstspieren}', '{voorste_schouder,triceps}'),
    ('Dumbbell bankdrukken', '{borstspieren}', '{voorste_schouder,triceps}'),
    ('Schuin bankdrukken met dumbbells', '{borstspieren}', '{voorste_schouder,triceps}'),
    ('Cable fly', '{borstspieren}', '{voorste_schouder}'),
    ('Pec deck', '{borstspieren}', '{voorste_schouder}'),
    ('Dumbbell fly', '{borstspieren}', '{voorste_schouder}'),
    ('Lat pulldown', '{latissimus}', '{biceps,rhomboideus,achterste_schouder}'),
    ('Assisted pull-up', '{latissimus}', '{biceps,rhomboideus,achterste_schouder}'),
    ('Pull-up', '{latissimus}', '{biceps,rhomboideus,achterste_schouder,onderarmen}'),
    ('Chin-up', '{latissimus,biceps}', '{rhomboideus,achterste_schouder,onderarmen}'),
    ('Seated cable row', '{rhomboideus,latissimus}', '{trapezius,achterste_schouder,biceps}'),
    ('Seated row machine', '{rhomboideus,latissimus}', '{trapezius,achterste_schouder,biceps}'),
    ('Eenarmige dumbbell row', '{latissimus,rhomboideus}', '{trapezius,achterste_schouder,biceps}'),
    ('Barbell row', '{latissimus,rhomboideus}', '{trapezius,achterste_schouder,biceps,onderrug}'),
    ('Row op een schuine bank', '{rhomboideus,latissimus}', '{trapezius,achterste_schouder,biceps}'),
    ('Inverted row', '{rhomboideus,latissimus}', '{trapezius,achterste_schouder,biceps}'),
    ('Row met elastiek', '{rhomboideus,latissimus}', '{trapezius,achterste_schouder,biceps}'),
    ('Face pull', '{achterste_schouder}', '{rhomboideus,trapezius}'),
    ('Straight arm pulldown', '{latissimus}', '{triceps}'),
    ('Back extension', '{onderrug}', '{bilspieren,hamstrings}'),
    ('Superman', '{onderrug}', '{bilspieren}'),
    ('Shoulder press machine', '{voorste_schouder}', '{middelste_schouder,triceps}'),
    ('Dumbbell shoulder press', '{voorste_schouder}', '{middelste_schouder,triceps}'),
    ('Overhead press', '{voorste_schouder}', '{middelste_schouder,triceps,trapezius,diepe_buikspier}'),
    ('Landmine press', '{voorste_schouder}', '{borstspieren,triceps}'),
    ('Lateral raise', '{middelste_schouder}', '{trapezius}'),
    ('Lateral raise aan de kabel', '{middelste_schouder}', '{trapezius}'),
    ('Reverse fly', '{achterste_schouder}', '{rhomboideus,trapezius}'),
    ('Band pull-apart', '{achterste_schouder}', '{rhomboideus,trapezius}'),
    ('Pike push-up', '{voorste_schouder}', '{middelste_schouder,triceps}'),
    ('Dumbbell curl', '{biceps}', '{onderarmen}'),
    ('Hammer curl', '{biceps,onderarmen}', '{}'),
    ('Barbell curl', '{biceps}', '{onderarmen}'),
    ('Curl aan de kabel', '{biceps}', '{onderarmen}'),
    ('Preacher curl machine', '{biceps}', '{onderarmen}'),
    ('Triceps pushdown', '{triceps}', '{}'),
    ('Triceps extension boven het hoofd', '{triceps}', '{}'),
    ('Skull crusher', '{triceps}', '{}'),
    ('Dips op een bank', '{triceps}', '{borstspieren,voorste_schouder}'),
    ('Dips aan de brug', '{triceps,borstspieren}', '{voorste_schouder}'),
    ('Push-up met smalle handen', '{triceps}', '{borstspieren,voorste_schouder}'),
    ('Triceps kickback', '{triceps}', '{}'),
    ('Leg press', '{quadriceps,bilspieren}', '{adductoren,hamstrings}'),
    ('Goblet squat', '{quadriceps,bilspieren}', '{adductoren,hamstrings,diepe_buikspier}'),
    ('Squat met lichaamsgewicht', '{quadriceps,bilspieren}', '{adductoren,hamstrings}'),
    ('Squat naar een bank', '{quadriceps,bilspieren}', '{adductoren,hamstrings}'),
    ('Back squat', '{quadriceps,bilspieren}', '{adductoren,hamstrings,onderrug}'),
    ('Front squat', '{quadriceps,bilspieren}', '{adductoren,onderrug,diepe_buikspier}'),
    ('Hack squat', '{quadriceps}', '{bilspieren,adductoren}'),
    ('Wall sit', '{quadriceps}', '{bilspieren,adductoren}'),
    ('Lunge met dumbbells', '{quadriceps,bilspieren}', '{hamstrings,adductoren,abductoren}'),
    ('Achterwaartse lunge', '{bilspieren,quadriceps}', '{hamstrings,adductoren,abductoren}'),
    ('Bulgarian split squat', '{quadriceps,bilspieren}', '{hamstrings,adductoren,abductoren}'),
    ('Step-up', '{quadriceps,bilspieren}', '{hamstrings,abductoren,kuiten}'),
    ('Walking lunge', '{quadriceps,bilspieren}', '{hamstrings,adductoren,abductoren}'),
    ('Leg extension', '{quadriceps}', '{}'),
    ('Leg curl liggend', '{hamstrings}', '{kuiten}'),
    ('Leg curl zittend', '{hamstrings}', '{kuiten}'),
    ('Roemeense deadlift met dumbbells', '{hamstrings,bilspieren}', '{onderrug,adductoren}'),
    ('Roemeense deadlift met barbell', '{hamstrings,bilspieren}', '{onderrug,adductoren}'),
    ('Deadlift', '{bilspieren,hamstrings,onderrug}', '{quadriceps,adductoren,trapezius,onderarmen}'),
    ('Adductor machine', '{adductoren}', '{}'),
    ('Hip thrust met barbell', '{bilspieren}', '{hamstrings,quadriceps}'),
    ('Hip thrust machine', '{bilspieren}', '{hamstrings,quadriceps}'),
    ('Glute bridge', '{bilspieren}', '{hamstrings}'),
    ('Glute bridge op een been', '{bilspieren}', '{hamstrings,abductoren}'),
    ('Kickback aan de kabel', '{bilspieren}', '{hamstrings}'),
    ('Abductor machine', '{abductoren}', '{bilspieren}'),
    ('Zijwaarts stappen met elastiek', '{abductoren}', '{bilspieren}'),
    ('Calf raise staand', '{kuiten}', '{}'),
    ('Calf raise zittend', '{kuiten}', '{}'),
    ('Calf raise op een trede', '{kuiten}', '{}'),
    ('Plank', '{rechte_buikspier,diepe_buikspier}', '{schuine_buikspieren,voorste_schouder}'),
    ('Zijplank', '{schuine_buikspieren}', '{diepe_buikspier,abductoren}'),
    ('Dead bug', '{diepe_buikspier,rechte_buikspier}', '{heupbuigers}'),
    ('Bird dog', '{onderrug,diepe_buikspier}', '{bilspieren,schuine_buikspieren}'),
    ('Crunch', '{rechte_buikspier}', '{schuine_buikspieren}'),
    ('Pallof press', '{schuine_buikspieren,diepe_buikspier}', '{rechte_buikspier}'),
    ('Cable crunch', '{rechte_buikspier}', '{schuine_buikspieren}'),
    ('Hanging knee raise', '{rechte_buikspier,heupbuigers}', '{schuine_buikspieren,onderarmen}'),
    ('Russian twist', '{schuine_buikspieren}', '{rechte_buikspier,heupbuigers}'),
    ('Ab wheel rollout', '{rechte_buikspier,diepe_buikspier}', '{latissimus,schuine_buikspieren}'),
    ('Farmer walk', '{onderarmen,trapezius}', '{diepe_buikspier,schuine_buikspieren}'),
    ('Turkish get-up', '{voorste_schouder,diepe_buikspier,bilspieren}', '{schuine_buikspieren,triceps,quadriceps}'),
    ('Kettlebell swing', '{bilspieren,hamstrings}', '{onderrug,diepe_buikspier}'),
    ('Thruster met dumbbells', '{quadriceps,bilspieren,voorste_schouder}', '{triceps,middelste_schouder,adductoren}'),
    ('Burpee', '{hart_longen,quadriceps,bilspieren}', '{borstspieren,triceps,voorste_schouder,rechte_buikspier}'),
    ('Squat jump', '{quadriceps,bilspieren}', '{kuiten,hamstrings}'),
    ('Box jump', '{quadriceps,bilspieren}', '{kuiten,hamstrings}'),
    ('Mountain climber', '{rechte_buikspier,heupbuigers}', '{diepe_buikspier,voorste_schouder,hart_longen}'),
    ('Medicine ball slam', '{latissimus,rechte_buikspier}', '{triceps,voorste_schouder,bilspieren}'),
    ('Battle ropes', '{voorste_schouder,hart_longen}', '{middelste_schouder,onderarmen,diepe_buikspier}'),
    ('Wandelen op de loopband', '{hart_longen}', '{quadriceps,bilspieren,kuiten,scheenbeenspier}'),
    ('Hardlopen op de loopband', '{hart_longen}', '{quadriceps,hamstrings,bilspieren,kuiten,heupbuigers}'),
    ('Crosstrainer', '{hart_longen}', '{quadriceps,bilspieren,hamstrings}'),
    ('Hometrainer', '{hart_longen}', '{quadriceps,bilspieren,kuiten}'),
    ('Roeiergometer', '{hart_longen}', '{quadriceps,bilspieren,hamstrings,latissimus,rhomboideus}'),
    ('Traploper', '{hart_longen}', '{quadriceps,bilspieren,kuiten}'),
    ('Airbike', '{hart_longen}', '{quadriceps,bilspieren,voorste_schouder,latissimus}'),
    ('Touwtjespringen', '{hart_longen}', '{kuiten,quadriceps}'),
    ('Schouders ophalen met dumbbells', '{trapezius}', '{onderarmen}'),
    ('Upright row met dumbbells', '{middelste_schouder,trapezius}', '{voorste_schouder,biceps}'),
    ('Front raise met dumbbells', '{voorste_schouder}', '{borstspieren}'),
    ('Reverse fly liggend op een bank', '{achterste_schouder}', '{rhomboideus,trapezius}'),
    ('Reverse fly met elastiek', '{achterste_schouder}', '{rhomboideus,trapezius}'),
    ('Schuin bankdrukken met barbell', '{borstspieren}', '{voorste_schouder,triceps}'),
    ('Bankdrukken met smalle greep', '{triceps,borstspieren}', '{voorste_schouder}'),
    ('Schuine dumbbell fly', '{borstspieren}', '{voorste_schouder}'),
    ('Cable crossover', '{borstspieren}', '{voorste_schouder}'),
    ('Dips voor de borst', '{borstspieren}', '{triceps,voorste_schouder}'),
    ('Push-up met voeten verhoogd', '{borstspieren}', '{voorste_schouder,triceps,rechte_buikspier}'),
    ('Pullover met dumbbell', '{borstspieren,latissimus}', '{triceps}'),
    ('Bankdrukken in de smith machine', '{borstspieren}', '{voorste_schouder,triceps}'),
    ('T-bar row', '{latissimus,rhomboideus}', '{trapezius,achterste_schouder,biceps,onderrug}'),
    ('Lat pulldown met V-greep', '{latissimus}', '{biceps,rhomboideus,achterste_schouder}'),
    ('Lat pulldown met onderhandse greep', '{latissimus}', '{biceps,rhomboideus,achterste_schouder}'),
    ('Pull-up met neutrale greep', '{latissimus}', '{biceps,rhomboideus,achterste_schouder,onderarmen}'),
    ('Barbell row met onderhandse greep', '{latissimus,rhomboideus}', '{biceps,trapezius,achterste_schouder,onderrug}'),
    ('Good morning', '{onderrug,hamstrings}', '{bilspieren,adductoren}'),
    ('Lunge met barbell', '{quadriceps,bilspieren}', '{hamstrings,adductoren,abductoren}'),
    ('Achterwaartse lunge met dumbbells', '{bilspieren,quadriceps}', '{hamstrings,adductoren,abductoren}'),
    ('Step-up met dumbbells', '{quadriceps,bilspieren}', '{hamstrings,abductoren,kuiten}'),
    ('Squat met dumbbells', '{quadriceps,bilspieren}', '{adductoren,hamstrings}'),
    ('Squat in de smith machine', '{quadriceps,bilspieren}', '{adductoren,hamstrings}'),
    ('Sumo squat met dumbbell', '{quadriceps,bilspieren,adductoren}', '{hamstrings}'),
    ('Squat met elastiek', '{quadriceps,bilspieren}', '{adductoren,hamstrings}'),
    ('Leg curl staand', '{hamstrings}', '{kuiten}'),
    ('Adductie aan de kabel', '{adductoren}', '{}'),
    ('Kuitpers in de leg press', '{kuiten}', '{}'),
    ('Concentratiecurl', '{biceps}', '{onderarmen}'),
    ('Curl met EZ-stang', '{biceps}', '{onderarmen}'),
    ('Preacher curl met barbell', '{biceps}', '{onderarmen}'),
    ('Curl op een schuine bank', '{biceps}', '{onderarmen}'),
    ('Biceps curl met elastiek', '{biceps}', '{onderarmen}'),
    ('Triceps pushdown met touw', '{triceps}', '{}'),
    ('Eenarmige triceps extension boven het hoofd', '{triceps}', '{}'),
    ('Triceps extension liggend met dumbbell', '{triceps}', '{}'),
    ('Leg raise liggend', '{rechte_buikspier,heupbuigers}', '{diepe_buikspier}'),
    ('Crunch met draai', '{schuine_buikspieren}', '{rechte_buikspier}'),
    ('Fietsende crunch', '{schuine_buikspieren,rechte_buikspier}', '{heupbuigers}'),
    ('Crunch met benen op een bank', '{rechte_buikspier}', '{schuine_buikspieren}'),
    ('Reverse crunch', '{rechte_buikspier}', '{heupbuigers}'),
    ('Zijwaarts buigen met dumbbell', '{schuine_buikspieren}', '{onderrug}')
  ) as v(naam, primair, secundair)
  where lower(o.naam) = lower(v.naam)
    and cardinality(o.spieren_primair) = 0;
  get diagnostics bijgewerkt = row_count;
  raise notice 'Spieren ingevuld bij % oefeningen.', bijgewerkt;
end $$;
