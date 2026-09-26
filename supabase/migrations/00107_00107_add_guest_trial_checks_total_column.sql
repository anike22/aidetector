ALTER TABLE server_guest_sessions 
ADD COLUMN IF NOT EXISTS trial_checks_total INTEGER DEFAULT 1;

UPDATE server_guest_sessions 
SET trial_checks_total = 1 
WHERE trial_checks_total IS NULL;
