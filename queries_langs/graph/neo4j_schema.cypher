CREATE CONSTRAINT user_id_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.id IS UNIQUE;

CREATE CONSTRAINT cv_id_unique IF NOT EXISTS
FOR (c:CV) REQUIRE c.id IS UNIQUE;

CREATE CONSTRAINT city_name_unique IF NOT EXISTS
FOR (c:City) REQUIRE c.name IS UNIQUE;

CREATE CONSTRAINT skill_id_unique IF NOT EXISTS
FOR (s:Skill) REQUIRE s.id IS UNIQUE;

CREATE CONSTRAINT hobby_id_unique IF NOT EXISTS
FOR (h:Hobby) REQUIRE h.id IS UNIQUE;

CREATE CONSTRAINT company_id_unique IF NOT EXISTS
FOR (c:Company) REQUIRE c.id IS UNIQUE;

CREATE CONSTRAINT exp_id_unique IF NOT EXISTS
FOR (e:WorkExperience) REQUIRE e.id IS UNIQUE;

CREATE CONSTRAINT edu_id_unique IF NOT EXISTS
FOR (e:Education) REQUIRE e.id IS UNIQUE;

CREATE CONSTRAINT language_id_unique IF NOT EXISTS
FOR (l:Language) REQUIRE l.id IS UNIQUE;

UNWIND [
  {name: 'Kyiv', country: 'Ukraine'},
  {name: 'Lviv', country: 'Ukraine'},
  {name: 'Kharkiv', country: 'Ukraine'},
  {name: 'Odesa', country: 'Ukraine'},
  {name: 'Dnipro', country: 'Ukraine'}
] AS city
MERGE (c:City {name: city.name})
SET c.country = city.country;

UNWIND [
  {id: 1, login: 'john_doe'},
  {id: 2, login: 'jane_smith'},
  {id: 3, login: 'bob_wilson'},
  {id: 4, login: 'alice_johnson'},
  {id: 5, login: 'charlie_brown'},
  {id: 6, login: 'diana_prince'},
  {id: 7, login: 'eve_adams'},
  {id: 8, login: 'frank_miller'},
  {id: 9, login: 'grace_hopper'},
  {id: 10, login: 'henry_ford'},
  {id: 11, login: 'iris_west'},
  {id: 12, login: 'jack_sparrow'},
  {id: 13, login: 'kate_bishop'},
  {id: 14, login: 'leo_messi'},
  {id: 15, login: 'mary_jane'},
  {id: 16, login: 'nick_fury'},
  {id: 17, login: 'olivia_wilde'},
  {id: 18, login: 'peter_parker'},
  {id: 19, login: 'quinn_fabray'},
  {id: 20, login: 'rachel_green'}
] AS row
MERGE (u:User {id: row.id})
SET u.login = row.login;

