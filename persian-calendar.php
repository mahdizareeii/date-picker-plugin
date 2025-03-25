<?php
/*
Plugin Name: Persian Calendar
Description: A customizable Persian (Jalali) and Gregorian calendar with date range selection and multilingual support.
Version: 2.0
Author: Your Name
Text Domain: persian-calendar
Domain Path: /languages
*/

defined('ABSPATH') || exit;

class Persian_Calendar_Plugin
{

    private $version = '2.0';

    public function __construct()
    {
        register_activation_hook(__FILE__, array($this, 'activate'));
        add_action('plugins_loaded', array($this, 'init'));
    }

    public function activate()
    {
        if (!current_user_can('activate_plugins'))
            return;

        // Set default options
        add_option('persian_calendar_primary_color', '#007bff');
        add_option('persian_calendar_secondary_color', '#1d59ff');
        add_option('persian_calendar_default_type', 'jalali');
        add_option('persian_calendar_default_selection', 'range');
        add_option('persian_calendar_disable_past_dates', '0');
    }

    public function init()
    {
        load_plugin_textdomain('persian-calendar', false, dirname(plugin_basename(__FILE__)) . '/languages/');

        // Admin functionality
        add_action('admin_menu', array($this, 'add_admin_pages'));
        add_action('admin_init', array($this, 'register_settings'));

        // Frontend functionality
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        add_shortcode('persian_calendar', array($this, 'calendar_shortcode'));
        add_shortcode('selected_dates', array($this, 'selected_dates_shortcode'));

        // AJAX handlers
        add_action('wp_ajax_persian_calendar_save_dates', array($this, 'save_selected_dates'));
        add_action('wp_ajax_nopriv_persian_calendar_save_dates', array($this, 'save_selected_dates'));
    }

    public function add_admin_pages()
    {
        add_menu_page(
            __('Persian Calendar Settings', 'persian-calendar'),
            __('Persian Calendar', 'persian-calendar'),
            'manage_options',
            'persian-calendar',
            array($this, 'render_settings_page'),
            'dashicons-calendar-alt',
            100
        );

        add_submenu_page(
            'persian-calendar',
            __('Documentation', 'persian-calendar'),
            __('Documentation', 'persian-calendar'),
            'manage_options',
            'persian-calendar-docs',
            array($this, 'render_docs_page')
        );
    }

    public function register_settings()
    {
        register_setting('persian_calendar_options', 'persian_calendar_primary_color', array(
            'sanitize_callback' => 'sanitize_hex_color',
            'default' => '#007bff'
        ));

        register_setting('persian_calendar_options', 'persian_calendar_secondary_color', array(
            'sanitize_callback' => 'sanitize_hex_color',
            'default' => '#1d59ff'
        ));

        register_setting('persian_calendar_options', 'persian_calendar_default_type', array(
            'sanitize_callback' => array($this, 'sanitize_calendar_type'),
            'default' => 'jalali'
        ));

        register_setting('persian_calendar_options', 'persian_calendar_default_selection', array(
            'sanitize_callback' => array($this, 'sanitize_selection_type'),
            'default' => 'range'
        ));

        register_setting('persian_calendar_options', 'persian_calendar_disable_past_dates', array(
            'sanitize_callback' => array($this, 'sanitize_checkbox'),
            'default' => 0
        ));

        // Settings sections
        add_settings_section(
            'persian_calendar_appearance',
            __('Appearance Settings', 'persian-calendar'),
            array($this, 'render_appearance_section'),
            'persian-calendar'
        );

        add_settings_section(
            'persian_calendar_behavior',
            __('Behavior Settings', 'persian-calendar'),
            array($this, 'render_behavior_section'),
            'persian-calendar'
        );

        // Settings fields
        add_settings_field(
            'primary_color',
            __('Primary Color', 'persian-calendar'),
            array($this, 'render_color_field'),
            'persian-calendar',
            'persian_calendar_appearance',
            array('option' => 'persian_calendar_primary_color')
        );

        add_settings_field(
            'secondary_color',
            __('Secondary Color', 'persian-calendar'),
            array($this, 'render_color_field'),
            'persian-calendar',
            'persian_calendar_appearance',
            array('option' => 'persian_calendar_secondary_color')
        );

        add_settings_field(
            'default_type',
            __('Default Calendar Type', 'persian-calendar'),
            array($this, 'render_calendar_type_field'),
            'persian-calendar',
            'persian_calendar_behavior'
        );

        add_settings_field(
            'default_selection',
            __('Default Selection Type', 'persian-calendar'),
            array($this, 'render_selection_type_field'),
            'persian-calendar',
            'persian_calendar_behavior'
        );

        add_settings_field(
            'disable_past_dates',
            __('Disable Past Dates', 'persian-calendar'),
            array($this, 'render_disable_past_dates_field'),
            'persian-calendar',
            'persian_calendar_behavior'
        );
    }

