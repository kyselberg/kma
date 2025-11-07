MATCH (company:Company)<-[:WORKED_AT]-(exp:WorkExperience)<-[:HAS_EXPERIENCE]-(cv:CV)
WITH company, collect(cv) as candidates
WHERE size(candidates) > 1
RETURN company.name,
        [candidate IN candidates | candidate.first_name + ' ' + candidate.last_name] as candidates;