UNWIND [
  {id: 1, user_id: 1, first_name: 'John', last_name: 'Doe', email: 'john.doe@email.com', phone: '+380501234567', date_of_birth: date('1990-05-15'), gender: 'Male', nationality: 'Ukrainian', marital_status: 'Single', address: '123 Main St', city: 'Kyiv', country: 'Ukraine', postal_code: '01001', linkedin: 'linkedin.com/in/johndoe', website: 'johndoe.dev', github: 'github.com/johndoe', position_title: 'Senior Developer', desired_salary: 5000, currency: 'USD', availability: 'Immediate', work_permit: true, preferred_work_type: 'Remote', summary: 'Experienced full-stack developer with 8 years of experience', objectives: 'Looking for challenging projects in web development', status: 'active'},
  {id: 2, user_id: 2, first_name: 'Jane', last_name: 'Smith', email: 'jane.smith@email.com', phone: '+380502345678', date_of_birth: date('1992-08-20'), gender: 'Female', nationality: 'Ukrainian', marital_status: 'Single', address: '456 Oak Ave', city: 'Lviv', country: 'Ukraine', postal_code: '79000', linkedin: 'linkedin.com/in/janesmith', website: 'janesmith.design', github: 'github.com/janesmith', position_title: 'UX Designer', desired_salary: 3000, currency: 'USD', availability: '2 weeks', work_permit: true, preferred_work_type: 'Hybrid', summary: 'Creative designer with strong focus on user experience', objectives: 'Creating intuitive and beautiful user interfaces', status: 'active'},
  {id: 3, user_id: 3, first_name: 'Bob', last_name: 'Wilson', email: 'bob.wilson@email.com', phone: '+380503456789', date_of_birth: date('1988-03-10'), gender: 'Male', nationality: 'Ukrainian', marital_status: 'Married', address: '789 Pine St', city: 'Kharkiv', country: 'Ukraine', postal_code: '61000', linkedin: 'linkedin.com/in/bobwilson', website: 'bobwilson.tech', github: 'github.com/bobwilson', position_title: 'DevOps Engineer', desired_salary: 4500, currency: 'USD', availability: '1 month', work_permit: true, preferred_work_type: 'On-site', summary: 'DevOps specialist with expertise in cloud infrastructure', objectives: 'Building scalable and reliable systems', status: 'active'},
  {id: 4, user_id: 4, first_name: 'Alice', last_name: 'Johnson', email: 'alice.johnson@email.com', phone: '+380504567890', date_of_birth: date('1995-12-05'), gender: 'Female', nationality: 'Ukrainian', marital_status: 'Single', address: '321 Elm St', city: 'Odesa', country: 'Ukraine', postal_code: '65000', linkedin: 'linkedin.com/in/alicejohnson', website: 'alicejohnson.art', github: 'github.com/alicejohnson', position_title: 'Frontend Developer', desired_salary: 2500, currency: 'USD', availability: 'Immediate', work_permit: true, preferred_work_type: 'Remote', summary: 'Passionate frontend developer with modern framework expertise', objectives: 'Creating engaging user experiences with cutting-edge technology', status: 'active'},
  {id: 5, user_id: 5, first_name: 'Charlie', last_name: 'Brown', email: 'charlie.brown@email.com', phone: '+380505678901', date_of_birth: date('1987-07-22'), gender: 'Male', nationality: 'Ukrainian', marital_status: 'Divorced', address: '654 Maple Ave', city: 'Dnipro', country: 'Ukraine', postal_code: '49000', linkedin: 'linkedin.com/in/charliebrown', website: 'charliebrown.data', github: 'github.com/charliebrown', position_title: 'Data Scientist', desired_salary: 4000, currency: 'USD', availability: '3 weeks', work_permit: true, preferred_work_type: 'Hybrid', summary: 'Data scientist with machine learning and analytics expertise', objectives: 'Solving complex business problems with data-driven insights', status: 'active'},
  {id: 6, user_id: 6, first_name: 'Diana', last_name: 'Prince', email: 'diana.prince@email.com', phone: '+380506789012', date_of_birth: date('1993-09-14'), gender: 'Female', nationality: 'Ukrainian', marital_status: 'Single', address: '987 Cedar Blvd', city: 'Kyiv', country: 'Ukraine', postal_code: '01001', linkedin: 'linkedin.com/in/dianaprince', website: 'dianaprince.lead', github: 'github.com/dianaprince', position_title: 'Project Manager', desired_salary: 3500, currency: 'USD', availability: '2 weeks', work_permit: true, preferred_work_type: 'Hybrid', summary: 'Experienced project manager with agile methodology expertise', objectives: 'Leading successful software development projects', status: 'active'},
  {id: 7, user_id: 7, first_name: 'Eve', last_name: 'Adams', email: 'eve.adams@email.com', phone: '+380507890123', date_of_birth: date('1991-11-30'), gender: 'Female', nationality: 'Ukrainian', marital_status: 'Married', address: '147 Birch St', city: 'Lviv', country: 'Ukraine', postal_code: '79000', linkedin: 'linkedin.com/in/eveadams', website: 'eveadams.qa', github: 'github.com/eveadams', position_title: 'QA Engineer', desired_salary: 2200, currency: 'USD', availability: 'Immediate', work_permit: true, preferred_work_type: 'Remote', summary: 'Quality assurance engineer with automation testing expertise', objectives: 'Ensuring high-quality software delivery', status: 'active'},
  {id: 8, user_id: 8, first_name: 'Frank', last_name: 'Miller', email: 'frank.miller@email.com', phone: '+380508901234', date_of_birth: date('1989-04-18'), gender: 'Male', nationality: 'Ukrainian', marital_status: 'Single', address: '258 Spruce Dr', city: 'Kharkiv', country: 'Ukraine', postal_code: '61000', linkedin: 'linkedin.com/in/frankmiller', website: 'frankmiller.backend', github: 'github.com/frankmiller', position_title: 'Backend Developer', desired_salary: 3800, currency: 'USD', availability: '1 month', work_permit: true, preferred_work_type: 'On-site', summary: 'Backend developer specializing in microservices architecture', objectives: 'Building robust and scalable backend systems', status: 'active'},
  {id: 9, user_id: 9, first_name: 'Grace', last_name: 'Hopper', email: 'grace.hopper@email.com', phone: '+380509012345', date_of_birth: date('1994-06-25'), gender: 'Female', nationality: 'Ukrainian', marital_status: 'Single', address: '369 Willow Way', city: 'Odesa', country: 'Ukraine', postal_code: '65000', linkedin: 'linkedin.com/in/gracehopper', website: 'gracehopper.ai', github: 'github.com/gracehopper', position_title: 'AI Engineer', desired_salary: 4200, currency: 'USD', availability: '3 weeks', work_permit: true, preferred_work_type: 'Hybrid', summary: 'AI engineer with expertise in machine learning and neural networks', objectives: 'Developing intelligent systems and AI solutions', status: 'active'},
  {id: 10, user_id: 10, first_name: 'Henry', last_name: 'Ford', email: 'henry.ford@email.com', phone: '+380500123456', date_of_birth: date('1986-01-12'), gender: 'Male', nationality: 'Ukrainian', marital_status: 'Married', address: '741 Poplar Ln', city: 'Dnipro', country: 'Ukraine', postal_code: '49000', linkedin: 'linkedin.com/in/henryford', website: 'henryford.arch', github: 'github.com/henryford', position_title: 'Solution Architect', desired_salary: 5500, currency: 'USD', availability: '2 months', work_permit: true, preferred_work_type: 'On-site', summary: 'Solution architect with enterprise system design expertise', objectives: 'Designing scalable and maintainable software architectures', status: 'active'},
  {id: 11, user_id: 11, first_name: 'Iris', last_name: 'West', email: 'iris.west@email.com', phone: '+380501234567', date_of_birth: date('1996-10-08'), gender: 'Female', nationality: 'Ukrainian', marital_status: 'Single', address: '852 Ash St', city: 'Kyiv', country: 'Ukraine', postal_code: '01001', linkedin: 'linkedin.com/in/iriswest', website: 'iriswest.mobile', github: 'github.com/iriswest', position_title: 'Mobile Developer', desired_salary: 3200, currency: 'USD', availability: 'Immediate', work_permit: true, preferred_work_type: 'Remote', summary: 'Mobile developer with cross-platform app development expertise', objectives: 'Creating innovative mobile applications', status: 'active'},
  {id: 12, user_id: 12, first_name: 'Jack', last_name: 'Sparrow', email: 'jack.sparrow@email.com', phone: '+380502345678', date_of_birth: date('1985-12-31'), gender: 'Male', nationality: 'Ukrainian', marital_status: 'Single', address: '963 Hickory Rd', city: 'Lviv', country: 'Ukraine', postal_code: '79000', linkedin: 'linkedin.com/in/jacksparrow', website: 'jacksparrow.security', github: 'github.com/jacksparrow', position_title: 'Security Engineer', desired_salary: 4800, currency: 'USD', availability: '1 month', work_permit: true, preferred_work_type: 'Hybrid', summary: 'Cybersecurity engineer with penetration testing expertise', objectives: 'Protecting systems and data from security threats', status: 'active'},
  {id: 13, user_id: 13, first_name: 'Kate', last_name: 'Bishop', email: 'kate.bishop@email.com', phone: '+380503456789', date_of_birth: date('1997-02-14'), gender: 'Female', nationality: 'Ukrainian', marital_status: 'Single', address: '174 Sycamore Ave', city: 'Kharkiv', country: 'Ukraine', postal_code: '61000', linkedin: 'linkedin.com/in/katebishop', website: 'katebishop.design', github: 'github.com/katebishop', position_title: 'UI Designer', desired_salary: 2800, currency: 'USD', availability: '2 weeks', work_permit: true, preferred_work_type: 'Remote', summary: 'UI designer with modern design system expertise', objectives: 'Creating beautiful and functional user interfaces', status: 'active'},
  {id: 14, user_id: 14, first_name: 'Leo', last_name: 'Messi', email: 'leo.messi@email.com', phone: '+380504567890', date_of_birth: date('1988-08-15'), gender: 'Male', nationality: 'Ukrainian', marital_status: 'Married', address: '285 Dogwood Dr', city: 'Odesa', country: 'Ukraine', postal_code: '65000', linkedin: 'linkedin.com/in/leomessi', website: 'leomessi.analytics', github: 'github.com/leomessi', position_title: 'Business Analyst', desired_salary: 3000, currency: 'USD', availability: '3 weeks', work_permit: true, preferred_work_type: 'Hybrid', summary: 'Business analyst with data analysis and process improvement expertise', objectives: 'Driving business growth through data-driven insights', status: 'active'},
  {id: 15, user_id: 15, first_name: 'Mary', last_name: 'Jane', email: 'mary.jane@email.com', phone: '+380505678901', date_of_birth: date('1992-05-03'), gender: 'Female', nationality: 'Ukrainian', marital_status: 'Single', address: '396 Magnolia St', city: 'Dnipro', country: 'Ukraine', postal_code: '49000', linkedin: 'linkedin.com/in/maryjane', website: 'maryjane.content', github: 'github.com/maryjane', position_title: 'Content Manager', desired_salary: 2000, currency: 'USD', availability: 'Immediate', work_permit: true, preferred_work_type: 'Remote', summary: 'Content manager with digital marketing and SEO expertise', objectives: 'Creating engaging content that drives user engagement', status: 'active'},
  {id: 16, user_id: 16, first_name: 'Nick', last_name: 'Fury', email: 'nick.fury@email.com', phone: '+380506789012', date_of_birth: date('1984-11-20'), gender: 'Male', nationality: 'Ukrainian', marital_status: 'Married', address: '507 Redwood Blvd', city: 'Kyiv', country: 'Ukraine', postal_code: '01001', linkedin: 'linkedin.com/in/nickfury', website: 'nickfury.lead', github: 'github.com/nickfury', position_title: 'Tech Lead', desired_salary: 6000, currency: 'USD', availability: '1 month', work_permit: true, preferred_work_type: 'On-site', summary: 'Technical lead with full-stack development and team management expertise', objectives: 'Leading development teams and technical decision making', status: 'active'},
  {id: 17, user_id: 17, first_name: 'Olivia', last_name: 'Wilde', email: 'olivia.wilde@email.com', phone: '+380507890123', date_of_birth: date('1993-07-17'), gender: 'Female', nationality: 'Ukrainian', marital_status: 'Single', address: '618 Cherry Ln', city: 'Lviv', country: 'Ukraine', postal_code: '79000', linkedin: 'linkedin.com/in/oliviawilde', website: 'oliviawilde.marketing', github: 'github.com/oliviawilde', position_title: 'Digital Marketing Specialist', desired_salary: 2500, currency: 'USD', availability: '2 weeks', work_permit: true, preferred_work_type: 'Hybrid', summary: 'Digital marketing specialist with social media and campaign expertise', objectives: 'Growing brand awareness and customer engagement', status: 'active'},
  {id: 18, user_id: 18, first_name: 'Peter', last_name: 'Parker', email: 'peter.parker@email.com', phone: '+380508901234', date_of_birth: date('1995-04-25'), gender: 'Male', nationality: 'Ukrainian', marital_status: 'Single', address: '729 Walnut St', city: 'Kharkiv', country: 'Ukraine', postal_code: '61000', linkedin: 'linkedin.com/in/peterparker', website: 'peterparker.web', github: 'github.com/peterparker', position_title: 'Web Developer', desired_salary: 2600, currency: 'USD', availability: 'Immediate', work_permit: true, preferred_work_type: 'Remote', summary: 'Web developer with modern JavaScript and framework expertise', objectives: 'Building responsive and interactive web applications', status: 'active'},
  {id: 19, user_id: 19, first_name: 'Quinn', last_name: 'Fabray', email: 'quinn.fabray@email.com', phone: '+380509012345', date_of_birth: date('1996-09-12'), gender: 'Female', nationality: 'Ukrainian', marital_status: 'Single', address: '830 Chestnut Ave', city: 'Odesa', country: 'Ukraine', postal_code: '65000', linkedin: 'linkedin.com/in/quinnfabray', website: 'quinnfabray.ux', github: 'github.com/quinnfabray', position_title: 'UX Researcher', desired_salary: 2400, currency: 'USD', availability: '3 weeks', work_permit: true, preferred_work_type: 'Hybrid', summary: 'UX researcher with user testing and usability expertise', objectives: 'Understanding user needs and improving product usability', status: 'active'},
  {id: 20, user_id: 20, first_name: 'Rachel', last_name: 'Green', email: 'rachel.green@email.com', phone: '+380500123456', date_of_birth: date('1994-01-28'), gender: 'Female', nationality: 'Ukrainian', marital_status: 'Married', address: '941 Pinecone Dr', city: 'Dnipro', country: 'Ukraine', postal_code: '49000', linkedin: 'linkedin.com/in/rachelgreen', website: 'rachelgreen.sales', github: 'github.com/rachelgreen', position_title: 'Sales Engineer', desired_salary: 3500, currency: 'USD', availability: '1 month', work_permit: true, preferred_work_type: 'On-site', summary: 'Sales engineer with technical sales and customer relationship expertise', objectives: 'Driving sales growth through technical expertise', status: 'active'}
] AS row
MATCH (u:User {id: row.user_id})
MATCH (city:City {name: row.city})
MERGE (c:CV {id: row.id})
SET c += apoc.map.removeKeys(row, ['id', 'user_id', 'city'])
MERGE (u)-[:OWNS]->(c)
MERGE (c)-[:LOCATED_IN]->(city);

