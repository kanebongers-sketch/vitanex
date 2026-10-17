-- Club: de nachtelijke demo-functie van afspraken is niet aan te roepen van buitenaf (na beveiligingsreview).
revoke all on function public.club_afspraken_demo_verversen() from public, anon, authenticated;
