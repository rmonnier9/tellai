<?php
// inc/image-functions.php

function lovarank_upload_image_from_url($image_url, $post_id = 0) {
    if (empty($image_url)) return false;

    $filename = basename($image_url);
    $image_data = file_get_contents($image_url);
    if (!$image_data) return false;

    $upload_dir = wp_upload_dir();
    $filepath = $upload_dir['path'] . '/' . $filename;
    file_put_contents($filepath, $image_data);

    $filetype = wp_check_filetype($filename, null);

    $attachment = [
        'post_mime_type' => $filetype['type'],
        'post_title'     => sanitize_file_name($filename),
        'post_content'   => '',
        'post_status'    => 'inherit',
    ];

    $attach_id = wp_insert_attachment($attachment, $filepath, $post_id);
    require_once ABSPATH . 'wp-admin/includes/image.php';
    $attach_data = wp_generate_attachment_metadata($attach_id, $filepath);
    wp_update_attachment_metadata($attach_id, $attach_data);

    return $attach_id;
}