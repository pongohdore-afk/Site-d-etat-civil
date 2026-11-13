/*
# Create promote_first_admin function

## Overview
Creates a SECURITY DEFINER function that promotes a user to admin IF no admin exists yet in the database.
This is a one-time bootstrap mechanism: it only works when there are zero admin users.
Once an admin exists, the function returns false and does nothing — preventing privilege escalation.

## Security
- SECURITY DEFINER: runs with the function owner's privileges, bypassing RLS.
- REVOKE EXECUTE FROM PUBLIC, anon: only authenticated users can call it.
- The function checks that no admin exists before promoting, so it can only be used for the initial setup.
*/

CREATE OR REPLACE FUNCTION public.promote_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count int;
BEGIN
  -- Count existing admins
  SELECT count(*) INTO admin_count FROM public.profiles WHERE is_admin = true;

  -- Only proceed if no admin exists yet (bootstrap mode)
  IF admin_count > 0 THEN
    RETURN false;
  END IF;

  -- Promote the calling user to admin
  UPDATE public.profiles
  SET is_admin = true
  WHERE id = auth.uid();

  RETURN true;
END;
$$;

-- Only authenticated users can call this
REVOKE EXECUTE ON FUNCTION public.promote_first_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_first_admin() TO authenticated;
