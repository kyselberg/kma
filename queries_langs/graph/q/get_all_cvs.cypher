MATCH (cv:CV)
WHERE cv.status = 'active'
RETURN cv.id, cv.first_name, cv.last_name, cv.email,
       cv.position_title, cv.city, cv.summary
ORDER BY cv.created_at DESC;
