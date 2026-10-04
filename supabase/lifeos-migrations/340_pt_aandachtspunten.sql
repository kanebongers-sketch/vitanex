-- ─── LifeOS — aandachtspunten uit coachgesprekken opvolgen ──────────────────
-- Elk aandachtspunt uit een coachgesprek wordt een open punt bij die PT'er. Bij
-- het volgende gesprek geef je één oordeel: opgelost, loopt nog, of erger.
-- `keer_open` telt de gesprekken waarin het punt open bleef — staat het er twee
-- gesprekken, dan meldt de ochtendmail het. Alleen de service-role (RLS aan).

create table if not exists public.pt_aandachtspunten (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  persoon_id uuid not null references public.crm_personen (id) on delete cascade,
  tekst text not null,
  bron_coaching_id uuid references public.pt_coaching (id) on delete set null,
  status text not null default 'open' check (status in ('open', 'opgelost')),
  laatste_oordeel text check (laatste_oordeel in ('opgelost', 'loopt', 'erger')),
  keer_open integer not null default 0,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  opgelost_op timestamptz
);

create index if not exists pt_aandachtspunten_open on public.pt_aandachtspunten (user_id, persoon_id) where status = 'open';
alter table public.pt_aandachtspunten enable row level security;
