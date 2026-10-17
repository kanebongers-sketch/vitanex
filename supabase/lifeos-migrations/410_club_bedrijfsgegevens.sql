-- ─── Club: bedrijfsgegevens en huisregels per sportschool ──────────────────
-- Een rij per sportschool (user_id = club_organisaties.id): de officiele
-- gegevens (bedrijfsnaam, KvK, btw, hoofdkantoor, contact, social links) en
-- drie teksten voor leden: huisregels, algemene voorwaarden en privacy.
-- Contactgegevens per vestiging staan in club_vestigingen (niet dubbel).
-- De vorm van de velden wordt in de app gecontroleerd (src/lib/club/bedrijf);
-- de checks hier zijn de vangrail. Idempotent; voegt alleen toe.

create table if not exists public.club_bedrijfsgegevens (
  user_id uuid primary key,
  bedrijfsnaam text check (char_length(bedrijfsnaam) <= 160),
  kvk text check (kvk ~ '^[0-9]{8}$'),
  btw text check (btw ~ '^NL[0-9]{9}B[0-9]{2}$'),
  adres text check (char_length(adres) <= 160),
  postcode text check (postcode ~ '^[1-9][0-9]{3} [A-Z]{2}$'),
  plaats text check (char_length(plaats) <= 80),
  telefoon text check (char_length(telefoon) <= 40),
  email text check (char_length(email) <= 160),
  website text check (char_length(website) <= 300 and website ~ '^https://'),
  instagram text check (char_length(instagram) <= 300 and instagram ~ '^https://'),
  facebook text check (char_length(facebook) <= 300 and facebook ~ '^https://'),
  tiktok text check (char_length(tiktok) <= 300 and tiktok ~ '^https://'),
  linkedin text check (char_length(linkedin) <= 300 and linkedin ~ '^https://'),
  huisregels text check (char_length(huisregels) <= 20000),
  voorwaarden text check (char_length(voorwaarden) <= 20000),
  privacy text check (char_length(privacy) <= 20000),
  demo boolean not null default false,
  bijgewerkt_op timestamptz not null default now()
);

alter table public.club_bedrijfsgegevens enable row level security;

-- ── Demodata ────────────────────────────────────────────────────────────────
-- Fit Factory: alleen feiten die in Club staan (openingstijden, bemande uren,
-- Eersel, trainingsband). Geen KvK, btw of juridische teksten verzonnen: die
-- vult de eigenaar zelf in.
insert into public.club_bedrijfsgegevens (user_id, bedrijfsnaam, website, huisregels, demo)
values (
  '67b0a700-3f1d-425e-9646-98c237e34fd7',
  'Fit Factory',
  'https://www.fitfactory.nl',
  $t$# Openingstijden
Je kunt 365 dagen per jaar sporten van 06:00 tot 23:00. Eersel heeft eigen openingstijden: kijk daarvoor bij de vestiging.
Buiten de bemande uren is er geen personeel aanwezig. Je traint dan zelfstandig.

# Toegang
- Je checkt in met je eigen trainingsband of QR-code.
- Je band is persoonlijk: laat nooit iemand anders met jouw band naar binnen.
- Ben je lid in Eersel? Dan sport je bij alle vestigingen. Ben je lid van een andere vestiging? Dan sport je overal behalve in Eersel.

# In de zaal
- Neem een handdoek mee en leg die op de toestellen.
- Ruim je gewichten en materialen na gebruik op.
- Maak het toestel na gebruik schoon.
- Train met schone sportschoenen die je alleen binnen draagt.

# Samen sporten
Iedereen moet zich hier welkom voelen. Wees vriendelijk en help elkaar. Twijfel je over een oefening? Vraag het aan een trainer tijdens de bemande uren.$t$,
  true
)
on conflict (user_id) do nothing;

-- Voorbeeld Gym: een fictieve sportschool, alles mag een voorbeeld zijn.
insert into public.club_bedrijfsgegevens (user_id, bedrijfsnaam, kvk, adres, postcode, plaats, telefoon, email, website, instagram, huisregels, voorwaarden, privacy, demo)
values (
  'de000000-0000-4000-8000-0000000000c1',
  'Voorbeeld Gym B.V.',
  '12345678',
  'Voorbeeldstraat 1',
  '1234 AB',
  'Voorbeeld',
  '010 123 4567',
  'info@voorbeeld.nl',
  'https://www.voorbeeld.nl',
  'https://www.instagram.com/voorbeeldgym',
  $t$# Welkom bij Voorbeeld Gym
Dit is een voorbeeld van huisregels. Pas ze aan naar je eigen sportschool.

# In de zaal
- Neem altijd een handdoek mee.
- Leg gewichten na gebruik terug op hun plek.
- Maak het toestel schoon als je klaar bent.

# Groepslessen
- Kom op tijd: na de start van de les kun je niet meer instappen.
- Kun je niet komen? Meld je af in de app, dan krijgt iemand anders je plek.$t$,
  $t$# Algemene voorwaarden (voorbeeld)
Dit is een voorbeeldtekst. Gebruik hem niet als echte voorwaarden zonder juridisch advies.

# Lidmaatschap
Je lidmaatschap start op de datum die in je inschrijving staat. Opzeggen kan volgens de termijn in je abonnement.

# Aansprakelijkheid
- Je sport op eigen risico.
- Laat geen waardevolle spullen onbeheerd achter.$t$,
  $t$# Privacyverklaring (voorbeeld)
Dit is een voorbeeldtekst. Vervang hem door de privacyverklaring van je eigen sportschool.

# Welke gegevens
- Je naam en contactgegevens.
- Je bezoeken en de lessen die je boekt.

# Je rechten
Je mag altijd vragen welke gegevens we van je hebben. Je kunt ze laten aanpassen of verwijderen. Stuur daarvoor een e-mail naar info@voorbeeld.nl.$t$,
  true
)
on conflict (user_id) do nothing;
