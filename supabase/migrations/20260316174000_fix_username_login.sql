-- Fix get_email_from_username to be case-insensitive
CREATE OR REPLACE FUNCTION public.get_email_from_username(p_username TEXT)
RETURNS TEXT 
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN (SELECT email FROM public.profiles WHERE LOWER(username) = LOWER(p_username) LIMIT 1);
END;
$$;
