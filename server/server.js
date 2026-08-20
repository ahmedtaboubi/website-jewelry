import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import db from './db.js';
import multer from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import crypto from 'crypto';
import { sendWelcomeEmail, sendPasswordResetEmail, sendOrderConfirmationEmail } from './mailer.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-development-key-parfum';

const app = express();
const PORT = process.env.PORT || 3000;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max for admin assets
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and GIF images are allowed.'));
    }
  }
});

// Strict Customer Review Photo Upload (Blocks SVG to eliminate Stored XSS vectors)
const reviewPhotoUpload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per photo
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only JPG, PNG, and WEBP images are allowed (SVG and scripts are strictly blocked).'));
    }
  }
});

// Security Middleware
app.use(helmet()); // Sets secure HTTP headers
app.use(cors()); // Enable CORS for frontend requests
app.use(express.json());

// Rate Limiters to prevent abuse (DDoS & Spam protection)
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 30, // Limit each IP to 30 search requests per `window`
  message: { error: 'Too many search requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10, // Limit each IP to 10 auth requests per `window`
  message: { error: 'Too many login/reset attempts from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 20, // Max 20 photo uploads per IP per 15 min
  message: { error: 'Upload limit reached. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const reviewSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 15, // Max 15 review submissions per IP per hour
  message: { error: 'Review submission limit reached. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);

// Helper function to synchronize and persist real-world product inventory
const syncProductInventory = () => {
  try {
    const products = db.prepare('SELECT id, initial_stock, stock FROM products').all();
    const updateStmt = db.prepare('UPDATE products SET stock = ? WHERE id = ?');
    
    for (const p of products) {
      const baseStock = p.initial_stock !== null && p.initial_stock !== undefined ? p.initial_stock : (p.stock !== null ? p.stock : 50);
      const metrics = db.prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN o.status IN ('Shipped', 'Delivered') THEN oi.quantity ELSE 0 END), 0) AS sold,
          COALESCE(SUM(CASE WHEN o.status = 'Processing' THEN oi.quantity ELSE 0 END), 0) AS reserved
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE (oi.product_id = ? OR oi.product_name = (SELECT name FROM products WHERE id = ?))
        AND o.status != 'Cancelled'
      `).get(p.id, p.id);

      const availableStock = Math.max(0, baseStock - (metrics.sold + metrics.reserved));
      updateStmt.run(availableStock, p.id);
    }
  } catch (err) {
    console.error('Error syncing inventory:', err);
  }
};

// Initial sync on boot
syncProductInventory();

// API Routes

// Get all products with dynamic real-world stock, sold counts, and reserved counts
app.get('/api/products', (req, res) => {
  try {
    const products = db.prepare(`
      SELECT p.*,
        COALESCE((
          SELECT SUM(oi.quantity) 
          FROM order_items oi 
          JOIN orders o ON oi.order_id = o.id 
          WHERE (oi.product_id = p.id OR oi.product_name = p.name) 
          AND o.status IN ('Shipped', 'Delivered')
        ), 0) AS units_sold,
        COALESCE((
          SELECT SUM(oi.quantity) 
          FROM order_items oi 
          JOIN orders o ON oi.order_id = o.id 
          WHERE (oi.product_id = p.id OR oi.product_name = p.name) 
          AND o.status = 'Processing'
        ), 0) AS units_reserved
      FROM products p
    `).all();

    const enriched = products.map(p => {
      const baseStock = p.initial_stock !== null && p.initial_stock !== undefined ? p.initial_stock : (p.stock !== null ? p.stock : 50);
      const availableStock = Math.max(0, baseStock - (p.units_sold + p.units_reserved));
      return {
        ...p,
        initial_stock: baseStock,
        stock: availableStock,
        units_sold: p.units_sold,
        units_reserved: p.units_reserved
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product by id with real-world stock metrics
app.get('/api/products/:id', (req, res) => {
  try {
    const product = db.prepare(`
      SELECT p.*,
        COALESCE((
          SELECT SUM(oi.quantity) 
          FROM order_items oi 
          JOIN orders o ON oi.order_id = o.id 
          WHERE (oi.product_id = p.id OR oi.product_name = p.name) 
          AND o.status IN ('Shipped', 'Delivered')
        ), 0) AS units_sold,
        COALESCE((
          SELECT SUM(oi.quantity) 
          FROM order_items oi 
          JOIN orders o ON oi.order_id = o.id 
          WHERE (oi.product_id = p.id OR oi.product_name = p.name) 
          AND o.status = 'Processing'
        ), 0) AS units_reserved
      FROM products p 
      WHERE p.id = ?
    `).get(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const baseStock = product.initial_stock !== null && product.initial_stock !== undefined ? product.initial_stock : (product.stock !== null ? product.stock : 50);
    const availableStock = Math.max(0, baseStock - (product.units_sold + product.units_reserved));

    res.json({
      ...product,
      initial_stock: baseStock,
      stock: availableStock,
      units_sold: product.units_sold,
      units_reserved: product.units_reserved
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Secure Search endpoint using Parameterized Queries to prevent SQL injection
app.get('/api/products/search', searchLimiter, (req, res) => {
  try {
    let { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.json([]); // Return empty if no valid query
    }

    q = q.trim();
    if (q.length === 0) {
      return res.json([]);
    }

    const stmt = db.prepare(`
      SELECT p.*,
        COALESCE((
          SELECT SUM(oi.quantity) 
          FROM order_items oi 
          JOIN orders o ON oi.order_id = o.id 
          WHERE (oi.product_id = p.id OR oi.product_name = p.name) 
          AND o.status IN ('Shipped', 'Delivered')
        ), 0) AS units_sold,
        COALESCE((
          SELECT SUM(oi.quantity) 
          FROM order_items oi 
          JOIN orders o ON oi.order_id = o.id 
          WHERE (oi.product_id = p.id OR oi.product_name = p.name) 
          AND o.status = 'Processing'
        ), 0) AS units_reserved
      FROM products p
      WHERE p.name LIKE @query 
      OR p.notes LIKE @query 
      OR p.category LIKE @query 
      OR p.inspiredBy LIKE @query
    `);
    
    const results = stmt.all({ query: `%${q}%` });
    const enriched = results.map(p => {
      const baseStock = p.initial_stock !== null && p.initial_stock !== undefined ? p.initial_stock : (p.stock !== null ? p.stock : 50);
      const availableStock = Math.max(0, baseStock - (p.units_sold + p.units_reserved));
      return {
        ...p,
        initial_stock: baseStock,
        stock: availableStock,
        units_sold: p.units_sold,
        units_reserved: p.units_reserved
      };
    });
    
    res.json(enriched);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

import bcrypt from 'bcrypt';

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const insert = db.prepare('INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)');
    const result = insert.run(name, email, phone || null, hashedPassword);
    
    const user = { id: result.lastInsertRowid, name, email, phone, address: null, city: null, zipCode: null, is_admin: 0 };
    const token = jwt.sign({ id: user.id, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      message: 'User created successfully',
      token,
      user
    });
    
    // Send welcome email asynchronously
    sendWelcomeEmail(user).catch(err => console.error('Failed to send welcome email', err));
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to optionally authenticate User (allows guests)
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    }
  } catch (error) {
    // Ignore error for guests
  }
  next();
};

// Middleware to verify User
const verifyUser = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Middleware to verify Admin
const verifyAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(403).json({ error: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.is_admin !== 1) {
      return res.status(403).json({ error: 'Access denied. Unauthorized.' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Logged in successfully',
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        phone: user.phone,
        address: user.address,
        city: user.city,
        zipCode: user.zipCode,
        is_admin: user.is_admin 
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return res.json({ message: 'If that email exists, a reset link has been generated.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

    const stmt = db.prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?');
    stmt.run(resetToken, expiry, user.id);

    // Send password reset email asynchronously
    sendPasswordResetEmail(user, resetToken).catch(err => console.error('Failed to send reset email', err));

    res.json({ 
      message: 'If that email exists, a reset link has been generated.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const user = db.prepare('SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > ?').get(token, new Date().toISOString());
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const stmt = db.prepare('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?');
    stmt.run(hashedPassword, user.id);

    res.json({ message: 'Password has been successfully reset' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
app.put('/api/users/:id', verifyUser, (req, res) => {
  try {
    const userId = req.params.id;
    // Check if the user updating the profile is the same as the authenticated user (or an admin)
    if (req.user.id !== parseInt(userId) && req.user.is_admin !== 1) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { name, phone, address, city, zipCode } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const stmt = db.prepare('UPDATE users SET name = ?, phone = ?, address = ?, city = ?, zipCode = ? WHERE id = ?');
    const result = stmt.run(name, phone || null, address || null, city || null, zipCode || null, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    res.json({
      message: 'Profile updated successfully',
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        phone: user.phone,
        address: user.address,
        city: user.city,
        zipCode: user.zipCode,
        is_admin: user.is_admin 
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new order (Supports registered users and guest checkout)
app.post('/api/orders', optionalAuth, (req, res) => {
  try {
    const { userId, discountPercent, items, shippingDetails, shippingCost } = req.body;
    
    // Resolve user ID strictly if user is actively authenticated
    let resolvedUserId = null;
    if (req.user && req.user.id) {
      resolvedUserId = req.user.id;
    }
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain items' });
    }

    // Backend price recalculation & stock validation
    let serverSubtotal = 0;
    const validatedItems = [];
    const getProduct = db.prepare('SELECT id, name, price, image, stock FROM products WHERE id = ?');

    for (const item of items) {
      if (!item.id) return res.status(400).json({ error: 'Product ID is required' });
      
      const product = getProduct.get(item.id);
      if (!product) return res.status(400).json({ error: `Product ID ${item.id} not found` });
      
      const requestedQty = parseInt(item.quantity) || 1;
      if (product.stock !== null && product.stock !== undefined && product.stock < requestedQty) {
        return res.status(400).json({ 
          error: product.stock === 0 
            ? `Sorry, "${product.name}" is currently out of stock.` 
            : `Sorry, "${product.name}" only has ${product.stock} unit(s) remaining in stock.` 
        });
      }

      const itemPrice = parseFloat(product.price.toString().replace(/[^0-9.]/g, '')) || 0;
      serverSubtotal += itemPrice * requestedQty;
      
      // Trust server data completely for price, name, and image
      validatedItems.push({ 
        id: product.id,
        name: product.name,
        image: product.image,
        quantity: requestedQty,
        price: itemPrice 
      });
    }

    const appliedDiscountPercent = discountPercent || 0;
    const discountAmount = serverSubtotal * (appliedDiscountPercent / 100);
    const finalShippingCost = shippingCost || 0;
    const finalTotal = serverSubtotal - discountAmount + finalShippingCost;

    const shippingDetailsJson = shippingDetails ? JSON.stringify(shippingDetails) : null;
    const nowIso = new Date().toISOString();

    const createOrder = db.transaction(() => {
      const orderStmt = db.prepare('INSERT INTO orders (user_id, total, subtotal, discount_percent, discount_amount, shipping_details, shipping_cost, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
      const orderInfo = orderStmt.run(resolvedUserId, finalTotal, serverSubtotal, appliedDiscountPercent, discountAmount, shippingDetailsJson, finalShippingCost, nowIso);
      const orderId = orderInfo.lastInsertRowid;

      const itemStmt = db.prepare('INSERT INTO order_items (order_id, product_id, product_name, product_image, quantity, price) VALUES (?, ?, ?, ?, ?, ?)');
      
      for (const item of validatedItems) {
        itemStmt.run(orderId, item.id, item.name, item.image, item.quantity, item.price);
      }
      
      return orderId;
    });

    const newOrderId = createOrder();
    syncProductInventory();

    // Find customer info from user table or shippingDetails
    let customerName = 'Guest Customer';
    let customerEmail = shippingDetails?.email || '';
    let customerPhone = shippingDetails?.phone || '';

    if (resolvedUserId) {
      const user = db.prepare('SELECT name, email, phone FROM users WHERE id = ?').get(resolvedUserId);
      if (user) {
        customerName = user.name;
        customerEmail = user.email;
        customerPhone = user.phone || customerPhone;
      }
    } else if (shippingDetails) {
      customerName = `${shippingDetails.firstName || ''} ${shippingDetails.lastName || ''}`.trim() || 'Guest Customer';
    }

    // --- DISCORD WEBHOOK INTEGRATION ---
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (discordWebhookUrl) {
      const itemsList = validatedItems.map(item => `- ${item.quantity}x ${item.name}`).join('\n');
      
      const discordMessage = {
        content: `🚨 **NEW ORDER RECEIVED** 🚨\n**Order ID:** #${newOrderId}\n**Customer:** ${customerName} (${customerEmail})\n**Phone:** ${customerPhone || 'N/A'}\n**Total:** ${finalTotal.toFixed(2)} DH\n**Items:** \n${itemsList}`
      };

      fetch(discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discordMessage)
      }).catch(err => console.error('Failed to send Discord webhook:', err));
    }
    
    if (customerEmail) {
      sendOrderConfirmationEmail({ name: customerName, email: customerEmail }, newOrderId, finalTotal, validatedItems).catch(err => console.error('Failed to send order email', err));
    }
    // -----------------------------------

    res.status(201).json({ success: true, orderId: newOrderId });
  } catch (error) {
    console.error('Failed to create order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ================= ADMIN ROUTES ================= //

// Get all ingredients (Public - since storefront needs it, or just admin? Storefront might need it later, but for now admin only or public is fine. Let's make it public for simplicity if we ever want to show a glossary)
app.get('/api/ingredients', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM ingredients ORDER BY name ASC');
    const ingredients = stmt.all();
    res.json(ingredients);
  } catch (error) {
    console.error('Fetch ingredients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new ingredient (Admin)
app.post('/api/ingredients', verifyAdmin, (req, res) => {
  try {
    const { name, icon } = req.body;
    if (!name || !icon) return res.status(400).json({ error: 'Name and icon required' });
    
    const stmt = db.prepare('INSERT INTO ingredients (name, icon) VALUES (?, ?)');
    const info = stmt.run(name, icon);
    
    res.status(201).json({ id: info.lastInsertRowid, message: 'Ingredient created successfully' });
  } catch (error) {
    console.error('Create ingredient error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete ingredient (Admin)
app.delete('/api/ingredients/:id', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM ingredients WHERE id = ?');
    const info = stmt.run(id);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    
    res.json({ message: 'Ingredient deleted successfully' });
  } catch (error) {
    console.error('Delete ingredient error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload product image (Admin)
app.post('/api/upload', verifyAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    // Return the URL path to the uploaded image
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const formatIsoTimestamp = (ts) => {
  if (!ts) return new Date().toISOString();
  if (typeof ts === 'string') {
    if (ts.includes('T') && ts.endsWith('Z')) return ts;
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(ts)) {
      return ts.replace(' ', 'T') + 'Z';
    }
  }
  return new Date(ts).toISOString();
};

// Get all orders (Admin)
app.get('/api/orders/all', verifyAdmin, (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT orders.*, users.email as user_email, users.name as user_name 
      FROM orders 
      LEFT JOIN users ON orders.user_id = users.id
      ORDER BY orders.created_at DESC
    `);
    const orders = stmt.all();

    // Fetch items for each order and populate customer details from shipping_details
    const itemStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const enrichedOrders = orders.map(order => {
      const items = itemStmt.all(order.id);
      let customerName = order.user_name || 'Guest Customer';
      let customerEmail = order.user_email || '';
      let customerPhone = '';

      if (order.shipping_details) {
        try {
          const ship = JSON.parse(order.shipping_details);
          const shipName = `${ship.firstName || ''} ${ship.lastName || ''}`.trim();
          if (shipName) customerName = shipName;
          if (ship.email) customerEmail = ship.email;
          if (ship.phone) customerPhone = ship.phone;
        } catch(e) {}
      }

      return { 
        ...order, 
        created_at: formatIsoTimestamp(order.created_at),
        user_name: customerName,
        user_email: customerEmail || (customerPhone ? `Tel: ${customerPhone}` : 'Guest Customer'),
        customer_phone: customerPhone,
        items 
      };
    });

    res.json(enrichedOrders);
  } catch (error) {
    console.error('Fetch all orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get orders for a user
app.get('/api/orders/:userId', verifyUser, (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.id !== parseInt(userId) && req.user.is_admin !== 1) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Fetch orders
    const ordersStmt = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC');
    const orders = ordersStmt.all(userId);

    // For each order, fetch items
    const itemStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const enrichedOrders = orders.map(order => {
      const items = itemStmt.all(order.id);
      return { 
        ...order, 
        created_at: formatIsoTimestamp(order.created_at),
        items 
      };
    });

    res.json(enrichedOrders);
  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status (Admin) - Synchronizes real-world inventory (Shipped, Delivered, Cancelled)
app.put('/api/orders/:id/status', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const currentOrder = db.prepare('SELECT status FROM orders WHERE id = ?').get(id);
    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
    syncProductInventory();

    res.json({ message: `Order #${id} status updated to "${status}" and inventory updated successfully` });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new product (Admin)
app.post('/api/products', verifyAdmin, (req, res) => {
  try {
    const { name, inspiredBy, notes, price, image, isNew, category, details, stock } = req.body;
    
    const isNewInt = isNew ? 1 : 0;
    const stockQty = stock !== undefined && stock !== null && stock !== '' ? parseInt(stock) : 50;
    
    const stmt = db.prepare(`
      INSERT INTO products (name, inspiredBy, notes, price, image, isNew, category, details, initial_stock, stock) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(name, inspiredBy, notes, price, image, isNewInt, category, details ? JSON.stringify(details) : null, stockQty, stockQty);
    syncProductInventory();
    
    res.status(201).json({ id: info.lastInsertRowid, message: 'Product created successfully' });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product (Admin)
app.put('/api/products/:id', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { name, inspiredBy, notes, price, image, isNew, category, details, stock } = req.body;
    
    const isNewInt = isNew ? 1 : 0;
    const stockQty = stock !== undefined && stock !== null && stock !== '' ? parseInt(stock) : 50;

    const currentMetrics = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN o.status IN ('Shipped', 'Delivered') THEN oi.quantity ELSE 0 END), 0) AS sold,
        COALESCE(SUM(CASE WHEN o.status = 'Processing' THEN oi.quantity ELSE 0 END), 0) AS reserved
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE (oi.product_id = ? OR oi.product_name = (SELECT name FROM products WHERE id = ?))
      AND o.status != 'Cancelled'
    `).get(id, id);

    const initialStock = stockQty;
    const availableStock = Math.max(0, initialStock - (currentMetrics.sold + currentMetrics.reserved));
    
    const stmt = db.prepare(`
      UPDATE products 
      SET name = ?, inspiredBy = ?, notes = ?, price = ?, image = ?, isNew = ?, category = ?, details = ?, initial_stock = ?, stock = ?
      WHERE id = ?
    `);
    
    const info = stmt.run(name, inspiredBy, notes, price, image, isNewInt, category, details ? JSON.stringify(details) : null, initialStock, availableStock, id);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    syncProductInventory();
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Quick Stock Update (Admin)
app.patch('/api/products/:id/stock', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    const stockNum = parseInt(stock);
    if (isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({ error: 'Valid stock quantity is required' });
    }

    const currentMetrics = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN o.status IN ('Shipped', 'Delivered') THEN oi.quantity ELSE 0 END), 0) AS sold,
        COALESCE(SUM(CASE WHEN o.status = 'Processing' THEN oi.quantity ELSE 0 END), 0) AS reserved
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE (oi.product_id = ? OR oi.product_name = (SELECT name FROM products WHERE id = ?))
      AND o.status != 'Cancelled'
    `).get(id, id);
    
    const newInitial = stockNum + (currentMetrics.sold + currentMetrics.reserved);
    const info = db.prepare('UPDATE products SET initial_stock = ?, stock = ? WHERE id = ?').run(newInitial, stockNum, id);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    syncProductInventory();
    res.json({ success: true, stock: stockNum });
  } catch (error) {
    console.error('Quick stock update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product (Admin)
app.delete('/api/products/:id', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    syncProductInventory();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- AD SPEND TRACKING ENDPOINTS (Admin) ---
// Get all ad spend records
app.get('/api/ad-spend', verifyAdmin, (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM ad_spends ORDER BY date DESC, id DESC');
    const records = stmt.all();
    res.json(records);
  } catch (error) {
    console.error('Fetch ad spend error:', error);
    res.status(500).json({ error: 'Failed to fetch ad spend records' });
  }
});

// Add or log an ad spend entry
app.post('/api/ad-spend', verifyAdmin, (req, res) => {
  try {
    const { date, platform, amount, impressions, clicks, notes } = req.body;
    if (!date || !platform || amount === undefined || amount === null || amount === '') {
      return res.status(400).json({ error: 'Date, platform, and spend amount are required.' });
    }

    const cleanAmount = typeof amount === 'number' ? amount : parseFloat(amount.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(cleanAmount) || cleanAmount < 0) {
      return res.status(400).json({ error: 'Please enter a valid positive spend amount.' });
    }

    const cleanImpressions = impressions ? parseInt(impressions.toString().replace(/[^0-9]/g, '')) || 0 : 0;
    const cleanClicks = clicks ? parseInt(clicks.toString().replace(/[^0-9]/g, '')) || 0 : 0;
    const cleanNotes = (notes || '').toString().trim();
    const cleanDate = (date || new Date().toISOString().split('T')[0]).toString().trim();
    const cleanPlatform = (platform || 'Meta Ads').toString().trim();

    const stmt = db.prepare(`
      INSERT INTO ad_spends (date, platform, amount, impressions, clicks, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      cleanDate,
      cleanPlatform,
      cleanAmount,
      cleanImpressions,
      cleanClicks,
      cleanNotes,
      new Date().toISOString()
    );

    const newRecord = db.prepare('SELECT * FROM ad_spends WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Add ad spend error:', error);
    res.status(500).json({ error: 'Failed to save ad spend record: ' + error.message });
  }
});

// Update an ad spend record
app.put('/api/ad-spend/:id', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { date, platform, amount, impressions, clicks, notes } = req.body;
    if (!date || !platform || amount === undefined || amount === null || amount === '') {
      return res.status(400).json({ error: 'Date, platform, and spend amount are required.' });
    }

    const cleanAmount = typeof amount === 'number' ? amount : parseFloat(amount.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(cleanAmount) || cleanAmount < 0) {
      return res.status(400).json({ error: 'Please enter a valid positive spend amount.' });
    }

    const cleanImpressions = impressions ? parseInt(impressions.toString().replace(/[^0-9]/g, '')) || 0 : 0;
    const cleanClicks = clicks ? parseInt(clicks.toString().replace(/[^0-9]/g, '')) || 0 : 0;
    const cleanNotes = (notes || '').toString().trim();
    const cleanDate = (date || new Date().toISOString().split('T')[0]).toString().trim();
    const cleanPlatform = (platform || 'Meta Ads').toString().trim();

    const stmt = db.prepare(`
      UPDATE ad_spends 
      SET date = ?, platform = ?, amount = ?, impressions = ?, clicks = ?, notes = ?
      WHERE id = ?
    `);

    const result = stmt.run(cleanDate, cleanPlatform, cleanAmount, cleanImpressions, cleanClicks, cleanNotes, id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Record not found.' });
    }

    const updatedRecord = db.prepare('SELECT * FROM ad_spends WHERE id = ?').get(id);
    res.json(updatedRecord);
  } catch (error) {
    console.error('Update ad spend error:', error);
    res.status(500).json({ error: 'Failed to update ad spend record: ' + error.message });
  }
});

// Delete an ad spend record
app.delete('/api/ad-spend/:id', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const info = db.prepare('DELETE FROM ad_spends WHERE id = ?').run(id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ message: 'Ad spend record deleted successfully' });
  } catch (error) {
    console.error('Delete ad spend error:', error);
    res.status(500).json({ error: 'Failed to delete ad spend record' });
  }
});

// --- REVIEWS & RATINGS API ENDPOINTS ---

// Public: Upload customer review photos (Max 4 images, 10MB each, JPG/PNG/WEBP only, rate limited)
app.post('/api/reviews/upload', uploadLimiter, (req, res) => {
  reviewPhotoUpload.array('images', 4)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files uploaded.' });
    }
    const fileUrls = req.files.map(f => `/uploads/${f.filename}`);
    res.json({ imageUrls: fileUrls });
  });
});

// Public: Submit a customer review (Defaults to 'pending' moderation status, rate limited)
app.post('/api/reviews', reviewSubmitLimiter, (req, res) => {
  try {
    const { productId, authorName, authorEmail, rating, title, comment, userId, images } = req.body;
    
    if (!productId || !authorName || !comment || !rating) {
      return res.status(400).json({ error: 'Product, author name, star rating, and review text are required.' });
    }

    const numericRating = parseInt(rating, 10);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5 stars.' });
    }

    const cleanAuthor = authorName.toString().trim();
    const cleanComment = comment.toString().trim();
    const cleanTitle = (title || '').toString().trim();
    const cleanEmail = (authorEmail || '').toString().trim().toLowerCase();
    const cleanProductId = parseInt(productId, 10);
    const cleanUserId = userId ? parseInt(userId, 10) : null;
    const cleanImages = Array.isArray(images) && images.length > 0 
      ? JSON.stringify(images) 
      : (typeof images === 'string' && images.startsWith('[') ? images : null);

    if (cleanAuthor.length < 2) {
      return res.status(400).json({ error: 'Please provide a valid name (at least 2 characters).' });
    }
    if (cleanComment.length < 3) {
      return res.status(400).json({ error: 'Please write a review comment (at least 3 characters).' });
    }

    // Check if the product exists
    const product = db.prepare('SELECT id, name FROM products WHERE id = ?').get(cleanProductId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Determine verified purchase status
    let verifiedPurchase = 0;
    try {
      let orderCheck = null;
      if (cleanUserId && cleanEmail) {
        orderCheck = db.prepare(`
          SELECT COUNT(*) as count 
          FROM order_items oi 
          JOIN orders o ON oi.order_id = o.id 
          WHERE (o.user_id = ? OR LOWER(json_extract(o.shipping_details, '$.email')) = ?) 
          AND (oi.product_id = ? OR LOWER(oi.product_name) = LOWER(?))
          AND o.status != 'Cancelled'
        `).get(cleanUserId, cleanEmail, cleanProductId, product.name);
      } else if (cleanUserId) {
        orderCheck = db.prepare(`
          SELECT COUNT(*) as count 
          FROM order_items oi 
          JOIN orders o ON oi.order_id = o.id 
          WHERE o.user_id = ? 
          AND (oi.product_id = ? OR LOWER(oi.product_name) = LOWER(?))
          AND o.status != 'Cancelled'
        `).get(cleanUserId, cleanProductId, product.name);
      } else if (cleanEmail) {
        orderCheck = db.prepare(`
          SELECT COUNT(*) as count 
          FROM order_items oi 
          JOIN orders o ON oi.order_id = o.id 
          WHERE LOWER(json_extract(o.shipping_details, '$.email')) = ? 
          AND (oi.product_id = ? OR LOWER(oi.product_name) = LOWER(?))
          AND o.status != 'Cancelled'
        `).get(cleanEmail, cleanProductId, product.name);
      }
      if (orderCheck && orderCheck.count > 0) {
        verifiedPurchase = 1;
      }
    } catch (err) {
      console.error('Error checking verified purchase:', err);
    }

    const insertStmt = db.prepare(`
      INSERT INTO reviews (
        product_id, user_id, author_name, author_email, rating, title, comment, status, verified_purchase, helpful_count, images
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, 0, ?)
    `);

    const info = insertStmt.run(
      cleanProductId,
      cleanUserId,
      cleanAuthor,
      cleanEmail,
      numericRating,
      cleanTitle,
      cleanComment,
      verifiedPurchase,
      cleanImages
    );

    const createdReview = db.prepare('SELECT * FROM reviews WHERE id = ?').get(info.lastInsertRowid);

    res.status(201).json({
      message: 'Review submitted successfully and is pending admin moderation.',
      review: createdReview
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: 'Failed to submit review.' });
  }
});

// Public: Get approved reviews and rating stats for a specific product
app.get('/api/products/:id/reviews', (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const approvedReviews = db.prepare(`
      SELECT r.*, u.name as user_display_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = ? AND r.status = 'approved'
      ORDER BY r.created_at DESC
    `).all(productId);

    const totalReviews = approvedReviews.length;
    let averageRating = 0;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (totalReviews > 0) {
      const sum = approvedReviews.reduce((acc, curr) => {
        const star = Math.min(5, Math.max(1, curr.rating));
        distribution[star] = (distribution[star] || 0) + 1;
        return acc + curr.rating;
      }, 0);
      averageRating = Number((sum / totalReviews).toFixed(1));
    }

    res.json({
      reviews: approvedReviews,
      stats: {
        totalReviews,
        averageRating,
        distribution
      }
    });
  } catch (error) {
    console.error('Fetch product reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

// Public: Upvote helpful review count
app.post('/api/reviews/:id/helpful', (req, res) => {
  try {
    const reviewId = parseInt(req.params.id, 10);
    if (isNaN(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }

    const review = db.prepare('SELECT * FROM reviews WHERE id = ? AND status = \'approved\'').get(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found or not approved.' });
    }

    db.prepare('UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?').run(reviewId);
    const updated = db.prepare('SELECT * FROM reviews WHERE id = ?').get(reviewId);
    res.json(updated);
  } catch (error) {
    console.error('Helpful review error:', error);
    res.status(500).json({ error: 'Failed to mark review as helpful.' });
  }
});

// Admin: Get all reviews with status filter, search, and metadata
app.get('/api/admin/reviews', verifyAdmin, (req, res) => {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT r.*, p.name as product_name, p.image as product_image, p.price as product_price
      FROM reviews r
      LEFT JOIN products p ON r.product_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ' AND r.status = ?';
      params.push(status);
    }

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      query += ' AND (r.author_name LIKE ? OR r.author_email LIKE ? OR r.comment LIKE ? OR r.title LIKE ? OR p.name LIKE ?)';
      params.push(s, s, s, s, s);
    }

    query += ' ORDER BY CASE WHEN r.status = \'pending\' THEN 0 ELSE 1 END, r.created_at DESC';

    const reviews = db.prepare(query).all(...params);

    const counts = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM reviews
    `).get();

    res.json({
      reviews,
      counts: {
        total: counts.total || 0,
        pending: counts.pending || 0,
        approved: counts.approved || 0,
        rejected: counts.rejected || 0
      }
    });
  } catch (error) {
    console.error('Admin fetch reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews for admin.' });
  }
});

// Admin: Moderate review status (Approve / Reject / Pending)
app.put('/api/admin/reviews/:id/status', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be approved, rejected, or pending.' });
    }

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(status, id);
    const updated = db.prepare(`
      SELECT r.*, p.name as product_name, p.image as product_image 
      FROM reviews r 
      LEFT JOIN products p ON r.product_id = p.id 
      WHERE r.id = ?
    `).get(id);

    res.json({
      message: `Review successfully marked as ${status}.`,
      review: updated
    });
  } catch (error) {
    console.error('Moderate review error:', error);
    res.status(500).json({ error: 'Failed to moderate review status.' });
  }
});

// Admin: Delete review permanently
app.delete('/api/admin/reviews/:id', verifyAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Review not found.' });
    }
    res.json({ message: 'Review deleted successfully.' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review.' });
  }
});

// --- ADMIN TEAM MANAGEMENT ENDPOINTS ---

// Admin: Get all administrators
app.get('/api/admin/team', verifyAdmin, (req, res) => {
  try {
    const admins = db.prepare(`
      SELECT id, name, email, phone, is_admin, created_at
      FROM users
      WHERE is_admin = 1
      ORDER BY id ASC
    `).all();
    res.json({ admins, currentAdminId: req.user.id });
  } catch (error) {
    console.error('Fetch admin team error:', error);
    res.status(500).json({ error: 'Failed to fetch admin team list.' });
  }
});

// Admin: Create or promote a user to Admin
app.post('/api/admin/team/create', verifyAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanName = name.toString().trim();
    const cleanEmail = email.toString().trim().toLowerCase();

    if (cleanName.length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const existingUser = db.prepare('SELECT id, is_admin FROM users WHERE email = ?').get(cleanEmail);

    if (existingUser) {
      if (existingUser.is_admin === 1) {
        return res.status(400).json({ error: 'An admin account with this email already exists.' });
      }
      // Promote existing user
      db.prepare('UPDATE users SET is_admin = 1, name = ?, password = ? WHERE id = ?').run(cleanName, hashedPassword, existingUser.id);
      const updatedUser = db.prepare('SELECT id, name, email, phone, is_admin, created_at FROM users WHERE id = ?').get(existingUser.id);
      return res.status(200).json({
        message: `User ${cleanEmail} successfully promoted to Admin!`,
        admin: updatedUser
      });
    }

    // Insert new admin user
    const insertResult = db.prepare(`
      INSERT INTO users (name, email, password, is_admin)
      VALUES (?, ?, ?, 1)
    `).run(cleanName, cleanEmail, hashedPassword);

    const newAdmin = db.prepare('SELECT id, name, email, phone, is_admin, created_at FROM users WHERE id = ?').get(insertResult.lastInsertRowid);

    res.status(201).json({
      message: `Admin ${cleanName} created successfully!`,
      admin: newAdmin
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Failed to create new admin: ' + error.message });
  }
});

// Admin: Revoke Admin Rights (Demote to normal customer)
app.put('/api/admin/team/:id/revoke', verifyAdmin, (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    if (req.user.id === targetId) {
      return res.status(400).json({ error: 'You cannot revoke your own Super Admin access.' });
    }

    const targetUser = db.prepare('SELECT id, name, is_admin FROM users WHERE id = ?').get(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    db.prepare('UPDATE users SET is_admin = 0 WHERE id = ?').run(targetId);
    res.json({ message: `Admin privileges revoked for ${targetUser.name}.` });
  } catch (error) {
    console.error('Revoke admin error:', error);
    res.status(500).json({ error: 'Failed to revoke admin privileges.' });
  }
});

// Admin: Delete Admin account permanently
app.delete('/api/admin/team/:id', verifyAdmin, (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    if (req.user.id === targetId) {
      return res.status(400).json({ error: 'You cannot delete your own active Admin account.' });
    }

    const result = db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ message: 'Admin account deleted successfully.' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ error: 'Failed to delete admin.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Backend server securely running on http://localhost:${PORT}`);
});

