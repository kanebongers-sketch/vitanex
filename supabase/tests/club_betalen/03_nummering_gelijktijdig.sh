#!/usr/bin/env bash
# Factuurnummers onder gelijktijdige aanroepen (migratie 461).
#
# Start N psql-sessies tegelijk die elk een eigen concept definitief maken, voor dezelfde
# sportschool. Daarna moet gelden: N nummers, allemaal verschillend, van 1 tot en met N, zonder gat.
#
# Gebruik (alleen op een TESTdatabase of Supabase-branch, nooit op productie):
#   TEST_DATABASE_URL="postgresql://..." bash supabase/tests/club_betalen/03_nummering_gelijktijdig.sh [aantal]
#
# Let op: dit commit echt (anders zijn de sessies niet gelijktijdig). Definitieve facturen
# kunnen bewust niet meer worden verwijderd, dus er blijven N testfacturen van een
# willekeurige test-sportschool achter. Gooi de testbranch daarna weg.

set -euo pipefail

: "${TEST_DATABASE_URL:?Zet TEST_DATABASE_URL op een testdatabase}"
N="${1:-20}"
ORG="$(cat /proc/sys/kernel/random/uuid 2>/dev/null || uuidgen | tr 'A-Z' 'a-z')"
PSQL=(psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -X -q -t -A)

echo "Test-sportschool: $ORG, $N sessies tegelijk"

# 1. N concepten klaarzetten (een transactie).
"${PSQL[@]}" <<SQL
begin;
insert into public.club_betalen_facturen (id, user_id, soort, subtotaal_excl_cent, btw_cent, totaal_cent, verkoper, klant_naam)
select ('${ORG:0:24}' || lpad(to_hex(n), 12, '0'))::uuid, '${ORG}'::uuid, 'handmatig', 1000, 210, 1210,
       '{"naam":"Testclub","kvk":"12345678","btw_nummer":"NL000000000B01","adres":"Straat 1, 1234AB Plaats"}'::jsonb, 'Test Klant'
from generate_series(1, ${N}) as n;
insert into public.club_betalen_factuurregels (user_id, factuur_id, omschrijving, stukprijs_excl_cent, bedrag_excl_cent, btw_procent, btw_cent, bedrag_incl_cent)
select user_id, id, 'Losse factuur', 1000, 1000, 21, 210, 1210
from public.club_betalen_facturen where user_id = '${ORG}'::uuid;
commit;
SQL

# 2. N sessies tegelijk definitief laten maken.
PIDS=()
for n in $(seq 1 "$N"); do
  ID="${ORG:0:24}$(printf '%012x' "$n")"
  "${PSQL[@]}" -c "select public.club_betalen_factuur_definitief('${ORG}'::uuid, '${ID}'::uuid, date '2026-03-10')" >/dev/null &
  PIDS+=("$!")
done
FOUT=0
for pid in "${PIDS[@]}"; do
  wait "$pid" || FOUT=$((FOUT + 1))
done
if [ "$FOUT" -ne 0 ]; then
  echo "MISLUKT: $FOUT sessies gaven een fout"
  exit 1
fi

# 3. Controleren.
UITKOMST="$("${PSQL[@]}" -c "
  select count(*) || ',' || count(distinct nummer) || ',' || min(substring(nummer from '[0-9]+\$')::int) || ',' || max(substring(nummer from '[0-9]+\$')::int)
  from public.club_betalen_facturen where user_id = '${ORG}'::uuid and nummer is not null")"
TELLER="$("${PSQL[@]}" -c "select laatste_nummer from public.club_betalen_factuurreeksen where user_id = '${ORG}'::uuid and soort = 'factuur' and jaar = 2026")"
echo "aantal,uniek,min,max = $UITKOMST, teller = $TELLER"

if [ "$UITKOMST" = "$N,$N,1,$N" ] && [ "$TELLER" = "$N" ]; then
  echo "GESLAAGD: $N nummers, allemaal uniek, 1 tot en met $N, zonder gat"
else
  echo "MISLUKT: verwacht $N,$N,1,$N en teller $N"
  exit 1
fi
