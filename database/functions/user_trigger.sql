-- =====================================================
-- Auto-create user record when someone signs up
-- This trigger fires when a new user is created in auth.users
-- =====================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    auth_id,
    email,
    role,
    first_name,
    last_name
  ) VALUES (
    NEW.id,
    NEW.email,
    'applicant',  -- Default role for new signups
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL)
  );
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users
-- This runs AFTER a new user is inserted into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.users TO supabase_auth_admin;

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates a user record in public.users when a new user signs up via Supabase Auth';
