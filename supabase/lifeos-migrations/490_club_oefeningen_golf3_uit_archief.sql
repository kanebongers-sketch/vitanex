-- 490: Club, de Blender-oefeningen van golf 3 uit het archief. Alleen bijwerken, idempotent.
-- Uitgevoerd 05-11-2026. Alleen bijwerken, mag Claude uitvoeren (toestemming Kane: aanvullende migraties voor Club).
--
-- Golf 3 (03 en 04-11-2026) gaf 11 oefeningen met optrekstang, dipstation, box,
-- muur en anker een eigen Blender-render. Ze staan al in de standaardbibliotheek
-- van elke sportschool met hun kenmerken, maar migratie 465 zette ze op
-- gearchiveerd. De code ziet een oefening met render al als kiesbaar
-- (isGearchiveerd); deze migratie zet de kolom gelijk aan de waarheid, net als
-- migraties 475 en 487.
--
-- Welke: de golf 3-oefeningen in src/components/aiyourgym/inhoud/oefenrenders.data.ts
-- op 04-11-2026. Alleen de standaardbibliotheek (exacte naam), in elke sportschool.
-- Er wordt niets verwijderd. De test blender-bibliotheek.test.ts controleert dat
-- elke naam hieronder een Blender-oefening is.
--
-- Terugdraaien: dezelfde lijst met gearchiveerd = true (zie migratie 465).

update public.club_oefeningen o
set gearchiveerd = false
from (values
  ('Box jump'),
  ('Chin-up'),
  ('Dips voor de borst'),
  ('Hanging knee raise'),
  ('Inverted row'),
  ('Negatieve pull-up'),
  ('Nordic hamstring curl'),
  ('Pull-up'),
  ('Pull-up met neutrale greep'),
  ('Step-up'),
  ('Wall sit')
) as v(naam)
where o.naam = v.naam
  and o.gearchiveerd = true;

-- Materiaal: de oefeningen aan de optrekstang en op het dipstation stonden op
-- 'geen' (lichaamsgewicht). Thuis heb je daar een rek of dipstation voor nodig,
-- dus het voorstel voor thuis zonder materiaal mag ze niet kiezen. Ze krijgen
-- 'overig' (materiaal in de sportschool), net als de box jump.
update public.club_oefeningen o
set materiaal = 'overig'
from (values
  ('Chin-up'),
  ('Dips voor de borst'),
  ('Hanging knee raise'),
  ('Inverted row'),
  ('Negatieve pull-up'),
  ('Pull-up'),
  ('Pull-up met neutrale greep')
) as v(naam)
where o.naam = v.naam
  and o.materiaal = 'geen';
