-- 501: Club, de Blender-oefeningen van golf 11, 12 en 13 uit het archief. Alleen bijwerken, idempotent.
-- Uitgevoerd 06-11-2026. Alleen bijwerken, mag Claude uitvoeren (toestemming Kane: aanvullende migraties voor Club).
--
-- Golf 11 tot en met 13 (05 en 06-11-2026) gaven 32 van de 63 nieuwe oefeningen
-- uit migratie 500 een eigen Blender-render, met het nieuwe figuur K3 (besluit
-- Kane 05-11-2026: het figuur lijkt op Kane). Migratie 500 zette ze in het
-- archief tot er een render is; de code ziet een oefening met render al als
-- kiesbaar (isGearchiveerd). Deze migratie zet de kolom gelijk aan de waarheid,
-- net als migraties 475, 487, 490 en 493 tot en met 499.
--
-- Bij drie oefeningen past de standaarduitleg nu bij de render (calf raise op
-- een been met de handen in de zij, step-down met de voet voor de box, bear
-- crawl op de plaats). Alleen waar de uitleg nog precies de oude standaardtekst
-- is; een eigen tekst van een sportschool blijft staan.
--
-- De overige 31 van migratie 500 blijven in het archief tot hun render er is.
-- Er wordt niets verwijderd. De test blender-bibliotheek.test.ts controleert dat
-- elke naam hieronder een Blender-oefening is.
-- Terugdraaien: dezelfde lijst met gearchiveerd = true.

update public.club_oefeningen o
set gearchiveerd = false
from (values
  ('Archer push-up'),
  ('Bear crawl'),
  ('Broad jump'),
  ('Calf raise op een been'),
  ('Copenhagen plank'),
  ('Cossack squat'),
  ('Curtsy lunge'),
  ('Donkey kick'),
  ('Drag curl met barbell'),
  ('Fire hydrant'),
  ('Flutter kicks'),
  ('Frog pump'),
  ('High knees'),
  ('Hip thrust op een been'),
  ('Hollow rock'),
  ('JM press'),
  ('Jumping jack'),
  ('Kettlebell press'),
  ('Pendlay row'),
  ('Pistol squat naar een bank'),
  ('Plank shoulder tap'),
  ('Push press'),
  ('Reverse curl met EZ-stang'),
  ('Skater jump'),
  ('Spider curl'),
  ('Squeeze press met dumbbells'),
  ('Step-down'),
  ('Tate press'),
  ('Tibialis raise'),
  ('V-up'),
  ('Wall slide'),
  ('Y-raise op een schuine bank')
) as v(naam)
where o.naam = v.naam
  and o.gearchiveerd = true;

update public.club_oefeningen o
set uitleg = 'Sta op een been met je handen in je zij. Duw jezelf zo hoog mogelijk op je tenen, houd kort vast en zak langzaam terug.'
where o.naam = 'Calf raise op een been'
  and o.uitleg = 'Sta op een been met een hand tegen de muur voor je evenwicht. Duw jezelf zo hoog mogelijk op je tenen, houd kort vast en zak langzaam terug.';

update public.club_oefeningen o
set uitleg = 'Sta met een been op een box en laat je andere voet voor de box hangen. Buig je standbeen langzaam tot je hiel de vloer net aantikt en duw je terug omhoog.'
where o.naam = 'Step-down'
  and o.uitleg = 'Sta met een been op een box en laat je andere voet naast de box hangen. Buig je standbeen langzaam tot je hiel de vloer net aantikt en duw je terug omhoog.';

update public.club_oefeningen o
set uitleg = 'Zit op handen en voeten met je knieen een paar centimeter boven de vloer. Til tegelijk je ene hand en je andere voet even op en zet ze weer neer, op de plaats of een stukje vooruit.'
where o.naam = 'Bear crawl'
  and o.uitleg = 'Zit op handen en voeten met je knieen een paar centimeter boven de vloer. Kruip vooruit door tegelijk je ene hand en je andere voet te verplaatsen.';
