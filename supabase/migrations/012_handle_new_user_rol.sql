-- Trigger fix: kopieer naam en rol uit auth metadata bij registratie
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, naam, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'naam', ''),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'medewerker')
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        naam  = CASE WHEN public.profiles.naam IS NULL OR public.profiles.naam = ''
                     THEN EXCLUDED.naam ELSE public.profiles.naam END,
        rol   = CASE WHEN public.profiles.rol IS NULL OR public.profiles.rol = ''
                     THEN EXCLUDED.rol ELSE public.profiles.rol END;
  RETURN NEW;
END;
$$;
