ALTER TABLE email_logs
ADD COLUMN IF NOT EXISTS recipient text,
ADD COLUMN IF NOT EXISTS provider text DEFAULT 'resend',
ADD COLUMN IF NOT EXISTS metadata jsonb,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Copy data from recipient_email to recipient if needed
UPDATE email_logs SET recipient = recipient_email WHERE recipient IS NULL AND recipient_email IS NOT NULL;
