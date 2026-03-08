
CREATE OR REPLACE FUNCTION public.handle_new_user_onboarding()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Create a new organization for the user
  INSERT INTO public.organizations (name)
  VALUES (NEW.full_name || '''s Restaurant')
  RETURNING id INTO new_org_id;

  -- Link the profile to the new organization
  UPDATE public.profiles SET organization_id = new_org_id WHERE id = NEW.id;

  -- Assign admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'admin');

  RETURN NEW;
END;
$$;

-- Trigger on profile insert (when org is null = new signup)
CREATE TRIGGER on_profile_created_onboarding
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.organization_id IS NULL)
  EXECUTE FUNCTION public.handle_new_user_onboarding();
