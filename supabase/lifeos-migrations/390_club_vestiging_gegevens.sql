-- ─── Fit Factory clubsoftware: vestigingen volgens fitfactory.nl ────────────
-- Gegevens van de website (14-10-2026): adres, telefoon, e-mail, openingstijden
-- (365 dagen per jaar 06:00 tot 23:00, Eersel eigen tijden) en de bemande uren.
-- Bemand = er is personeel; daarbuiten sporten leden onbemand met hun
-- trainingsband. Het personeelsrooster toetst de bezetting aan de bemande uren.
-- Idempotent: alleen kolommen toevoegen en waarden bijwerken.

alter table public.club_vestigingen add column if not exists telefoon text check (char_length(telefoon) <= 40);
alter table public.club_vestigingen add column if not exists email text check (char_length(email) <= 160);
-- Zelfde vorm als openingstijden: { "1": ["08:00","21:30"], ... } (1 = maandag). Leeg = onbemand.
alter table public.club_vestigingen add column if not exists bemand jsonb not null default '{}'::jsonb;

update public.club_vestigingen v set
  naam = x.naam, adres = x.adres, telefoon = x.telefoon, email = x.email,
  openingstijden = x.open::jsonb, bemand = x.bemand::jsonb
from (values
  ('bergeijk', 'Bergeijk', 'Loo 30, 5571 KR Bergeijk', '085-744 4923', 'bergeijk@fitfactory.nl',
    '{"1":["06:00","23:00"],"2":["06:00","23:00"],"3":["06:00","23:00"],"4":["06:00","23:00"],"5":["06:00","23:00"],"6":["06:00","23:00"],"7":["06:00","23:00"]}', '{}'),
  ('bladel', 'Bladel', 'Raambrug 4, 5531 AG Bladel', '085-060 5827', 'bladel@fitfactory.nl',
    '{"1":["06:00","23:00"],"2":["06:00","23:00"],"3":["06:00","23:00"],"4":["06:00","23:00"],"5":["06:00","23:00"],"6":["06:00","23:00"],"7":["06:00","23:00"]}', '{}'),
  ('budel', 'Budel', 'Capucijnerplein 17, 6021 CA Budel', '085-060 3424', 'budel@fitfactory.nl',
    '{"1":["06:00","23:00"],"2":["06:00","23:00"],"3":["06:00","23:00"],"4":["06:00","23:00"],"5":["06:00","23:00"],"6":["06:00","23:00"],"7":["06:00","23:00"]}',
    '{"1":["08:00","21:30"],"2":["08:00","21:30"],"3":["08:00","21:30"],"4":["08:00","21:30"],"5":["08:00","21:30"],"6":["08:00","13:00"],"7":["08:00","13:00"]}'),
  ('eersel', 'Eersel', 'Dreef 31, Eersel', '0497 51 51 52', 'eersel@fitfactory.nl',
    '{"1":["07:00","23:00"],"2":["07:00","23:00"],"3":["07:00","23:00"],"4":["07:00","23:00"],"5":["07:00","22:00"],"6":["08:00","16:00"],"7":["08:00","14:00"]}',
    '{"1":["07:00","23:00"],"2":["07:00","23:00"],"3":["07:00","23:00"],"4":["07:00","23:00"],"5":["07:00","22:00"],"6":["08:00","16:00"],"7":["08:00","14:00"]}'),
  ('eindhoven_boschdijk', 'Eindhoven Boschdijk', 'Boschdijk 295, Eindhoven', '085-060 4276', 'eindhovenboschdijk@fitfactory.nl',
    '{"1":["06:00","23:00"],"2":["06:00","23:00"],"3":["06:00","23:00"],"4":["06:00","23:00"],"5":["06:00","23:00"],"6":["06:00","23:00"],"7":["06:00","23:00"]}', '{}'),
  ('eindhoven_tongelre', 'Eindhoven Tongelre', 'Tongelresestraat 227, 5613 DG Eindhoven', '085-505 5483', 'eindhoventongelre@fitfactory.nl',
    '{"1":["06:00","23:00"],"2":["06:00","23:00"],"3":["06:00","23:00"],"4":["06:00","23:00"],"5":["06:00","23:00"],"6":["06:00","23:00"],"7":["06:00","23:00"]}', '{}'),
  ('oisterwijk', 'Oisterwijk', 'Sportlaan 6, 5062 JK Oisterwijk', '085-060 1422', 'oisterwijk@fitfactory.nl',
    '{"1":["06:00","23:00"],"2":["06:00","23:00"],"3":["06:00","23:00"],"4":["06:00","23:00"],"5":["06:00","23:00"],"6":["06:00","23:00"],"7":["06:00","23:00"]}', '{}'),
  ('someren', 'Someren', 'Kerkstraat 26, 5711 GW Someren', '085-060 3564', 'someren@fitfactory.nl',
    '{"1":["06:00","23:00"],"2":["06:00","23:00"],"3":["06:00","23:00"],"4":["06:00","23:00"],"5":["06:00","23:00"],"6":["06:00","23:00"],"7":["06:00","23:00"]}', '{}')
) as x(vestiging, naam, adres, telefoon, email, open, bemand)
where v.vestiging = x.vestiging;

-- Groepslessen: omschrijvingen in de woorden van fitfactory.nl (ingekort).
update public.club_lestypen t set omschrijving = x.oms
from (values
  ('ClubPower', 'Krachttraining met een halter en gewichten op je eigen niveau. Je traint je hele lichaam en wordt sterker.'),
  ('Spinning', 'Fietsworkout op muziek. Een caloriekiller en goed voor je uithoudingsvermogen.'),
  ('Indoor Bootcamp / HIIT', 'In 30 minuten een full body workout. Goed voor je conditie en om sterker te worden.'),
  ('Xcore', 'Functionele training met de XCORE-buis voor buik, rug, benen en armen.'),
  ('Zumba', 'Fitness op Latijns-Amerikaanse muziek zoals salsa en samba. Te vergelijken met aerobics.'),
  ('Yoga', 'Afwisselende yogaoefeningen, zodat je spieren steeds op een andere manier werken.'),
  ('Yin Yoga', 'Langzame yoga met houdingen die drie tot vijf minuten worden aangehouden. Goed voor bindweefsel en soepele gewrichten.'),
  ('Vitaal Fit', 'Les voor deelnemers vanaf 55 jaar: spieren verstevigen en conditie verbeteren. Laagdrempelig, iedereen kan instromen.'),
  ('BodyBalance', 'Rustige les met elementen uit yoga, tai chi en pilates voor kracht, balans en ontspanning.'),
  ('BodyShape', 'Kracht en vorm voor het hele lichaam met lichte gewichten.'),
  ('Pilates', 'Inspannende ontspanningsles: houding, stabiliteit, coordinatie, ademhaling en focus.')
) as x(naam, oms)
where t.naam = x.naam;
