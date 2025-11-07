PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cv (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10),
    nationality VARCHAR(50),
    marital_status VARCHAR(20),

    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    linkedin VARCHAR(255),
    website VARCHAR(255),
    github VARCHAR(255),

    position_title VARCHAR(200),
    desired_salary DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'UAH',
    availability VARCHAR(50),
    work_permit BOOLEAN DEFAULT 0,
    preferred_work_type VARCHAR(20),

    summary TEXT,
    objectives TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS education (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cv_id INTEGER REFERENCES cv(id) ON DELETE CASCADE,
    institution VARCHAR(255) NOT NULL,
    degree VARCHAR(100),
    field_of_study VARCHAR(200),
    start_date DATE,
    end_date DATE,
    gpa DECIMAL(3,2),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS work_experience (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cv_id INTEGER REFERENCES cv(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    position VARCHAR(200) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT 0,
    description TEXT,
    achievements TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50), -- programming, language, soft_skill, etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cv_skills (
    cv_id INTEGER REFERENCES cv(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level VARCHAR(20), -- beginner, intermediate, advanced, expert
    years_of_experience INTEGER,
    PRIMARY KEY (cv_id, skill_id)
);

CREATE TABLE IF NOT EXISTS hobbies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50), -- sports, arts, technology, etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cv_hobbies (
    cv_id INTEGER REFERENCES cv(id) ON DELETE CASCADE,
    hobby_id INTEGER REFERENCES hobbies(id) ON DELETE CASCADE,
    description TEXT,
    PRIMARY KEY (cv_id, hobby_id)
);

CREATE TABLE IF NOT EXISTS languages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    code VARCHAR(5), -- ISO language code
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cv_languages (
    cv_id INTEGER REFERENCES cv(id) ON DELETE CASCADE,
    language_id INTEGER REFERENCES languages(id) ON DELETE CASCADE,
    proficiency_level VARCHAR(20), -- native, fluent, intermediate, basic
    PRIMARY KEY (cv_id, language_id)
);

CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cv_id INTEGER REFERENCES cv(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    credential_id VARCHAR(100),
    credential_url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cv_id INTEGER REFERENCES cv(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    project_url VARCHAR(500),
    technologies TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cv_references (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cv_id INTEGER REFERENCES cv(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(200),
    company VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    relationship VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_cv_user_id ON cv(user_id);
CREATE INDEX idx_cv_city ON cv(city);
CREATE INDEX idx_cv_position ON cv(position_title);
CREATE INDEX idx_education_cv_id ON education(cv_id);
CREATE INDEX idx_work_experience_cv_id ON work_experience(cv_id);
CREATE INDEX idx_work_experience_company ON work_experience(company_name);
CREATE INDEX idx_cv_skills_cv_id ON cv_skills(cv_id);
CREATE INDEX idx_cv_skills_skill_id ON cv_skills(skill_id);
CREATE INDEX idx_cv_hobbies_cv_id ON cv_hobbies(cv_id);
CREATE INDEX idx_cv_hobbies_hobby_id ON cv_hobbies(hobby_id);
CREATE INDEX idx_cv_languages_cv_id ON cv_languages(cv_id);
CREATE INDEX idx_certificates_cv_id ON certificates(cv_id);
CREATE INDEX idx_projects_cv_id ON projects(cv_id);
CREATE INDEX idx_cv_references_cv_id ON cv_references(cv_id);

INSERT INTO users (login, password) VALUES
('john_doe', '$2a$10$abcdefghijklmnopqrstuv'),
('jane_smith', '$2a$10$abcdefghijklmnopqrstuv'),
('bob_wilson', '$2a$10$abcdefghijklmnopqrstuv'),
('alice_johnson', '$2a$10$abcdefghijklmnopqrstuv'),
('charlie_brown', '$2a$10$abcdefghijklmnopqrstuv'),
('diana_prince', '$2a$10$abcdefghijklmnopqrstuv'),
('eve_adams', '$2a$10$abcdefghijklmnopqrstuv'),
('frank_miller', '$2a$10$abcdefghijklmnopqrstuv'),
('grace_hopper', '$2a$10$abcdefghijklmnopqrstuv'),
('henry_ford', '$2a$10$abcdefghijklmnopqrstuv'),
('iris_west', '$2a$10$abcdefghijklmnopqrstuv'),
('jack_sparrow', '$2a$10$abcdefghijklmnopqrstuv'),
('kate_bishop', '$2a$10$abcdefghijklmnopqrstuv'),
('leo_messi', '$2a$10$abcdefghijklmnopqrstuv'),
('mary_jane', '$2a$10$abcdefghijklmnopqrstuv'),
('nick_fury', '$2a$10$abcdefghijklmnopqrstuv'),
('olivia_wilde', '$2a$10$abcdefghijklmnopqrstuv'),
('peter_parker', '$2a$10$abcdefghijklmnopqrstuv'),
('quinn_fabray', '$2a$10$abcdefghijklmnopqrstuv'),
('rachel_green', '$2a$10$abcdefghijklmnopqrstuv');

INSERT INTO cv (user_id, first_name, last_name, email, phone, date_of_birth, city, country, position_title, desired_salary, currency, summary, status) VALUES
(1, 'John', 'Doe', 'john.doe@email.com', '+380501234567', '1990-05-15', 'Kyiv', 'Ukraine', 'Senior Developer', 5000, 'USD', 'Experienced full-stack developer with 8 years of experience', 'active'),
(2, 'Jane', 'Smith', 'jane.smith@email.com', '+380502345678', '1992-08-20', 'Lviv', 'Ukraine', 'UX Designer', 3000, 'USD', 'Creative designer with strong focus on user experience', 'active'),
(3, 'Bob', 'Wilson', 'bob.wilson@email.com', '+380503456789', '1988-03-10', 'Kyiv', 'Ukraine', 'Project Manager', 4000, 'USD', 'Certified PM with experience in agile methodologies', 'active'),
(4, 'Alice', 'Johnson', 'alice.johnson@email.com', '+380504567890', '1995-12-03', 'Kharkiv', 'Ukraine', 'Frontend Developer', 3500, 'USD', 'React specialist with 3 years experience', 'active'),
(5, 'Charlie', 'Brown', 'charlie.brown@email.com', '+380505678901', '1987-07-18', 'Dnipro', 'Ukraine', 'DevOps Engineer', 4500, 'USD', 'AWS certified DevOps with Kubernetes expertise', 'active'),
(6, 'Diana', 'Prince', 'diana.prince@email.com', '+380506789012', '1993-04-25', 'Kyiv', 'Ukraine', 'Backend Developer', 4200, 'USD', 'Python and Node.js expert', 'active'),
(7, 'Eve', 'Adams', 'eve.adams@email.com', '+380507890123', '1991-09-12', 'Lviv', 'Ukraine', 'UI Designer', 2800, 'USD', 'Mobile app design specialist', 'active'),
(8, 'Frank', 'Miller', 'frank.miller@email.com', '+380508901234', '1985-11-30', 'Odessa', 'Ukraine', 'Senior QA Engineer', 3800, 'USD', 'Automation testing expert', 'active'),
(9, 'Grace', 'Hopper', 'grace.hopper@email.com', '+380509012345', '1994-02-14', 'Kyiv', 'Ukraine', 'Data Scientist', 5500, 'USD', 'ML and AI specialist with PhD', 'active'),
(10, 'Henry', 'Ford', 'henry.ford@email.com', '+380510123456', '1989-06-08', 'Kharkiv', 'Ukraine', 'Tech Lead', 6000, 'USD', 'Full-stack lead with 10+ years experience', 'active'),
(11, 'Iris', 'West', 'iris.west@email.com', '+380511234567', '1992-10-22', 'Lviv', 'Ukraine', 'Product Manager', 4800, 'USD', 'Agile product management expert', 'active'),
(12, 'Jack', 'Sparrow', 'jack.sparrow@email.com', '+380512345678', '1986-08-05', 'Dnipro', 'Ukraine', 'Full Stack Developer', 4300, 'USD', 'JavaScript and Python specialist', 'active'),
(13, 'Kate', 'Bishop', 'kate.bishop@email.com', '+380513456789', '1996-01-17', 'Kyiv', 'Ukraine', 'Junior Developer', 2200, 'USD', 'Recent graduate with internship experience', 'active'),
(14, 'Leo', 'Messi', 'leo.messi@email.com', '+380514567890', '1987-03-28', 'Odessa', 'Ukraine', 'Mobile Developer', 4000, 'USD', 'React Native and Flutter expert', 'active'),
(15, 'Mary', 'Jane', 'mary.jane@email.com', '+380515678901', '1993-12-09', 'Kharkiv', 'Ukraine', 'Marketing Manager', 3200, 'USD', 'Digital marketing and analytics expert', 'active'),
(16, 'Nick', 'Fury', 'nick.fury@email.com', '+380516789012', '1984-05-21', 'Kyiv', 'Ukraine', 'Security Engineer', 5200, 'USD', 'Cybersecurity and penetration testing', 'active'),
(17, 'Olivia', 'Wilde', 'olivia.wilde@email.com', '+380517890123', '1990-07-04', 'Lviv', 'Ukraine', 'Content Manager', 2900, 'USD', 'Content strategy and copywriting expert', 'active'),
(18, 'Peter', 'Parker', 'peter.parker@email.com', '+380518901234', '1995-11-16', 'Dnipro', 'Ukraine', 'Junior Frontend Developer', 2000, 'USD', 'Vue.js and React enthusiast', 'active'),
(19, 'Quinn', 'Fabray', 'quinn.fabray@email.com', '+380519012345', '1991-04-07', 'Odessa', 'Ukraine', 'HR Specialist', 3100, 'USD', 'Recruitment and employee relations', 'active'),
(20, 'Rachel', 'Green', 'rachel.green@email.com', '+380520123456', '1988-09-13', 'Kharkiv', 'Ukraine', 'Business Analyst', 3600, 'USD', 'Requirements analysis and process improvement', 'active');

-- Insert skills (comprehensive list for better query testing)
INSERT INTO skills (name, category) VALUES
('JavaScript', 'programming'),
('Python', 'programming'),
('Java', 'programming'),
('C#', 'programming'),
('TypeScript', 'programming'),
('Go', 'programming'),
('React', 'framework'),
('Vue.js', 'framework'),
('Angular', 'framework'),
('Node.js', 'backend'),
('Express.js', 'backend'),
('Django', 'backend'),
('Spring Boot', 'backend'),
('MongoDB', 'database'),
('PostgreSQL', 'database'),
('MySQL', 'database'),
('Redis', 'database'),
('HTML/CSS', 'frontend'),
('SASS/SCSS', 'frontend'),
('Bootstrap', 'frontend'),
('Tailwind CSS', 'frontend'),
('Docker', 'devops'),
('Kubernetes', 'devops'),
('AWS', 'cloud'),
('Azure', 'cloud'),
('GCP', 'cloud'),
('Git', 'tools'),
('Jenkins', 'devops'),
('GitLab CI', 'devops'),
('Figma', 'design'),
('Sketch', 'design'),
('Adobe XD', 'design'),
('Photoshop', 'design'),
('Illustrator', 'design'),
('Agile', 'methodology'),
('Scrum', 'methodology'),
('Kanban', 'methodology'),
('JIRA', 'tools'),
('Confluence', 'tools'),
('Slack', 'tools'),
('React Native', 'mobile'),
('Flutter', 'mobile'),
('Swift', 'mobile'),
('Kotlin', 'mobile'),
('TensorFlow', 'ai_ml'),
('PyTorch', 'ai_ml'),
('Pandas', 'data_analysis'),
('NumPy', 'data_analysis'),
('SQL', 'database'),
('GraphQL', 'api'),
('REST API', 'api'),
('Microservices', 'architecture'),
('SOLID Principles', 'programming'),
('Design Patterns', 'programming');

-- CV-Skills relationships (comprehensive data for all 20 CVs)
INSERT INTO cv_skills (cv_id, skill_id, proficiency_level, years_of_experience) VALUES
-- John Doe (Senior Developer)
(1, 1, 'expert', 8), (1, 7, 'advanced', 5), (1, 10, 'advanced', 6), (1, 15, 'intermediate', 3), (1, 27, 'expert', 8),
(1, 22, 'advanced', 4), (1, 24, 'intermediate', 2), (1, 40, 'expert', 8), (1, 45, 'advanced', 6),
-- Jane Smith (UX Designer)
(2, 30, 'expert', 6), (2, 31, 'expert', 5), (2, 32, 'advanced', 4), (2, 33, 'intermediate', 3), (2, 34, 'advanced', 4),
(2, 18, 'expert', 6), (2, 19, 'advanced', 4), (2, 40, 'intermediate', 2),
-- Bob Wilson (Project Manager)
(3, 35, 'expert', 7), (3, 36, 'expert', 7), (3, 37, 'advanced', 5), (3, 38, 'expert', 6), (3, 39, 'advanced', 5),
(3, 40, 'expert', 7),
-- Alice Johnson (Frontend Developer)
(4, 7, 'expert', 3), (4, 18, 'expert', 3), (4, 19, 'advanced', 2), (4, 20, 'intermediate', 1), (4, 21, 'intermediate', 1),
(4, 1, 'advanced', 3), (4, 5, 'intermediate', 2),
-- Charlie Brown (DevOps Engineer)
(5, 22, 'expert', 5), (5, 23, 'advanced', 3), (5, 24, 'expert', 4), (5, 25, 'intermediate', 2), (5, 27, 'expert', 6),
(5, 28, 'advanced', 4), (5, 29, 'intermediate', 2), (5, 2, 'advanced', 3),
-- Diana Prince (Backend Developer)
(6, 2, 'expert', 4), (6, 10, 'expert', 4), (6, 11, 'advanced', 3), (6, 15, 'advanced', 3), (6, 22, 'intermediate', 2),
(6, 1, 'advanced', 3), (6, 40, 'expert', 5),
-- Eve Adams (UI Designer)
(7, 30, 'expert', 4), (7, 31, 'expert', 3), (7, 32, 'advanced', 3), (7, 18, 'expert', 4), (7, 19, 'advanced', 2),
(7, 41, 'expert', 3), (7, 42, 'intermediate', 1),
-- Frank Miller (Senior QA Engineer)
(8, 2, 'advanced', 6), (8, 15, 'expert', 6), (8, 16, 'expert', 5), (8, 22, 'intermediate', 3), (8, 40, 'expert', 7),
(8, 35, 'advanced', 5), (8, 1, 'intermediate', 2),
-- Grace Hopper (Data Scientist)
(9, 2, 'expert', 4), (9, 45, 'expert', 3), (9, 46, 'advanced', 2), (9, 47, 'expert', 4), (9, 48, 'expert', 4),
(9, 24, 'intermediate', 2), (9, 15, 'advanced', 3),
-- Henry Ford (Tech Lead)
(10, 1, 'expert', 10), (10, 2, 'expert', 8), (10, 7, 'expert', 6), (10, 10, 'expert', 8), (10, 15, 'expert', 7),
(10, 22, 'expert', 5), (10, 24, 'advanced', 4), (10, 35, 'expert', 8), (10, 40, 'expert', 10),
-- Iris West (Product Manager)
(11, 35, 'expert', 5), (11, 36, 'expert', 5), (11, 37, 'advanced', 4), (11, 38, 'expert', 6), (11, 39, 'advanced', 4),
(11, 40, 'expert', 6), (11, 1, 'intermediate', 2),
-- Jack Sparrow (Full Stack Developer)
(12, 1, 'expert', 6), (12, 2, 'expert', 5), (12, 7, 'advanced', 4), (12, 10, 'advanced', 4), (12, 15, 'advanced', 4),
(12, 22, 'intermediate', 2), (12, 40, 'expert', 7),
-- Kate Bishop (Junior Developer)
(13, 1, 'intermediate', 1), (13, 7, 'intermediate', 1), (13, 18, 'intermediate', 1), (13, 27, 'intermediate', 1),
(13, 40, 'intermediate', 1), (13, 5, 'beginner', 0),
-- Leo Messi (Mobile Developer)
(14, 41, 'expert', 4), (14, 42, 'advanced', 2), (14, 43, 'intermediate', 1), (14, 44, 'intermediate', 1), (14, 1, 'advanced', 3),
(14, 22, 'intermediate', 2), (14, 40, 'expert', 5),
-- Mary Jane (Marketing Manager)
(15, 38, 'expert', 4), (15, 39, 'advanced', 3), (15, 30, 'intermediate', 2), (15, 1, 'beginner', 0),
(15, 2, 'beginner', 0), (15, 40, 'intermediate', 2),
-- Nick Fury (Security Engineer)
(16, 2, 'expert', 8), (16, 1, 'advanced', 6), (16, 22, 'expert', 5), (16, 24, 'expert', 6), (16, 15, 'expert', 7),
(16, 40, 'expert', 9), (16, 35, 'advanced', 6),
-- Olivia Wilde (Content Manager)
(17, 38, 'expert', 3), (17, 39, 'advanced', 3), (17, 30, 'intermediate', 2), (17, 40, 'intermediate', 3),
(17, 1, 'beginner', 0),
-- Peter Parker (Junior Frontend Developer)
(18, 8, 'intermediate', 1), (18, 7, 'intermediate', 1), (18, 18, 'intermediate', 1), (18, 19, 'intermediate', 1),
(18, 27, 'intermediate', 1), (18, 40, 'intermediate', 1),
-- Quinn Fabray (HR Specialist)
(19, 35, 'advanced', 4), (19, 36, 'advanced', 3), (19, 38, 'expert', 5), (19, 39, 'advanced', 4), (19, 40, 'expert', 6),
(19, 1, 'beginner', 0),
-- Rachel Green (Business Analyst)
(20, 15, 'expert', 5), (20, 47, 'advanced', 3), (20, 48, 'advanced', 3), (20, 35, 'advanced', 4), (20, 40, 'expert', 6),
(20, 2, 'intermediate', 2);

-- Insert hobbies
INSERT INTO hobbies (name, category) VALUES
('Photography', 'arts'),
('Football', 'sports'),
('Reading', 'leisure'),
('Swimming', 'sports'),
('Traveling', 'leisure'),
('Guitar', 'arts');

-- CV-Hobbies relationships
INSERT INTO cv_hobbies (cv_id, hobby_id, description) VALUES
(1, 1, 'Landscape and portrait photography'),
(1, 2, 'Play in local amateur league'),
(2, 3, 'Love reading design books'),
(2, 1, 'Photography enthusiast'),
(3, 4, 'Swim 3 times a week'),
(3, 5, 'Travel blogger');

-- Insert languages
INSERT INTO languages (name, code) VALUES
('English', 'en'),
('Ukrainian', 'uk'),
('German', 'de'),
('French', 'fr'),
('Polish', 'pl');

-- CV-Languages relationships
INSERT INTO cv_languages (cv_id, language_id, proficiency_level) VALUES
(1, 1, 'fluent'),
(1, 2, 'native'),
(2, 1, 'advanced'),
(2, 2, 'native'),
(2, 3, 'intermediate'),
(3, 1, 'fluent'),
(3, 2, 'native'),
(3, 4, 'basic');

-- Insert education
INSERT INTO education (cv_id, institution, degree, field_of_study, start_date, end_date, gpa) VALUES
(1, 'Kyiv Polytechnic Institute', 'Master of Science', 'Computer Science', '2010-09-01', '2015-06-30', 3.8),
(2, 'Lviv Art Academy', 'Bachelor of Arts', 'Design', '2012-09-01', '2016-06-30', 3.9),
(3, 'Kyiv National University', 'Master of Business Administration', 'Project Management', '2008-09-01', '2013-06-30', 3.7);

-- Insert work experience
INSERT INTO work_experience (cv_id, company_name, position, start_date, end_date, is_current, description) VALUES
(1, 'TechCorp Ukraine', 'Senior Developer', '2018-01-01', '2023-12-31', 0, 'Led development of web applications'),
(1, 'StartupXYZ', 'Full Stack Developer', '2015-07-01', '2017-12-31', 0, 'Built MVPs for various clients'),
(2, 'Design Studio', 'UX Designer', '2019-03-01', NULL, 1, 'Creating user experiences for mobile apps'),
(2, 'FreelanceHub', 'UI Designer', '2016-07-01', '2019-02-28', 0, 'Freelance design projects'),
(3, 'TechCorp Ukraine', 'Project Manager', '2020-01-01', NULL, 1, 'Managing agile teams'),
(3, 'Consulting Group', 'Junior PM', '2013-07-01', '2019-12-31', 0, 'Assisted in project coordination');

-- Insert certificates
INSERT INTO certificates (cv_id, name, issuing_organization, issue_date, credential_id) VALUES
(1, 'AWS Certified Developer', 'Amazon Web Services', '2023-03-15', 'AWS-DEV-123456'),
(2, 'Adobe Certified Expert', 'Adobe', '2022-11-20', 'ACE-UX-789012'),
(3, 'PMP Certification', 'PMI', '2021-05-10', 'PMP-456789');

-- Insert projects
INSERT INTO projects (cv_id, name, description, start_date, end_date, technologies) VALUES
(1, 'E-commerce Platform', 'Full-stack e-commerce solution', '2022-01-01', '2022-12-31', 'React, Node.js, MongoDB'),
(2, 'Mobile Banking App', 'UX/UI redesign for banking app', '2023-03-01', '2023-09-30', 'Figma, Sketch'),
(3, 'ERP Implementation', 'Led ERP system implementation', '2021-01-01', '2022-06-30', 'SAP, Agile');
