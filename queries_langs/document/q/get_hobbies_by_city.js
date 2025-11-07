use('hr_database');

db.cvs.aggregate([
  {
    $lookup: {
      from: 'cv_hobbies',
      localField: '_id',
      foreignField: 'cv_id',
      as: 'hobby_relations'
    }
  },
  {
    $lookup: {
      from: 'hobbies',
      localField: 'hobby_relations.hobby_id',
      foreignField: '_id',
      as: 'hobbies'
    }
  },
  {
    $unwind: '$hobbies'
  },
  {
    $group: {
      _id: '$city',
      hobbies: { $addToSet: '$hobbies.name' }
    }
  },
  {
    $sort: { _id: 1 }
  }
]);
