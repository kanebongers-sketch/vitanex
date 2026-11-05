-- 496: Club, de Blender-oefeningen van golf 7 (de restlijst) uit het archief. Alleen bijwerken, idempotent.
-- Uitgevoerd 05-11-2026. Alleen bijwerken, mag Claude uitvoeren (toestemming Kane: aanvullende migraties voor Club).
--
-- Golf 7 (05-11-2026) gaf 15 oefeningen uit de restlijst een eigen
-- Blender-render: bankdrukken met barbell en dumbbells (vlak en schuin), dips en
-- push-ups met een bank, hip thrust met barbell, concentratiecurl, suitcase
-- carry, zijwaarts buigen, lat pulldown met onderhandse greep, trap bar deadlift
-- (eigen model) en face pull. Ze staan al in de standaardbibliotheek van elke
-- sportschool met hun kenmerken (het materiaal klopt al), maar migratie 465
-- zette ze op gearchiveerd. De code ziet een oefening met render al als
-- kiesbaar (isGearchiveerd); deze migratie zet de kolom gelijk aan de waarheid,
-- net als migraties 475, 487, 490, 493, 494 en 495.
--
-- Nog zonder render (blijven in het archief): onder meer Hip thrust met
-- dumbbell, Eenarmige triceps extension boven het hoofd, Pallof press,
-- Eenarmige lat pulldown, Preacher curl met barbell, Eenarmige dumbbell row,
-- T-bar row, Landmine press en Turkish get-up.
--
-- Er wordt niets verwijderd. De test blender-bibliotheek.test.ts controleert dat
-- elke naam hieronder een Blender-oefening is.
-- Terugdraaien: dezelfde lijst met gearchiveerd = true (zie migratie 465).

update public.club_oefeningen o
set gearchiveerd = false
from (values
  ('Bankdrukken met barbell'),
  ('Bankdrukken met smalle greep'),
  ('Dumbbell bankdrukken'),
  ('Schuin bankdrukken met barbell'),
  ('Schuin bankdrukken met dumbbells'),
  ('Dips op een bank'),
  ('Push-up met handen verhoogd'),
  ('Push-up met voeten verhoogd'),
  ('Hip thrust met barbell'),
  ('Concentratiecurl'),
  ('Suitcase carry'),
  ('Zijwaarts buigen met dumbbell'),
  ('Lat pulldown met onderhandse greep'),
  ('Trap bar deadlift'),
  ('Face pull')
) as v(naam)
where o.naam = v.naam
  and o.gearchiveerd = true;
