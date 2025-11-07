use('hr_database');

db.cvs.aggregate([
  {
    $group: {
      _id: '$city',
      count: { $sum: 1 },
      avg_salary: { $avg: '$desired_salary' },
      positions: { $addToSet: '$position_title' }
    }
  },
  {
    $sort: { count: -1 }
  }
]);
