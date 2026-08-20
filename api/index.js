import express from 'express';
import cors from 'cors';
import { createClient } from '@libsql/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json());

const TURSO_URL = process.env.TURSO_DATABASE_URL || "libsql://jewelry-db-ahmedtaboubi.aws-eu-west-1.turso.io";
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODcyNTQ3OTUsImlkIjoiMDFhMDIwYTktYmQwMS03ZjZiLWIyMjktMjBjMzQ3MmM1MTcwIiwia2lkIjoiQW5tcmtZYXNLRFdzLTlQTlJjMUhhQkw5V2loTkpXQ1FFZE5xWkhqdWNJbyIsInJpZCI6ImE0MzM0MzE4LTA5OTgtNDdiNi1iMTBhLTM1NTczNTc5YWJhZSJ9.4Wj7hzKYC4OnctQiAMJw7CoO-VKPzA8s7KfGq71JmI-AgUsBdM5An34eNZ3CcTURCIWbLev8sPA8RDmlfBiJCg";
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-development-key-parfum';

const turso = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN
});

// Middleware: Authenticate Token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// 1. GET /api/products
app.get('/api/products', async (req, res) => {
  try {
    const result = await turso.execute('SELECT * FROM products ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// 2. GET /api/products/:id
app.get('/api/products/:id', async (req, res) => {
  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM products WHERE id = ?',
      args: [req.params.id]
    });
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// 3. GET /api/products/search
app.get('/api/products/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const pattern = `%${query}%`;
    const result = await turso.execute({
      sql: `SELECT * FROM products 
            WHERE name LIKE ? OR category LIKE ? OR notes LIKE ? OR inspiredBy LIKE ? 
            ORDER BY id ASC`,
      args: [pattern, pattern, pattern, pattern]
    });
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

// 4. POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const existing = await turso.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email.toLowerCase()]
    });
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await turso.execute({
      sql: 'INSERT INTO users (name, email, phone, password, is_admin) VALUES (?, ?, ?, ?, 0)',
      args: [name, email.toLowerCase(), phone || '', hashedPassword]
    });

    const user = {
      id: Number(result.lastInsertRowid),
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      is_admin: 0
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ message: 'User registered successfully', token, user });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// 5. POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email.toLowerCase()]
    });
    const userRow = result.rows[0];

    if (!userRow) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, userRow.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      phone: userRow.phone || '',
      address: userRow.address || '',
      city: userRow.city || '',
      zipCode: userRow.zipCode || '',
      is_admin: userRow.is_admin ? 1 : 0
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token, user });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 6. PUT /api/users/:id
app.put('/api/users/:id', verifyToken, async (req, res) => {
  try {
    const { name, phone, address, city, zipCode } = req.body;
    await turso.execute({
      sql: `UPDATE users SET name = ?, phone = ?, address = ?, city = ?, zipCode = ? WHERE id = ?`,
      args: [name, phone || '', address || '', city || '', zipCode || '', req.params.id]
    });

    const result = await turso.execute({
      sql: 'SELECT id, name, email, phone, address, city, zipCode, is_admin FROM users WHERE id = ?',
      args: [req.params.id]
    });

    res.json({ message: 'Profile updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 7. POST /api/orders
app.post('/api/orders', async (req, res) => {
  try {
    const { userId, total, subtotal, discountPercent, discountAmount, shippingCost, shippingDetails, items } = req.body;

    let resolvedUserId = null;
    if (userId) {
      const parsed = parseInt(userId, 10);
      if (!isNaN(parsed) && parsed > 0) resolvedUserId = parsed;
    }

    // Try extracting from auth header if userId was not directly provided
    if (!resolvedUserId) {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          if (decoded && decoded.id) resolvedUserId = parseInt(decoded.id, 10) || null;
        } catch (e) {}
      }
    }

    // Verify that resolvedUserId actually exists in the users table to prevent Foreign Key constraint errors
    if (resolvedUserId) {
      const userExists = await turso.execute({
        sql: 'SELECT id FROM users WHERE id = ?',
        args: [resolvedUserId]
      });
      if (userExists.rows.length === 0) {
        resolvedUserId = null;
      }
    }

    // If still null, check if shippingDetails has an email that matches an existing registered user
    if (!resolvedUserId && shippingDetails) {
      try {
        const parsedShipping = typeof shippingDetails === 'string' 
          ? JSON.parse(shippingDetails) 
          : shippingDetails;
        if (parsedShipping?.email) {
          const userByEmail = await turso.execute({
            sql: 'SELECT id FROM users WHERE LOWER(email) = LOWER(?)',
            args: [parsedShipping.email.trim()]
          });
          if (userByEmail.rows.length > 0) {
            resolvedUserId = userByEmail.rows[0].id;
          }
        }
      } catch (e) {}
    }

    const finalTotal = parseFloat(total) || 0;
    const finalSubtotal = parseFloat(subtotal) || finalTotal;
    const finalDiscountPercent = parseInt(discountPercent, 10) || 0;
    const finalDiscountAmount = parseFloat(discountAmount) || 0;
    const finalShippingCost = parseFloat(shippingCost) || 0;
    const shippingDetailsStr = typeof shippingDetails === 'string' 
      ? shippingDetails 
      : JSON.stringify(shippingDetails || {});
    const nowIso = new Date().toISOString();

    const orderResult = await turso.execute({
      sql: `INSERT INTO orders (user_id, total, subtotal, discount_percent, discount_amount, shipping_cost, shipping_details, status, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Processing', ?)`,
      args: [
        resolvedUserId, 
        finalTotal, 
        finalSubtotal, 
        finalDiscountPercent, 
        finalDiscountAmount, 
        finalShippingCost, 
        shippingDetailsStr,
        nowIso
      ]
    });

    const orderId = Number(orderResult.lastInsertRowid);

    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        await turso.execute({
          sql: `INSERT INTO order_items (order_id, product_name, product_image, quantity, price) VALUES (?, ?, ?, ?, ?)`,
          args: [
            orderId, 
            item.name || 'Jewelry Item', 
            item.image || '', 
            parseInt(item.quantity, 10) || 1, 
            parseFloat(item.price) || 0
          ]
        });

        // Decrement product stock if product id exists
        if (item.id) {
          try {
            await turso.execute({
              sql: 'UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?',
              args: [parseInt(item.quantity, 10) || 1, item.id]
            });
          } catch (e) {}
        }
      }
    }

    // --- DISCORD WEBHOOK INTEGRATION ---
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || "https://discord.com/api/webhooks/1537478820385525811/G67kdt8xvifiEGEZZypckGVn0ZYTYPxna_MDIyLX2lfOG4Ea0apt0tyyIQJpDoznfLFn";
    if (discordWebhookUrl) {
      try {
        let shipObj = {};
        try {
          shipObj = typeof shippingDetails === 'string' ? JSON.parse(shippingDetails) : (shippingDetails || {});
        } catch (e) {}

        const customerName = `${shipObj.firstName || ''} ${shipObj.lastName || ''}`.trim() || 'Guest Customer';
        const customerEmail = shipObj.email || 'N/A';
        const customerPhone = shipObj.phone || 'N/A';
        const itemsList = Array.isArray(items) 
          ? items.map(item => `- ${item.quantity || 1}x ${item.name || 'Jewelry Piece'}`).join('\n')
          : 'N/A';

        const discordMessage = {
          content: `🚨 **NEW ORDER RECEIVED** 🚨\n**Order ID:** #${orderId}\n**Customer:** ${customerName} (${customerEmail})\n**Phone:** ${customerPhone}\n**Total:** ${finalTotal.toFixed(2)} DH\n**Items:**\n${itemsList}`
        };

        fetch(discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discordMessage)
        }).catch(err => console.error('Failed to send Discord webhook:', err));
      } catch (err) {
        console.error('Discord webhook error:', err);
      }
    }

    res.status(201).json({ message: 'Order created successfully', orderId });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message || 'Failed to place order' });
  }
});

