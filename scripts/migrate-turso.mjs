import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';

const TURSO_URL = "libsql://jewelry-db-ahmedtaboubi.aws-eu-west-1.turso.io";
const TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODcyNTQ3OTUsImlkIjoiMDFhMDIwYTktYmQwMS03ZjZiLWIyMjktMjBjMzQ3MmM1MTcwIiwia2lkIjoiQW5tcmtZYXNLRFdzLTlQTlJjMUhhQkw5V2loTkpXQ1FFZE5xWkhqdWNJbyIsInJpZCI6ImE0MzM0MzE4LTA5OTgtNDdiNi1iMTBhLTM1NTczNTc5YWJhZSJ9.4Wj7hzKYC4OnctQiAMJw7CoO-VKPzA8s7KfGq71JmI-AgUsBdM5An34eNZ3CcTURCIWbLev8sPA8RDmlfBiJCg";

const turso = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN
});

async function migrate() {
  console.log('Connecting to Turso and creating database tables...');

  // 1. Create tables
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      inspiredBy TEXT,
      notes TEXT,
      price TEXT NOT NULL,
      image TEXT NOT NULL,
      isNew BOOLEAN,
      category TEXT,
      details TEXT,
      stock INTEGER DEFAULT 50,
      initial_stock INTEGER DEFAULT 50
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      address TEXT,
      city TEXT,
      zipCode TEXT,
      is_admin BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      total REAL NOT NULL,
      subtotal REAL DEFAULT 0,
      discount_percent INTEGER DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      shipping_cost REAL DEFAULT 0,
      shipping_details TEXT,
      status TEXT DEFAULT 'Processing',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_image TEXT,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await turso.execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      author TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Tables created successfully!');

  // 2. Migrate products from local SQLite
  const localDb = new Database(path.resolve('server/products.db'));
  const localProducts = localDb.prepare('SELECT * FROM products').all();

  console.log(`Migrating ${localProducts.length} products to Turso...`);
  for (const p of localProducts) {
    await turso.execute({
      sql: `INSERT OR REPLACE INTO products (id, name, inspiredBy, notes, price, image, isNew, category, details, stock, initial_stock)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [p.id, p.name, p.inspiredBy || '', p.notes || '', p.price, p.image, p.isNew ? 1 : 0, p.category, p.details || '', p.stock || 50, p.initial_stock || 50]
    });
  }
  console.log('Products successfully migrated to Turso!');

  // 3. Seed default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await turso.execute({
    sql: `INSERT OR IGNORE INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)`,
    args: ['Admin Aura', 'admin@aura.com', hashedPassword, 1]
  });

  const check = await turso.execute('SELECT COUNT(*) as count FROM products');
  console.log(`Turso Database currently has ${check.rows[0].count} products live in the cloud!`);
}

migrate().catch(console.error);
