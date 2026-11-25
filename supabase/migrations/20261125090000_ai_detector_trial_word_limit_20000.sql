-- Set the free AI text detector trial input ceiling to 20,000 words.
-- The API now supplies p_unit_quantity so reserve_entitlement_and_credits can enforce it.
UPDATE public.credit_rate_table
SET details = COALESCE(details, '{}'::jsonb)
      || jsonb_build_object('trial_max_words', 20000),
    updated_at = NOW()
WHERE feature_slug = 'ai_detector';