// 8. GET /api/orders/all
app.get('/api/orders/all', async (req, res) => {
  try {
    const ordersResult = await turso.execute(`
      SELECT orders.*, users.email as user_email, users.name as user_name, users.phone as user_phone
      FROM orders 
      LEFT JOIN users ON orders.user_id = users.id
      ORDER BY orders.created_at DESC
    `);
    const itemsResult = await turso.execute('SELECT * FROM order_items');

    const orders = ordersResult.rows.map(order => {
      let customerName = order.user_name || 'Guest Customer';
      let customerEmail = order.user_email || '';
      let customerPhone = order.user_phone || '';

      let parsedShipping = {};
      if (order.shipping_details) {
        try {
          parsedShipping = typeof order.shipping_details === 'string' 
            ? JSON.parse(order.shipping_details) 
            : order.shipping_details;
          const shipName = `${parsedShipping.firstName || ''} ${parsedShipping.lastName || ''}`.trim();
          if (shipName) customerName = shipName;
          if (parsedShipping.email) customerEmail = parsedShipping.email;
          if (parsedShipping.phone) customerPhone = parsedShipping.phone;
        } catch (e) {}
      }

      return {
        ...order,
        shipping_details: parsedShipping,
        user_name: customerName,
        user_email: customerEmail || (customerPhone ? `Tel: ${customerPhone}` : 'Guest Customer'),
        customer_phone: customerPhone,
        items: itemsResult.rows.filter(item => item.order_id === order.id)
      };
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// 9. GET /api/orders/:userId
app.get('/api/orders/:userId', async (req, res) => {
  try {
    const rawParam = req.params.userId || '';
    const parsedId = parseInt(rawParam, 10);
    const validUserId = isNaN(parsedId) ? -1 : parsedId;
    const emailParam = (req.query.email || (rawParam.includes('@') ? rawParam : '')).toLowerCase();

    let targetEmail = emailParam;
    if (!targetEmail && validUserId > 0) {
      const userRes = await turso.execute({
        sql: 'SELECT email FROM users WHERE id = ?',
        args: [validUserId]
      });
      targetEmail = (userRes.rows[0]?.email || '').toLowerCase();
    }

    let ordersResult;
    if (targetEmail) {
      const emailPattern = `%"email":"${targetEmail}"%`;
      ordersResult = await turso.execute({
        sql: 'SELECT * FROM orders WHERE user_id = ? OR shipping_details LIKE ? ORDER BY created_at DESC',
        args: [validUserId, emailPattern]
      });
    } else {
      ordersResult = await turso.execute({
        sql: 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
        args: [validUserId]
      });
    }

    const itemsResult = await turso.execute('SELECT * FROM order_items');

    const orders = ordersResult.rows.map(order => ({
      ...order,
      shipping_details: typeof order.shipping_details === 'string' ? JSON.parse(order.shipping_details || '{}') : order.shipping_details,
      items: itemsResult.rows.filter(item => item.order_id === order.id)
    }));

    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Failed to fetch user orders' });
  }
});

// 10. GET /api/ingredients
app.get('/api/ingredients', async (req, res) => {
  try {
    const result = await turso.execute('SELECT * FROM ingredients ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    res.json([]);
  }
});

// 11. GET /api/products/:id/reviews
app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const result = await turso.execute({
      sql: 'SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC',
      args: [req.params.id]
    });
    res.json(result.rows);
  } catch (error) {
    res.json([]);
  }
});

// 12. POST /api/reviews
app.post('/api/reviews', async (req, res) => {
  try {
    const { productId, author, rating, comment } = req.body;
    await turso.execute({
      sql: 'INSERT INTO reviews (product_id, author, rating, comment) VALUES (?, ?, ?, ?)',
      args: [productId, author || 'Anonymous', rating || 5, comment || '']
    });
    res.status(201).json({ message: 'Review submitted successfully' });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// 13. PUT /api/orders/:id/status
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await turso.execute({
      sql: 'UPDATE orders SET status = ? WHERE id = ?',
      args: [status, req.params.id]
    });
    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// 14. Product Management (Admin)
app.post('/api/products', async (req, res) => {
  try {
    const { name, inspiredBy, notes, price, image, isNew, category, details, stock, initial_stock } = req.body;
    const result = await turso.execute({
      sql: `INSERT INTO products (name, inspiredBy, notes, price, image, isNew, category, details, stock, initial_stock) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [name, inspiredBy || '', notes || '', price, image, isNew ? 1 : 0, category, details || '', stock || 50, initial_stock || 50]
    });
    res.status(201).json({ message: 'Product created', id: Number(result.lastInsertRowid) });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { name, inspiredBy, notes, price, image, isNew, category, details, stock, initial_stock } = req.body;
    await turso.execute({
      sql: `UPDATE products SET name = ?, inspiredBy = ?, notes = ?, price = ?, image = ?, isNew = ?, category = ?, details = ?, stock = ?, initial_stock = ? WHERE id = ?`,
      args: [name, inspiredBy || '', notes || '', price, image, isNew ? 1 : 0, category, details || '', stock || 50, initial_stock || 50, req.params.id]
    });
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.patch('/api/products/:id/stock', async (req, res) => {
  try {
    const { stock, initial_stock } = req.body;
    await turso.execute({
      sql: 'UPDATE products SET stock = ?, initial_stock = ? WHERE id = ?',
      args: [stock, initial_stock, req.params.id]
    });
    res.json({ message: 'Stock updated successfully' });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await turso.execute({
      sql: 'DELETE FROM products WHERE id = ?',
      args: [req.params.id]
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default app;
