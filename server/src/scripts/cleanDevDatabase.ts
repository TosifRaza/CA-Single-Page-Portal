import mongoose from 'mongoose';

async function clean() {
  const uri = 'mongodb://127.0.0.1:27017/ca_proflow';
  console.log('Connecting to', uri);
  await mongoose.connect(uri);
  const db = mongoose.connection.db!;

  const collectionsToClear = [
    'taxgroups',
    'taxmasters',
    'workmasters',
    'workassignments',
    'clients',
    'taxfilings',
    'payments',
    'activitylogs',
    'notifications',
    'documents',
    'services',
    'documentcategories',
    'branches',
    'financialyears',
  ];

  for (const col of collectionsToClear) {
    const res = await db.collection(col).deleteMany({});
    console.log(`Cleared ${col}: ${res.deletedCount}`);
  }

  // In employees, keep only the admin user Tosif Raza
  const empRes = await db.collection('employees').deleteMany({ email: { $ne: 'tosif@rizassociates.com' } });
  console.log('Cleared other seeded employees:', empRes.deletedCount);

  // Clear branchId from Tosif's employee profile since branches are wiped
  await db.collection('employees').updateOne(
    { email: 'tosif@rizassociates.com' },
    { $unset: { branchId: '' } }
  );

  console.log('\n--- Final Verification for ca_proflow database ---');
  const allCols = await db.listCollections().toArray();
  for (const c of allCols) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`${c.name}: ${count}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

clean().catch((err) => {
  console.error(err);
  process.exit(1);
});
