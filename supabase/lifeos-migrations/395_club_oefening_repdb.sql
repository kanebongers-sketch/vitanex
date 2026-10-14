-- ─── Fit Factory clubsoftware: RepDB als hoofdbron voor beelden bij oefeningen ───
-- 1. De controle op beeldpaden laat nu twee bronnen toe:
--    /club/oefeningen/NNNN-start.svg en -eind.svg (Everkinetic, migratie 391) en
--    /club/oefeningen-repdb/<slug>-start.webp en -eind.webp (RepDB).
-- 2. 129 oefeningen krijgen een RepDB-illustratie (een stijl per oefening).
--    Handmatig gekoppeld op beweging en materiaal, zie
--    src/lib/club/training/beelden-repdb.ts. Oefeningen zonder RepDB-match
--    houden hun Everkinetic-tekening of blijven zonder beeld.
--
-- Bron: RepDB, gratis versie (repdb.co, github.com/RepDB/exercise-dataset).
-- Licentie: gratis ook commercieel in een app, met zichtbare bronvermelding
-- "Exercise data by RepDB (repdb.co)"; zie public/club/oefeningen-repdb/ATTRIBUTION.txt.
-- Ophalen: node scripts/club/repdb-import.mjs
--
-- Idempotent: de controle wordt steeds opnieuw gezet, paden alleen bij
-- oefeningen zonder beeld of met een beeld van Everkinetic of RepDB.
-- Opnieuw draaien is veilig.

alter table public.club_oefeningen add column if not exists beeld_start text;
alter table public.club_oefeningen add column if not exists beeld_eind text;
alter table public.club_oefeningen add column if not exists beeld_bron text;
alter table public.club_oefeningen add column if not exists beeld_licentie text;

alter table public.club_oefeningen drop constraint if exists club_oefeningen_beeld_pad;
alter table public.club_oefeningen add constraint club_oefeningen_beeld_pad check (
  (beeld_start is null
    or beeld_start ~ '^/club/oefeningen/[0-9]{4}-start\.svg$'
    or beeld_start ~ '^/club/oefeningen-repdb/[a-z0-9]+(-[a-z0-9]+)*-start\.webp$')
  and (beeld_eind is null
    or beeld_eind ~ '^/club/oefeningen/[0-9]{4}-eind\.svg$'
    or beeld_eind ~ '^/club/oefeningen-repdb/[a-z0-9]+(-[a-z0-9]+)*-eind\.webp$')
);

do $$
declare
  uid uuid;
  bijgewerkt int;