    public function sanitize_checkbox($input) {
        return isset($input) ? 1 : 0;
    }

    public function sanitize_calendar_type($input)
    {
        return in_array($input, array('jalali', 'gregorian')) ? $input : 'jalali';
    }

    public function sanitize_selection_type($input)
    {
        return in_array($input, array('single', 'range')) ? $input : 'range';
    }

    public function render_settings_page()
    {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.', 'persian-calendar'));
        }
        ?>
        <div class="wrap">
            <h1><?php _e('Persian Calendar Settings', 'persian-calendar'); ?></h1>

            <form method="post" action="options.php">
                <?php
                settings_fields('persian_calendar_options');
                do_settings_sections('persian-calendar');
                submit_button();
                ?>
            </form>

            <div class="persian-calendar-preview">
                <h2><?php _e('Preview', 'persian-calendar'); ?></h2>
                <?php echo do_shortcode('[persian_calendar]'); ?>
            </div>
        </div>
        <?php
    }

    public function render_docs_page()
    {
        ?>
        <div class="wrap">
            <h1><?php _e('Persian Calendar Documentation', 'persian-calendar'); ?></h1>

            <h2><?php _e('Shortcodes', 'persian-calendar'); ?></h2>
            <h3><?php _e('Calendar', 'persian-calendar'); ?></h3>
            <pre>[persian_calendar type="jalali" selection="range" class="my-class"]</pre>
            <p><?php _e('Parameters:', 'persian-calendar'); ?></p>
            <ul>
                <li><strong>type</strong>: jalali (default) or gregorian</li>
                <li><strong>selection</strong>: single or range (default)</li>
                <li><strong>class</strong>: custom CSS class</li>
            </ul>

            <h3><?php _e('Selected Dates Display', 'persian-calendar'); ?></h3>
            <pre>[selected_dates]</pre>
        </div>
        <?php

        ?>
        <div class="card">
            <h3><?php _e('Troubleshooting', 'persian-calendar'); ?></h3>
            <p><?php _e('If changes don\'t appear immediately:', 'persian-calendar'); ?></p>
            <ol>
                <li><?php _e('Clear your WordPress cache', 'persian-calendar'); ?></li>
                <li><?php _e('Clear your browser cache', 'persian-calendar'); ?></li>
                <li><?php _e('Disable any caching plugins temporarily', 'persian-calendar'); ?></li>
            </ol>
        </div>
        <?php
    }

    public function render_appearance_section()
    {
        echo '<p>' . __('Customize the appearance of your calendar.', 'persian-calendar') . '</p>';
    }

    public function render_behavior_section()
    {
        echo '<p>' . __('Configure how the calendar behaves.', 'persian-calendar') . '</p>';
    }

    public function render_color_field($args)
    {
        $value = get_option($args['option']);
        ?>
        <input type="color" name="<?php echo esc_attr($args['option']); ?>" value="<?php echo esc_attr($value); ?>" />
        <?php
    }

    public function render_calendar_type_field()
    {
        $value = get_option('persian_calendar_default_type');
        ?>
        <select name="persian_calendar_default_type">
            <option value="jalali" <?php selected($value, 'jalali'); ?>>
                <?php _e('Jalali (Persian)', 'persian-calendar'); ?>
            </option>
            <option value="gregorian" <?php selected($value, 'gregorian'); ?>>
                <?php _e('Gregorian', 'persian-calendar'); ?>
            </option>
        </select>
        <?php
    }

    public function render_selection_type_field()
    {
        $value = get_option('persian_calendar_default_selection');
        ?>
        <select name="persian_calendar_default_selection">
            <option value="single" <?php selected($value, 'single'); ?>>
                <?php _e('Single Date', 'persian-calendar'); ?>
            </option>
            <option value="range" <?php selected($value, 'range'); ?>>
                <?php _e('Date Range', 'persian-calendar'); ?>
            </option>
        </select>
        <?php
    }

    public function render_disable_past_dates_field() {
        $value = get_option('persian_calendar_disable_past_dates', 0);
        ?>
        <label>
            <input type="checkbox" name="persian_calendar_disable_past_dates" value="1" <?php checked($value, 1); ?> />
            <?php _e('Disable selection of past dates', 'persian-calendar'); ?>
        </label>
        <?php
    }

    public function enqueue_assets()
    {
        // CSS
        wp_enqueue_style(
            'persian-calendar',
            plugins_url('styles.css', __FILE__),
            array(),
            $this->version
        );

        // JavaScript
        wp_enqueue_script(
            'persian-calendar',
            plugins_url('script.js', __FILE__),
            array('jquery'),
            $this->version,
            true
        );

        // Localize script
        wp_localize_script('persian-calendar', 'persianCalendarSettings', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'primaryColor' => get_option('persian_calendar_primary_color', '#007bff'),
            'secondaryColor' => get_option('persian_calendar_secondary_color', '#1d59ff'),
            'disablePastDates' => get_option('persian_calendar_disable_past_dates', 0),
            'defaultType' => get_option('persian_calendar_default_type', 'jalali'),
            'defaultSelection' => get_option('persian_calendar_default_selection', 'range'),
            'nonce' => wp_create_nonce('persian_calendar_nonce'),
            'i18n' => array(
                'selectedRange' => __('Selected Range:', 'persian-calendar'),
                'selectedDate' => __('Selected Date:', 'persian-calendar'),
                'noSelection' => __('No dates selected.', 'persian-calendar'),
                'prevMonth' => __('Previous month', 'persian-calendar'),
                'nextMonth' => __('Next month', 'persian-calendar')
            )
        ));

        
        wp_add_inline_style('persian-calendar', '
            .calendar[data-type="jalali"] {
                direction: rtl;
            }
            .calendar[data-type="gregorian"] {
                direction: ltr;
            }
        ');

        wp_localize_script('persian-calendar', 'persianCalendarSettings', array(
            // ... other settings ...
            'disablePastDates' => get_option('persian_calendar_disable_past_dates', 0),
        ));
    }

    public function calendar_shortcode($atts)
    {
        $atts = shortcode_atts(array(
            'type' => get_option('persian_calendar_default_type', 'jalali'),
            'selection' => get_option('persian_calendar_default_selection', 'range'),
            'class' => '',
            'id' => ''
        ), $atts, 'persian_calendar');

        // Apply settings dynamically
        $primary_color = get_option('persian_calendar_primary_color', '#007bff');
        $secondary_color = get_option('persian_calendar_secondary_color', '#1d59ff');

        ob_start();
        ?>
        <style>
            .persian-calendar-container {
                --primary-color:
                    <?php echo esc_attr($primary_color); ?>
                ;
                --secondary-color:
                    <?php echo esc_attr($secondary_color); ?>
                ;
            }
        </style>
        <div class="persian-calendar-container <?php echo esc_attr($atts['class']); ?>"
            id="<?php echo esc_attr($atts['id']); ?>">
            <div class="calendar" data-type="<?php echo esc_attr($atts['type']); ?>"
                data-selection="<?php echo esc_attr($atts['selection']); ?>">
                <div class="calendar-header">
                    <button id="prev-month" class="calendar-nav"
                        aria-label="<?php esc_attr_e('Previous month', 'persian-calendar'); ?>">
                        <?php echo $atts['type'] === 'jalali' ? '←' : '←'; ?>
                    </button>
                    <h2 id="month-year" class="calendar-title"></h2>
                    <button id="next-month" class="calendar-nav"
                        aria-label="<?php esc_attr_e('Next month', 'persian-calendar'); ?>">
                        <?php echo $atts['type'] === 'jalali' ? '→' : '→'; ?>
                    </button>
                </div>
                <div class="weekdays" id="weekdays" role="rowgroup"></div>
                <div class="dates" id="dates" role="grid"></div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    public function selected_dates_shortcode()
    {
        return '<div id="selected-dates" class="persian-calendar-selected-dates"></div>';
    }

    public function save_selected_dates()
    {
        check_ajax_referer('persian_calendar_nonce', 'security');

        if (!isset($_POST['dates'])) {
            wp_send_json_error(__('No dates provided', 'persian-calendar'));
        }

        $dates = json_decode(stripslashes($_POST['dates']), true);

        if (is_user_logged_in()) {
            update_user_meta(get_current_user_id(), 'persian_calendar_selected_dates', $dates);
        } else {
            WC()->session->set('persian_calendar_selected_dates', $dates);
        }

        wp_send_json_success(__('Dates saved successfully', 'persian-calendar'));
    }
}

new Persian_Calendar_Plugin();