-- 494: Club, de Blender-oefeningen van golf 5 (machines) uit het archief. Alleen bijwerken, idempotent.
-- Uitgevoerd 05-11-2026. Alleen bijwerken, mag Claude uitvoeren (toestemming Kane: aanvullende migraties voor Club).
--
-- Golf 5 (05-11-2026) gaf 25 machine-oefeningen een eigen Blender-render (leg press,
-- hack squat, kuitmachines, hip thrust machine, smith machine, beenmachines,
-- curl- en roeimachines, ondersteunde pull-up en dips, chest press, shoulder
-- press, pec deck, dips machine en crunch machine). Ze staan al in de
-- standaardbibliotheek van elke sportschool met materiaal machine, maar migratie
-- 465 zette ze op gearchiveerd. De code ziet een oefening met render al als
-- kiesbaar (isGearchiveerd); deze migratie zet de kolom gelijk aan de waarheid,
-- net als migraties 475, 487, 490 en 493.
--
-- Er wordt niets verwijderd. De test blender-bibliotheek.test.ts controleert dat
-- elke naam hieronder een Blender-oefening is.
-- Terugdraaien: dezelfde lijst met gearchiveerd = true (zie migratie 465).

update public.club_oefeningen o
set gearchiveerd = false
from (values
  ('Abductor machine'),
  ('Adductor machine'),
  ('Assisted dips'),
  ('Assisted pull-up'),
  ('Bankdrukken in de smith machine'),
  ('Biceps curl machine'),
  ('Calf raise staand'),
  ('Calf raise zittend'),
  ('Chest press machine'),
  ('Crunch machine'),
  ('Dips machine'),
  ('Hack squat'),
  ('Hip thrust machine'),
  ('Leg curl liggend'),
  ('Leg curl zittend'),
  ('Leg extension'),
  ('Leg press'),
  ('Leg press zittend'),
  ('Pec deck'),
  ('Preacher curl machine'),
  ('Reverse fly machine'),
  ('Schuin bankdrukken in de smith machine'),
  ('Seated row machine'),
  ('Shoulder press machine'),
  ('Squat in de smith machine')
) as v(naam)
where o.naam = v.naam
  and o.gearchiveerd = true;
