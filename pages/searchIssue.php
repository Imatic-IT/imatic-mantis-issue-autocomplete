<?php
header('Content-Type: application/json');

require_api('authentication_api.php');
auth_ensure_user_authenticated();

function searchBugBySummary($searchValue)
{

    $userId = auth_get_current_user_id();
    $t_projects = user_get_all_accessible_projects($userId);

    $limit = plugin_config_get('search_issue_limit') ? plugin_config_get('search_issue_limit') : 100;
    $excludeStatus = plugin_config_get('exclude_view_states') ? plugin_config_get('exclude_view_states') : [];

    $searchValue = '%' . $searchValue . '%';

    db_param_push();
    $t_query = 'SELECT id, summary, project_id FROM ' . db_get_table('bug')
        . ' WHERE summary ILIKE ' . db_param()
        . ' AND status NOT IN (' . implode(',', $excludeStatus) . ')'
        . 'AND project_id IN (' . implode(',', $t_projects) . ')'
        . ' LIMIT ' . db_param();

    $t_result = db_query($t_query, [$searchValue, $limit]);

    $bugs = [];
    while ($row = db_fetch_array($t_result)) {
        if (access_has_bug_level(user_get_access_level($userId), $row['id'], $userId)) {
            $row['id'] = bug_format_id($row['id']);
            $row['project'] = project_get_name($row['project_id']);
            $bugs[] = $row;
        }
    }
    return $bugs;
}

if (
    $_SERVER['REQUEST_METHOD'] === 'POST'
    ||
    $_SERVER['REQUEST_METHOD'] === 'GET'
) {
    $data = json_decode(file_get_contents('php://input'), true);

    $searchValue = isset($data['issue_search_autocomplete']) ? $data['issue_search_autocomplete'] : '';


    $response = searchBugBySummary($searchValue);

    header('Content-Type: application/json');
    echo json_encode($response);
} else {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'Only POST requests are allowed']);
}
?>
