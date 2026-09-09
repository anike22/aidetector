ALTER TABLE customer_profiles
  ADD COLUMN onboarding_dismissed boolean NOT NULL DEFAULT false,
  ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN onboarding_reset_at timestamptz;

CREATE INDEX idx_customer_profiles_onboarding ON customer_profiles(user_id, onboarding_dismissed, onboarding_completed);