-- 487: Club, de Blender-oefeningen van golf 2 uit het archief. Alleen bijwerken, idempotent.
-- Nog uit te voeren (31-10-2026). Alleen bijwerken, mag Claude uitvoeren (toestemming Kane: aanvullende migraties voor Club).
--
-- Golf 2 (30 en 31-10-2026) gaf 32 oefeningen met dumbbells, kettlebell en banken
-- een eigen Blender-render. Ze staan al in de standaardbibliotheek van elke
-- sportschool (migratie 444) met hun kenmerken, maar migratie 465 zette ze op
-- gearchiveerd. De code ziet een oefening met render al als kiesbaar
-- (isGearchiveerd); deze migratie zet de kolom gelijk aan de waarheid, net als
-- migratie 475 voor golf 1.
--
-- Welke: de golf 2-oefeningen in src/components/aiyourgym/inhoud/oefenrenders.data.ts
-- op 31-10-2026. Alleen de standaardbibliotheek (exacte naam), in elke sportschool.
-- Er wordt niets verwijderd. De test blender-bibliotheek.test.ts controleert dat
-- elke naam hieronder een Blender-oefening is.
--
-- Terugdraaien: dezelfde lijst met gearchiveerd = true (zie migratie 465).

update public.club_oefeningen o
set gearchiveerd = false
from (values
  ('Achterwaartse lunge met dumbbells'),
  ('Arnold press'),
  ('Bulgarian split squat'),
  ('Curl met EZ-stang'),
  ('Curl op een schuine bank'),
  ('Deadlift met kettlebell'),
  ('Dumbbell curl'),
  ('Dumbbell fly'),
  ('Dumbbell shoulder press'),
  ('Farmer walk'),
  ('Front raise met dumbbells'),
  ('Goblet squat'),
  ('Hammer curl'),
  ('Kettlebell swing'),
  ('Lateral raise'),
  ('Lunge met dumbbells'),
  ('Pullover met dumbbell'),
  ('Reverse fly'),
  ('Roemeense deadlift met dumbbells'),
  ('Row op een schuine bank'),
  ('Schouders ophalen met dumbbells'),
  ('Schuine dumbbell fly'),
  ('Skull crusher'),
  ('Split squat met dumbbells'),
  ('Squat met dumbbells'),
  ('Squat naar een bank'),
  ('Sumo squat met dumbbell'),
  ('Triceps extension boven het hoofd'),
  ('Triceps extension liggend met dumbbell'),
  ('Triceps kickback'),
  ('Upright row met dumbbells'),
  ('Voorovergebogen row met dumbbells')
) as v(naam)
where o.naam = v.naam
  and o.gearchiveerd = true;
