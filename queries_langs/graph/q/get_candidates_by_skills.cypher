MATCH (cv:CV)-[r:HAS_SKILL]->(s:Skill {name: $skill_name})
WHERE r.proficiency_level IN $levels
RETURN cv.first_name, cv.last_name, s.name as skill,
       r.proficiency_level, r.years_of_experience
ORDER BY r.years_of_experience DESC;
