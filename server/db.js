import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to SQLite database (creates it if it doesn't exist)
const dbPath = path.resolve(__dirname, 'products.db');
const db = new Database(dbPath);

// Initialize the database with required tables
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    inspiredBy TEXT,
    notes TEXT,
    price TEXT NOT NULL,
    image TEXT NOT NULL,
    isNew BOOLEAN,
    category TEXT,
    details TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    total REAL NOT NULL,
    status TEXT DEFAULT 'Processing',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    product_image TEXT,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ad_spends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    platform TEXT NOT NULL,
    amount REAL NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Add phone column to users table if it doesn't exist
try {
  db.exec('ALTER TABLE users ADD COLUMN phone TEXT;');
  console.log('Successfully added phone column to users table');
} catch (error) {
  if (!error.message.includes('duplicate column name')) {
    console.error('Migration error (phone):', error.message);
  }
}

// Migration: Add is_admin column to users table if it doesn't exist
try {
  db.exec('ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0;');
  console.log('Successfully added is_admin column to users table');
} catch (error) {
  if (!error.message.includes('duplicate column name')) {
    console.error('Migration error (is_admin):', error.message);
  }
}

// Migration: Add details column to products table if it doesn't exist
try {
  db.exec('ALTER TABLE products ADD COLUMN details TEXT;');
  console.log('Successfully added details column to products table');
} catch (error) {
  if (!error.message.includes('duplicate column name')) {
    console.error('Migration error (details):', error.message);
  }
}

// Migration: Add order calculation columns to orders table
try {
  db.exec('ALTER TABLE orders ADD COLUMN subtotal REAL DEFAULT 0;');
  db.exec('ALTER TABLE orders ADD COLUMN discount_percent INTEGER DEFAULT 0;');
  db.exec('ALTER TABLE orders ADD COLUMN discount_amount REAL DEFAULT 0;');
  console.log('Successfully added calculation columns to orders table');
} catch (error) {
  if (!error.message.includes('duplicate column name')) {
    console.error('Migration error (order calculations):', error.message);
  }
}

// Migration: Add shipping_details column to orders table
try {
  db.exec('ALTER TABLE orders ADD COLUMN shipping_details TEXT;');
  console.log('Successfully added shipping_details column to orders table');
} catch (error) {
  if (!error.message.includes('duplicate column name')) {
    console.error('Migration error (shipping_details):', error.message);
  }
}

// Migration: Add address fields to users table
try {
  db.exec('ALTER TABLE users ADD COLUMN address TEXT;');
  db.exec('ALTER TABLE users ADD COLUMN city TEXT;');
  db.exec('ALTER TABLE users ADD COLUMN zipCode TEXT;');
  console.log('Successfully added address columns to users table');
} catch (error) {
  if (!error.message.includes('duplicate column name')) {
    console.error('Migration error (user address fields):', error.message);
  }
}

// Migration: Add shipping_cost column to orders table
try {
  db.exec('ALTER TABLE orders ADD COLUMN shipping_cost REAL DEFAULT 0;');
  console.log('Successfully added shipping_cost column to orders table');
} catch (error) {
  if (!error.message.includes('duplicate column name')) {
    console.error('Migration error (shipping_cost):', error.message);
  }
}

// Seed default admin user if it doesn't exist
try {
  import('bcrypt').then(bcrypt => {
    const adminExists = db.prepare('SELECT id FROM users WHERE is_admin = 1').get();
    if (!adminExists) {
      bcrypt.hash('admin123', 10).then(hashedPassword => {
        db.prepare('INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)').run(
          'Admin',
          'admin@aura.com',
          hashedPassword,
          1
        );
        console.log('Successfully seeded default admin user (admin@aura.com / admin123)');
      });
    }
  });
} catch (error) {
  console.error('Error seeding admin user:', error);
}

// Migration: Add reset_token columns to users table
try {
  db.exec('ALTER TABLE users ADD COLUMN reset_token TEXT;');
  db.exec('ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME;');
  console.log('Successfully added reset token columns to users table');
} catch (error) {
  if (!error.message.includes('duplicate column name')) {
    console.error('Migration error (reset_token):', error.message);
  }
}

// Migration: Normalize timestamps in orders, users, ad_spends, ingredients to standard ISO 8601 UTC
try {
  db.exec(`
    UPDATE orders 
    SET created_at = replace(created_at, ' ', 'T') || 'Z' 
    WHERE created_at NOT LIKE '%Z' AND created_at NOT LIKE '%T%';
  `);
  console.log('Successfully normalized orders timestamps to ISO UTC');
} catch (error) {
  console.error('Migration error (normalize timestamps):', error.message);
}

// Migration: Add stock column to products table
try {
  db.exec('ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 50;');
  console.log('Successfully added stock column to products table');
} catch (error) {
  if (!error.message.includes('duplicate column name')) {
    console.error('Migration error (stock):', error.message);
  }
}

// Migration: Ensure existing products have valid default stock
try {
  db.exec('UPDATE products SET stock = 50 WHERE stock IS NULL;');
} catch (error) {
  console.error('Migration error (default stock):', error.message);
}

// Migration: Add initial_stock column to products table
try {
  db.exec('ALTER TABLE products ADD COLUMN initial_stock INTEGER DEFAULT 50;');
  db.exec('UPDATE products SET initial_stock = 50 WHERE initial_stock IS NULL;');
  console.log('Successfully added initial_stock column to products table');
} catch (error) {
  if (!error.message.includes('duplicate column name')) {
    console.error('Migration error (initial_stock):', error.message);
  }
}

// Migration: Create reviews table for customer ratings and comments with moderation status
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER,
      author_name TEXT NOT NULL,
      author_email TEXT,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      title TEXT,
      comment TEXT NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
      verified_purchase BOOLEAN DEFAULT 0,
      helpful_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(product_id) REFERENCES products(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id, status);
    CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
  `);
  console.log('Successfully initialized reviews table');

  // Seed sample reviews if table is empty
  const reviewCount = db.prepare('SELECT COUNT(*) as count FROM reviews').get();
  if (reviewCount && reviewCount.count === 0) {
    const products = db.prepare('SELECT id, name FROM products LIMIT 6').all();
    if (products && products.length > 0) {
      const seedStmt = db.prepare(`
        INSERT INTO reviews (product_id, author_name, author_email, rating, title, comment, status, verified_purchase, helpful_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
      `);

      const sampleReviews = [
        { author: 'Yasmine B.', email: 'yasmine@example.com', rating: 5, title: 'Magnifique qualité !', comment: 'La brillance et les détails sont exceptionnels. Ne noircit pas sous l’eau et résiste très bien au quotidien.', status: 'approved', verified: 1, helpful: 14, time: '-5 days' },
        { author: 'Mehdi K.', email: 'mehdi@example.com', rating: 5, title: 'Un éclat subtil et luxueux', comment: 'Offert en cadeau, la personne était ravie. Très belle finition dorée et packaging soigné.', status: 'approved', verified: 1, helpful: 8, time: '-12 days' },
        { author: 'Sarah L.', email: 'sarah@example.com', rating: 4, title: 'Très élégant', comment: 'Bijou conforme aux photos, très agréable à porter toute la journée.', status: 'approved', verified: 1, helpful: 3, time: '-18 days' },
        { author: 'Inès T.', email: 'ines@example.com', rating: 5, title: 'Superbe découverte', comment: 'J’avais un doute sur l’alliage XP, mais la tenue est bluffante. Je recommande sans hésiter !', status: 'pending', verified: 1, helpful: 0, time: '-2 hours' },
        { author: 'Karim E.', email: 'karim@example.com', rating: 4, title: 'Qualité au rendez-vous', comment: 'Design moderne inspiré des motifs traditionnels. Livraison rapide en 48h.', status: 'pending', verified: 0, helpful: 0, time: '-1 hour' }
      ];

      products.forEach((p, pIdx) => {
        sampleReviews.forEach((sr, rIdx) => {
          seedStmt.run(
            p.id,
            sr.author,
            sr.email,
            sr.rating,
            sr.title,
            sr.comment,
            (pIdx === 0 && rIdx >= 3) ? 'pending' : (rIdx < 3 ? 'approved' : 'pending'),
            sr.verified,
            sr.helpful,
            sr.time
          );
        });
      });
      console.log('Successfully seeded demo product reviews');
    }
  }
} catch (error) {
  console.error('Migration error (reviews table):', error.message);
}

// Migration: Add images column to reviews table for customer photo uploads
try {
  db.exec('ALTER TABLE reviews ADD COLUMN images TEXT;');
  console.log('Successfully added images column to reviews table');
} catch (error) {
  if (!error.message.includes('duplicate column name')) {
    console.error('Migration error (reviews images):', error.message);
  }
}

export default db;
