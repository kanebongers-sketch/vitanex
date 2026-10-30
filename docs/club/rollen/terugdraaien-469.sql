-- Terugdraaien van migraties 469 en 470 (rollenmodel v2). 470 wijzigde alleen club_profiel_voor_beheerder
-- (die hier vervalt) en zette 3 beheerderprofielen op actief = false; die blijven inactief staan.
-- Alleen draaien op uitdrukkelijk verzoek van Kane.
--
-- Wat blijft: club_medewerkers.rollen is door de synchronisatie altijd bijgewerkt
-- met de vier oude rollen, dus de oude code verliest niets. Wat verloren gaat:
-- de rollen eigenaar en roosteraar per profiel en instellingen.rolrechten (de
-- oude instellingen.rechten zijn nooit aangeraakt).
--
-- De profielen die 469 voor beheerders aanmaakte (club_medewerkers met
-- alle_vestigingen = true en gekoppeld via club_beheerders.profiel_id) blijven
-- staan als gewone medewerker zonder rol. Wil je ze ook weg, wis ze dan via de
-- AVG-functie (club_medewerker_anonimiseren) en niet met delete: zo blijven
-- logboek en koppelingen kloppen.
--
-- Eerst de code terug: CLUB_ROLLEN_V2_ORGS leeg maken en CLUB_ROLLEN_V2_OVERAL
-- false in src/lib/club/rollen/schakelaar.ts, en deployen.

begin;

drop trigger if exists club_beheerder_profiel on public.club_beheerders;
drop trigger if exists club_medewerker_rollen_sync on public.club_medewerkers;
drop trigger if exists club_profiel_rollen_sync on public.club_profiel_rollen;
drop function if exists public.club_beheerder_profiel();
drop function if exists public.club_medewerker_rollen_naar_profiel();
drop function if exists public.club_profiel_rollen_naar_oud();
drop function if exists public.club_profiel_voor_beheerder(uuid, text, text, text);

-- club_demo_verversen en club_medewerker_anonimiseren noemen club_profiel_rollen:
-- eerst de versies van voor 469 terugzetten (pg_get_functiondef uit een back-up,
-- of de versie zonder de regels met club_profiel_rollen en club_beheerders.profiel_id).

drop table if exists public.club_profiel_rollen;

update public.club_organisaties set instellingen = instellingen - 'rolrechten' where instellingen ? 'rolrechten';

alter table public.club_beheerders drop column if exists profiel_id;
alter table public.club_medewerkers drop column if exists alle_vestigingen;

commit;
