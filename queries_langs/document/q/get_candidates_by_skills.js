use('hr_database');

db.cvs.aggregate([
  {
    $match: { status: 'active' }
  },
  {
    $lookup: {
      from: 'cv_skills',
      localField: '_id',
      foreignField: 'cv_id',
      as: 'skills'
    }
  },
  {
    $lookup: {
      from: 'skills',
      localField: 'skills.skill_id',
      foreignField: '_id',
      as: 'skill_details'
    }
  },
  {
    $match: {
      'skill_details.name': {$in: ['TypeScript', 'Python']},
      'skills.proficiency_level': { $in: ['beginner', 'intermediate'] }
    }
  },
  {
    $project: {
      first_name: 1,
      last_name: 1,
    }
  },
  {
    $sort: { years_of_experience: -1 }
  }
]);
