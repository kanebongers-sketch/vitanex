-- ─── LifeOS — PT-klanten: afwijkende prijs, reden van stoppen, extra abonnementen ─
-- - prijs_afwijkend: wat de klant werkelijk betaalt als dat afwijkt van de
--   standaard (korting, actie). Alleen eigenaren en de beheerder zien en zetten
--   hem; PT'ers krijgen hem nooit (de app strip't hem server-side).
-- - stop_reden: waarom een klant opzegde of stopte (archief zoals in de Excel).
-- - Abonnementen uit het PT-dashboard (Excel) van Fit Factory die nog ontbraken:
--   duo-startactie, challenge (6 weken) en coaching. Prijzen staan in abonnementen.ts.

alter table public.pt_klanten
  add column if not exists prijs_afwijkend numeric(7, 2) check (prijs_afwijkend is null or (prijs_afwijkend >= 0 and prijs_afwijkend <= 5000)),
  add column if not exists stop_reden text check (stop_reden is null or stop_reden in
    ('doel_behaald', 'financieel', 'tijd', 'blessure', 'verhuisd', 'ontevreden', 'anders'));

alter table public.pt_klanten drop constraint if exists pt_klanten_abonnement_check;
alter table public.pt_klanten add constraint pt_klanten_abonnement_check
  check (abonnement in ('1x', '2x', 'duo_1x', 'duo_2x', '1x_2w', 'duo_start', 'challenge', 'coaching'));
