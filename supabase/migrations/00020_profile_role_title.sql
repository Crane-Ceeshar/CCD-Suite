-- Add role_title column to profiles for display/personalization purposes
-- This is distinct from user_type (which controls access). role_title is purely cosmetic.
-- e.g. "CEO / Founder", "Director", "Manager", "Team Lead", etc.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role_title text DEFAULT '';

-- Update handle_new_user trigger to include role_title from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    tenant_id,
    user_type,
    role_title
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', NULL),
    (new.raw_user_meta_data->>'tenant_id')::uuid,
    COALESCE(new.raw_user_meta_data->>'user_type', 'sales'),
    COALESCE(new.raw_user_meta_data->>'role_title', '')
  );
  RETURN new;
END;
$$;
