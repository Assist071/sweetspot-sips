-- Comprehensive trigger function for both Admin and Customer signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_admin_user BOOLEAN := FALSE;
  is_rider_user BOOLEAN := FALSE;
BEGIN
  -- Determine if user should be an admin based on the secret key
  -- Key: MIKTEA_ADMIN_2024
  IF (NEW.raw_user_meta_data->>'admin_secret_key' = 'MIKTEA_ADMIN_2024') THEN
    is_admin_user := TRUE;
  ELSIF (NEW.raw_user_meta_data->>'rider_secret_key' = 'SIPS_RIDER_2024') THEN
    is_rider_user := TRUE;
  END IF;

  -- Insert profile only for non-admin users (including riders)
  IF NOT is_admin_user THEN
    INSERT INTO public.profiles (
      user_id, 
      email,
      full_name, 
      username, 
      first_name, 
      last_name, 
      phone, 
      city,
      barangay, 
      zip_code, 
      complete_address
    )
    VALUES (
      NEW.id, 
      NEW.email,
      -- Fallback: Use full_name if first/last name combo is empty
      COALESCE(
        NULLIF(TRIM((NEW.raw_user_meta_data->>'first_name') || ' ' || (NEW.raw_user_meta_data->>'last_name')), ''),
        NEW.raw_user_meta_data->>'full_name'
      ),
      NEW.raw_user_meta_data->>'username',
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'city',
      NEW.raw_user_meta_data->>'barangay',
      NEW.raw_user_meta_data->>'zip_code',
      NEW.raw_user_meta_data->>'complete_address'
    );
  END IF;

  -- Assign appropriate role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id, 
    CASE 
      WHEN is_admin_user THEN 'admin'::app_role 
      WHEN is_rider_user THEN 'rider'::app_role 
      ELSE 'user'::app_role 
    END
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
