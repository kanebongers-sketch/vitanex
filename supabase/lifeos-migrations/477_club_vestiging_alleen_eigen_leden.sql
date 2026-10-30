-- 477: Club, check-in: "alleen eigen leden" als regel per vestiging. Alleen toevoegen, idempotent.
-- Uitgevoerd door Claude op 30-10-2026 (toestemming Kane: aanvullende migraties voor Club).
--
-- Tot nu toe stond de regel van fitfactory.nl in de code: in Eersel checken
-- alleen leden van Eersel in, leden van Eersel sporten overal. Dat is nu data:
-- een vestiging met alleen_eigen_leden = true laat alleen eigen leden binnen.
-- Een aparte kolom (niet in regels jsonb), omdat het opslaan van de regels die
-- jsonb helemaal vervangt.
-- Gedrag blijft gelijk: de code gold voor elke vestiging met slug eersel; die
-- (alleen bij Fit Factory) krijgt de vlag.
-- Terugdraaien: alter table public.club_vestigingen drop column alleen_eigen_leden.

alter table public.club_vestigingen
  add column if not exists alleen_eigen_leden boolean not null default false;

update public.club_vestigingen
  set alleen_eigen_leden = true
  where vestiging = 'eersel' and alleen_eigen_leden = false;

comment on column public.club_vestigingen.alleen_eigen_leden is 'Check-in: alleen leden van deze vestiging mogen hier sporten (migratie 477).';
