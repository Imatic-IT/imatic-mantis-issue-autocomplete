<?php
header('Content-Type: application/json');

require_api('authentication_api.php');
auth_ensure_user_authenticated();


class IssueSearch
{
    private array $searchFields;
    private int $minSearchLength;
    private int $issueLimit;
    private array $excludedStatuses;
    private string $searchTerm;

    public function __construct(string $searchTerm)
    {
        $this->searchTerm = $searchTerm;
        $this->searchFields = plugin_config_get('searchByFields');
        $this->minSearchLength = plugin_config_get('minSearchLength');
        $this->issueLimit = plugin_config_get('searchIssueLimit');
        $this->excludedStatuses = plugin_config_get('excludeViewStates');
    }

    private function getSearchTerm(): string
    {
        return $this->searchTerm;
    }

    private function shouldSearchByDescription(): bool
    {
        return $this->searchFields['description'];
    }

    private function schouldSearchByAdditionalInformation(): bool
    {
        return $this->searchFields['additional_information'];
    }

    private function shouldSearchBySummary(): bool
    {
        return $this->searchFields['summary'];
    }

    private function shouldSearchById(): bool
    {
        return $this->searchFields['id'];
    }

    private function parseToInt()
    {
        $intValue = intval($this->searchTerm);
        return filter_var($intValue, FILTER_VALIDATE_INT) !== false ? $intValue : false;
    }

    private function getProjectIds(): array
    {
        $userId = $this->getUserId();
        return user_get_all_accessible_projects($userId);
    }

    private function getUserId(): int
    {
        return auth_get_current_user_id();
    }

    private function getStatusLabel($statusEnum, $status): string
    {
        return MantisEnum::getLabel($statusEnum, $status);
    }

    // TODO: IF YOU WANT TO ADD MORE DATABASES, ADD THEM HERE
    public function buildFinalQuery(): string
    {
        if (db_is_pgsql()) {
            $query = $this->getPostgresQuery();
        } else if (db_is_mysql()) {
            $query = $this->getMysqlQuery();
        } else {
            throw new Exception("Unsupported database type.");
        }

        return $query;
    }

    private function getPostgresQuery(): string
    {
        $query = 'SELECT b.id, b.summary, b.project_id, b.status FROM ' . db_get_table('bug') . ' b';
        $query .= ' JOIN ' . db_get_table('bug_text') . ' bt ON bt.id = b.bug_text_id';
        $query .= ' WHERE b.status NOT IN (' . implode(',', $this->excludedStatuses) . ')';
        $query .= ' AND ( b.summary ILIKE ' . db_param();

        if ($this->shouldSearchByDescription()) {
            $query .= ' OR bt.description ILIKE ' . db_param();
        }

        if ($this->schouldSearchByAdditionalInformation()) {
            $query .= ' OR bt.additional_information ILIKE ' . db_param();
        }

        if ($this->shouldSearchById()) {
            $intSearchValue = $this->parseToInt();
            if ($intSearchValue != false) {
                $query .= ' OR b.id::text ILIKE ' . db_param();
            }
        }

        $query .= ')';

        $query .= ' AND b.project_id IN (' . implode(',', $this->getProjectIds()) . ')';
        $query .= ' GROUP BY b.project_id, b.id, b.summary, b.status';
        $query .= ' ORDER BY CASE WHEN b.project_id = ' . db_param() . ' THEN 0 ELSE 1 END, b.project_id ASC, b.status ASC';

        $query .= ' LIMIT ' . db_param();

        return $query;

    }

    // TODO: NOT TESTED IN MYSQL DB  !
    private function getMysqlQuery(): string
    {
        $query = 'SELECT b.id, b.summary, b.project_id, b.status FROM ' . db_get_table('bug') . ' b';
        $query .= ' JOIN ' . db_get_table('bug_text') . ' bt ON bt.id = b.bug_text_id';
        $query .= ' WHERE b.status NOT IN (' . implode(',', $this->excludedStatuses) . ')';
        $query .= ' AND ( b.summary LIKE ' . db_param();

        if ($this->shouldSearchByDescription()) {
            $query .= ' OR bt.description LIKE ' . db_param();
        }

        if ($this->schouldSearchByAdditionalInformation()) {
            $query .= ' OR bt.additional_information LIKE ' . db_param();
        }

        if ($this->shouldSearchById()) {
            $intSearchValue = $this->parseToInt();
            if ($intSearchValue != false) {
                $query .= ' OR b.id::text LIKE ' . db_param();
            }
        }

        $query .= ')';

        $query .= ' AND b.project_id IN (' . implode(',', $this->getProjectIds()) . ')';
        $query .= ' GROUP BY b.project_id, b.id, b.summary, b.status';
        $query .= ' ORDER BY CASE WHEN b.project_id = ' . db_param() . ' THEN 0 ELSE 1 END, b.project_id ASC, b.status ASC';
        $query .= ' LIMIT ' . db_param();

        return $query;
    }


    public function bindParamsAndFetchIssues(): array
    {
        $searchValue = '%' . $this->searchTerm . '%';
        $params = [$searchValue];

        if ($this->shouldSearchByDescription()) {
            $params[] = $searchValue;
        }

        if ($this->schouldSearchByAdditionalInformation()) {
            $params[] = $searchValue;
        }

        if ($this->shouldSearchById()) {
            $parsedValue = ltrim($this->parseToInt(), '0');

            if ($parsedValue != false) {
                $params[] = '%' . $parsedValue . '%';
            }
        }


        $params[] = helper_get_current_project();

        $params[] = $this->issueLimit;

        $queryResult = db_query($this->buildFinalQuery(), $params);

        return $this->formatResults($queryResult);
    }

    private function formatResults($queryResult): array
    {
        $issues = [];
        $statusEnum = lang_get('status_enum_string');
        $userId = $this->getUserId();

        while ($row = db_fetch_array($queryResult)) {
            if (access_has_bug_level(user_get_access_level($userId), $row['id'], $userId)) {
                $row['id'] = bug_format_id($row['id']);
                $row['project'] = project_get_name($row['project_id']);
                $row['statusColor'] = html_get_status_css_fg($row['status']);
                $row['status'] = $this->getStatusLabel($statusEnum, $row['status']);
                $issues[] = $row;
            }
        }
        return $issues;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $searchValue = isset($data['issue_search_autocomplete']) ? $data['issue_search_autocomplete'] : '';

    $searchedIssue = new IssueSearch($searchValue);
    $response = $searchedIssue->bindParamsAndFetchIssues();

    header('Content-Type: application/json');
    echo json_encode($response);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Only POST requests are allowed']);
}
?>
