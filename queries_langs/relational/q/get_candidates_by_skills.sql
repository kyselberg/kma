SELECT
    c.first_name,
    c.last_name,
    s.name as skill,
    cs.proficiency_level,
    cs.years_of_experience
FROM cv c
INNER JOIN cv_skills cs ON c.id = cs.cv_id
INNER JOIN skills s ON cs.skill_id = s.id
WHERE s.name = 'TypeScript'
    AND cs.proficiency_level IN ('beginner', 'intermediate')
ORDER BY cs.years_of_experience DESC;
