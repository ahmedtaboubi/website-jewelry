import { createClient } from '@libsql/client';

const turso = createClient({
  url: 'libsql://jewelry-db-ahmedtaboubi.aws-eu-west-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODcyNTQ3OTUsImlkIjoiMDFhMDIwYTktYmQwMS03ZjZiLWIyMjktMjBjMzQ3MmM1MTcwIiwia2lkIjoiQW5tcmtZYXNLRFdzLTlQTlJjMUhhQkw5V2loTkpXQ1FFZE5xWkhqdWNJbyIsInJpZCI6ImE0MzM0MzE4LTA5OTgtNDdiNi1iMTBhLTM1NTczNTc5YWJhZSJ9.4Wj7hzKYC4OnctQiAMJw7CoO-VKPzA8s7KfGq71JmI-AgUsBdM5An34eNZ3CcTURCIWbLev8sPA8RDmlfBiJCg'
});

async function migrateRoles() {
  const tableInfo = await turso.execute('PRAGMA table_info(users)');
  const columns = tableInfo.rows.map(r => r.name);
  console.log('Existing columns:', columns);

  if (!columns.includes('role')) {
    console.log('Adding role column...');
    await turso.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'customer'");
  }

  if (!columns.includes('permissions')) {
    console.log('Adding permissions column...');
    await turso.execute("ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT '[]'");
  }

  // Set Super Admins
  const allPermissions = JSON.stringify(['orders', 'products', 'reviews', 'ingredients', 'analytics', 'marketing', 'team']);
  
  await turso.execute({
    sql: "UPDATE users SET role = 'super_admin', is_admin = 1, permissions = ? WHERE LOWER(email) IN ('ahmed.taboubi@hotmail.fr', 'admin@aura.com')",
    args: [allPermissions]
  });

  // Set regular admins
  await turso.execute({
    sql: "UPDATE users SET role = 'admin', permissions = ? WHERE is_admin = 1 AND (role != 'super_admin' OR role IS NULL)",
    args: [JSON.stringify(['orders', 'products', 'reviews'])]
  });

  const updatedUsers = await turso.execute('SELECT id, name, email, role, is_admin, permissions FROM users');
  console.log('SUCCESS! UPDATED USERS:');
  console.log(updatedUsers.rows);
}

migrateRoles().catch(console.error);
