-- Add new columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN username TEXT UNIQUE,
ADD COLUMN email TEXT,
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT,
ADD COLUMN barangay TEXT,
ADD COLUMN city TEXT,
ADD COLUMN zip_code TEXT,
ADD COLUMN complete_address TEXT;

-- Update the handle_new_user function to handle more metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
    (NEW.raw_user_meta_data->>'first_name') || ' ' || (NEW.raw_user_meta_data->>'last_name'),
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'barangay',
    NEW.raw_user_meta_data->>'zip_code',
    NEW.raw_user_meta_data->>'complete_address'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get email from username (for login lookup)
CREATE OR REPLACE FUNCTION public.get_email_from_username(p_username TEXT)
RETURNS TEXT 
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN (SELECT email FROM public.profiles WHERE username = p_username LIMIT 1);
END;
$$;
