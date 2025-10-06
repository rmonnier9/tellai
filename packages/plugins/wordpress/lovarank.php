<?php
if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

/*
 * Plugin Name: Lovarank
 * Plugin URI: https://lovarank.com
 * Description: Get traffic and outrank competitors with automatic SEO-optimized content generation published to your WordPress site.
 * Version: 1.0.2
 * Author: Lovarank
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Requires PHP: 8.0
 * Requires at least: 6.4
 * Tested up to: 6.8
*/

define('LOVARANK_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('LOVARANK_PLUGIN_URL', plugin_dir_url(__FILE__));
require_once plugin_dir_path(__FILE__) . 'includes/image-functions.php';

// Add admin menu pages
add_action('admin_menu', 'lovarank_add_lovarank_menu');
function lovarank_add_lovarank_menu() {
    add_menu_page(
        'Lovarank Menu',
        'Lovarank',
        'manage_options',
        'lovarank',
        'lovarank_page',
        'data:image/svg+xml;base64,' . base64_encode(file_get_contents(LOVARANK_PLUGIN_PATH . 'images/icon.svg')),
        60
    );
    add_submenu_page('lovarank', 'Home', 'Home', 'manage_options', 'lovarank', 'lovarank_page');
    add_submenu_page('lovarank', 'Manage', 'Manage', 'manage_options', 'lovarank_manage', 'lovarank_manage_page');
}

// Redirect to manage page if no API key is set
add_action('admin_init', 'lovarank_check_api_key_redirect');
function lovarank_check_api_key_redirect() {
    // Only redirect if we're on the Lovarank home page
    if (isset($_GET['page']) && $_GET['page'] === 'lovarank') {
        $apiKey = get_option('lovarank_api_key');
        if (empty($apiKey)) {
            wp_safe_redirect(admin_url('admin.php?page=lovarank_manage'));
            exit;
        }
    }
}

// Handle activation redirect
add_action('admin_init', 'lovarank_activation_redirect');
function lovarank_activation_redirect() {
    // Only redirect if transient exists
    if (get_transient('lovarank_activation_redirect')) {
        delete_transient('lovarank_activation_redirect');
        
        // Don't redirect on multi-site activations or bulk plugin activations
        if (is_network_admin() || isset($_GET['activate-multi'])) {
            return;
        }
        
        // Redirect to manage page
        wp_safe_redirect(admin_url('admin.php?page=lovarank_manage'));
        exit;
    }
}

// Include admin pages
function lovarank_page() {
    include_once LOVARANK_PLUGIN_PATH . 'pages/home.php';
}

function lovarank_manage_page() {
    include_once LOVARANK_PLUGIN_PATH . 'pages/manage.php';
}

// Activation hook: Create custom table
register_activation_hook(__FILE__, 'lovarank_activate');
function lovarank_activate() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'lovarank_manage';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "
    CREATE TABLE {$table_name} (
        id INT(11) NOT NULL AUTO_INCREMENT,
        image TEXT NOT NULL,
        slug VARCHAR(191) NOT NULL,
        title TEXT NOT NULL,
        meta_description TEXT NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY slug_unique (slug)
    ) ENGINE=InnoDB $charset_collate;
    ";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql);
    lovarank_schedule_cron();
    
    // Set transient for activation redirect
    set_transient('lovarank_activation_redirect', true, 30);
}

// Deactivation hook: Keep all data
register_deactivation_hook(__FILE__, 'lovarank_deactivate');

function lovarank_deactivate() {
    // Clear scheduled cron events
    $timestamp = wp_next_scheduled('lovarank_daily_sync');
    if ($timestamp) {
        wp_unschedule_event($timestamp, 'lovarank_daily_sync');
    }
    
    // Note: We intentionally keep all data (database table, options, posts)
    // This allows users to reactivate without losing anything
}

// Enqueue admin styles and scripts
add_action('admin_enqueue_scripts', 'lovarank_add_plugin_assets');
function lovarank_add_plugin_assets($hook_suffix = '') {
    if (strpos($hook_suffix, 'lovarank') === false) return; // Only enqueue on outrank pages

    wp_enqueue_style('lovarank-style', LOVARANK_PLUGIN_URL . 'css/manage.css', [], '1.0.0');
    wp_enqueue_style('lovarank-home-style', LOVARANK_PLUGIN_URL . 'css/home.css', [], '1.0.0');

    wp_enqueue_script('lovarank-script', LOVARANK_PLUGIN_URL . 'script/manage.js', ['jquery'], '1.0.0', true);

    // Localize ajax data only on Manage page
    if ($hook_suffix === 'toplevel_page_lovarank_manage' || $hook_suffix === 'lovarank_page_lovarank_manage') {
        wp_localize_script('lovarank-script', 'lovarankAjax', [
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce'   => wp_create_nonce('lovarank_fetch_nonce'),
        ]);
    }
}