UNWIND [
  {id: 1, name: 'JavaScript', category: 'Programming Language'},
  {id: 2, name: 'Python', category: 'Programming Language'},
  {id: 3, name: 'Java', category: 'Programming Language'},
  {id: 4, name: 'TypeScript', category: 'Programming Language'},
  {id: 5, name: 'React', category: 'Framework'},
  {id: 6, name: 'Vue.js', category: 'Framework'},
  {id: 7, name: 'Angular', category: 'Framework'},
  {id: 8, name: 'Node.js', category: 'Runtime'},
  {id: 9, name: 'Express.js', category: 'Framework'},
  {id: 10, name: 'Django', category: 'Framework'},
  {id: 11, name: 'Flask', category: 'Framework'},
  {id: 12, name: 'Spring Boot', category: 'Framework'},
  {id: 13, name: 'MongoDB', category: 'Database'},
  {id: 14, name: 'PostgreSQL', category: 'Database'},
  {id: 15, name: 'MySQL', category: 'Database'},
  {id: 16, name: 'Redis', category: 'Database'},
  {id: 17, name: 'Docker', category: 'DevOps'},
  {id: 18, name: 'Kubernetes', category: 'DevOps'},
  {id: 19, name: 'AWS', category: 'Cloud'},
  {id: 20, name: 'Azure', category: 'Cloud'},
  {id: 21, name: 'Git', category: 'Version Control'},
  {id: 22, name: 'Linux', category: 'Operating System'},
  {id: 23, name: 'Machine Learning', category: 'AI/ML'},
  {id: 24, name: 'Data Analysis', category: 'Data Science'},
  {id: 25, name: 'Project Management', category: 'Management'}
] AS row
MERGE (s:Skill {id: row.id})
SET s.name = row.name, s.category = row.category;

