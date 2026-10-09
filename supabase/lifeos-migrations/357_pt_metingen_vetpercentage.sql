-- 357 · Fit Factory PT — vetpercentage bij metingen (optioneel, 2–70 %).
alter table pt_metingen
  add column if not exists vet_pct numeric(4, 1) check (vet_pct is null or vet_pct between 2 and 70);
