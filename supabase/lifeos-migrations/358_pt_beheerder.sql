-- ─── LifeOS — PT-app: beheerder-rol (Kane) + abonnement "1x per 2 weken" ────
-- Kane beheert Fit Factory PT vanuit de PT-app zelf (alles wat met PT te maken
-- heeft is uit zijn LifeOS-dashboard verhuisd). Hij ziet wat een eigenaar ziet
-- plus Beheer, en logt in via zijn MentaForce-hoofdaccount: geen pincode.
-- `pin_hash` blijft leeg, dus een pin raden of kiezen kan niet (kiesPin werkt
-- alleen bij pin_status 'geen'; pinKlopt is false zonder hash).
--
-- Kane is een CRM-persoon in 'management' (geen PT'er: geen coachgesprek, niet
-- op de teamlijst van /FitFactoryPT), maar traint zelf ook PT-klanten; die
-- hangen aan deze persoon en tellen mee in de teamcijfers.

alter table public.pt_lead_links drop constraint if exists pt_lead_links_rol_check;
alter table public.pt_lead_links add constraint pt_lead_links_rol_check check (rol in ('pt', 'eigenaar', 'beheerder'));

-- Fit Factory rekent ook "1x per 2 weken" (€169 p/m), zie abonnementen.ts.
alter table public.pt_klanten drop constraint if exists pt_klanten_abonnement_check;
alter table public.pt_klanten add constraint pt_klanten_abonnement_check
  check (abonnement in ('1x', '2x', 'duo_1x', 'duo_2x', '1x_2w'));

-- Kane als CRM-persoon (management) en zijn beheerderslink: mentaforce.nl/kane.
insert into public.crm_personen (user_id, naam, groep, status)
select l.user_id, 'Kane', 'management', 'actief'
from public.pt_lead_links l
where l.code = 'ruben'
  and not exists (select 1 from public.crm_personen p where p.groep = 'management' and p.naam = 'Kane')
limit 1;

insert into public.pt_lead_links (persoon_id, user_id, code, rol, pin_status)
select p.id, p.user_id, 'kane', 'beheerder', 'actief'
from public.crm_personen p
where p.groep = 'management' and p.naam = 'Kane'
  and not exists (select 1 from public.pt_lead_links l where l.code = 'kane' or l.persoon_id = p.id)
limit 1;
