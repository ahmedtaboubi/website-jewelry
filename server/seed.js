import db from './db.js';

const products = [
  { name: 'Zellij Geometric Ring', inspiredBy: 'Moroccan Architecture', notes: 'Stainless Steel 316L, Intricate Carving', price: '180.00', image: '/images/product_ring_white.jpg', isNew: 1, category: 'Rings' },
  { name: 'Medina XP Hoops', inspiredBy: 'Marrakech Souks', notes: 'XP Jewelry Alloy, Waterproof, Lightweight', price: '120.00', image: '/images/product_hoops_white.jpg', isNew: 0, category: 'Earrings' },
  { name: 'Atlas Cuff Bracelet', inspiredBy: 'Berber Heritage', notes: 'Stainless Steel 316L, Hand-Hammered', price: '250.00', image: '/images/product_cuff_white.jpg', isNew: 0, category: 'Bracelets' },
  { name: 'Sahara Pendant', inspiredBy: 'Desert Dunes', notes: 'XP Plating, Cubic Zirconia, Matte Finish', price: '145.00', image: '/images/product_pendant_white.jpg', isNew: 1, category: 'Necklaces' },
  { name: 'Oasis Drop Earrings', inspiredBy: 'Majorelle Gardens', notes: 'Lapis Lazuli, Stainless Steel, Zirconia', price: '190.00', image: '/images/product_earrings_white.jpg', isNew: 1, category: 'Earrings' },
  { name: 'Kasbah Signet Ring', inspiredBy: 'Ancient Doors', notes: 'Stainless Steel 316L, Zirconia Crystals', price: '320.00', image: '/images/product_signet_white.jpg', isNew: 0, category: 'Rings' },
  { name: 'bassma', inspiredBy: 'Arabic Calligraphy', notes: '18k Gold Plated, Custom Nameplate', price: '150.00', image: '/images/product_bassma_white.jpg', isNew: 0, category: 'Necklaces' },
];

console.log('Seeding database with jewelry...');

const insert = db.prepare(`
  INSERT INTO products (name, inspiredBy, notes, price, image, isNew, category)
  VALUES (@name, @inspiredBy, @notes, @price, @image, @isNew, @category)
`);

const count = db.prepare('SELECT COUNT(*) as count FROM products').get();

if (count.count === 0) {
  const insertMany = db.transaction((products) => {
    for (const product of products) {
      insert.run(product);
    }
  });

  insertMany(products);
  console.log('Successfully seeded database with jewelry products!');
} else {
  console.log('Database already contains products. Skipping seed.');
}
