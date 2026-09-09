-- Non-destructive migration: add email platform branding fields and reusable partnership template
-- Existing templates, drafts, campaigns, subscribers, and email history are preserved.

-- 1. Add configurable branding fields to email_settings (all optional, no defaults that overwrite existing data)
ALTER TABLE IF EXISTS email_settings
  ADD COLUMN IF NOT EXISTS business_email text,
  ADD COLUMN IF NOT EXISTS business_phone text,
  ADD COLUMN IF NOT EXISTS sender_display_name text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS business_address text,
  ADD COLUMN IF NOT EXISTS primary_color text,
  ADD COLUMN IF NOT EXISTS accent_color text;

-- 2. Ensure email_templates table exists with the columns the UI expects
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text DEFAULT 'transactional',
  subject text,
  preview_text text,
  html_body text,
  plain_text_body text,
  is_enabled boolean DEFAULT true,
  version integer DEFAULT 1,
  last_edited_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Add columns for body-only reusable templates
ALTER TABLE IF EXISTS email_templates
  ADD COLUMN IF NOT EXISTS template_key text,
  ADD COLUMN IF NOT EXISTS body_only boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cta_label text,
  ADD COLUMN IF NOT EXISTS cta_url text,
  ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

-- 4. Seed the default "Professional Partnership" body-only template if it does not exist
INSERT INTO email_templates (
  name,
  template_key,
  type,
  subject,
  preview_text,
  html_body,
  body_only,
  cta_label,
  cta_url,
  is_enabled,
  is_default
)
SELECT
  'Professional Partnership',
  'professional-partnership',
  'partnership',
  'Partnership opportunity with AIDetector.cx',
  '',
  '<p>Dear {{first_name}},</p><p>We believe AIDetector.cx can add value to your platform and audience through our multilingual AI detection, humanization, plagiarism checking, and SEO writing tools.</p><p>We would love to explore how we can work together.</p>',
  true,
  'Learn more',
  'https://aidetector.cx/',
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM email_templates WHERE template_key = 'professional-partnership'
);