UNWIND [
  {cv_id: 1, skill_id: 1, proficiency_level: 'expert', years_of_experience: 8},
  {cv_id: 1, skill_id: 4, proficiency_level: 'expert', years_of_experience: 6},
  {cv_id: 1, skill_id: 5, proficiency_level: 'expert', years_of_experience: 7},
  {cv_id: 1, skill_id: 8, proficiency_level: 'expert', years_of_experience: 6},
  {cv_id: 1, skill_id: 13, proficiency_level: 'intermediate', years_of_experience: 4},
  {cv_id: 1, skill_id: 17, proficiency_level: 'intermediate', years_of_experience: 3},
  {cv_id: 2, skill_id: 5, proficiency_level: 'expert', years_of_experience: 5},
  {cv_id: 2, skill_id: 6, proficiency_level: 'expert', years_of_experience: 4},
  {cv_id: 2, skill_id: 1, proficiency_level: 'intermediate', years_of_experience: 3},
  {cv_id: 2, skill_id: 4, proficiency_level: 'intermediate', years_of_experience: 2},
  {cv_id: 3, skill_id: 17, proficiency_level: 'expert', years_of_experience: 6},
  {cv_id: 3, skill_id: 18, proficiency_level: 'expert', years_of_experience: 4},
  {cv_id: 3, skill_id: 19, proficiency_level: 'expert', years_of_experience: 5},
  {cv_id: 3, skill_id: 22, proficiency_level: 'expert', years_of_experience: 8},
  {cv_id: 3, skill_id: 2, proficiency_level: 'intermediate', years_of_experience: 3},
  {cv_id: 4, skill_id: 1, proficiency_level: 'expert', years_of_experience: 4},
  {cv_id: 4, skill_id: 4, proficiency_level: 'expert', years_of_experience: 3},
  {cv_id: 4, skill_id: 5, proficiency_level: 'expert', years_of_experience: 4},
  {cv_id: 4, skill_id: 6, proficiency_level: 'intermediate', years_of_experience: 2},
  {cv_id: 5, skill_id: 2, proficiency_level: 'expert', years_of_experience: 6},
  {cv_id: 5, skill_id: 23, proficiency_level: 'expert', years_of_experience: 5},
  {cv_id: 5, skill_id: 24, proficiency_level: 'expert', years_of_experience: 6},
  {cv_id: 5, skill_id: 14, proficiency_level: 'expert', years_of_experience: 5},
  {cv_id: 5, skill_id: 15, proficiency_level: 'intermediate', years_of_experience: 3}
] AS row
MATCH (c:CV {id: row.cv_id})
MATCH (s:Skill {id: row.skill_id})
MERGE (c)-[r:HAS_SKILL]->(s)
SET r.proficiency_level = row.proficiency_level,
    r.years_of_experience = row.years_of_experience;

