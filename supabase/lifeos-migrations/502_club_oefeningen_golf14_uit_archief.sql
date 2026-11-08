-- 502: Club, de Blender-oefeningen van golf 14 uit het archief. Alleen bijwerken, idempotent.
-- Uitgevoerd 08-11-2026. Alleen bijwerken, mag Claude uitvoeren (toestemming Kane: aanvullende migraties voor Club).
--
-- Golf 14 (06-11-2026) geeft 12 van de overige nieuwe oefeningen uit migratie 500
-- een eigen Blender-render: kabel, latstation en optrekstang. Migratie 500 zette
-- ze in het archief tot er een render is; de code ziet een oefening met render al
-- als kiesbaar (isGearchiveerd). Deze migratie zet de kolom gelijk aan de waarheid,
-- net als migraties 475, 487, 490 en 493 tot en met 499 en 501.
--
-- Bij Woodchop aan de kabel past de standaardtekst nu bij de render: de handen
-- eindigen voor de andere heup (niet bij de knie) en de voeten blijven breed op de
-- vloer staan. Alleen waar de tekst nog precies de oude standaardtekst is; een
-- eigen tekst van een sportschool blijft staan.
--
-- De overige oefeningen van migratie 500 blijven in het archief tot hun render er
-- is. Er wordt niets verwijderd.
-- Terugdraaien: dezelfde lijst met gearchiveerd = true.

update public.club_oefeningen o
set gearchiveerd = false
from (values
  ('Bayesian curl aan de kabel'),
  ('Cable fly van hoog naar laag'),
  ('Cable fly van laag naar hoog'),
  ('Dead hang'),
  ('Eenarmige seated cable row'),
  ('Front raise aan de kabel'),
  ('Hanging leg raise'),
  ('Lat pulldown met brede greep'),
  ('Reverse fly aan de kabel'),
  ('Scapula pull-up'),
  ('Triceps pushdown met een arm'),
  ('Woodchop aan de kabel')
) as v(naam)
where o.naam = v.naam
  and o.gearchiveerd = true;

update public.club_oefeningen o
set uitleg = 'Sta zijwaarts naast de kabeltoren met de katrol hoog en pak het handvat met beide handen. Trek het diagonaal omlaag over je lichaam tot voor je andere heup en kom rustig terug.'
where o.naam = 'Woodchop aan de kabel'
  and o.uitleg = 'Sta zijwaarts naast de kabeltoren met de katrol hoog en pak het handvat met beide handen. Trek het diagonaal omlaag over je lichaam naar je andere knie en kom rustig terug.';

update public.club_oefeningen o
set aandachtspunten = 'De draai komt uit je romp en heupen, je armen houden dezelfde buiging. Je voeten blijven breed op de vloer staan.'
where o.naam = 'Woodchop aan de kabel'
  and o.aandachtspunten = 'De draai komt uit je romp en heupen, je armen blijven lang. Je achterste voet draait mee.';
