<?php
/**
 * Plugin Name: AIDetector.cx SEO Assistant & Humanizer
 * Plugin URI: https://aidetector.cx
 * Description: Adds AI Humanizer, SEO Assistant, AI Detection, and content optimization tools to WordPress.
 * Version: 2.4.5
 * Author: AIDetector.cx
 * Author URI: https://aidetector.cx
 * License: GPL2
 * Text Domain: aidetector
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('admin_menu', 'aidetector_menu');

function aidetector_menu() {
    add_menu_page(
        'AIDetector Settings',
        'AIDetector',
        'manage_options',
        'aidetector-settings',
        'aidetector_settings_page',
        'dashicons-shield',
        100
    );
    add_submenu_page(
        'aidetector-settings',
        'Web Editor',
        'Web Editor',
        'manage_options',
        'aidetector-web-editor',
        'aidetector_web_editor_page'
    );
}

function aidetector_web_editor_page() {
    ?>
    <div class="wrap">
        <h1>AIDetector.cx Web Assistant</h1>
        <p>Use our full-featured web editor for advanced AI Detection, Humanization, and SEO Optimization.</p>
        <iframe src="https://aidetector.cx" width="100%" height="800px" style="border: 1px solid #ccc; border-radius: 8px;"></iframe>
    </div>
    <?php
}

function aidetector_settings_page() {
    $api_key = get_option('aidetector_api_key', '');
    $auth_mode = get_option('aidetector_auth_mode', 'api_key');
    $auth_email = get_option('aidetector_auth_email', '');
    ?>
    <div class="wrap">
        <h1>AIDetector.cx Settings & Instructions</h1>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 300px; background: #fff; padding: 20px; border: 1px solid #ccd0d4; box-shadow: 0 1px 1px rgba(0,0,0,.04);">
                <h2>1. API Configuration</h2>
                
                <div id="aidetector-connection-status" style="margin-bottom: 20px; padding: 10px; border-radius: 4px; display: none;"></div>

                <div id="aidetector-tabs" style="margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
                    <label style="margin-right: 15px;">
                        <input type="radio" name="auth_mode_toggle" value="api_key" <?php echo $auth_mode !== 'account' ? 'checked' : ''; ?>> API Key
                    </label>
                    <label>
                        <input type="radio" name="auth_mode_toggle" value="account" <?php echo $auth_mode === 'account' ? 'checked' : ''; ?>> Account Login
                    </label>
                </div>

                <div id="aidetector-api-key-section" style="display: <?php echo $auth_mode !== 'account' ? 'block' : 'none'; ?>;">
                    <p>Enter your API Key. Find it in the <a href="https://aidetector.cx/api-platform" target="_blank">AIDetector API Platform</a>.</p>
                    <input type="text" id="aidetector_api_key_input" value="<?php echo esc_attr($api_key); ?>" style="width: 100%; margin-bottom: 10px;" placeholder="sk-... or aid_..." />
                    <button type="button" class="button button-primary" id="aidetector_save_api_key_btn">Save & Verify API Key</button>
                </div>

                <div id="aidetector-account-section" style="display: <?php echo $auth_mode === 'account' ? 'block' : 'none'; ?>;">
                    <?php if ($auth_mode === 'account' && !empty($auth_email)): ?>
                        <p style="color: green; font-weight: bold;">✓ Connected as <?php echo esc_html($auth_email); ?></p>
                        <button type="button" class="button" id="aidetector_disconnect_btn">Disconnect Account</button>
                    <?php else: ?>
                        <p>Login with your AIDetector.cx account.</p>
                        <input type="email" id="aidetector_email" placeholder="Email" style="width: 100%; margin-bottom: 10px;" />
                        <input type="password" id="aidetector_password" placeholder="Password" style="width: 100%; margin-bottom: 10px;" />
                        <button type="button" class="button button-primary" id="aidetector_login_btn">Connect Account</button>
                    <?php endif; ?>
                </div>

                <script>
                jQuery(document).ready(function($) {
                    const apiUrl = 'https://hzjnrmxwzkeaodvusszx.supabase.co/functions/v1';

                    $('input[name="auth_mode_toggle"]').on('change', function() {
                        if (this.value === 'api_key') {
                            $('#aidetector-api-key-section').show();
                            $('#aidetector-account-section').hide();
                        } else {
                            $('#aidetector-api-key-section').hide();
                            $('#aidetector-account-section').show();
                        }
                    });

                    function showStatus(message, isSuccess) {
                        const status = $('#aidetector-connection-status');
                        status.html((isSuccess ? '✓ ' : '✗ ') + message)
                              .css('background-color', isSuccess ? '#e7f5ea' : '#fbeaea')
                              .css('color', isSuccess ? '#135e24' : '#ba0c2f')
                              .css('border', isSuccess ? '1px solid #c6e1c6' : '1px solid #f1c2c2')
                              .show();
                    }

                    function saveSettings(apiKey, authMode, email) {
                        $.post(ajaxurl, {
                            action: 'aidetector_save_settings',
                            nonce: '<?php echo wp_create_nonce('aidetector_save_nonce'); ?>',
                            api_key: apiKey,
                            auth_mode: authMode,
                            email: email
                        }, function(res) {
                            if (res.success) {
                                showStatus(authMode === 'account' ? 'Connected as ' + email : 'API Key connected successfully.', true);
                                if (authMode === 'account') location.reload();
                            } else {
                                showStatus('Failed to save settings.', false);
                            }
                        });
                    }

                    $('#aidetector_save_api_key_btn').on('click', function() {
                        const key = $('#aidetector_api_key_input').val().trim();
                        if (!key) return showStatus('API key is required.', false);
                        const btn = $(this);
                        btn.text('Verifying...').prop('disabled', true);
                        
                        // Verify by calling edge function
                        $.ajax({
                            url: apiUrl + '/run-humanizer',
                            method: 'POST',
                            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
                            data: JSON.stringify({ text: 'test', action: 'humanize', level: 'standard', preserveSeo: true }),
                            success: function() {
                                saveSettings(key, 'api_key', '');
                                btn.text('Save & Verify API Key').prop('disabled', false);
                            },
                            error: function(xhr) {
                                if (xhr.status === 401) {
                                    showStatus('Invalid API Key.', false);
                                } else {
                                    // 400 Bad Request or 429 means key is valid but request malformed/rate limited.
                                    saveSettings(key, 'api_key', '');
                                }
                                btn.text('Save & Verify API Key').prop('disabled', false);
                            }
                        });
                    });

                    $('#aidetector_login_btn').on('click', function() {
                        const email = $('#aidetector_email').val().trim();
                        const pass = $('#aidetector_password').val();
                        if (!email || !pass) return showStatus('Email and password required.', false);
                        
                        const btn = $(this);
                        btn.text('Connecting...').prop('disabled', true);
                        
                        $.ajax({
                            url: apiUrl + '/wp-auth',
                            method: 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify({ email: email, password: pass }),
                            success: function(res) {
                                if (res.success && res.api_key) {
                                    saveSettings(res.api_key, 'account', res.email);
                                } else {
                                    showStatus('Invalid email or password.', false);
                                    btn.text('Connect Account').prop('disabled', false);
                                }
                            },
                            error: function(xhr) {
                                let msg = 'Invalid email or password.';
                                if (xhr.responseJSON && xhr.responseJSON.error) msg = xhr.responseJSON.error;
                                showStatus(msg, false);
                                btn.text('Connect Account').prop('disabled', false);
                            }
                        });
                    });

                    $('#aidetector_disconnect_btn').on('click', function() {
                        if(confirm('Are you sure you want to disconnect?')) {
                            saveSettings('', 'api_key', '');
                            setTimeout(() => location.reload(), 1000);
                        }
                    });
                });
                </script>
            </div>
            
            <div style="flex: 1; min-width: 300px; background: #fff; padding: 20px; border: 1px solid #ccd0d4; box-shadow: 0 1px 1px rgba(0,0,0,.04);">
                <h2>2. How to Use the Plugin</h2>
                <ul style="list-style-type: disc; margin-left: 20px;">
                    <li><strong>Block Editor (Gutenberg):</strong> Click the <strong>Shield icon</strong> in the top-right corner to open the AIDetector Sidebar.</li>
                    <li><strong>Classic Editor:</strong> Scroll down below the text editor box to find the "AIDetector & Humanizer" meta box.</li>
                    <li><strong>Elementor / Site Editor:</strong> Use our <a href="?page=aidetector-web-editor"><strong>Web Editor</strong></a> inside WordPress, or visit <a href="https://aidetector.cx" target="_blank">aidetector.cx</a> directly.</li>
                    <li><strong>Bulk SEO Action:</strong> Go to the Posts list, select multiple posts, and choose "Run SEO Assistant" from the Bulk Actions dropdown. A progress bar will handle them seamlessly!</li>
                </ul>
            </div>
        </div>
    </div>
    <?php
}

add_action('wp_ajax_aidetector_save_settings', 'aidetector_save_settings_ajax');
function aidetector_save_settings_ajax() {
    check_ajax_referer('aidetector_save_nonce', 'nonce');
    if (!current_user_can('manage_options')) {
        wp_send_json_error(['message' => 'Unauthorized']);
    }
    update_option('aidetector_api_key', sanitize_text_field($_POST['api_key'] ?? ''));
    update_option('aidetector_auth_mode', sanitize_text_field($_POST['auth_mode'] ?? 'api_key'));
    update_option('aidetector_auth_email', sanitize_email($_POST['email'] ?? ''));
    wp_send_json_success();
}

add_action('admin_init', 'aidetector_register_settings');

function aidetector_register_settings() {
    register_setting('aidetector_options_group', 'aidetector_detector_service');
    register_setting('aidetector_options_group', 'aidetector_humanizer_service');
    register_setting('aidetector_options_group', 'aidetector_seo_service');

    add_settings_section('aidetector_main_section', 'Advanced Configuration', null, 'aidetector-settings');
    add_settings_field('aidetector_detector_service', 'Detector Service', 'aidetector_detector_service_cb', 'aidetector-settings', 'aidetector_main_section');
    add_settings_field('aidetector_humanizer_service', 'Humanizer Service', 'aidetector_humanizer_service_cb', 'aidetector-settings', 'aidetector_main_section');
    add_settings_field('aidetector_seo_service', 'SEO Service', 'aidetector_seo_service_cb', 'aidetector-settings', 'aidetector_main_section');
}

function aidetector_api_key_cb() {
    $api_key = get_option('aidetector_api_key');
    echo "<input type='text' name='aidetector_api_key' value='" . esc_attr($api_key) . "' style='width: 300px;' placeholder='aid_...' />";
    echo "<p class='description'>Generate this key from your <a href='https://aidetector.cx/api-platform' target='_blank'>AIDetector.cx API Platform</a>.</p>";
}

function aidetector_detector_service_cb() {
    $val = get_option('aidetector_detector_service', 'default');
    echo "<select name='aidetector_detector_service'>
            <option value='default' " . selected($val, 'default', false) . ">Default AI Detector</option>
            <option value='openai' " . selected($val, 'openai', false) . ">OpenAI Detector</option>
          </select>";
}

function aidetector_humanizer_service_cb() {
    $val = get_option('aidetector_humanizer_service', 'default');
    echo "<select name='aidetector_humanizer_service'>
            <option value='default' " . selected($val, 'default', false) . ">Default Humanizer (Gemini Flash)</option>
            <option value='claude' " . selected($val, 'claude', false) . ">Claude 3.5 Humanizer</option>
          </select>";
}

function aidetector_seo_service_cb() {
    $val = get_option('aidetector_seo_service', 'default');
    echo "<select name='aidetector_seo_service'>
            <option value='default' " . selected($val, 'default', false) . ">Default SEO (Gemini Flash)</option>
            <option value='openai' " . selected($val, 'openai', false) . ">OpenAI SEO Analyzer</option>
          </select>";
}

// Register Meta fields for SEO results
add_action('init', 'aidetector_register_meta');
function aidetector_register_meta() {
    register_post_meta('', '_aidetector_seo_results', array(
        'show_in_rest' => true,
        'single' => true,
        'type' => 'string',
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));
    register_post_meta('', '_aidetector_seo_score', array(
        'show_in_rest' => true,
        'single' => true,
        'type' => 'integer',
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        }
    ));
}

// === CUSTOM COLUMNS FOR POST LIST ===
add_filter('manage_posts_columns', 'aidetector_add_custom_columns');
function aidetector_add_custom_columns($columns) {
    $columns['aidetector_seo_score'] = 'SEO Score';
    return $columns;
}

add_filter('manage_edit-post_sortable_columns', 'aidetector_sortable_columns');
function aidetector_sortable_columns($columns) {
    $columns['aidetector_seo_score'] = 'aidetector_seo_score';
    return $columns;
}

add_action('pre_get_posts', 'aidetector_seo_score_orderby');
function aidetector_seo_score_orderby($query) {
    if (!is_admin() || !$query->is_main_query()) return;
    $orderby = $query->get('orderby');
    if ('aidetector_seo_score' === $orderby) {
        $query->set('meta_key', '_aidetector_seo_score');
        $query->set('orderby', 'meta_value_num');
    }
}

add_action('manage_posts_custom_column', 'aidetector_render_custom_columns', 10, 2);
function aidetector_render_custom_columns($column, $post_id) {
    if ($column == 'aidetector_seo_score') {
        $meta = get_post_meta($post_id, '_aidetector_seo_results', true);
        if ($meta) {
            $data = json_decode($meta, true);
            if (isset($data['seoScore'])) {
                $score = intval($data['seoScore']);
                $color = $score >= 80 ? 'green' : ($score >= 50 ? 'orange' : 'red');
                
                $tooltip = "";
                if (isset($data['keywordSuggestions']) || isset($data['metaTitleSuggestion'])) {
                    $kws = isset($data['keywordSuggestions']) ? implode(', ', $data['keywordSuggestions']) : '';
                    $mt = isset($data['metaTitleSuggestion']) ? $data['metaTitleSuggestion'] : '';
                    $md = isset($data['metaDescriptionSuggestion']) ? $data['metaDescriptionSuggestion'] : '';
                    $tooltip = esc_attr("Keywords: $kws\nTitle: $mt\nDesc: $md");
                }
                
                echo "<strong style='color:{$color}; cursor:help;' title='{$tooltip}'>{$score}/100</strong>";
                return;
            }
        }
        echo '<span style="color:#999;">Not Analyzed</span>';
    }
}

// === WP CRON: WEEKLY SEO SCAN FOR NEW POSTS ===
register_activation_hook(__FILE__, 'aidetector_activate_cron');
function aidetector_activate_cron() {
    if (!wp_next_scheduled('aidetector_weekly_seo_scan')) {
        wp_schedule_event(time(), 'weekly', 'aidetector_weekly_seo_scan');
    }
}

register_deactivation_hook(__FILE__, 'aidetector_deactivate_cron');
function aidetector_deactivate_cron() {
    $timestamp = wp_next_scheduled('aidetector_weekly_seo_scan');
    if ($timestamp) {
        wp_unschedule_event($timestamp, 'aidetector_weekly_seo_scan');
    }
}

add_action('aidetector_weekly_seo_scan', 'aidetector_run_weekly_scan');
function aidetector_run_weekly_scan() {
    $api_key = get_option('aidetector_api_key');
    if (empty($api_key)) return;

    // Find up to 50 recent posts without SEO score
    $query = new WP_Query(array(
        'post_type' => 'post',
        'post_status' => 'publish',
        'posts_per_page' => 50,
        'meta_query' => array(
            array(
                'key' => '_aidetector_seo_score',
                'compare' => 'NOT EXISTS'
            )
        )
    ));

    if (!$query->have_posts()) return;

    $seo_service = get_option('aidetector_seo_service', 'default');

    foreach ($query->posts as $post) {
        $content = wp_strip_all_tags($post->post_content);
        if (empty($content)) continue;

        $response = wp_remote_post('https://hzjnrmxwzkeaodvusszx.supabase.co/functions/v1/plugin-seo-analyzer', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type' => 'application/json'
            ),
            'body' => wp_json_encode(array(
                'title' => $post->post_title,
                'content' => $content,
                'keyword' => '',
                'service' => $seo_service
            )),
            'timeout' => 30
        ));

        if (!is_wp_error($response)) {
            $data = json_decode(wp_remote_retrieve_body($response), true);
            if (isset($data['seoScore'])) {
                update_post_meta($post->ID, '_aidetector_seo_results', wp_json_encode($data));
                update_post_meta($post->ID, '_aidetector_seo_score', intval($data['seoScore']));
            }
        }
    }
}

// === BULK ACTION: RUN SEO ASSISTANT via AJAX ===

// 1. Register the Bulk Action in Dropdown
add_filter('bulk_actions-edit-post', 'aidetector_register_bulk_action');
function aidetector_register_bulk_action($bulk_actions) {
    $bulk_actions['run_aidetector_seo'] = __('Run SEO Assistant', 'aidetector');
    return $bulk_actions;
}

// 2. Enqueue the JS for AJAX progress bar on the edit.php screen
add_action('admin_enqueue_scripts', 'aidetector_enqueue_bulk_js');
function aidetector_enqueue_bulk_js($hook) {
    if ($hook !== 'edit.php') return;
    
    wp_enqueue_script('aidetector-bulk-ajax', plugins_url('assets/js/bulk-ajax.js', __FILE__), array('jquery'), '2.4.0', true);
    wp_localize_script('aidetector-bulk-ajax', 'aidetectorBulk', array(
        'nonce' => wp_create_nonce('aidetector_bulk_seo_nonce')
    ));
}

// 3. The AJAX Handler
add_action('wp_ajax_aidetector_process_single_seo', 'aidetector_ajax_process_single_seo');
function aidetector_ajax_process_single_seo() {
    check_ajax_referer('aidetector_bulk_seo_nonce', 'nonce');
    if (!current_user_can('edit_posts')) wp_send_json_error('Permission denied.');

    $post_id = intval($_POST['post_id']);
    $api_key = get_option('aidetector_api_key');
    if (empty($api_key)) wp_send_json_error('API Key missing.');

    $post = get_post($post_id);
    if (!$post) wp_send_json_error('Post not found.');

    $content = wp_strip_all_tags($post->post_content);
    $title = $post->post_title;
    
    $seo_service = get_option('aidetector_seo_service', 'default');

    $response = wp_remote_post('https://hzjnrmxwzkeaodvusszx.supabase.co/functions/v1/plugin-seo-analyzer', array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $api_key,
            'Content-Type' => 'application/json'
        ),
        'body' => wp_json_encode(array(
            'title' => $title,
            'content' => $content,
            'keyword' => '',
            'service' => $seo_service
        )),
        'timeout' => 45 // Longer timeout for AI
    ));

    if (is_wp_error($response)) {
        wp_send_json_error($response->get_error_message());
    }

    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);

    if (isset($data['seoScore'])) {
        update_post_meta($post_id, '_aidetector_seo_results', wp_json_encode($data));
        update_post_meta($post_id, '_aidetector_seo_score', intval($data['seoScore']));
        wp_send_json_success(array('score' => $data['seoScore']));
    } else {
        wp_send_json_error('Invalid AI response: ' . $body);
    }
}


// Enqueue Editor Assets for Gutenberg
add_action('enqueue_block_editor_assets', 'aidetector_enqueue_gutenberg_assets');
function aidetector_enqueue_gutenberg_assets() {
    if (!current_user_can('edit_posts')) return;
    
    wp_enqueue_script(
        'aidetector-gutenberg', 
        plugins_url('assets/js/gutenberg.js', __FILE__), 
        array('wp-plugins', 'wp-edit-post', 'wp-element', 'wp-components', 'wp-data', 'wp-core-data', 'wp-compose'), 
        '2.4.0', 
        true
    );
    wp_enqueue_style('aidetector-gutenberg-css', plugins_url('assets/css/style.css', __FILE__), array(), '2.4.0');
    
    wp_localize_script('aidetector-gutenberg', 'aidetectorData', array(
        'apiKey' => get_option('aidetector_api_key'),
        'apiUrl' => 'https://hzjnrmxwzkeaodvusszx.supabase.co/functions/v1',
        'detectorService' => get_option('aidetector_detector_service', 'default'),
        'humanizerService' => get_option('aidetector_humanizer_service', 'default'),
        'seoService' => get_option('aidetector_seo_service', 'default')
    ));
}

// Classic Editor Meta Box
add_action('add_meta_boxes', 'aidetector_add_classic_meta_box');
function aidetector_add_classic_meta_box() {
    add_meta_box('aidetector_classic_box', 'AIDetector & Humanizer', 'aidetector_classic_box_html', array('post', 'page'), 'normal', 'high');
}

function aidetector_classic_box_html($post) {
    ?>
    <div id="aidetector-classic-app">
        <p><em>Loading AIDetector interface...</em></p>
    </div>
    <?php
}

add_action('admin_enqueue_scripts', 'aidetector_enqueue_classic_assets');
function aidetector_enqueue_classic_assets($hook) {
    global $post;
    if ($hook == 'post-new.php' || $hook == 'post.php') {
        if (!current_user_can('edit_posts')) return;
        // Don't load classic script if Gutenberg is active for this post
        if (function_exists('use_block_editor_for_post') && use_block_editor_for_post($post)) return;

        wp_enqueue_script('aidetector-classic', plugins_url('assets/js/classic.js', __FILE__), array('jquery'), '2.4.0', true);
        wp_enqueue_style('aidetector-classic-css', plugins_url('assets/css/style.css', __FILE__), array(), '2.4.0');
        
        wp_localize_script('aidetector-classic', 'aidetectorData', array(
            'apiKey' => get_option('aidetector_api_key'),
            'apiUrl' => 'https://hzjnrmxwzkeaodvusszx.supabase.co/functions/v1',
            'detectorService' => get_option('aidetector_detector_service', 'default'),
            'humanizerService' => get_option('aidetector_humanizer_service', 'default'),
            'seoService' => get_option('aidetector_seo_service', 'default')
        ));
    }
}