UNWIND [
  {id: 1, name: 'Photography', category: 'Arts'},
  {id: 2, name: 'Reading', category: 'Education'},
  {id: 3, name: 'Gaming', category: 'Entertainment'},
  {id: 4, name: 'Cooking', category: 'Lifestyle'},
  {id: 5, name: 'Hiking', category: 'Sports'},
  {id: 6, name: 'Music', category: 'Arts'},
  {id: 7, name: 'Travel', category: 'Lifestyle'},
  {id: 8, name: 'Swimming', category: 'Sports'},
  {id: 9, name: 'Painting', category: 'Arts'},
  {id: 10, name: 'Chess', category: 'Games'},
  {id: 11, name: 'Yoga', category: 'Sports'},
  {id: 12, name: 'Gardening', category: 'Lifestyle'},
  {id: 13, name: 'Dancing', category: 'Arts'},
  {id: 14, name: 'Cycling', category: 'Sports'},
  {id: 15, name: 'Writing', category: 'Education'}
] AS row
MERGE (h:Hobby {id: row.id})
SET h.name = row.name, h.category = row.category;

UNWIND [
  {cv_id: 1, hobby_id: 1}, {cv_id: 1, hobby_id: 3}, {cv_id: 1, hobby_id: 6},
  {cv_id: 2, hobby_id: 9}, {cv_id: 2, hobby_id: 2}, {cv_id: 2, hobby_id: 7},
  {cv_id: 3, hobby_id: 5}, {cv_id: 3, hobby_id: 8}, {cv_id: 3, hobby_id: 14},
  {cv_id: 4, hobby_id: 6}, {cv_id: 4, hobby_id: 13}, {cv_id: 4, hobby_id: 2},
  {cv_id: 5, hobby_id: 2}, {cv_id: 5, hobby_id: 10}, {cv_id: 5, hobby_id: 15}
] AS row
MATCH (c:CV {id: row.cv_id})
MATCH (h:Hobby {id: row.hobby_id})
MERGE (c)-[:HAS_HOBBY]->(h);

