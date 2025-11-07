MATCH (city:City {name: $city})<-[:LOCATED_IN]-(cv:CV)-[:HAS_HOBBY]->(h:Hobby)
RETURN DISTINCT h.name, h.category
ORDER BY h.name;
