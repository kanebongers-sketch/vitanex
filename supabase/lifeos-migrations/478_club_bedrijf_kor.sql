-- 478: Club, bedrijfsgegevens: vinkje kleineondernemersregeling (KOR). Alleen toevoegen, idempotent.
-- Uitgevoerd door Claude op 30-10-2026 (toestemming Kane: aanvullende migraties voor Club).
--
-- Besluit Kane (30-10-2026): KvK-nummer is verplicht, een btw-nummer ook,
-- behalve voor een sportschool die de KOR gebruikt. Regel in de code:
-- bedrijfCompleet() in src/lib/club/bedrijf/model.ts.
-- Terugdraaien: alter table public.club_bedrijfsgegevens drop column kor.

alter table public.club_bedrijfsgegevens
  add column if not exists kor boolean not null default false;

comment on column public.club_bedrijfsgegevens.kor is 'Sportschool gebruikt de kleineondernemersregeling: btw-nummer niet verplicht (migratie 478).';
