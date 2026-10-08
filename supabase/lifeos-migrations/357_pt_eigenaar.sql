-- ─── LifeOS — PT-app: eigenaar-rol (Ruben) ──────────────────────────────────
-- Een eigenaar van Fit Factory krijgt dezelfde app als een PT'er (eigen link,
-- zelfgekozen pincode, Kane keurt goed), maar ziet het héle team: alle
-- statistieken, alle leads en klanten, de check-ins en de kennisbank — alleen
-- lezen. Hij schrijft zelf niets: de PT-API weigert schrijfacties van deze rol.
--
-- De eigenaar is een CRM-persoon in de groep 'management' (niet 'pt_team'), zodat
-- hij nergens als PT'er meetelt (team-overzicht, weekmail, coachgesprekken).

alter table public.pt_lead_links
  add column if not exists rol text not null default 'pt';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pt_lead_links_rol_check') then
    alter table public.pt_lead_links add constraint pt_lead_links_rol_check check (rol in ('pt', 'eigenaar'));
  end if;
end $$;

-- Ruben (management) krijgt zijn link: mentaforce.nl/ruben. Idempotent; pas als
-- hij in het CRM staat. Pincode kiest hij zelf bij het eerste bezoek.
insert into public.pt_lead_links (persoon_id, user_id, code, rol)
select p.id, p.user_id, 'ruben', 'eigenaar'
from public.crm_personen p
where p.groep = 'management' and lower(btrim(p.naam)) = 'ruben'
  and not exists (select 1 from public.pt_lead_links l where l.persoon_id = p.id or l.code = 'ruben')
limit 1;
