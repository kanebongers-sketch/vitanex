-- 498: Club, de Blender-oefeningen van golf 9 uit het archief. Alleen bijwerken, idempotent.
-- Uitgevoerd 05-11-2026. Alleen bijwerken, mag Claude uitvoeren (toestemming Kane: aanvullende migraties voor Club).
--
-- Golf 9 (05-11-2026) gaf 5 eenarmige oefeningen een eigen Blender-render die
-- wisselt (besluit Kane 30-10-2026): eerst links, daarna rechts als gespiegeld
-- beeld van links ("wissel": "beeld"), zodat het gewicht nooit van hand hoeft.
-- Ze staan al in de standaardbibliotheek van elke sportschool met het juiste
-- materiaal, maar migratie 465 zette ze op gearchiveerd. De code ziet een
-- oefening met render al als kiesbaar (isGearchiveerd); deze migratie zet de
-- kolom gelijk aan de waarheid, net als migraties 475, 487, 490 en 493 tot en
-- met 497.
--
-- Nog zonder render (blijft in het archief): Turkish get-up.
--
-- De uitleg van de eenarmige triceps extension zei "zit rechtop"; de render is
-- staand. Alleen waar de uitleg nog de standaardtekst is, wordt hij gelijk aan
-- de render gezet (eigen tekst van een sportschool blijft staan).
--
-- Er wordt niets verwijderd. De test blender-bibliotheek.test.ts controleert dat
-- elke naam hieronder een Blender-oefening is.
-- Terugdraaien: dezelfde lijst met gearchiveerd = true (zie migratie 465).

update public.club_oefeningen o
set gearchiveerd = false
from (values
  ('Eenarmige dumbbell row'),
  ('Eenarmige lat pulldown'),
  ('Eenarmige triceps extension boven het hoofd'),
  ('Landmine press'),
  ('Pallof press')
) as v(naam)
where o.naam = v.naam
  and o.gearchiveerd = true;

update public.club_oefeningen o
set uitleg = 'Sta rechtop met een dumbbell in een hand achter je hoofd, elleboog naar het plafond. Strek je arm omhoog en laat de dumbbell gecontroleerd terug achter je hoofd zakken.'
where o.naam = 'Eenarmige triceps extension boven het hoofd'
  and o.uitleg = 'Zit rechtop met een dumbbell in een hand achter je hoofd, elleboog naar het plafond. Strek je arm omhoog en laat de dumbbell gecontroleerd terug achter je hoofd zakken.';
