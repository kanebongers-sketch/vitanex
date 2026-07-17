-- ─────────────────────────────────────────────────────────────────────────────
-- 047 — avatars: bucket privé, en eindelijk in versiebeheer
-- ─────────────────────────────────────────────────────────────────────────────
-- De avatars-bucket bestond alleen in de live database: handmatig aangemaakt,
-- nooit in een migratie. Hij stond op public.
--
-- Public buckets serveren downloads BUITEN RLS om. De vier policies uit
-- 013_security_hardening.sql:246-259 zagen er keurig uit (alleen je eigen map),
-- maar golden dus niet voor de download-route — het commentaar daar geeft dat
-- zelf toe. En het pad was voorspelbaar:
--
--   src/app/(app)/instellingen/page.tsx:250 → `${userId}/avatar.jpg`
--
-- Dus: wie een user-id kende, kon de pasfoto ophalen. Zonder in te loggen,
-- permanent, ook na uitdiensttreding. Collega's zíén elkaars user-id (/chat
-- selecteert profiles.id gewoon mee). Voor een product met een expliciete
-- anonimiteitsbelofte aan medewerkers van klantbedrijven is dat AVG-terrein.
--
-- Na deze migratie:
--   • bucket privé → geen enkele download meer buiten RLS om;
--   • lezen mag alleen als je de persoon kent (zie mag_avatar_zien);
--   • de client tekent zelf tijdelijke URLs (createSignedUrls, gebundeld) —
--     Postgres beslist of dat mag, niet een route die het kan vergeten.
--
-- Waarom geen /api/avatar-proxy: deze app heeft geen cookie-sessie (de Supabase-
-- client draait op localStorage), en een <img src> stuurt geen Authorization-
-- header mee. Een proxy-route zou de autorisatie dus tóch ergens anders moeten
-- ophangen. RLS is hier de juiste plek: de regel staat één keer, naast de data.

-- ─── 1. Bucket privé ─────────────────────────────────────────────────────────
-- `do update` en niet `do nothing`: de bucket bestáát al en staat op public.
-- Dit is precies de regel die het gat dicht.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do update set public = false;

-- ─── 2. Wie mag een avatar zien? ─────────────────────────────────────────────
-- Eén functie, één bit antwoord. Bewust geen `bedrijf_van(uuid)`-achtige helper:
-- die zou een oracle zijn ("van welk bedrijf is deze user?"). Dit beantwoordt
-- alleen "mag ík deze zien", en alleen voor ingelogde gebruikers.
--
-- SECURITY DEFINER omdat de functie profiles/coach_klanten leest namens de
-- kijker; zonder definer zou de RLS op profiles hier terugslaan.
--
-- Drie gevallen, en dat is niet willekeurig:
--   1. je eigen foto;
--   2. een collega binnen hetzelfde bedrijf (team, chat, directory, dashboard);
--   3. een lopende coachrelatie — coach_klanten staat expliciet LOS van
--      bedrijf_id (zie 037), dus zonder dit geval verliezen /coaching en
--      /mijn-coach hun avatars. 'beeindigd' telt niet mee: een afgelopen
--      begeleiding geeft geen blijvend recht op iemands pasfoto.
create or replace function public.mag_avatar_zien(eigenaar text)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select
    eigenaar = auth.uid()::text
    or exists (
      select 1
      from profiles ik, profiles hij
      where ik.id = auth.uid()
        and ik.bedrijf_id is not null
        and hij.id::text = eigenaar
        and hij.bedrijf_id = ik.bedrijf_id
    )
    or exists (
      select 1
      from coach_klanten ck
      where ck.status in ('uitgenodigd', 'actief', 'gepauzeerd')
        and (
          (ck.coach_id = auth.uid() and ck.klant_id::text = eigenaar)
          or (ck.klant_id = auth.uid() and ck.coach_id::text = eigenaar)
        )
    );
$$;

revoke execute on function public.mag_avatar_zien(text) from public, anon;
grant  execute on function public.mag_avatar_zien(text) to authenticated, service_role;

-- ─── 3. Leespolicy ───────────────────────────────────────────────────────────
-- Vervangt "avatars: eigen map lezen". Die was te streng voor de app (collega's
-- werden alleen zichtbaar dóórdat de bucket public was) en tegelijk irrelevant
-- (public downloads gingen er sowieso omheen). Nu klopt hij met wat de app doet.
drop policy if exists "avatars: eigen map lezen"   on storage.objects;
drop policy if exists "avatars: zichtbaar voor wie je kent" on storage.objects;

create policy "avatars: zichtbaar voor wie je kent"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and public.mag_avatar_zien((storage.foldername(name))[1])
  );

-- De schrijf-policies uit 013 blijven ongemoeid: uploaden/bijwerken/verwijderen
-- blijft strikt je eigen map.

-- ─── 4. avatar_url bevat vanaf nu een PAD ────────────────────────────────────
-- Stond: de volledige publieke URL (+ ?t=cache-bust). Die URL werkt niet meer
-- op een privébucket, dus laten staan zou elke bestaande avatar breken.
-- Het pad is alles ná /object/public/avatars/, zonder query.
--
-- Idempotent: de where-clause raakt alleen rijen die nog een publieke URL
-- bevatten. Tweede keer draaien doet niets.
update profiles
set avatar_url = split_part(
  regexp_replace(avatar_url, '^.*/object/public/avatars/', ''),
  '?', 1
)
where avatar_url like '%/object/public/avatars/%';
