<?php
if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

// Handle API key form submission
if (isset($_POST['btn_save_and_sync'])) {
    // Nonce verification
    check_admin_referer('lovarank_save_key');

    // Securely handle input
    $apiKey = isset($_POST['api_key']) ? sanitize_text_field(wp_unslash($_POST['api_key'])) : '';
    $postMode = isset($_POST['post_as_draft']) ? sanitize_text_field(wp_unslash($_POST['post_as_draft'])) : 'no';

    if (!in_array($postMode, ['yes', 'no'])) {
        $postMode = 'no'; // fallback
    }

    update_option('lovarank_api_key', $apiKey);
    update_option('lovarank_post_as_draft', $postMode);

    echo '<div class="outrank-success-notice">
            <div class="notice-content">
                <svg class="notice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                </svg>
                <div>
                    <div class="notice-title">Settings Saved Successfully!</div>
                    <div class="notice-subtitle">Integration key and preferences updated successfully.</div>
                </div>
            </div>
          </div>';

    // lovarank_fetch_articles();
}

// Get saved values
$apiKey = get_option('lovarank_api_key');
$isDraft = get_option('lovarank_post_as_draft', 'no');
?>

<div class="outrank-settings-container">
    <div class="outrank-settings-card">
        <div class="outrank-settings-header">
            <h1 class="settings-title"><?php echo empty($apiKey) ? 'Lovarank Plugin Set Up' : 'Plugin Settings'; ?></h1>
            <p class="settings-subtitle">Configure Lovarank plugin to publish articles to your website</p>
        </div>

        <div class="settings-form-container">
            <form method="post" action="<?php echo esc_url(admin_url('admin.php?page=lovarank_manage')); ?>" class="settings-form">
                <?php wp_nonce_field('lovarank_save_key'); ?>

                <div class="field-group">
                    <label for="api_key" class="field-label">Integration Key</label>
                    <input 
                        type="text" 
                        id="api_key" 
                        name="api_key" 
                        class="field-input" 
                        value="<?php echo esc_attr($apiKey); ?>" 
                        placeholder="Enter your integration key here..."
                        required 
                    />
                    <p class="field-description">
                        Generate this key in <a href="https://app.lovarank.com/" target="_blank">Lovarank App</a> when creating your WordPress integration.
                    </p>
                </div>

                <div class="field-group">
                    <label for="post_as_draft" class="field-label">Post Mode</label>
                    <select name="post_as_draft" id="post_as_draft" class="field-input">
                        <option value="" disabled>Select Post Mode</option>
                        <option value="yes" <?php selected($isDraft, 'yes'); ?>>Save as Draft</option>
                        <option value="no" <?php selected($isDraft, 'no'); ?>>Publish Directly</option>
                    </select>
                    <p class="field-description">Choose whether incoming posts are published immediately or saved as drafts.</p>
                </div>

                <div class="flex-buttons" style="display: flex; gap: 12px; margin-top: 16px;">
                    <button id="save-btn" type="submit" name="btn_save_and_sync" class="save-button">
                        Save
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>