begin
  select user_id into uid from public.pt_lead_links limit 1;
  if uid is null then raise exception 'Geen LifeOS-gebruiker gevonden (pt_lead_links leeg).'; end if;

  update public.club_oefeningen o
  set beeld_start = '/club/oefeningen-repdb/' || v.id || '-start.webp',
      beeld_eind = '/club/oefeningen-repdb/' || v.id || '-eind.webp',
      beeld_bron = 'RepDB',
      beeld_licentie = 'RepDB gratis (bronvermelding)'
  from (values
    ('Chest press machine','chest-press-machine'),
    ('Push-up','push-up'),
    ('Push-up op knieën','knee-push-ups'),
    ('Bankdrukken met barbell','bench-press'),
    ('Dumbbell bankdrukken','db-bench-press'),
    ('Schuin bankdrukken met dumbbells','incline-db-press'),
    ('Pec deck','pec-deck'),
    ('Dumbbell fly','db-fly'),
    ('Schuin bankdrukken met barbell','incline-bench-press'),
    ('Schuine dumbbell fly','incline-dumbbell-fly'),
    ('Cable crossover','cable-fly'),
    ('Dips voor de borst','dips'),
    ('Push-up met voeten verhoogd','decline-push-up'),
    ('Pullover met dumbbell','db-pullover'),
    ('Bankdrukken in de smith machine','smith-machine-bench-press'),
    ('Lat pulldown','lat-pulldown'),
    ('Assisted pull-up','assisted-pull-ups'),
    ('Pull-up','pull-up'),
    ('Chin-up','chin-ups'),
    ('Seated cable row','seated-cable-row'),
    ('Seated row machine','chest-supported-machine-row'),
    ('Eenarmige dumbbell row','single-arm-db-row'),
    ('Barbell row','barbell-row'),
    ('Row op een schuine bank','chest-supported-db-row'),
    ('Inverted row','inverted-row'),
    ('Straight arm pulldown','straight-arm-pulldown'),
    ('Back extension','back-extension'),
    ('Superman','superman'),
    ('T-bar row','t-bar-row'),
    ('Lat pulldown met V-greep','v-bar-lat-pulldown'),
    ('Lat pulldown met onderhandse greep','reverse-grip-lat-pulldown'),
    ('Pull-up met neutrale greep','neutral-grip-pull-ups'),
    ('Barbell row met onderhandse greep','reverse-grip-bent-over-row'),
    ('Good morning','good-morning'),
    ('Face pull','face-pull'),
    ('Shoulder press machine','machine-shoulder-press'),
    ('Dumbbell shoulder press','seated-db-press'),
    ('Overhead press','ohp'),
    ('Landmine press','landmine-press'),
    ('Lateral raise','lateral-raise'),
    ('Lateral raise aan de kabel','cable-lateral-raise'),
    ('Reverse fly','dumbbell-reverse-fly'),
    ('Band pull-apart','band-pull-apart'),
    ('Pike push-up','pike-push-ups'),
    ('Schouders ophalen met dumbbells','db-shrug'),
    ('Upright row met dumbbells','dumbbell-upright-row'),
    ('Front raise met dumbbells','dumbbell-front-raise'),
    ('Dumbbell curl','bicep-curl'),
    ('Hammer curl','hammer-curl'),
    ('Barbell curl','barbell-curl'),
    ('Curl aan de kabel','cable-curl'),
    ('Preacher curl machine','machine-preacher-curl'),
    ('Concentratiecurl','concentration-curl'),
    ('Curl met EZ-stang','ez-bar-curl'),
    ('Preacher curl met barbell','barbell-preacher-curl'),
    ('Curl op een schuine bank','incline-db-curl'),
    ('Triceps pushdown','tricep-pushdown'),
    ('Triceps extension boven het hoofd','overhead-tricep-extension'),
    ('Skull crusher','skull-crusher'),
    ('Dips op een bank','bench-dips'),
    ('Push-up met smalle handen','close-grip-push-ups'),
    ('Triceps kickback','tricep-kickback'),
    ('Bankdrukken met smalle greep','close-grip-bench-press'),
    ('Eenarmige triceps extension boven het hoofd','single-arm-dumbbell-overhead-tricep-extension'),
    ('Triceps extension liggend met dumbbell','lying-tricep-extension'),
    ('Leg press','leg-press'),
    ('Goblet squat','goblet-squat'),
    ('Squat met lichaamsgewicht','bodyweight-squat'),
    ('Squat naar een bank','box-squat'),
    ('Back squat','squat'),
    ('Front squat','front-squat'),
    ('Hack squat','hack-squat'),
    ('Wall sit','wall-sit'),
    ('Lunge met dumbbells','db-lunge'),
    ('Achterwaartse lunge','bodyweight-reverse-lunge'),
    ('Bulgarian split squat','bulgarian-split-squat'),
    ('Step-up','step-ups'),
    ('Leg extension','leg-extension'),
    ('Leg curl liggend','leg-curl'),
    ('Leg curl zittend','seated-leg-curl'),
    ('Roemeense deadlift met dumbbells','dumbbell-romanian-deadlift'),
    ('Roemeense deadlift met barbell','romanian-deadlift'),
    ('Deadlift','deadlift'),
    ('Adductor machine','hip-adduction'),
    ('Lunge met barbell','barbell-lunge'),
    ('Achterwaartse lunge met dumbbells','reverse-lunge'),
    ('Squat met dumbbells','db-squat'),
    ('Squat in de smith machine','smith-machine-squat'),
    ('Hip thrust met barbell','hip-thrust'),
    ('Hip thrust machine','plate-loaded-glute-drive'),
    ('Glute bridge','glute-bridge'),
    ('Glute bridge op een been','single-leg-glute-bridge'),
    ('Kickback aan de kabel','cable-kickback'),
    ('Abductor machine','hip-abduction'),
    ('Zijwaarts stappen met elastiek','banded-lateral-walk'),
    ('Calf raise staand','machine-calf-raise'),
    ('Calf raise zittend','seated-calf-raise'),
    ('Plank','plank'),
    ('Zijplank','side-plank'),
    ('Dead bug','dead-bug'),
    ('Bird dog','bird-dog'),
    ('Crunch','crunches'),
    ('Pallof press','cable-pallof-press'),
    ('Cable crunch','cable-crunch'),
    ('Hanging knee raise','hanging-knee-raise'),
    ('Russian twist','russian-twist'),
    ('Ab wheel rollout','ab-wheel-rollout'),
    ('Leg raise liggend','lying-leg-raise'),
    ('Crunch met draai','cross-body-crunch'),
    ('Fietsende crunch','bicycle-crunch'),
    ('Reverse crunch','reverse-crunches'),
    ('Zijwaarts buigen met dumbbell','dumbbell-side-bend'),
    ('Farmer walk','dumbbell-farmers-walk'),
    ('Turkish get-up','kettlebell-turkish-get-ups'),
    ('Kettlebell swing','kettlebell-swing'),
    ('Burpee','burpees'),
    ('Squat jump','jump-squat'),
    ('Box jump','box-jump'),
    ('Mountain climber','mountain-climbers'),
    ('Medicine ball slam','medicine-ball-slam'),
    ('Battle ropes','battle-ropes'),
    ('Wandelen op de loopband','incline-treadmill-walk'),
    ('Hardlopen op de loopband','treadmill-running'),
    ('Crosstrainer','elliptical-trainer'),
    ('Hometrainer','stationary-bike'),
    ('Roeiergometer','rowing-machine'),
    ('Traploper','stair-climber'),
    ('Airbike','air-bike'),
    ('Touwtjespringen','jump-rope')

  ) as v(naam, id)
  where o.user_id = uid
    and lower(o.naam) = lower(v.naam)
    and (o.beeld_bron is null or o.beeld_bron in ('Everkinetic', 'RepDB'));
  get diagnostics bijgewerkt = row_count;

  raise notice 'Oefeningen met een RepDB-beeld: % (verwacht 129)', bijgewerkt;
end $$;
