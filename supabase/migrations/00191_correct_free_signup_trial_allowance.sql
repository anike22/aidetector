-- New Free accounts receive five introductory trial checks, not five paid credits.
-- Guest usage is merged later by link_guest_to_registered_user, producing
-- 1 used / 4 remaining when the guest check was consumed before signup.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles
    (id, email, phone, full_name, role, credits_balance, trial_checks_total, trial_checks_remaining, trial_checks_used)
  VALUES
    (
      NEW.id,
      NEW.email,
      NEW.phone,
      COALESCE(NEW.raw_user_meta_data->>'full_name',''),
      'user'::public.user_role,
      0,
      5,
      5,
      0
    );
  RETURN NEW;
END;
$function$;
