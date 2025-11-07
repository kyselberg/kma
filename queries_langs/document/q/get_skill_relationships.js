use('hr_database');

db.cv_skills.aggregate([
  {
    $lookup: {
      from: 'skills',
      localField: 'skill_id',
      foreignField: '_id',
      as: 'skill'
    }
  },
  {
    $unwind: '$skill'
  },
  {
    $group: {
      _id: '$cv_id',
      skills: { $push: '$skill.name' },
      skill_count: { $sum: 1 }
    }
  },
  {
    $match: { skill_count: { $gte: 2 } }
  },
  {
    $unwind: '$skills'
  },
  {
    $group: {
      _id: '$skills',
      frequency: { $sum: 1 },
      avg_cv_skills: { $avg: '$skill_count' }
    }
  },
  {
    $sort: { frequency: -1 }
  },
  {
    $limit: 10
  }
]);
