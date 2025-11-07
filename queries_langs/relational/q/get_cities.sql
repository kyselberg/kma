SELECT DISTINCT c.city, c.country
FROM cv c
WHERE c.city IS NOT NULL
ORDER BY c.city;
