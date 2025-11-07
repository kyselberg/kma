MATCH (cv:CV)-[:HAS_SKILL]->(s1:Skill)
MATCH (cv)-[:HAS_SKILL]->(s2:Skill)
WHERE s1 <> s2
WITH s1, s2, count(cv) as co_occurrence
WHERE co_occurrence > 1
RETURN s1.name, s2.name, co_occurrence
ORDER BY co_occurrence DESC;
