-- Restore lifecycle catalog rows referenced by Customer Intelligence triggers.
-- Definitions only; this does not create or modify individual user progress.
INSERT INTO public.milestones (milestone_key,title,description,badge_image_url,requirements,category,display_order,enabled,is_system) VALUES
('first_login','First Login','Welcome to AIDetector.cx',NULL,'{"event":"signup"}','onboarding',1,true,true),
('email_verified','Email Verified','You confirmed your email address.',NULL,'{"field":"email_verified"}','onboarding',2,true,true),
('first_scan','First Scan','You ran your first AI Detector scan.',NULL,'{"event":"tool_used","tool":"detector"}','detector',3,true,true),
('first_humanization','First Humanization','You humanized your first document.',NULL,'{"event":"tool_used","tool":"humanizer"}','humanizer',4,true,true),
('first_plagiarism_check','First Plagiarism Check','You checked your first document for originality.',NULL,'{"event":"tool_used","tool":"plagiarism"}','plagiarism',5,true,true),
('10_scans','10 Scans','You analyzed 10 documents.',NULL,'{"event":"tool_used","tool":"detector","count":10}','detector',6,true,true),
('100_scans','100 Scans','You analyzed 100 documents.',NULL,'{"event":"tool_used","tool":"detector","count":100}','detector',7,true,true),
('1000_scans','1000 Scans','You analyzed 1,000 documents.',NULL,'{"event":"tool_used","tool":"detector","count":1000}','detector',8,true,true),
('extension_installed','Extension Installed','You added AI detection to your browser.',NULL,'{"event":"tool_used","tool":"chrome_extension_install"}','integrations',9,true,true),
('plugin_connected','Plugin Connected','You connected the WordPress plugin.',NULL,'{"event":"tool_used","tool":"wordpress_plugin_install"}','integrations',10,true,true),
('api_activated','API Activated','You generated your first API key.',NULL,'{"event":"tool_used","tool":"api_key_created"}','api',11,true,true),
('first_upgrade','First Upgrade','You upgraded to a premium plan.',NULL,'{"field":"subscription_plan","not":"free"}','billing',12,true,true),
('first_report_saved','First Report Saved','You saved your first report.',NULL,'{"event":"report_saved"}','productivity',13,true,true),
('one_month_active','One Month Active','You used the platform for a full month.',NULL,'{"days_active":30}','engagement',14,true,true),
('three_month_active','Three Month Active','You used the platform for three months.',NULL,'{"days_active":90}','engagement',15,true,true),
('power_user','Power User','You adopted multiple tools and use them consistently.',NULL,'{"tools_used":3,"days_active":15}','engagement',16,true,true)
ON CONFLICT (milestone_key) DO UPDATE SET title=excluded.title,description=excluded.description,requirements=excluded.requirements,category=excluded.category,display_order=excluded.display_order,enabled=excluded.enabled,is_system=excluded.is_system;

INSERT INTO public.customer_goals(goal_key,title,description,requirements,target,enabled,is_system) VALUES
('check_100_documents','Check 100 documents','Run AI detection on 100 documents.','{"event":"tool_used","tool":"detector","count":100}',100,true,true),
('humanize_50_articles','Humanize 50 articles','Rewrite 50 articles with the Humanizer.','{"event":"tool_used","tool":"humanizer","count":50}',50,true,true),
('install_extension','Install Chrome Extension','Add the browser extension.','{"event":"tool_used","tool":"chrome_extension_install"}',1,true,true),
('connect_plugin','Connect WordPress Plugin','Connect the WordPress plugin.','{"event":"tool_used","tool":"wordpress_plugin_install"}',1,true,true),
('generate_api_key','Generate API Key','Create your first API key.','{"event":"tool_used","tool":"api_key_created"}',1,true,true),
('upgrade_to_pro','Upgrade to Pro','Unlock premium features.','{"field":"subscription_plan","not":"free"}',1,true,true)
ON CONFLICT (goal_key) DO UPDATE SET title=excluded.title,description=excluded.description,requirements=excluded.requirements,target=excluded.target,enabled=excluded.enabled,is_system=excluded.is_system;

INSERT INTO public.activation_checklist_items(item_key,label,description,estimated_time,completion_criteria,reward_message,display_order,enabled,is_system) VALUES
('verify_email','Verify email address','Confirm your email to unlock full access.',1,'{"field":"email_verified"}','Email verified — your account is secure.',1,true,true),
('complete_profile','Complete your profile','Add your name, role, and company.',2,'{"fields":["full_name","role"]}','Profile completed — we can personalize your experience.',2,true,true),
('first_scan','Run first AI Detector scan','Analyze your first document for AI-generated content.',2,'{"event":"tool_used","tool":"detector"}','First scan complete — welcome to AI detection.',3,true,true),
('first_humanize','Humanize first document','Rewrite AI text to sound natural.',3,'{"event":"tool_used","tool":"humanizer"}','First humanization done — your content sounds human.',4,true,true),
('first_plagiarism','Run plagiarism scan','Check your content for originality.',2,'{"event":"tool_used","tool":"plagiarism"}','Originality check complete.',5,true,true),
('install_extension','Install Chrome Extension','Add AI detection to your browser.',3,'{"event":"tool_used","tool":"chrome_extension_install"}','Extension installed — analyze anywhere.',6,true,true),
('install_plugin','Install WordPress Plugin','Connect AI detection to your WordPress site.',4,'{"event":"tool_used","tool":"wordpress_plugin_install"}','Plugin connected — protect your site.',7,true,true),
('first_api_key','Generate first API Key','Start building with the API.',2,'{"event":"tool_used","tool":"api_key_created"}','API activated — build at scale.',8,true,true),
('save_report','Save first report','Save a report for quick access later.',1,'{"event":"report_saved"}','First report saved — your work is organized.',9,true,true),
('upgrade_to_pro','Upgrade to Pro','Unlock higher limits and advanced features.',2,'{"field":"subscription_plan","not":"free"}','Welcome to Pro — enjoy premium features.',10,true,true)
ON CONFLICT (item_key) DO UPDATE SET label=excluded.label,description=excluded.description,estimated_time=excluded.estimated_time,completion_criteria=excluded.completion_criteria,reward_message=excluded.reward_message,display_order=excluded.display_order,enabled=excluded.enabled,is_system=excluded.is_system;
