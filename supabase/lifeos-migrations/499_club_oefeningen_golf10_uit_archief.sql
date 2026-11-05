-- 499: Club, de Blender-oefening van golf 10 uit het archief. Alleen bijwerken, idempotent.
-- Uitgevoerd 05-11-2026. Alleen bijwerken, mag Claude uitvoeren (toestemming Kane: aanvullende migraties voor Club).
--
-- Golf 10 (05-11-2026) gaf de Turkish get-up een eigen Blender-render die wisselt
-- (besluit Kane 30-10-2026): eerst links, daarna rechts als gespiegeld beeld van
-- links ("wissel": "beeld"). Hij staat al in de standaardbibliotheek van elke
-- sportschool met het juiste materiaal (kettlebell) en een uitleg die bij de
-- render past, maar migratie 465 zette hem op gearchiveerd. De code ziet een
-- oefening met render al als kiesbaar (isGearchiveerd); deze migratie zet de
-- kolom gelijk aan de waarheid, net als migraties 475, 487, 490 en 493 tot en
-- met 498.
--
-- Daarmee heeft elke oefening uit de standaardbibliotheek een render.
--
-- Er wordt niets verwijderd. De test blender-bibliotheek.test.ts controleert dat
-- elke naam hieronder een Blender-oefening is.
-- Terugdraaien: dezelfde lijst met gearchiveerd = true (zie migratie 465).

update public.club_oefeningen o
set gearchiveerd = false
from (values
  ('Turkish get-up')
) as v(naam)
where o.naam = v.naam
  and o.gearchiveerd = true;