UNWIND [
  {id: 1, name: 'TechCorp', industry: 'Technology', size: 'Large', founded_year: 2010},
  {id: 2, name: 'StartupXYZ', industry: 'Technology', size: 'Small', founded_year: 2020},
  {id: 3, name: 'FinancePro', industry: 'Finance', size: 'Medium', founded_year: 2015},
  {id: 4, name: 'HealthTech', industry: 'Healthcare', size: 'Medium', founded_year: 2018},
  {id: 5, name: 'EduSoft', industry: 'Education', size: 'Small', founded_year: 2019}
] AS row
MERGE (co:Company {id: row.id})
SET co.name = row.name, co.industry = row.industry, co.size = row.size, co.founded_year = row.founded_year;

UNWIND [
  {id: 1, cv_id: 1, company_id: 1, position: 'Senior Developer', start_date: date('2020-01-01'), end_date: date('2024-01-01'), description: 'Led development of microservices architecture', current: false},
  {id: 2, cv_id: 1, company_id: 2, position: 'Full Stack Developer', start_date: date('2018-01-01'), end_date: date('2019-12-31'), description: 'Developed web applications using React and Node.js', current: false},
  {id: 3, cv_id: 2, company_id: 3, position: 'UX Designer', start_date: date('2021-03-01'), end_date: date('2024-01-01'), description: 'Designed user interfaces for financial applications', current: false},
  {id: 4, cv_id: 3, company_id: 1, position: 'DevOps Engineer', start_date: date('2022-01-01'), end_date: null, description: 'Managing cloud infrastructure and CI/CD pipelines', current: true}
] AS row
MATCH (c:CV {id: row.cv_id})
MATCH (co:Company {id: row.company_id})
MERGE (e:WorkExperience {id: row.id})
SET e.position = row.position,
    e.start_date = row.start_date,
    e.end_date = row.end_date,
    e.description = row.description,
    e.current = row.current
