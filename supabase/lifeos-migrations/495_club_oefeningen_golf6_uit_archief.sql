-- 495: Club, de Blender-oefeningen van golf 6 (elastiek, overige materialen en cardio) uit het archief. Alleen bijwerken, idempotent.
-- Uitgevoerd 05-11-2026. Alleen bijwerken, mag Claude uitvoeren (toestemming Kane: aanvullende migraties voor Club).
--
-- Golf 6 (05-11-2026) gaf 19 oefeningen een eigen Blender-render: elastiek
-- (mini band en lange band), hyperextensiebank, ab wheel, ophangtrainer,
-- slam ball, medicijnbal met muurdoel, battle ropes, slee en de cardiotoestellen
-- (loopband, springtouw, hometrainer, airbike, crosstrainer, traploper en
-- roeiergometer), alles eigen werk en merkloos. Ze staan al in de
-- standaardbibliotheek van elke sportschool met hun kenmerken (materiaal band,
-- bank, overig of cardio_apparaat klopt al), maar migratie 465 zette ze op
-- gearchiveerd. De code ziet een oefening met render al als kiesbaar
-- (isGearchiveerd); deze migratie zet de kolom gelijk aan de waarheid, net als
-- migraties 475, 487, 490, 493 en 494.
--
-- Er wordt niets verwijderd. De test blender-bibliotheek.test.ts controleert dat
-- elke naam hieronder een Blender-oefening is.
-- Terugdraaien: dezelfde lijst met gearchiveerd = true (zie migratie 465).

update public.club_oefeningen o
set gearchiveerd = false
from (values
  ('Band pull-apart'),
  ('Zijwaarts stappen met elastiek'),
  ('Adductie staand met elastiek'),
  ('Squat met elastiek boven de knieen'),
  ('Back extension'),
  ('Ab wheel rollout'),
  ('TRX row'),
  ('Medicine ball slam'),
  ('Wall ball'),
  ('Battle ropes'),
  ('Slee duwen'),
  ('Wandelen op de loopband'),
  ('Hardlopen op de loopband'),
  ('Touwtjespringen'),
  ('Hometrainer'),
  ('Airbike'),
  ('Crosstrainer'),
  ('Traploper'),
  ('Roeiergometer')
) as v(naam)
where o.naam = v.naam
  and o.gearchiveerd = true;
