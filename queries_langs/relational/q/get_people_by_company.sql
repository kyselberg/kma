SELECT
    we.company_name,
    COUNT(DISTINCT we.cv_id) as candidate_count,
    STRING_AGG(CONCAT(c.first_name, ' ', c.last_name), ', ') as candidates
FROM work_experience we
INNER JOIN cv c ON we.cv_id = c.id
WHERE c.status = 'active'
GROUP BY we.company_name
HAVING COUNT(DISTINCT we.cv_id) > 1
ORDER BY candidate_count DESC;
