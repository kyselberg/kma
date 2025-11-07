SELECT DISTINCT h.name, h.category
FROM hobbies h
INNER JOIN cv_hobbies ch ON h.id = ch.hobby_id
INNER JOIN cv c ON ch.cv_id = c.id
WHERE c.status = 'active'
ORDER BY h.name;
