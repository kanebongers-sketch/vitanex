-- 448: boekingswidget voor de eigen website van een sportschool.
-- Alleen toevoegen; idempotent. Code: src/lib/club/widget/**, src/app/widget/**,
-- src/app/api/widget/**, public/widget/aiyourgym-widget.js.
--
-- 1. club_widget_instellingen: per vestiging aan of uit, toegestane domeinen
--    (frame-ancestors), welke lestypen zichtbaar zijn (leeg = alle), kleurmodus
--    en een optionele link naar de privacyverklaring. Standaard uit.
-- 2. club_widget_rem: de rem op het aanvraagformulier. Alleen sha256-hashes van
--    IP (over alle sportscholen) en e-mail (per sportschool), nooit de waarde zelf.
--    Rijen ouder dan 2 dagen ruimt de functie zelf op.
-- 3. club_widget_rem(): telt en schrijft onder een slot, zodat veel gelijktijdige
--    verzoeken er niet allemaal doorheen komen.
-- 4. club_widget_kader(): voor de proxy (Content-Security-Policy frame-ancestors):
--    staat de widget van deze sportschool en vestiging aan, en op welke domeinen.
-- RLS aan zonder policies, niets voor anon of authenticated: alleen de server.

create table if not exists public.club_widget_instellingen (
  vestiging text primary key references public.club_vestigingen(vestiging) on delete cascade on update cascade,
  user_id uuid not null,
  aan boolean not null default false,
  domeinen text[] not null default '{}' check (cardinality(domeinen) <= 10),
  lestype_ids uuid[] not null default '{}' check (cardinality(lestype_ids) <= 200),
  kleurmodus text not null default 'huisstijl' check (kleurmodus in ('huisstijl', 'licht', 'donker')),
  privacy_url text check (privacy_url is null or (char_length(privacy_url) <= 300 and privacy_url ~ '^https://')),
  bijgewerkt_op timestamptz not null default now()
);
create index if not exists club_widget_instellingen_user on public.club_widget_instellingen (user_id);

create table if not exists public.club_widget_rem (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  soort text not null check (soort in ('ip', 'email')),
  sleutel text not null check (sleutel ~ '^[0-9a-f]{64}$'),
  op timestamptz not null default now()
);
create index if not exists club_widget_rem_zoek on public.club_widget_rem (soort, sleutel, op desc);
create index if not exists club_widget_rem_op on public.club_widget_rem (op);

alter table public.club_widget_instellingen enable row level security;
alter table public.club_widget_rem enable row level security;
revoke all on public.club_widget_instellingen from anon, authenticated;
revoke all on public.club_widget_rem from anon, authenticated;

-- true = de aanvraag mag door (en is geteld); false = te veel aanvragen.
-- Per IP: 3 per 10 minuten en 10 per dag, over alle sportscholen.
-- Per e-mailadres: 2 per dag per sportschool.
create or replace function public.club_widget_rem(p_user uuid, p_ip text, p_email text)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  ip_kort integer;
  ip_dag integer;
  email_dag integer;
  school_uur integer;
begin
  if p_ip !~ '^[0-9a-f]{64}$' or p_email !~ '^[0-9a-f]{64}$' then raise exception 'ongeldig'; end if;
  -- Altijd eerst het IP, dan het e-mailadres: zo kunnen twee verzoeken elkaar niet vastzetten.
  perform pg_advisory_xact_lock(hashtext('club_widget_ip_' || p_ip));
  perform pg_advisory_xact_lock(hashtext('club_widget_email_' || p_email));
  delete from public.club_widget_rem where op < now() - interval '2 days';
  select count(*) filter (where op > now() - interval '10 minutes'), count(*)
    into ip_kort, ip_dag
    from public.club_widget_rem
   where soort = 'ip' and sleutel = p_ip and op > now() - interval '24 hours';
  select count(*) into email_dag
    from public.club_widget_rem
   where soort = 'email' and user_id = p_user and sleutel = p_email and op > now() - interval '24 hours';
  -- Vangnet tegen een verspreide aanval (X-Forwarded-For is te vervalsen): per sportschool maximaal 20 aanvragen per uur.
  select count(*) into school_uur
    from public.club_widget_rem
   where soort = 'email' and user_id = p_user and op > now() - interval '1 hour';
  if ip_kort >= 3 or ip_dag >= 10 or email_dag >= 2 or school_uur >= 20 then return false; end if;
  insert into public.club_widget_rem (user_id, soort, sleutel) values (p_user, 'ip', p_ip), (p_user, 'email', p_email);
  return true;
end $$;

revoke all on function public.club_widget_rem(uuid, text, text) from public, anon, authenticated;
grant execute on function public.club_widget_rem(uuid, text, text) to service_role;

-- null = onbekende sportschool of vestiging; anders { aan, domeinen }.
create or replace function public.club_widget_kader(p_slug text, p_vestiging text)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object('aan', coalesce(w.aan, false), 'domeinen', coalesce(to_jsonb(w.domeinen), '[]'::jsonb))
    from public.club_organisaties o
    join public.club_vestigingen v on v.user_id = o.id and v.vestiging = p_vestiging
    left join public.club_widget_instellingen w on w.vestiging = v.vestiging and w.user_id = o.id
   where o.slug = p_slug
   limit 1
$$;

revoke all on function public.club_widget_kader(text, text) from public, anon, authenticated;
grant execute on function public.club_widget_kader(text, text) to service_role;
