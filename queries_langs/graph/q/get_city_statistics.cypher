MATCH (cv:CV)-[:LOCATED_IN]->(city:City)
RETURN city.name as city, city.country as country,
       count(cv) as candidate_count
ORDER BY candidate_count DESC;
