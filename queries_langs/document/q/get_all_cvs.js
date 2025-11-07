use('hr_database');

db.cvs.find(
  { status: 'active' },
  {
    _id: 1,
    first_name: 1,
    last_name: 1,
    email: 1,
    position_title: 1,
    city: 1,
    summary: 1
  }
).sort({ created_at: -1 });
