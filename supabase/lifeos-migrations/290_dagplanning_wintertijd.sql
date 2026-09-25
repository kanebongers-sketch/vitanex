-- Dagplanning ook in de wintertijd om 07:00 NL.
-- pg_cron tikt in UTC: 05:00 UTC is 's zomers 07:00, maar vanaf eind oktober
-- 06:00. Daarom tikt de klok nu óók om 06:00/06:30 UTC. De route stuurt niets
-- vóór 07:00 NL (te vroeg) en hooguit één mail per dag (de claim), dus 's zomers
-- zijn de extra tikken een goedkope no-op en 's winters sturen zíj de mail.
select cron.schedule('lifeos-dagplanning', '0 5,6 * * 1-5', $$select lifeos_klok.roep('/api/cron/dagplanning-mail')$$);
select cron.schedule('lifeos-dagplanning-herkans', '30 5,6 * * 1-5', $$select lifeos_klok.roep('/api/cron/dagplanning-mail')$$);
