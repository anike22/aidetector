
-- Detector page configurable content
CREATE TABLE IF NOT EXISTS detector_page_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE detector_page_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read; only admins can write
CREATE POLICY "Public read detector_page_config" ON detector_page_config FOR SELECT USING (true);
CREATE POLICY "Admin write detector_page_config" ON detector_page_config FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Seed: live statistics
INSERT INTO detector_page_config (config_key, config_value) VALUES
('stats', '[
  {"label": "Documents Analyzed",   "value": "12.4M+",  "suffix": "", "icon": "FileText"},
  {"label": "Detection Requests",   "value": "38.1M+",  "suffix": "", "icon": "Activity"},
  {"label": "Countries Served",     "value": "142",     "suffix": "+","icon": "Globe"},
  {"label": "AI Models Supported",  "value": "50",      "suffix": "+","icon": "Bot"},
  {"label": "Avg Processing Time",  "value": "1.2",     "suffix": "s","icon": "Zap"},
  {"label": "Detection Accuracy",   "value": "98.7",    "suffix": "%","icon": "Target"}
]')
ON CONFLICT (config_key) DO NOTHING;

-- Seed: AI models
INSERT INTO detector_page_config (config_key, config_value) VALUES
('models', '[
  {"name":"GPT-5.5",    "maker":"OpenAI",    "badge":"Latest",  "icon":"openai",  "desc":"OpenAI''s most advanced model. AIDetector.cx uses proprietary linguistic fingerprinting to catch its highly human-like output."},
  {"name":"GPT-4",      "maker":"OpenAI",    "badge":"",        "icon":"openai",  "desc":"Detects the low-perplexity, formulaic sentence structures characteristic of GPT-4 generations."},
  {"name":"ChatGPT",    "maker":"OpenAI",    "badge":"",        "icon":"openai",  "desc":"Identifies ChatGPT-written essays, emails, and reports using burstiness and token-probability analysis."},
  {"name":"Gemini",     "maker":"Google",    "badge":"",        "icon":"google",  "desc":"Flags Gemini-generated content using cross-model pattern libraries unique to Google''s architecture."},
  {"name":"Claude",     "maker":"Anthropic", "badge":"",        "icon":"anthropic","desc":"Recognises Anthropic Claude''s distinctive reasoning patterns, hedging phrases, and paragraph structure."},
  {"name":"DeepSeek",   "maker":"DeepSeek",  "badge":"",        "icon":"deepseek","desc":"Covers DeepSeek R1 and V3 outputs with model-specific embeddings trained on verified samples."},
  {"name":"Grok",       "maker":"xAI",       "badge":"",        "icon":"xai",     "desc":"Detects xAI Grok output including its characteristic tone shifts and informational density patterns."},
  {"name":"Llama",      "maker":"Meta",      "badge":"",        "icon":"meta",    "desc":"Supports Llama 3.x family. Detects open-weight model text through statistical deviation markers."},
  {"name":"Mistral",    "maker":"Mistral",   "badge":"",        "icon":"mistral", "desc":"Identifies Mistral-generated text via its distinct tokenization and low-entropy phrasing tendencies."},
  {"name":"Copilot",    "maker":"Microsoft", "badge":"",        "icon":"microsoft","desc":"Detects Microsoft Copilot output from documents, emails, and web content using neural fingerprints."},
  {"name":"Perplexity", "maker":"Perplexity","badge":"",        "icon":"perplexity","desc":"Flags AI-generated research summaries and answers produced by Perplexity AI assistants."}
]')
ON CONFLICT (config_key) DO NOTHING;

-- Seed: benchmarks
INSERT INTO detector_page_config (config_key, config_value) VALUES
('benchmarks', '[
  {"model":"GPT-5.5",  "accuracy":98.7,"falsePositive":1.1,"falseNegative":0.8,"sampleSize":12000,"lastTested":"2025-11"},
  {"model":"GPT-4",    "accuracy":97.4,"falsePositive":1.6,"falseNegative":1.5,"sampleSize":15000,"lastTested":"2025-10"},
  {"model":"Gemini",   "accuracy":96.8,"falsePositive":1.9,"falseNegative":2.1,"sampleSize":10000,"lastTested":"2025-10"},
  {"model":"Claude",   "accuracy":95.9,"falsePositive":2.1,"falseNegative":2.8,"sampleSize":9000, "lastTested":"2025-10"},
  {"model":"DeepSeek", "accuracy":94.6,"falsePositive":2.8,"falseNegative":3.1,"sampleSize":8000, "lastTested":"2025-09"},
  {"model":"Llama",    "accuracy":93.2,"falsePositive":3.1,"falseNegative":3.9,"sampleSize":7500, "lastTested":"2025-09"}
]')
ON CONFLICT (config_key) DO NOTHING;

-- Seed: testimonials
INSERT INTO detector_page_config (config_key, config_value) VALUES
('testimonials', '[
  {"name":"Dr. Sarah Mitchell","role":"Academic Integrity Officer","org":"Stanford University","quote":"AIDetector.cx catches what TurnItIn misses. The sentence-level highlighting is invaluable for our review committee. We''ve integrated it into our entire submission workflow.","rating":5,"avatar":"SM"},
  {"name":"James Okafor","role":"Senior Content Director","org":"Forbes","quote":"We screen every article now before it goes to our editors. The false positive rate is the lowest we''ve tested across six tools — trust is everything in publishing.","rating":5,"avatar":"JO"},
  {"name":"Lisa Huang","role":"Talent Acquisition Lead","org":"Stripe","quote":"We started seeing AI-written cover letters spike in 2024. AIDetector.cx became essential to our screening. It''s part of our ATS workflow now.","rating":5,"avatar":"LH"},
  {"name":"Carlos Mendez","role":"SEO Manager","org":"HubSpot","quote":"The API integration took 20 minutes. Now every piece of content we publish is automatically scanned. Our organic rankings improved after we removed flagged content.","rating":5,"avatar":"CM"},
  {"name":"Dr. Emma Thornton","role":"Research Publisher","org":"Nature Portfolio","quote":"Reviewer trust in submitted manuscripts has increased since we adopted AIDetector.cx. The methodology transparency helped us write our own AI-content policy.","rating":5,"avatar":"ET"},
  {"name":"Alex Rivera","role":"Founder","org":"WriteSmart AI","quote":"We embed the API into our SaaS dashboard. Customers love having real-time originality scores as they write. Retention went up measurably after we launched it.","rating":5,"avatar":"AR"}
]')
ON CONFLICT (config_key) DO NOTHING;
