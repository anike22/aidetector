ALTER TABLE seo_reports ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'Sample Data';
ALTER TABLE seo_keywords ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'Sample Data';
ALTER TABLE seo_competitors ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'Sample Data';
ALTER TABLE seo_backlinks ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'Sample Data';
ALTER TABLE seo_ai_visibility ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'Sample Data';