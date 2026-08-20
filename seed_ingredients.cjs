const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const ingredients = [
  { name: 'Sandalwood', icon: '/uploads/sandalwood_icon.png' },
  { name: 'Vanilla', icon: '/uploads/vanilla_icon.png' },
  { name: 'Bergamot', icon: '/uploads/bergamot_icon.png' },
  { name: 'Jasmine', icon: '/uploads/jasmine_icon.png' },
  { name: 'Cedarwood', icon: '/uploads/cedarwood_icon.png' },
  { name: 'Coconut', icon: '/uploads/coconut_icon.png' }
];

db.serialize(() => {
  const stmt = db.prepare('INSERT INTO ingredients (name, icon) VALUES (?, ?)');
  for (const ing of ingredients) {
    stmt.run(ing.name, ing.icon);
  }
  stmt.finalize(() => {
    console.log('Ingredients seeded successfully!');
    db.close();
  });
});
