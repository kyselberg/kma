use('hr_database');

db.hobbies.find({}, { name: 1, category: 1 }).sort({ name: 1 });
