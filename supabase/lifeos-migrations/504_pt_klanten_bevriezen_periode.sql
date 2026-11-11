-- LifeOS | PT-app: bevriezen met een periode (vraag Kane 11-11-2026, "Ja, bouwen").
-- Een bevroren klant is alleen bevroren van bevroren_van tot en met bevroren_tot.
-- Voor de van-datum en na de tot-datum telt hij in de app vanzelf als actief
-- (afgeleid in src/lib/lifeos/pt-dashboard/bevriezen.ts, geen cron).
-- bevroren_tot leeg = einddatum onbekend. De omzet per kalendermaand rekent de
-- bevroren dagen naar rato af.
-- Uitgevoerd 11-11-2026. Alleen toevoegen; niets verwijderd. Veilig om opnieuw te draaien.

alter table public.pt_klanten
  add column if not exists bevroren_van date,
  add column if not exists bevroren_tot date;

alter table public.pt_klanten drop constraint if exists pt_klanten_bevroren_periode_check;
alter table public.pt_klanten add constraint pt_klanten_bevroren_periode_check
  check (bevroren_tot is null or bevroren_van is null or bevroren_tot >= bevroren_van);

-- Bestaande bevroren klanten: de bevriezing begon uiterlijk bij de laatste wijziging
-- van de rij (toen werd de status gezet), en nooit voor de startdatum. De einddatum
-- blijft leeg (onbekend); de PT'er kan beide aanpassen in het formulier.
update public.pt_klanten
set bevroren_van = greatest(startdatum, (bijgewerkt_op at time zone 'Europe/Amsterdam')::date)
where status = 'bevroren' and bevroren_van is null;
