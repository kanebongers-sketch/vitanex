-- ─── Club: toestemming bij metingen vastleggen ──────────────────────────────
-- Na de beveiligingsreview: bij een losse meting (gezondheidsgegevens, AVG)
-- leggen we vast WANNEER en DOOR WIE de toestemming van het lid is gevraagd.
-- Nieuwe metingen vullen dit altijd; wijzigen laat het staan. Bestaande rijen
-- krijgen het moment van aanmaken. Idempotent; voegt alleen toe.
alter table public.club_metingen add column if not exists toestemming_op timestamptz;
alter table public.club_metingen add column if not exists toestemming_door text check (char_length(toestemming_door) <= 80);
update public.club_metingen set toestemming_op = coalesce(toestemming_op, aangemaakt_op), toestemming_door = coalesce(toestemming_door, case when demo then 'Demo' else 'Onbekend' end) where toestemming_op is null;
