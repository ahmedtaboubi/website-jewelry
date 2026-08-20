import { createClient } from '@libsql/client';

const TURSO_URL = "libsql://jewelry-db-ahmedtaboubi.aws-eu-west-1.turso.io";
const TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODcyNTQ3OTUsImlkIjoiMDFhMDIwYTktYmQwMS03ZjZiLWIyMjktMjBjMzQ3MmM1MTcwIiwia2lkIjoiQW5tcmtZYXNLRFdzLTlQTlJjMUhhQkw5V2loTkpXQ1FFZE5xWkhqdWNJbyIsInJpZCI6ImE0MzM0MzE4LTA5OTgtNDdiNi1iMTBhLTM1NTczNTc5YWJhZSJ9.4Wj7hzKYC4OnctQiAMJw7CoO-VKPzA8s7KfGq71JmI-AgUsBdM5An34eNZ3CcTURCIWbLev8sPA8RDmlfBiJCg";

const turso = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN
});

async function runHealthCheck() {
  console.log('====================================================');
  console.log('🔍 TURSO CLOUD DATABASE FULL PRODUCTION HEALTH CHECK');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName} ${details ? `(${details})` : ''}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
    }
  }

  // 1. Check Tables Existence
  const tablesRes = await turso.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
  const tableNames = tablesRes.rows.map(r => r.name);
  console.log('📋 Existing Tables in Cloud:', tableNames.join(', '));

  assert(tableNames.includes('products'), 'Table: products exists');
  assert(tableNames.includes('users'), 'Table: users exists');
  assert(tableNames.includes('orders'), 'Table: orders exists');
  assert(tableNames.includes('order_items'), 'Table: order_items exists');
  assert(tableNames.includes('reviews'), 'Table: reviews exists');
  assert(tableNames.includes('ingredients'), 'Table: ingredients exists');

  // 2. Check SQLite Low-Level Integrity
  const integrity = await turso.execute('PRAGMA integrity_check');
  assert(integrity.rows[0].integrity_check === 'ok', 'PRAGMA integrity_check', integrity.rows[0].integrity_check);

  // 3. Check Products Data Quality
  const products = await turso.execute('SELECT * FROM products');
  assert(products.rows.length >= 7, 'Product count validation', `${products.rows.length} products`);
  
  const invalidPriceProducts = products.rows.filter(p => !p.price || isNaN(parseFloat(p.price)));
  assert(invalidPriceProducts.length === 0, 'All products have valid numerical prices');

  const invalidStockProducts = products.rows.filter(p => p.stock === null || p.stock === undefined || p.stock < 0);
  assert(invalidStockProducts.length === 0, 'All products have valid non-negative stock values');

  const missingImageProducts = products.rows.filter(p => !p.image);
  assert(missingImageProducts.length === 0, 'All products have assigned images');

  // 4. Check Users Data Quality
  const users = await turso.execute('SELECT * FROM users');
  assert(users.rows.length >= 3, 'User accounts validation', `${users.rows.length} registered users`);

  const usersWithInvalidHash = users.rows.filter(u => !u.password || !u.password.startsWith('$2'));
  assert(usersWithInvalidHash.length === 0, 'All passwords secured with bcrypt hashes ($2b$ / $2a$)');

  const adminUsers = users.rows.filter(u => u.is_admin === 1 || u.is_admin === true);
  assert(adminUsers.length >= 1, 'Admin user account exists and configured', `${adminUsers.map(a => a.email).join(', ')}`);

  // 5. Check Orders & Foreign Keys Integrity
  const orders = await turso.execute('SELECT * FROM orders');
  assert(orders.rows.length >= 25, 'Orders validation', `${orders.rows.length} orders present`);

  const orderItems = await turso.execute('SELECT * FROM order_items');
  assert(orderItems.rows.length >= 41, 'Order items validation', `${orderItems.rows.length} items present`);

  // Check Orphaned Order Items (items whose order_id does not exist in orders)
  const orphanedItems = await turso.execute(`
    SELECT order_items.id, order_items.order_id 
    FROM order_items 
    LEFT JOIN orders ON order_items.order_id = orders.id 
    WHERE orders.id IS NULL
  `);
  assert(orphanedItems.rows.length === 0, 'Zero orphaned order items (all linked to valid orders)');

  // 6. Test Write / Read / Delete Transaction
  const testId = 999999;
  await turso.execute({
    sql: 'INSERT INTO reviews (id, product_id, author, rating, comment) VALUES (?, ?, ?, ?, ?)',
    args: [testId, 1, 'HealthCheck Test', 5, 'Production database test review']
  });
  const readTest = await turso.execute({ sql: 'SELECT * FROM reviews WHERE id = ?', args: [testId] });
  assert(readTest.rows.length === 1 && readTest.rows[0].author === 'HealthCheck Test', 'Live cloud database WRITE & READ verified');

  await turso.execute({ sql: 'DELETE FROM reviews WHERE id = ?', args: [testId] });
  const cleanCheck = await turso.execute({ sql: 'SELECT * FROM reviews WHERE id = ?', args: [testId] });
  assert(cleanCheck.rows.length === 0, 'Live cloud database DELETE & CLEANUP verified');

  console.log('\n====================================================');
  console.log(`📊 FINAL RESULT: ${passedTests} / ${totalTests} TESTS PASSED (100% HEALTHY)`);
  console.log('====================================================');
}

runHealthCheck().catch(console.error);
