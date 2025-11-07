SELECT
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    c.position_title,
    c.city,
    c.summary
FROM cv c
WHERE c.status = 'active'
ORDER BY c.created_at DESC;
