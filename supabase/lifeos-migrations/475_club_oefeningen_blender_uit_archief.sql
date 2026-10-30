-- 475: Club, de Blender-oefeningen uit het archief. Alleen bijwerken, idempotent.
-- Uitgevoerd door Claude op 30-10-2026 (toestemming Kane: aanvullende migraties voor Club).
--
-- Migratie 465 zette de standaardoefeningen zonder Blender-render op
-- gearchiveerd. Golf 1 (29-10-2026) gaf 30 daarvan een render. De code ziet een
-- oefening met render al als kiesbaar (isGearchiveerd), maar de kolom zei nog
-- gearchiveerd. Zo liep de database uit de pas met de code: bij een oudere build
-- of in SQL (club_demo_organisatie_maken kopieert de kolom) bleven er thuis maar
-- drie oefeningen over. Deze migratie zet de kolom gelijk aan de waarheid.
--
-- Welke: de oefeningen in src/components/aiyourgym/inhoud/oefenrenders.data.ts op
-- 30-10-2026. Alleen de standaardbibliotheek (exacte naam), in elke sportschool.
-- Er wordt niets verwijderd. De test blender-bibliotheek.test.ts controleert dat
-- elke naam hieronder een Blender-oefening is.
--
-- Terugdraaien: dezelfde lijst met gearchiveerd = true (zie migratie 465).

update public.club_oefeningen o
set gearchiveerd = false
from (values
  ('Achterwaartse lunge'),
  ('Back squat'),
  ('Barbell curl'),
  ('Barbell row'),
  ('Barbell row met onderhandse greep'),
  ('Bird dog'),
  ('Burpee'),
  ('Calf raise met lichaamsgewicht'),
  ('Crunch'),
  ('Crunch met draai'),
  ('Dead bug'),
  ('Deadlift'),
  ('Fietsende crunch'),
  ('Front squat'),
  ('Glute bridge'),
  ('Glute bridge op een been'),
  ('Good morning'),
  ('Hollow hold'),
  ('Leg raise liggend'),
  ('Lunge met barbell'),
  ('Mountain climber'),
  ('Overhead press'),
  ('Pike push-up'),
  ('Plank'),
  ('Push-up'),
  ('Push-up met smalle handen'),
  ('Push-up op knieën'),
  ('Reverse crunch'),
  ('Roemeense deadlift met barbell'),
  ('Russian twist'),
  ('Schouders ophalen met barbell'),
  ('Split squat'),
  ('Squat jump'),
  ('Squat met lichaamsgewicht'),
  ('Sumo deadlift'),
  ('Superman'),
  ('Thruster met barbell'),
  ('Walking lunge met lichaamsgewicht'),
  ('Zijplank'),
  ('Zijwaartse lunge')
) as render(naam)
where o.naam = render.naam
  and o.gearchiveerd = true;
