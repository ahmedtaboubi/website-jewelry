import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import path from 'path';

const TURSO_URL = "libsql://jewelry-db-ahmedtaboubi.aws-eu-west-1.turso.io";
const TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODcyNTQ3OTUsImlkIjoiMDFhMDIwYTktYmQwMS03ZjZiLWIyMjktMjBjMzQ3MmM1MTcwIiwia2lkIjoiQW5tcmtZYXNLRFdzLTlQTlJjMUhhQkw5V2loTkpXQ1FFZE5xWkhqdWNJbyIsInJpZCI6ImE0MzM0MzE4LTA5OTgtNDdiNi1iMTBhLTM1NTczNTc5YWJhZSJ9.4Wj7hzKYC4OnctQiAMJw7CoO-VKPzA8s7KfGq71JmI-AgUsBdM5An34eNZ3CcTURCIWbLev8sPA8RDmlfBiJCg";

const turso = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN
});

const localDb = new Database(path.resolve('server/products.db'));

async function fullMigration() {
  console.log('--- Starting Full Database Migration to Turso ---');

  // 1. Migrate Users
  const users = localDb.prepare('SELECT * FROM users').all();
  console.log(`Migrating ${users.length} user accounts...`);
  for (const u of users) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO users (id, name, email, phone, password, address, city, zipCode, is_admin, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        u.id, 
        u.name, 
        u.email, 
        u.phone || '', 
        u.password, 
        u.address || '', 
        u.city || '', 
        u.zipCode || '', 
        u.is_admin ? 1 : 0, 
        u.created_at || new Date().toISOString()
      ]
    });
  }
  console.log('✓ Users migrated successfully!');

  // 2. Migrate Orders
  const orders = localDb.prepare('SELECT * FROM orders').all();
  console.log(`Migrating ${orders.length} orders...`);
  for (const o of orders) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO orders (id, user_id, total, subtotal, discount_percent, discount_amount, shipping_cost, shipping_details, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        o.id,
        o.user_id || null,
        o.total,
        o.subtotal || 0,
        o.discount_percent || 0,
        o.discount_amount || 0,
        o.shipping_cost || 0,
        typeof o.shipping_details === 'string' ? o.shipping_details : JSON.stringify(o.shipping_details || {}),
        o.status || 'Processing',
        o.created_at || new Date().toISOString()
      ]
    });
  }
  console.log('✓ Orders migrated successfully!');

  // 3. Migrate Order Items
  const orderItems = localDb.prepare('SELECT * FROM order_items').all();
  console.log(`Migrating ${orderItems.length} order items...`);
  for (const item of orderItems) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO order_items (id, order_id, product_name, product_image, quantity, price)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        item.id,
        item.order_id,
        item.product_name,
        item.product_image || '',
        item.quantity,
        item.price
      ]
    });
  }
  console.log('✓ Order items migrated successfully!');

  // 4. Verify count in Turso
  const uCount = await turso.execute('SELECT COUNT(*) as c FROM users');
  const oCount = await turso.execute('SELECT COUNT(*) as c FROM orders');
  const iCount = await turso.execute('SELECT COUNT(*) as c FROM order_items');
  const pCount = await turso.execute('SELECT COUNT(*) as c FROM products');

  console.log('\n--- Turso Cloud Database Live Status ---');
  console.log(`Users:       ${uCount.rows[0].c}`);
  console.log(`Orders:      ${oCount.rows[0].c}`);
  console.log(`Order Items: ${iCount.rows[0].c}`);
  console.log(`Products:    ${pCount.rows[0].c}`);
}

fullMigration().catch(console.error);
