-- 479: Club, huisstijl: tweede kleur, achtergrondtint en meer thema's. Alleen toevoegen, idempotent.
-- Uitgevoerd door Claude op 30-10-2026 (toestemming Kane: aanvullende migraties voor Club).
--
-- Besluit Kane (30-10-2026): de huisstijl heeft drie kleuren (hoofdkleur in
-- kleur_accent, tweede kleur, achtergrondtint) en meer thema's: donker,
-- diepzwart, grafiet, licht, zacht licht en automatisch. De kolom thema blijft
-- licht of donker (afgeleid van het thema), zodat bestaande code gelijk werkt.
-- Leeg = niet gekozen: tweede kleur = hoofdkleur, geen tint, thema = thema.
-- Terugdraaien: alter table public.club_organisaties drop column kleur_tweede, drop column kleur_tint, drop column thema_variant.

alter table public.club_organisaties
  add column if not exists kleur_tweede text,
  add column if not exists kleur_tint text,
  add column if not exists thema_variant text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'club_organisaties_kleur_tweede_check') then
    alter table public.club_organisaties add constraint club_organisaties_kleur_tweede_check check (kleur_tweede is null or kleur_tweede ~ '^#[0-9A-Fa-f]{6}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'club_organisaties_kleur_tint_check') then
    alter table public.club_organisaties add constraint club_organisaties_kleur_tint_check check (kleur_tint is null or kleur_tint ~ '^#[0-9A-Fa-f]{6}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'club_organisaties_thema_variant_check') then
    alter table public.club_organisaties add constraint club_organisaties_thema_variant_check check (thema_variant is null or thema_variant in ('donker', 'diepzwart', 'grafiet', 'licht', 'zacht', 'auto'));
  end if;
end
$$;

comment on column public.club_organisaties.kleur_tweede is 'Tweede kleur van de huisstijl (grafieken, tellers, voortgang); leeg = hoofdkleur (migratie 479).';
comment on column public.club_organisaties.kleur_tint is 'Achtergrondtint die de vlakken licht mee kleurt; leeg = neutraal (migratie 479).';
comment on column public.club_organisaties.thema_variant is 'Thema: donker, diepzwart, grafiet, licht, zacht of auto; leeg = de kolom thema (migratie 479).';