MERGE (c)-[:HAS_EXPERIENCE]->(e)
MERGE (e)-[:WORKED_AT]->(co);

UNWIND [
  {id: 1, cv_id: 1, institution: 'Kyiv Polytechnic Institute', degree: 'Bachelor of Computer Science', field_of_study: 'Computer Science', start_date: date('2008-09-01'), end_date: date('2012-06-30'), gpa: 3.8},
  {id: 2, cv_id: 2, institution: 'Lviv Academy of Arts', degree: 'Bachelor of Design', field_of_study: 'Graphic Design', start_date: date('2010-09-01'), end_date: date('2014-06-30'), gpa: 3.9},
  {id: 3, cv_id: 3, institution: 'Kharkiv National University', degree: 'Master of Engineering', field_of_study: 'Software Engineering', start_date: date('2006-09-01'), end_date: date('2011-06-30'), gpa: 3.7}
] AS row
MATCH (c:CV {id: row.cv_id})
MERGE (e:Education {id: row.id})
SET e.institution = row.institution,
    e.degree = row.degree,
    e.field_of_study = row.field_of_study,
    e.start_date = row.start_date,
    e.end_date = row.end_date,
    e.gpa = row.gpa
MERGE (c)-[:HAS_EDUCATION]->(e);

UNWIND [
  {id: 1, name: 'English', proficiency: 'Fluent'},
  {id: 2, name: 'Ukrainian', proficiency: 'Native'},
  {id: 3, name: 'Russian', proficiency: 'Fluent'},
  {id: 4, name: 'German', proficiency: 'Intermediate'},
  {id: 5, name: 'French', proficiency: 'Beginner'}
] AS row
MERGE (l:Language {id: row.id})
SET l.name = row.name, l.default_proficiency = row.proficiency;

UNWIND [
  {cv_id: 1, language_id: 1, proficiency: 'Fluent'},
  {cv_id: 1, language_id: 2, proficiency: 'Native'},
  {cv_id: 1, language_id: 3, proficiency: 'Fluent'},
  {cv_id: 2, language_id: 1, proficiency: 'Fluent'},
  {cv_id: 2, language_id: 2, proficiency: 'Native'},
  {cv_id: 2, language_id: 4, proficiency: 'Intermediate'},
  {cv_id: 3, language_id: 1, proficiency: 'Fluent'},
  {cv_id: 3, language_id: 2, proficiency: 'Native'},
  {cv_id: 3, language_id: 3, proficiency: 'Fluent'}
] AS row
MATCH (c:CV {id: row.cv_id})
MATCH (l:Language {id: row.language_id})
MERGE (c)-[r:HAS_LANGUAGE]->(l)
SET r.proficiency = row.proficiency;
