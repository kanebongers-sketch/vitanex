-- ─── Club: elke sportschool een unieke naam per beheerder ───────────────────
-- Voorkomt een dubbele sportschool bij twee snelle klikken op Aanmaken.
create unique index if not exists club_organisaties_naam_uniek on public.club_organisaties (beheerder_id, lower(naam));
