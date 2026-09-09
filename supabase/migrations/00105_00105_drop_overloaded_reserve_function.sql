-- Drop the old integer signature function
DROP FUNCTION IF EXISTS public.reserve_entitlement_and_credits(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT, JSONB);
