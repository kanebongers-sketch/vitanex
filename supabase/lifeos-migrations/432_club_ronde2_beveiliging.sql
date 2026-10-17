-- 432: Club, beveiligingsreview ronde 2. Alleen toevoegen, idempotent.
-- De tabellen van 416 en 419 hadden RLS aan zonder policies, maar nog wel de
-- standaardrechten van Supabase voor anon en authenticated. Alleen de server
-- (service role) leest en schrijft hier, dus die rechten gaan eraf.
-- 418 deed dit al voor de challenge-tabellen.
revoke all on public.club_intakevragen from anon, authenticated;
revoke all on public.club_automatiseringen from anon, authenticated;
revoke all on public.club_opvolgtaken from anon, authenticated;
revoke all on public.club_opvolg_rondes from anon, authenticated;
