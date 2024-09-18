<?php

class ImaticIssueAutocompletePlugin extends MantisPlugin
{
    public function register(): void
    {
        $this->name = 'Imatic Issue autocomplete';
        $this->description = 'This plugin provides autocomplete for issue id in MantisBT.';
        $this->version = '0.0.1';
        $this->requires = [
            'MantisCore' => '2.0.0',
        ];

        $this->author = 'Imatic Software s.r.o.';
        $this->contact = 'info@imatic.cz';
        $this->url = 'https://www.imatic.cz/';
    }

    public function config(): array
    {
        return [
            'min_search_length' => 3,
            'search_issue_limit' => 100,
            'exclude_view_states' => [80],
            'autocomplete_issue_window_settings' =>
                [
                    'width' => '40%',
                    'height' => '40%',
                    'background' => 'rgba(0, 0, 0, 0.8)',
                ],
        ];
    }

    public function hooks(): array
    {
        return [
            'EVENT_LAYOUT_BODY_END' => 'layout_body_end_hook'
        ];
    }

    public function layout_body_end_hook($p_event)
    {
        if (isset($_GET['id'])) {
            $t_data = htmlspecialchars(json_encode([
                'url' => plugin_page('searchIssue'),
                'autocomplete_issue_window_settings' => plugin_config_get('autocomplete_issue_window_settings'),
                'min_search_length' => plugin_config_get('min_search_length'),
                'min_search_length_message' => sprintf(plugin_lang_get('min_search_length_message'), plugin_config_get('min_search_length')),
                'no_issue_found_message' => plugin_lang_get('no_issue_found_message'),
                'search_for_issue_message' => plugin_lang_get('search_for_issue_message'),
            ]));
            echo '<script  id="imaticIssueAutocomplete" data-data="' . $t_data . '" src="' . plugin_file('bundle.js') . '&v=' . $this->version . '"></script>
            <link rel="stylesheet" type="text/css" href="' . plugin_file('style.css') . '&v=' . $this->version . '" />';
        }
    }
}
