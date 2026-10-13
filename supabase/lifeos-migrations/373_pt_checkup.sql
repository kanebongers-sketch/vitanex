-- ─── PT-app — checkup: referral op de klant + meetbare afspraken ───────────
-- 1. Wanneer de PT'er een klant om een referral vroeg (null = nog niet).
-- 2. De afspraken uit een checkup (Kane met een PT'er). De nieuwste per PT'er is
--    de lopende; de volgende checkup meet hem na uit leads en klanten (zie
--    src/lib/lifeos/pt-dashboard/checkup.ts). Leeg veld = daar geen afspraak over.

alter table public.pt_klanten add column if not exists referral_gevraagd_op date;

create table if not exists public.pt_groeiafspraken (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  persoon_id uuid not null references public.crm_personen(id) on delete cascade,
  gemaakt_op date not null,
  gesprekken int check (gesprekken between 1 and 100),
  nieuwe_klanten int check (nieuwe_klanten between 1 and 50),
  referrals int check (referrals between 1 and 100),
  niets_te_laat boolean not null default false,
  notitie text check (char_length(notitie) <= 300),
  gemaakt_door text,
  aangemaakt_op timestamptz not null default now()
);
create index if not exists pt_groeiafspraken_persoon on public.pt_groeiafspraken (user_id, persoon_id, aangemaakt_op desc);
alter table public.pt_groeiafspraken enable row level security;
revoke all on public.pt_groeiafspraken from anon, authenticated;
