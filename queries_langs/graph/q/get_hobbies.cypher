MATCH (h:Hobby)
RETURN DISTINCT h.name, h.category
ORDER BY h.name;
