-- 493: Club, de Blender-oefeningen van golf 4 (kabels) uit het archief. Alleen bijwerken, idempotent.
-- Uitgevoerd 05-11-2026. Alleen bijwerken, mag Claude uitvoeren (toestemming Kane: aanvullende migraties voor Club).
--
-- Golf 4 (04 en 05-11-2026) gaf 15 kabeloefeningen een eigen Blender-render
-- (kabeltoren, latstation, roeistation en crossoverframe). Ze staan al in de
-- standaardbibliotheek van elke sportschool met hun kenmerken, maar migratie 465
-- zette ze op gearchiveerd. De code ziet een oefening met render al als kiesbaar
-- (isGearchiveerd); deze migratie zet de kolom gelijk aan de waarheid, net als
-- migraties 475, 487 en 490.
--
-- Nog zonder render (blijven in het archief): Lat pulldown met onderhandse greep,
-- Eenarmige lat pulldown, Face pull en Pallof press.
--
-- Er wordt niets verwijderd. De test blender-bibliotheek.test.ts controleert dat
-- elke naam hieronder een Blender-oefening is.
-- Terugdraaien: dezelfde lijst met gearchiveerd = true (zie migratie 465).

update public.club_oefeningen o
set gearchiveerd = false
from (values
  ('Cable crossover'),
  ('Cable crunch'),
  ('Curl aan de kabel'),
  ('Exorotatie aan de kabel'),
  ('Hammer curl aan de kabel'),
  ('Kickback aan de kabel'),
  ('Lat pulldown'),
  ('Lat pulldown met V-greep'),
  ('Lateral raise aan de kabel'),
  ('Pull-through aan de kabel'),
  ('Seated cable row'),
  ('Seated cable row met brede greep'),
  ('Straight arm pulldown'),
  ('Triceps extension boven het hoofd aan de kabel'),
  ('Triceps pushdown')
) as v(naam)
where o.naam = v.naam
  and o.gearchiveerd = true;
