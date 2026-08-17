
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segment_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cp_select_own ON customer_profiles;
DROP POLICY IF EXISTS cp_select_admin ON customer_profiles;
DROP POLICY IF EXISTS cp_insert_admin ON customer_profiles;
DROP POLICY IF EXISTS cp_update_own ON customer_profiles;
DROP POLICY IF EXISTS cp_update_admin ON customer_profiles;
DROP POLICY IF EXISTS cp_delete_admin ON customer_profiles;

CREATE POLICY cp_select_own ON customer_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY cp_select_admin ON customer_profiles FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY cp_insert_admin ON customer_profiles FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY cp_update_own ON customer_profiles FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY cp_update_admin ON customer_profiles FOR UPDATE USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY cp_delete_admin ON customer_profiles FOR DELETE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS cd_select_own ON customer_devices;
DROP POLICY IF EXISTS cd_select_admin ON customer_devices;
DROP POLICY IF EXISTS cd_insert_admin ON customer_devices;
DROP POLICY IF EXISTS cd_update_admin ON customer_devices;
DROP POLICY IF EXISTS cd_delete_admin ON customer_devices;

CREATE POLICY cd_select_own ON customer_devices FOR SELECT USING (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
CREATE POLICY cd_select_admin ON customer_devices FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY cd_insert_admin ON customer_devices FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY cd_update_admin ON customer_devices FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY cd_delete_admin ON customer_devices FOR DELETE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS cs_select_all ON customer_segments;
DROP POLICY IF EXISTS cs_insert_admin ON customer_segments;
DROP POLICY IF EXISTS cs_update_admin ON customer_segments;
DROP POLICY IF EXISTS cs_delete_admin ON customer_segments;

CREATE POLICY cs_select_all ON customer_segments FOR SELECT USING (true);
CREATE POLICY cs_insert_admin ON customer_segments FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY cs_update_admin ON customer_segments FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY cs_delete_admin ON customer_segments FOR DELETE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS csm_select_own ON customer_segment_memberships;
DROP POLICY IF EXISTS csm_select_admin ON customer_segment_memberships;
DROP POLICY IF EXISTS csm_insert_admin ON customer_segment_memberships;
DROP POLICY IF EXISTS csm_update_admin ON customer_segment_memberships;
DROP POLICY IF EXISTS csm_delete_admin ON customer_segment_memberships;

CREATE POLICY csm_select_own ON customer_segment_memberships FOR SELECT USING (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
CREATE POLICY csm_select_admin ON customer_segment_memberships FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY csm_insert_admin ON customer_segment_memberships FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY csm_update_admin ON customer_segment_memberships FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY csm_delete_admin ON customer_segment_memberships FOR DELETE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS ct_select_all ON customer_tags;
DROP POLICY IF EXISTS ct_insert_admin ON customer_tags;
DROP POLICY IF EXISTS ct_update_admin ON customer_tags;
DROP POLICY IF EXISTS ct_delete_admin ON customer_tags;

CREATE POLICY ct_select_all ON customer_tags FOR SELECT USING (true);
CREATE POLICY ct_insert_admin ON customer_tags FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY ct_update_admin ON customer_tags FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY ct_delete_admin ON customer_tags FOR DELETE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS cta_select_own ON customer_tag_assignments;
DROP POLICY IF EXISTS cta_select_admin ON customer_tag_assignments;
DROP POLICY IF EXISTS cta_insert_admin ON customer_tag_assignments;
DROP POLICY IF EXISTS cta_update_admin ON customer_tag_assignments;
DROP POLICY IF EXISTS cta_delete_admin ON customer_tag_assignments;

CREATE POLICY cta_select_own ON customer_tag_assignments FOR SELECT USING (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
CREATE POLICY cta_select_admin ON customer_tag_assignments FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY cta_insert_admin ON customer_tag_assignments FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY cta_update_admin ON customer_tag_assignments FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY cta_delete_admin ON customer_tag_assignments FOR DELETE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS ci_select_own ON customer_interests;
DROP POLICY IF EXISTS ci_select_admin ON customer_interests;
DROP POLICY IF EXISTS ci_insert_admin ON customer_interests;
DROP POLICY IF EXISTS ci_update_admin ON customer_interests;
DROP POLICY IF EXISTS ci_delete_admin ON customer_interests;

CREATE POLICY ci_select_own ON customer_interests FOR SELECT USING (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
CREATE POLICY ci_select_admin ON customer_interests FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY ci_insert_admin ON customer_interests FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY ci_update_admin ON customer_interests FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY ci_delete_admin ON customer_interests FOR DELETE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS pc_select_own ON privacy_consents;
DROP POLICY IF EXISTS pc_select_admin ON privacy_consents;
DROP POLICY IF EXISTS pc_insert_own ON privacy_consents;
DROP POLICY IF EXISTS pc_update_own ON privacy_consents;
DROP POLICY IF EXISTS pc_insert_admin ON privacy_consents;
DROP POLICY IF EXISTS pc_update_admin ON privacy_consents;
DROP POLICY IF EXISTS pc_delete_admin ON privacy_consents;

CREATE POLICY pc_select_own ON privacy_consents FOR SELECT USING (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
CREATE POLICY pc_select_admin ON privacy_consents FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY pc_insert_own ON privacy_consents FOR INSERT WITH CHECK (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
CREATE POLICY pc_update_own ON privacy_consents FOR UPDATE USING (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid())) WITH CHECK (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
CREATE POLICY pc_insert_admin ON privacy_consents FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY pc_update_admin ON privacy_consents FOR UPDATE USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY pc_delete_admin ON privacy_consents FOR DELETE USING (is_admin(auth.uid()));

DROP POLICY IF EXISTS ddr_select_own ON data_deletion_requests;
DROP POLICY IF EXISTS ddr_select_admin ON data_deletion_requests;
DROP POLICY IF EXISTS ddr_insert_own ON data_deletion_requests;
DROP POLICY IF EXISTS ddr_update_admin ON data_deletion_requests;
DROP POLICY IF EXISTS ddr_delete_admin ON data_deletion_requests;

CREATE POLICY ddr_select_own ON data_deletion_requests FOR SELECT USING (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
CREATE POLICY ddr_select_admin ON data_deletion_requests FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY ddr_insert_own ON data_deletion_requests FOR INSERT WITH CHECK (customer_profile_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));
CREATE POLICY ddr_update_admin ON data_deletion_requests FOR UPDATE USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY ddr_delete_admin ON data_deletion_requests FOR DELETE USING (is_admin(auth.uid()));

INSERT INTO customer_segments (name, description, is_system, is_dynamic, rules_json) VALUES
('Anonymous Visitors', 'Users who have not signed up yet', true, true, '{"operator":"AND","conditions":[{"field":"is_anonymous","operator":"eq","value":true}]}'),
('New Users', 'Users registered within the last 7 days', true, true, '{"operator":"AND","conditions":[{"field":"days_since_signup","operator":"lte","value":7}]}'),
('Free Users', 'Users on the free plan', true, true, '{"operator":"AND","conditions":[{"field":"subscription_plan","operator":"eq","value":"free"}]}'),
('Pro Users', 'Users with a Pro, Business, or Enterprise subscription', true, true, '{"operator":"AND","conditions":[{"field":"subscription_plan","operator":"in","value":["pro","business","enterprise"]}]}'),
('Business Users', 'Users on the Business plan', true, true, '{"operator":"AND","conditions":[{"field":"subscription_plan","operator":"eq","value":"business"}]}'),
('Enterprise Users', 'Users on the Enterprise plan', true, true, '{"operator":"AND","conditions":[{"field":"subscription_plan","operator":"eq","value":"enterprise"}]}'),
('Students', 'Users with a student role or academic behavior', true, true, '{"operator":"AND","conditions":[{"field":"role","operator":"eq","value":"student"}]}'),
('Teachers', 'Users with a teacher role', true, true, '{"operator":"AND","conditions":[{"field":"role","operator":"eq","value":"teacher"}]}'),
('Researchers', 'Users with a researcher role', true, true, '{"operator":"AND","conditions":[{"field":"role","operator":"eq","value":"researcher"}]}'),
('Content Writers', 'Users identified as content writers', true, true, '{"operator":"AND","conditions":[{"field":"role","operator":"eq","value":"content_writer"}]}'),
('SEO Professionals', 'Users identified as SEO professionals', true, true, '{"operator":"AND","conditions":[{"field":"role","operator":"eq","value":"seo_professional"}]}'),
('Agencies', 'Users identified as agencies', true, true, '{"operator":"AND","conditions":[{"field":"role","operator":"eq","value":"agency"}]}'),
('Publishers', 'Users identified as publishers', true, true, '{"operator":"AND","conditions":[{"field":"role","operator":"eq","value":"publisher"}]}'),
('Developers', 'Users identified as developers', true, true, '{"operator":"AND","conditions":[{"field":"role","operator":"eq","value":"developer"}]}'),
('API Users', 'Users who have created or used API keys', true, true, '{"operator":"AND","conditions":[{"field":"used_tool","operator":"gte","value":1,"tool":"api"}]}'),
('Chrome Extension Users', 'Users who installed the Chrome extension', true, true, '{"operator":"AND","conditions":[{"field":"used_tool","operator":"gte","value":1,"tool":"extension"}]}'),
('WordPress Plugin Users', 'Users who downloaded the WordPress plugin', true, true, '{"operator":"AND","conditions":[{"field":"used_tool","operator":"gte","value":1,"tool":"plugin"}]}'),
('Returning Users', 'Users who have logged in more than once', true, true, '{"operator":"AND","conditions":[{"field":"session_count","operator":"gte","value":2}]}'),
('Inactive Users', 'No activity in the last 30 days', true, true, '{"operator":"AND","conditions":[{"field":"days_since_login","operator":"gte","value":30}]}'),
('Power Users', 'High tool usage in the last 30 days', true, true, '{"operator":"AND","conditions":[{"field":"engagement_score","operator":"gte","value":60}]}'),
('High Intent Users', 'Visited pricing and used tools frequently without a paid plan', true, true, '{"operator":"AND","conditions":[{"field":"visited_page","operator":"eq","value":"/pricing"},{"field":"used_tool","operator":"gte","value":5},{"field":"subscription_plan","operator":"neq","value":"enterprise"}]}'),
('Trial Users', 'Users currently on a trial', true, true, '{"operator":"AND","conditions":[{"field":"subscription_status","operator":"eq","value":"trialing"}]}'),
('Cancelled Users', 'Users with cancelled subscriptions', true, true, '{"operator":"AND","conditions":[{"field":"subscription_status","operator":"eq","value":"cancelled"}]}'),
('Recently Upgraded', 'Upgraded to paid within the last 7 days', true, true, '{"operator":"AND","conditions":[{"field":"subscription_plan","operator":"in","value":["pro","business","enterprise"]},{"field":"days_since_signup","operator":"lte","value":7}]}'),
('Recently Downgraded', 'Downgraded or cancelled within the last 7 days', true, true, '{"operator":"AND","conditions":[{"field":"subscription_status","operator":"eq","value":"cancelled"},{"field":"days_since_signup","operator":"lte","value":7}]}')
ON CONFLICT (name) DO NOTHING;

INSERT INTO customer_tags (name, color, is_system) VALUES
('High Intent', '#F59E0B', true),
('Power User', '#8B5CF6', true),
('VIP', '#EF4444', false),
('Academic', '#10B981', true),
('Enterprise Lead', '#3B82F6', true),
('Agency', '#06B6D4', false),
('Developer', '#6366F1', true),
('SEO', '#14B8A6', true),
('Publisher', '#F97316', true),
('Inactive', '#6B7280', true),
('Returning', '#22C55E', true),
('Churn Risk', '#EF4444', true)
ON CONFLICT (name) DO NOTHING;
