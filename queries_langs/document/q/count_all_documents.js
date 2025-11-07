use('hr_database');

console.log("Users:", db.users.countDocuments());
console.log("CVs:", db.cvs.countDocuments());
console.log("Skills:", db.skills.countDocuments());
console.log("Hobbies:", db.hobbies.countDocuments());
console.log("Companies:", db.companies.countDocuments());
console.log("Experiences:", db.experiences.countDocuments());
console.log("Educations:", db.educations.countDocuments());
console.log("Languages:", db.languages.countDocuments());
console.log("CV Skills:", db.cv_skills.countDocuments());
console.log("CV Hobbies:", db.cv_hobbies.countDocuments());
console.log("CV Languages:", db.cv_languages.countDocuments());
