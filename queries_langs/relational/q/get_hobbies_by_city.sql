SELECT DISTINCT h.name, h.category
FROM cv c
INNER JOIN cv_hobbies ch ON c.id = ch.cv_id
INNER JOIN hobbies h ON ch.hobby_id = h.id
WHERE c.city = 'Kyiv'
ORDER BY h.name;