// Schedule daily cron event
function lovarank_schedule_cron() {
    if (!wp_next_scheduled('lovarank_daily_sync')) {
        wp_schedule_event(time(), 'daily', 'lovarank_daily_sync');
    }
}
add_action('lovarank_daily_sync', 'lovarank_fetch_articles');

// Clear scheduled cron event
// function lovarank_clear_cron() {
//     $timestamp = wp_next_scheduled('lovarank_daily_sync');
//     if ($timestamp) {
//         wp_unschedule_event($timestamp, 'lovarank_daily_sync');
//     }
// }

// AJAX handler for manual fetching articles
add_action('wp_ajax_lovarank_fetch_articles_now', function () {
    if (!check_ajax_referer('lovarank_fetch_nonce', 'security', false)) {
        wp_send_json_error(['message' => 'Invalid nonce']);
    }
    lovarank_fetch_articles();
    wp_send_json_success(['message' => '✅ Articles fetched successfully']);
});

// Fetch articles from external API and insert into DB + create WP pages
function lovarank_fetch_articles() {
    global $wpdb;
    $apiKey = get_option('lovarank_api_key');
    if (!$apiKey) {
    //     if ( defined('WP_DEBUG') && WP_DEBUG === true){
    //         error_log('Lovarank: API key missing');
    //     }
        return;
    }

    $response = wp_remote_get("https://app.lovarank.com/api/integrations/wordpress/articles", [
        'headers' => ['X-API-Key' => $apiKey],
        'timeout' => 60,
    ]);

    if (is_wp_error($response) && defined('WP_DEBUG') && WP_DEBUG === true) {
    //     error_log('Lovarank fetch error: ' . $response->get_error_message());
        return;
    }

    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);

    if (empty($data['data']['articles']) && defined('WP_DEBUG') && WP_DEBUG === true) {
    //     error_log('Lovarank: No articles found in response.');
        return;
    }

    $table = $wpdb->prefix . 'lovarank_manage';
    $slugCounts = [];

    foreach ($data['data']['articles'] as $article) {
        $baseSlug = !empty($article['slug']) ? sanitize_title($article['slug']) : sanitize_title($article['title'] ?? 'untitled');
        $slug = $baseSlug;
        $slugCounts[$baseSlug] = ($slugCounts[$baseSlug] ?? 0) + 1;
        if ($slugCounts[$baseSlug] > 1) {
            $slug .= '-' . $slugCounts[$baseSlug];
        }

        $cache_key = 'lovarank_slug_exists_' . md5($slug);
        $exists = wp_cache_get($cache_key);
        
        if ($exists === false) {
            $table_name = esc_sql($wpdb->prefix . 'lovarank_manage');
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            $exists = $wpdb->get_var(
                $wpdb->prepare("SELECT COUNT(*) FROM %i WHERE slug = %s", $table_name, $slug)
            );
            wp_cache_set($cache_key, $exists, '', 600); // cache for 10 minutes
        }
        if ($exists > 0) {
            continue; // skip duplicates
        }

        $created_at = !empty($article['created_at']) ? gmdate('Y-m-d H:i:s', strtotime($article['created_at'])) : current_time('mysql');

        // Insert into DB
        $imageId = lovarank_upload_image_from_url($article['image_url'] ?? '');

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
        $inserted = $wpdb->insert(
            $table_name,
            [
                'image' => $imageId,
                'slug'             => sanitize_text_field($slug),
                'title'            => sanitize_text_field($article['title']),
                'meta_description' => sanitize_text_field($article['meta_description'] ?? ''),
                'status'           => get_option('lovarank_post_as_draft', 'yes') === 'yes' ? 'draft' : 'publish',
                'created_at'       => $created_at,
            ]
        );


        if ($inserted === false && defined('WP_DEBUG') && WP_DEBUG === true) {
        //     error_log('Lovarank DB Insert failed: ' . $wpdb->last_error);
            continue;
        }

        // Handle categories properly
        $category_ids = [];
        if (!empty($article['category'])) {
            if (is_array($article['category'])) {
                foreach ($article['category'] as $cat_name) {
                    $cat = get_category_by_slug(sanitize_title($cat_name));
                    if (!$cat) {
                        $cat_id = wp_create_category($cat_name);
                        $category_ids[] = $cat_id;
                    } else {
                        $category_ids[] = $cat->term_id;
                    }
                }
            } else {
                $cat = get_category_by_slug(sanitize_title($article['category']));
                if (!$cat) {
                    $cat_id = wp_create_category($article['category']);
                    $category_ids[] = $cat_id;
                } else {
                    $category_ids[] = $cat->term_id;
                }
            }
        } else {
            // Default category if none provided
            $default_cat = get_category_by_slug('lovarank');
            if (!$default_cat) {
                $cat_id = wp_create_category('Lovarank');
                $category_ids[] = $cat_id;
            } else {
                $category_ids[] = $default_cat->term_id;
            }
        }

        // Handle author properly
        $author_id = 1; // Default to admin
        if (!empty($article['author'])) {
            if (is_numeric($article['author'])) {
                $author_id = (int) $article['author'];
            } else {
                $user = get_user_by('login', $article['author']);
                if ($user) {
                    $author_id = $user->ID;
                }
            }
        }

        // Prepare post data
        $post_data = [
            'post_title'    => sanitize_text_field($article['title']),
            'post_content'  => wp_kses_post($article['content']),
            'post_status'   => get_option('lovarank_post_as_draft', 'yes') === 'yes' ? 'draft' : 'publish',
            'post_type'     => 'post',
            'post_name'     => $slug,
            'post_category' => $category_ids,
            'post_author'   => $author_id,
            'post_date'     => $created_at,
        ];

        // Handle tags
        if (!empty($article['tags'])) {
            if (is_array($article['tags'])) {
                $post_data['tags_input'] = $article['tags'];
            } else {
                $post_data['tags_input'] = explode(',', $article['tags']);
            }
        }

        // Insert as WP post
        $post_id = wp_insert_post($post_data);//db call ok
        
        if (is_wp_error($post_id) && defined('WP_DEBUG') && WP_DEBUG === true) {
            // error_log('Lovarank WP Post Insert failed: ' . $post_id->get_error_message());
            continue;
        } elseif ($post_id === 0 && defined('WP_DEBUG') && WP_DEBUG === true) {
            // error_log('Lovarank WP Post Insert failed: wp_insert_post returned 0');
            continue;
        }

        // Set featured image if available
        if (!empty($imageId)) {
            set_post_thumbnail($post_id, $imageId);
        }

        // Set SEO meta data for popular SEO plugins
        if (!empty($article['meta_description'])) {
            $meta_description = sanitize_text_field($article['meta_description']);
            
            // Yoast SEO
            update_post_meta($post_id, '_yoast_wpseo_metadesc', $meta_description);
            
            // Rank Math
            update_post_meta($post_id, 'rank_math_description', $meta_description);
            
            // All in One SEO
            update_post_meta($post_id, '_aioseo_description', $meta_description);
            
            // SEOPress
            update_post_meta($post_id, '_seopress_titles_desc', $meta_description);
        }
        
        // Set focus keyphrase/keyword if provided
        if (!empty($article['focus_keyword']) || !empty($article['focus_keyphrase'])) {
            $focus_keyword = sanitize_text_field($article['focus_keyword'] ?? $article['focus_keyphrase'] ?? '');
            
            // Yoast SEO
            update_post_meta($post_id, '_yoast_wpseo_focuskw', $focus_keyword);
            
            // Rank Math
            update_post_meta($post_id, 'rank_math_focus_keyword', $focus_keyword);
            
            // All in One SEO (stores as JSON)
            $aioseo_keyphrases = json_encode([
                ['keyphrase' => $focus_keyword, 'score' => 0]
            ]);
            update_post_meta($post_id, '_aioseo_keyphrases', $aioseo_keyphrases);
            
            // SEOPress
            update_post_meta($post_id, '_seopress_analysis_target_kw', $focus_keyword);
        }
        
        // Set SEO title using the normal title
        if (!empty($article['title'])) {
            $seo_title = sanitize_text_field($article['title']);
            
            // Yoast SEO
            update_post_meta($post_id, '_yoast_wpseo_title', $seo_title);
            
            // Rank Math
            update_post_meta($post_id, 'rank_math_title', $seo_title);
            
            // All in One SEO
            update_post_meta($post_id, '_aioseo_title', $seo_title);
            
            // SEOPress
            update_post_meta($post_id, '_seopress_titles_title', $seo_title);
        }

        // if (defined('WP_DEBUG') && WP_DEBUG === true) {
            // error_log("Lovarank: Successfully created post ID: $post_id with title: " . $article['title']);
        // }
    }
}

// Helper function to get all articles from DB
function lovarank_get_articles() {
    global $wpdb;

    $cache_key = 'lovarank_all_articles';
    $articles = wp_cache_get($cache_key);

    if ($articles === false) {
        $table_name = esc_sql($wpdb->prefix . 'lovarank_manage');
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
        $articles = $wpdb->get_results($wpdb->prepare("SELECT * FROM %i ORDER BY created_at DESC", $table_name));
        wp_cache_set($cache_key, $articles, '', 300); // Cache for 5 minutes
    }

    return $articles;
}

require_once LOVARANK_PLUGIN_PATH . 'libs/api.php';

$api_file = LOVARANK_PLUGIN_PATH . 'libs/api.php';

if (file_exists($api_file)) {
    require_once $api_file;
    // if (defined('WP_DEBUG') && WP_DEBUG === true) {
    //     error_log("✅ api.php included from $api_file");
    // }
// } else {
    // if (defined('WP_DEBUG') && WP_DEBUG === true) {
    //     error_log("❌ api.php NOT found at $api_file");
    // }
}