# Imatic Issue Autocomplete

This plugin clones the "related issue" input field. When you start typing, it searches for issues by **summary**, displaying a modal window with the search results. Clicking on an issue number will insert it into the "related issue" input field.

## Plugin Settings

The following settings can be customized:

```php
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
```

- min_search_length: Minimum number of characters the user needs to enter to trigger the search.
- search_issue_limit: The maximum number of issues to be searched and displayed.
- exclude_view_states: Defines which issue states will be excluded from the search.
- autocomplete_issue_window_settings: Settings for the modal window that displays the searched issues (width, height, background).

## Installation
- Copy all files from Imatic Mantis Issue Type Checker into the plugins/ImaticIssueAutocomplete directory.
- In Mantis plugins page, install the plugin.


## Browser Requirements

The plugin requires a modern browser that supports ES6 features. Ensure your browser is up-to-date to fully utilize the plugin's functionality.
