-- Fix circular dependency in users_select_admin and users_select_caseworker policies
-- These policies were querying the users table to check role, which caused a circular dependency
-- Use get_user_role() function instead, which is SECURITY DEFINER and can bypass RLS

DROP POLICY IF EXISTS "users_select_admin" ON "public"."users";
DROP POLICY IF EXISTS "users_select_caseworker" ON "public"."users";

CREATE POLICY "users_select_admin"
  ON "public"."users"
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
USING (
  public.get_user_role() = 'administrator'::public.user_role
);

CREATE POLICY "users_select_caseworker"
  ON "public"."users"
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
USING (
  public.get_user_role() = ANY (ARRAY['caseworker'::public.user_role, 'administrator'::public.user_role])
);

