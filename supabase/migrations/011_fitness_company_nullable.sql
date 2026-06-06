-- company_id optioneel voor gebruikers zonder bedrijf (zelfstandigen)
alter table fitness_schemas alter column company_id drop not null;
