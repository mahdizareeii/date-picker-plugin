<?php
/*
Plugin Name: Persian Calendar
Description: A plugin to display a Persian (Jalali) or Gregorian calendar with range selection and customizable colors.
Version: 1.0
Author: Your Name
*/

// Add plugin settings page
function persian_calendar_settings_page() {
    add_menu_page(
        'Persian Calendar Settings',
        'Persian Calendar',
        'manage_options',
        'persian-calendar-settings',
        'persian_calendar_settings_html',
        'dashicons-calendar',
        100
    );
}
add_action('admin_menu', 'persian_calendar_settings_page');

// Render the settings page
function persian_calendar_settings_html() {
    if (!current_user_can('manage_options')) {
        return;
    }

    // Save settings if form is submitted
    if (isset($_POST['persian_calendar_settings_nonce'])) {
        update_option('persian_calendar_primary_color', sanitize_hex_color($_POST['primary_color']));
        update_option('persian_calendar_secondary_color', sanitize_hex_color($_POST['secondary_color']));
        echo '<div class="notice notice-success"><p>Settings saved.</p></div>';
    }

    // Get current settings
    $primary_color = get_option('persian_calendar_primary_color', '#ff9800');
    $secondary_color = get_option('persian_calendar_secondary_color', '#ffcc80');

    ?>
    <div class="wrap">
        <h1>Persian Calendar Settings</h1>
        <form method="post">
            <?php wp_nonce_field('persian_calendar_settings_action', 'persian_calendar_settings_nonce'); ?>
            <table class="form-table">
                <tr>
                    <th scope="row"><label for="primary_color">Primary Color</label></th>
                    <td>
                        <input name="primary_color" type="color" value="<?php echo esc_attr($primary_color); ?>" />
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="secondary_color">Secondary Color</label></th>
                    <td>
                        <input name="secondary_color" type="color" value="<?php echo esc_attr($secondary_color); ?>" />
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}

// Enqueue styles and scripts
function persian_calendar_enqueue_assets() {
    wp_enqueue_style('persian-calendar-style', plugins_url('styles.css', __FILE__));
    wp_enqueue_script('persian-calendar-script', plugins_url('script.js', __FILE__), array(), null, true);

    // Pass plugin settings to JavaScript
    wp_localize_script('persian-calendar-script', 'persianCalendarSettings', array(
        'primaryColor' => get_option('persian_calendar_primary_color', '#ff9800'),
        'secondaryColor' => get_option('persian_calendar_secondary_color', '#ffcc80'),
    ));
}
add_action('wp_enqueue_scripts', 'persian_calendar_enqueue_assets');

// Shortcode to display the calendar
function persian_calendar_shortcode($atts) {
    $atts = shortcode_atts(array(
        'type' => 'jalali', // jalali or gregorian
        'selection' => 'range', // single, multiple, range
    ), $atts);

    ob_start();
    ?>
    <div class="calendar" data-type="<?php echo esc_attr($atts['type']); ?>" data-selection="<?php echo esc_attr($atts['selection']); ?>">
        <div class="calendar-header">
            <button id="next-month">&rarr;</button>
            <span id="month-year"></span>
            <button id="prev-month">&larr;</button>
        </div>
        <div class="weekdays">
            <span>ش</span>
            <span>ی</span>
            <span>د</span>
            <span>س</span>
            <span>چ</span>
            <span>پ</span>
            <span>ج</span>
        </div>
        <div class="dates" id="dates"></div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('persian_calendar', 'persian_calendar_shortcode');

// Shortcode to display selected dates
function persian_calendar_selected_dates_shortcode() {
    return '<div id="selected-dates"></div>';
}
add_shortcode('selected_dates', 'persian_calendar_selected_dates_shortcode');