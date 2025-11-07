use('hr_database');

db.experiences.aggregate([
  {
    $lookup: {
      from: 'cvs',
      localField: 'cv_id',
      foreignField: '_id',
      as: 'cv'
    }
  },
  {
    $lookup: {
      from: 'companies',
      localField: 'company_id',
      foreignField: '_id',
      as: 'company'
    }
  },
  {
    $unwind: '$cv'
  },
  {
    $unwind: '$company'
  },
  {
    $project: {
      first_name: '$cv.first_name',
      last_name: '$cv.last_name',
      email: '$cv.email',
      position: 1,
      company_name: '$company.name',
      start_date: 1,
      end_date: 1,
      current: 1
    }
  },
  {
    $sort: { company_name: 1, last_name: 1 }
  }
]);
