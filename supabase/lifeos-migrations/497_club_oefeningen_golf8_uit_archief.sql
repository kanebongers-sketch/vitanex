-- 497: Club, de Blender-oefeningen van golf 8 uit het archief. Alleen bijwerken, idempotent.
-- Uitgevoerd 05-11-2026. Alleen bijwerken, mag Claude uitvoeren (toestemming Kane: aanvullende migraties voor Club).
--
-- Golf 8 (05-11-2026) gaf 3 oefeningen een eigen Blender-render: preacher curl
-- met barbell (preacherbank met rechte stang), hip thrust met dumbbell (handen
-- plat op de koppen) en T-bar row (landmine met schijf en V-greep, eigen model).
-- Ze staan al in de standaardbibliotheek van elke sportschool, maar migratie 465
-- zette ze op gearchiveerd. De code ziet een oefening met render al als
-- kiesbaar (isGearchiveerd); deze migratie zet de kolom gelijk aan de waarheid,
-- net als migraties 475, 487, 490 en 493 tot en met 496.
--
-- Nog zonder render (blijven in het archief): Eenarmige dumbbell row (wisselt
-- nog niet), Eenarmige lat pulldown, Pallof press, Eenarmige triceps extension
-- boven het hoofd, Landmine press en Turkish get-up.
--
-- Er wordt niets verwijderd. De test blender-bibliotheek.test.ts controleert dat
-- elke naam hieronder een Blender-oefening is.
-- Terugdraaien: dezelfde lijst met gearchiveerd = true (zie migratie 465).

update public.club_oefeningen o
set gearchiveerd = false
from (values
  ('Hip thrust met dumbbell'),
  ('Preacher curl met barbell'),
  ('T-bar row')
) as v(naam)
where o.naam = v.naam
  and o.gearchiveerd = true;

-- Materiaal: de T-bar row stond op 'machine', maar de render (en de gangbare
-- uitvoering) is een stang in een landmine, net als de landmine press: 'barbell'.
update public.club_oefeningen o
set materiaal = 'barbell'
where o.naam = 'T-bar row'
  and o.materiaal = 'machine';
