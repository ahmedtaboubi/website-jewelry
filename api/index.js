import express from 'express';
import cors from 'cors';
import { createClient } from '@libsql/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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
      is_admin: 0,
      role: 'customer',
      permissions: []
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

    let userPermissions = [];
    if (userRow.permissions) {
      try {
        userPermissions = typeof userRow.permissions === 'string' ? JSON.parse(userRow.permissions) : userRow.permissions;
      } catch (e) {
        userPermissions = [];
      }
    }

    let userRole = userRow.role || (userRow.is_admin ? 'admin' : 'customer');
    if (['ahmed.taboubi@hotmail.fr', 'admin@aura.com'].includes(userRow.email.toLowerCase())) {
      userRole = 'super_admin';
      userPermissions = ['orders', 'products', 'reviews', 'ingredients', 'analytics', 'marketing', 'team'];
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      phone: userRow.phone || '',
      address: userRow.address || '',
      city: userRow.city || '',
      zipCode: userRow.zipCode || '',
      is_admin: (userRow.is_admin || userRole === 'super_admin' || userRole === 'admin') ? 1 : 0,
      role: userRole,
      permissions: Array.isArray(userPermissions) ? userPermissions : []
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token, user });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5.1 GET /api/auth/me
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const result = await turso.execute({
      sql: 'SELECT id, name, email, phone, address, city, zipCode, is_admin, role, permissions FROM users WHERE id = ?',
      args: [req.user.id]
    });
    const userRow = result.rows[0];
    if (!userRow) return res.status(404).json({ error: 'User not found' });

    let userPermissions = [];
    if (userRow.permissions) {
      try {
        userPermissions = typeof userRow.permissions === 'string' ? JSON.parse(userRow.permissions) : userRow.permissions;
      } catch (e) {
        userPermissions = [];
      }
    }

    let userRole = userRow.role || (userRow.is_admin ? 'admin' : 'customer');
    if (['ahmed.taboubi@hotmail.fr', 'admin@aura.com'].includes(userRow.email.toLowerCase())) {
      userRole = 'super_admin';
      userPermissions = ['orders', 'products', 'reviews', 'ingredients', 'analytics', 'marketing', 'team'];
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      phone: userRow.phone || '',
      address: userRow.address || '',
      city: userRow.city || '',
      zipCode: userRow.zipCode || '',
      is_admin: (userRow.is_admin || userRole === 'super_admin' || userRole === 'admin') ? 1 : 0,
      role: userRole,
      permissions: Array.isArray(userPermissions) ? userPermissions : []
    };

    res.json({ user });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
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

// Email Sender Helper for Password Resets
const sendResetEmail = async (toEmail, userName, resetToken) => {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'Aura Jewelry <onboarding@resend.dev>';
  const resendApiKey = process.env.RESEND_API_KEY;

  const resetLink = `https://website-jewelry.vercel.app/reset-password?token=${resetToken}`;

  const emailHtml = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #eae6de; border-radius: 12px; background: #fafaf8; color: #141414;">
      <h2 style="font-family: Georgia, serif; color: #141414; margin-top: 0;">Reset Your Password</h2>
      <p style="font-size: 15px; line-height: 1.5; color: #444;">Hello ${userName || 'Valued Customer'},</p>
      <p style="font-size: 15px; line-height: 1.5; color: #444;">We received a request to reset the password for your Aura Jewelry account. Click the button below to set a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #141414; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 14px; display: inline-block; letter-spacing: 0.5px;">Reset My Password</a>
      </div>
      <p style="font-size: 13px; color: #666; line-height: 1.5;">Or copy and paste this link in your browser:<br/><a href="${resetLink}" style="color: #b89058;">${resetLink}</a></p>
      <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">This link is valid for 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
  `;

  // 1. If Resend API Key is provided
  if (resendApiKey) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: smtpFrom.includes('<') ? smtpFrom : `Aura Jewelry <${smtpFrom}>`,
          to: [toEmail],
          subject: 'Reset Your Aura Jewelry Password',
          html: emailHtml
        })
      });
      console.log(`Password reset email dispatched via Resend to ${toEmail}`);
      return;
    } catch (e) {
      console.error('Resend email error:', e);
    }
  }

  // 2. If SMTP is configured
  if (smtpUser && smtpPass) {
    try {
      const nodemailerModule = await import('nodemailer');
      const transporter = nodemailerModule.default.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass }
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: toEmail,
        subject: 'Reset Your Aura Jewelry Password',
        html: emailHtml
      });
      console.log(`Password reset email sent via SMTP to ${toEmail}`);
      return;
    } catch (e) {
      console.error('SMTP email error:', e);
    }
  }

  console.log(`[EMAIL NOTICE] Password reset token generated for ${toEmail}: ${resetLink}`);
};

// 6a. POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.toString().trim().toLowerCase();
    const result = await turso.execute({
      sql: 'SELECT id, email, name FROM users WHERE LOWER(email) = ?',
      args: [cleanEmail]
    });

    if (result.rows.length === 0) {
      // Safe response to prevent account enumeration
      return res.json({ message: 'If that email is registered, password reset instructions have been sent to your email.' });
    }

    const user = result.rows[0];
    const resetToken = crypto.randomBytes(24).toString('hex');
    const expiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    await turso.execute({
      sql: 'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
      args: [resetToken, expiry, user.id]
    });

    // Send dedicated email directly to the user's inbox
    sendResetEmail(user.email, user.name, resetToken).catch(err => console.error('Email dispatch error:', err));

    res.json({ 
      message: `Password reset instructions have been sent to ${user.email}. Please check your inbox and spam folder.`,
      resetToken
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process forgot password request' });
  }
});

// 6b. POST /api/auth/reset-password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const result = await turso.execute({
      sql: 'SELECT id, reset_token_expiry FROM users WHERE reset_token = ?',
      args: [token]
    });

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired password reset link' });
    }

    const user = result.rows[0];
    if (user.reset_token_expiry && new Date(user.reset_token_expiry) < new Date()) {
      return res.status(400).json({ error: 'Password reset link has expired. Please request a new one.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await turso.execute({
      sql: 'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      args: [hashedPassword, user.id]
    });

    res.json({ message: 'Password has been successfully updated! You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// 6c. PUT /api/auth/change-password (Authenticated users)
app.put('/api/auth/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const result = await turso.execute({
      sql: 'SELECT id, password FROM users WHERE id = ?',
      args: [req.user.id]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await turso.execute({
      sql: 'UPDATE users SET password = ? WHERE id = ?',
      args: [hashedPassword, req.user.id]
    });

    res.json({ message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
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
        const itemSize = item.size || item.selectedSize || 'Standard';
        await turso.execute({
          sql: `INSERT INTO order_items (order_id, product_name, product_image, quantity, price, size) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            orderId, 
            item.name || 'Jewelry Item', 
            item.image || '', 
            parseInt(item.quantity, 10) || 1, 
            parseFloat(item.price) || 0,
            itemSize
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
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
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
          ? items.map(item => `- ${item.quantity || 1}x ${item.name || 'Jewelry Piece'} (Size: ${item.size || item.selectedSize || 'Standard'})`).join('\n')
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
      sql: `SELECT id, product_id, 
                   COALESCE(author_name, author, 'Client vérifié') as author,
                   COALESCE(author_name, author, 'Client vérifié') as author_name,
                   author_email,
                   rating,
                   COALESCE(title, '') as title,
                   comment,
                   COALESCE(verified_purchase, 1) as verified_purchase,
                   COALESCE(helpful_count, 0) as helpful_count,
                   COALESCE(helpful_count, 0) as helpful,
                   images,
                   status,
                   created_at
            FROM reviews 
            WHERE product_id = ? AND (status = 'approved' OR status IS NULL)
            ORDER BY created_at DESC`,
      args: [req.params.id]
    });
    
    const parsed = result.rows.map(r => {
      let imgList = [];
      if (r.images) {
        try {
          imgList = typeof r.images === 'string' ? JSON.parse(r.images) : (Array.isArray(r.images) ? r.images : [r.images]);
        } catch(e) {
          imgList = [r.images];
        }
      }
      return { ...r, images: imgList };
    });

    const total = parsed.length;
    const avg = total > 0 ? (parsed.reduce((acc, r) => acc + (parseInt(r.rating, 10) || 5), 0) / total) : 5.0;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    parsed.forEach(r => {
      const rat = Math.min(5, Math.max(1, parseInt(r.rating, 10) || 5));
      distribution[rat] = (distribution[rat] || 0) + 1;
    });

    res.json({
      reviews: parsed,
      stats: {
        totalReviews: total,
        averageRating: parseFloat(avg.toFixed(1)),
        distribution
      }
    });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.json({
      reviews: [],
      stats: { totalReviews: 0, averageRating: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }
    });
  }
});

// 12. POST /api/reviews
app.post('/api/reviews', async (req, res) => {
  try {
    const { productId, authorName, author, authorEmail, rating, title, comment, images, userId } = req.body;
    const name = authorName || author || 'Client vérifié';
    const email = authorEmail || '';
    const rRating = parseInt(rating, 10) || 5;
    const rTitle = title || '';
    const rComment = comment || '';
    const imgString = images && Array.isArray(images) ? JSON.stringify(images) : (images || '');

    const result = await turso.execute({
      sql: `INSERT INTO reviews (product_id, author, author_name, author_email, rating, title, comment, status, verified_purchase, helpful_count, images, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 1, 0, ?, ?)`,
      args: [productId, name, name, email, rRating, rTitle, rComment, imgString, userId || null]
    });

    res.status(201).json({ message: 'Review submitted successfully', reviewId: Number(result.lastInsertRowid) });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// 12b. POST /api/reviews/:id/helpful
app.post('/api/reviews/:id/helpful', async (req, res) => {
  try {
    await turso.execute({
      sql: 'UPDATE reviews SET helpful_count = COALESCE(helpful_count, 0) + 1 WHERE id = ?',
      args: [req.params.id]
    });
    const reviewRes = await turso.execute({
      sql: 'SELECT COALESCE(helpful_count, 0) as helpful_count FROM reviews WHERE id = ?',
      args: [req.params.id]
    });
    const helpful_count = reviewRes.rows.length > 0 ? Number(reviewRes.rows[0].helpful_count) : 1;
    res.json({ success: true, message: 'Review marked as helpful', helpful_count });
  } catch (error) {
    console.error('Helpful vote error:', error);
    res.status(500).json({ error: 'Failed to record helpful vote' });
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

// 14.1 GET /api/admin/customers
app.get('/api/admin/customers', async (req, res) => {
  try {
    const usersRes = await turso.execute(`
      SELECT id, name, email, phone, address, city, zipCode, role, is_admin, created_at 
      FROM users 
      WHERE (is_admin = 0 OR is_admin IS NULL) AND (role = 'customer' OR role IS NULL OR role = '')
      ORDER BY id DESC
    `);

    const ordersRes = await turso.execute(`
      SELECT id, user_id, total, status, shipping_details, created_at 
      FROM orders
      ORDER BY id DESC
    `);

    // Strictly filter out staff / admin accounts
    const customerOnlyUsers = usersRes.rows.filter(user => {
      const r = (user.role || '').toLowerCase();
      const em = (user.email || '').toLowerCase();
      if (r === 'admin' || r === 'super_admin') return false;
      if (user.is_admin === 1 || user.is_admin === '1' || user.is_admin === true) return false;
      if (['ahmed.taboubi@hotmail.fr', 'admin@aura.com'].includes(em)) return false;
      return true;
    });

    const registeredEmails = new Set(customerOnlyUsers.map(u => (u.email || '').trim().toLowerCase()).filter(Boolean));
    const registeredUserIds = new Set(customerOnlyUsers.map(u => Number(u.id)));

    // Helper to safely extract full name from shipping details
    const extractCustomerFullName = (shipping, fallbackEmail) => {
      if (!shipping) return fallbackEmail ? fallbackEmail.split('@')[0] : 'Guest Buyer';
      const first = (shipping.firstName || shipping.first_name || '').trim();
      const last = (shipping.lastName || shipping.last_name || '').trim();
      if (first && last) return `${first} ${last}`;
      if (first) return first;
      if (last) return last;
      if (shipping.name && shipping.name.trim()) return shipping.name.trim();
      if (shipping.fullName && shipping.fullName.trim()) return shipping.fullName.trim();
      if (shipping.full_name && shipping.full_name.trim()) return shipping.full_name.trim();
      if (shipping.recipient_name && shipping.recipient_name.trim()) return shipping.recipient_name.trim();
      if (fallbackEmail) return fallbackEmail.split('@')[0];
      return 'Guest Buyer';
    };

    // 1. Process Registered Customers
    const registeredCustomerList = customerOnlyUsers.map(user => {
      const userOrders = ordersRes.rows.filter(o => {
        if (o.user_id && Number(o.user_id) === Number(user.id)) return true;
        if (o.shipping_details) {
          try {
            const ship = typeof o.shipping_details === 'string' ? JSON.parse(o.shipping_details) : o.shipping_details;
            if (ship?.email && ship.email.trim().toLowerCase() === (user.email || '').trim().toLowerCase()) return true;
          } catch(e) {}
        }
        return false;
      });

      const totalSpent = userOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
      const lastOrder = userOrders.length > 0 
        ? userOrders.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0] 
        : null;

      let recentCity = user.city || '';
      let recentPhone = user.phone || '';
      let recentAddress = user.address || '';
      let resolvedName = user.name || '';

      if (lastOrder && lastOrder.shipping_details) {
        try {
          const ship = typeof lastOrder.shipping_details === 'string' ? JSON.parse(lastOrder.shipping_details) : lastOrder.shipping_details;
          if (!recentCity && ship?.city) recentCity = ship.city;
          if (!recentPhone && ship?.phone) recentPhone = ship.phone;
          if (!recentAddress && ship?.address) recentAddress = ship.address;
          if (!resolvedName || resolvedName === 'Anonymous') resolvedName = extractCustomerFullName(ship, user.email);
        } catch(e) {}
      }

      return {
        id: user.id,
        name: resolvedName || user.email.split('@')[0],
        email: user.email,
        phone: recentPhone,
        city: recentCity,
        address: recentAddress,
        zipCode: user.zipCode || '',
        role: 'customer',
        account_type: 'registered',
        orders_count: userOrders.length,
        total_spent: totalSpent,
        last_order_date: lastOrder ? lastOrder.created_at : null,
        created_at: user.created_at
      };
    });

    // 2. Discover Guest Checkout Buyers
    const guestMap = new Map();

    ordersRes.rows.forEach(order => {
      const orderUserId = order.user_id ? Number(order.user_id) : null;
      let shipping = null;
      if (order.shipping_details) {
        try {
          shipping = typeof order.shipping_details === 'string' ? JSON.parse(order.shipping_details) : order.shipping_details;
        } catch(e) {}
      }

      const email = shipping?.email ? shipping.email.trim().toLowerCase() : '';
      const phone = shipping?.phone ? shipping.phone.trim() : '';

      // Skip if order belongs to an already registered user
      if (orderUserId && registeredUserIds.has(orderUserId)) return;
      if (email && registeredEmails.has(email)) return;

      // Filter out admin email if admin tested checkout
      if (['ahmed.taboubi@hotmail.fr', 'admin@aura.com'].includes(email)) return;

      const guestKey = email || phone || `guest_${order.id}`;
      const customerFullName = extractCustomerFullName(shipping, email);

      if (!guestMap.has(guestKey)) {
        guestMap.set(guestKey, {
          id: `G-${order.id}`,
          name: customerFullName,
          email: email || 'No email provided',
          phone: phone,
          city: shipping?.city || '',
          address: shipping?.address || '',
          zipCode: shipping?.zipCode || shipping?.postalCode || '',
          role: 'customer',
          account_type: 'guest',
          orders_count: 0,
          total_spent: 0,
          last_order_date: order.created_at,
          created_at: order.created_at
        });
      }

      const guestProfile = guestMap.get(guestKey);
      guestProfile.orders_count += 1;
      guestProfile.total_spent += parseFloat(order.total) || 0;
      if (new Date(order.created_at || 0) >= new Date(guestProfile.last_order_date || 0)) {
        guestProfile.last_order_date = order.created_at;
        if (shipping?.city) guestProfile.city = shipping.city;
        if (shipping?.phone) guestProfile.phone = shipping.phone;
        if (shipping?.address) guestProfile.address = shipping.address;
        if (customerFullName && customerFullName !== 'Guest Buyer') {
          guestProfile.name = customerFullName;
        }
      }
      if (new Date(order.created_at || 0) < new Date(guestProfile.created_at || 0)) {
        guestProfile.created_at = order.created_at;
      }
    });

    const guestCustomerList = Array.from(guestMap.values());
    const combinedCustomers = [...registeredCustomerList, ...guestCustomerList];

    res.json({ customers: combinedCustomers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customer list' });
  }
});

// 15. Admin Team Management
app.get('/api/admin/team', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let currentAdminId = 1;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.id) currentAdminId = decoded.id;
      } catch (e) {}
    }

    const adminsRes = await turso.execute(`
      SELECT id, name, email, phone, is_admin, role, permissions, created_at
      FROM users
      WHERE is_admin = 1 OR role IN ('super_admin', 'admin')
      ORDER BY id ASC
    `);

    const admins = adminsRes.rows.map(admin => {
      let perms = [];
      if (admin.permissions) {
        try {
          perms = typeof admin.permissions === 'string' ? JSON.parse(admin.permissions) : admin.permissions;
        } catch (e) {
          perms = [];
        }
      }
      let r = admin.role || 'admin';
      if (['ahmed.taboubi@hotmail.fr', 'admin@aura.com'].includes((admin.email || '').toLowerCase())) {
        r = 'super_admin';
        perms = ['orders', 'products', 'reviews', 'ingredients', 'analytics', 'marketing', 'team'];
      }
      return {
        ...admin,
        role: r,
        permissions: Array.isArray(perms) ? perms : []
      };
    });

    res.json({ admins, currentAdminId });
  } catch (error) {
    console.error('Fetch admin team error:', error);
    res.status(500).json({ error: 'Failed to fetch admin team' });
  }
});

app.post('/api/admin/team/create', async (req, res) => {
  try {
    const { name, email, password, permissions } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanName = name.toString().trim();
    const cleanEmail = email.toString().trim().toLowerCase();
    const permsList = Array.isArray(permissions) && permissions.length > 0 ? permissions : ['orders', 'products', 'reviews'];
    const cleanPermissions = JSON.stringify(permsList);

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await turso.execute({
      sql: 'SELECT id, is_admin, role FROM users WHERE LOWER(email) = LOWER(?)',
      args: [cleanEmail]
    });

    if (existingUser.rows.length > 0) {
      const userRow = existingUser.rows[0];
      if (userRow.role === 'super_admin' || ['ahmed.taboubi@hotmail.fr', 'admin@aura.com'].includes(cleanEmail)) {
        return res.status(400).json({ error: 'Super Admin account is permanently configured.' });
      }
      await turso.execute({
        sql: 'UPDATE users SET is_admin = 1, role = ?, permissions = ?, name = ?, password = ? WHERE id = ?',
        args: ['admin', cleanPermissions, cleanName, hashedPassword, userRow.id]
      });
      const updatedUser = await turso.execute({
        sql: 'SELECT id, name, email, phone, is_admin, role, permissions, created_at FROM users WHERE id = ?',
        args: [userRow.id]
      });
      return res.json({ 
        message: `User ${cleanEmail} promoted to Admin!`, 
        admin: { ...updatedUser.rows[0], permissions: permsList } 
      });
    }

    const insertResult = await turso.execute({
      sql: 'INSERT INTO users (name, email, password, is_admin, role, permissions) VALUES (?, ?, ?, 1, ?, ?)',
      args: [cleanName, cleanEmail, hashedPassword, 'admin', cleanPermissions]
    });

    const newAdminId = Number(insertResult.lastInsertRowid);
    const newAdmin = await turso.execute({
      sql: 'SELECT id, name, email, phone, is_admin, role, permissions, created_at FROM users WHERE id = ?',
      args: [newAdminId]
    });

    res.status(201).json({ 
      message: `Admin ${cleanName} created successfully!`, 
      admin: { ...newAdmin.rows[0], permissions: permsList } 
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

app.put('/api/admin/team/:id/permissions', async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);
    const { permissions } = req.body;

    const userRes = await turso.execute({
      sql: 'SELECT id, email, role FROM users WHERE id = ?',
      args: [targetId]
    });

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found.' });
    }

    const targetUser = userRes.rows[0];
    if (targetUser.role === 'super_admin' || ['ahmed.taboubi@hotmail.fr', 'admin@aura.com'].includes(targetUser.email?.toLowerCase())) {
      return res.status(403).json({ error: 'Super Admin permissions are permanent and cannot be modified.' });
    }

    const permsList = Array.isArray(permissions) ? permissions : [];
    const permsJson = JSON.stringify(permsList);
    await turso.execute({
      sql: 'UPDATE users SET permissions = ? WHERE id = ?',
      args: [permsJson, targetId]
    });

    res.json({ message: 'Permissions updated successfully', permissions: permsList });
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({ error: 'Failed to update admin permissions' });
  }
});

app.put('/api/admin/team/:id/revoke', async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);

    const userRes = await turso.execute({
      sql: 'SELECT id, email, role FROM users WHERE id = ?',
      args: [targetId]
    });

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const targetUser = userRes.rows[0];
    if (targetUser.role === 'super_admin' || ['ahmed.taboubi@hotmail.fr', 'admin@aura.com'].includes(targetUser.email?.toLowerCase())) {
      return res.status(403).json({ error: 'Super Admin account is permanently protected and cannot be revoked.' });
    }

    await turso.execute({
      sql: "UPDATE users SET is_admin = 0, role = 'customer', permissions = '[]' WHERE id = ?",
      args: [targetId]
    });
    res.json({ message: 'Admin privileges revoked successfully' });
  } catch (error) {
    console.error('Revoke admin error:', error);
    res.status(500).json({ error: 'Failed to revoke admin privileges' });
  }
});

app.delete('/api/admin/team/:id', async (req, res) => {
  try {
    const targetId = parseInt(req.params.id, 10);

    const userRes = await turso.execute({
      sql: 'SELECT id, email, role FROM users WHERE id = ?',
      args: [targetId]
    });

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const targetUser = userRes.rows[0];
    if (targetUser.role === 'super_admin' || ['ahmed.taboubi@hotmail.fr', 'admin@aura.com'].includes(targetUser.email?.toLowerCase())) {
      return res.status(403).json({ error: 'Super Admin account is permanently protected and cannot be deleted.' });
    }

    await turso.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [targetId]
    });
    res.json({ message: 'Admin account deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

// 16. Admin Reviews Moderation
app.get('/api/admin/reviews', async (req, res) => {
  try {
    const status = req.query.status;
    const search = req.query.search;

    const countsResult = await turso.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' OR status IS NULL THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM reviews
    `);
    const cRow = countsResult.rows[0] || {};
    const counts = {
      total: Number(cRow.total) || 0,
      pending: Number(cRow.pending) || 0,
      approved: Number(cRow.approved) || 0,
      rejected: Number(cRow.rejected) || 0
    };

    let sql = `SELECT reviews.*, products.name as product_name, products.image as product_image 
               FROM reviews 
               LEFT JOIN products ON reviews.product_id = products.id`;
    const whereClauses = [];
    const args = [];

    if (status && status !== 'all') {
      whereClauses.push(`reviews.status = ?`);
      args.push(status);
    }

    if (search && search.trim()) {
      whereClauses.push(`(reviews.author_name LIKE ? OR reviews.comment LIKE ? OR reviews.title LIKE ? OR products.name LIKE ?)`);
      const s = `%${search.trim()}%`;
      args.push(s, s, s, s);
    }

    if (whereClauses.length > 0) {
      sql += ` WHERE ` + whereClauses.join(' AND ');
    }

    sql += ` ORDER BY reviews.created_at DESC`;

    const result = await turso.execute({ sql, args });

    const parsed = result.rows.map(r => {
      let imgList = [];
      if (r.images) {
        try {
          imgList = typeof r.images === 'string' ? JSON.parse(r.images) : (Array.isArray(r.images) ? r.images : [r.images]);
        } catch(e) {
          imgList = [r.images];
        }
      }
      return { 
        ...r, 
        author: r.author_name || r.author || 'Client vérifié',
        author_name: r.author_name || r.author || 'Client vérifié',
        images: imgList 
      };
    });

    res.json({
      reviews: parsed,
      counts
    });
  } catch (error) {
    console.error('Fetch admin reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.put('/api/admin/reviews/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await turso.execute({
      sql: 'UPDATE reviews SET status = ? WHERE id = ?',
      args: [status, req.params.id]
    });
    res.json({ message: 'Review status updated' });
  } catch (error) {
    console.error('Update review status error:', error);
    res.status(500).json({ error: 'Failed to update review status' });
  }
});

app.delete('/api/admin/reviews/:id', async (req, res) => {
  try {
    await turso.execute({
      sql: 'DELETE FROM reviews WHERE id = ?',
      args: [req.params.id]
    });
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// 17. Ad Spend Management
app.get('/api/ad-spend', async (req, res) => {
  try {
    const result = await turso.execute('SELECT * FROM ad_spends ORDER BY date DESC, id DESC');
    res.json(result.rows);
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/ad-spend', async (req, res) => {
  try {
    const { platform, amount, date, notes } = req.body;
    const result = await turso.execute({
      sql: 'INSERT INTO ad_spends (platform, amount, date, notes) VALUES (?, ?, ?, ?)',
      args: [platform, parseFloat(amount) || 0, date, notes || '']
    });
    res.status(201).json({ message: 'Ad spend recorded', id: Number(result.lastInsertRowid) });
  } catch (error) {
    console.error('Create ad spend error:', error);
    res.status(500).json({ error: 'Failed to record ad spend' });
  }
});

app.delete('/api/ad-spend/:id', async (req, res) => {
  try {
    await turso.execute({
      sql: 'DELETE FROM ad_spends WHERE id = ?',
      args: [req.params.id]
    });
    res.json({ message: 'Ad spend deleted' });
  } catch (error) {
    console.error('Delete ad spend error:', error);
    res.status(500).json({ error: 'Failed to delete ad spend' });
  }
});

// 18. Ingredients Management
app.post('/api/ingredients', async (req, res) => {
  try {
    const { name, origin, scentProfile, harvestSeason, description, image } = req.body;
    const result = await turso.execute({
      sql: 'INSERT INTO ingredients (name, origin, scentProfile, harvestSeason, description, image) VALUES (?, ?, ?, ?, ?, ?)',
      args: [name, origin || '', scentProfile || '', harvestSeason || '', description || '', image || '']
    });
    res.status(201).json({ message: 'Ingredient added', id: Number(result.lastInsertRowid) });
  } catch (error) {
    console.error('Add ingredient error:', error);
    res.status(500).json({ error: 'Failed to add ingredient' });
  }
});

app.put('/api/ingredients/:id', async (req, res) => {
  try {
    const { name, origin, scentProfile, harvestSeason, description, image } = req.body;
    await turso.execute({
      sql: 'UPDATE ingredients SET name = ?, origin = ?, scentProfile = ?, harvestSeason = ?, description = ?, image = ? WHERE id = ?',
      args: [name, origin || '', scentProfile || '', harvestSeason || '', description || '', image || '', req.params.id]
    });
    res.json({ message: 'Ingredient updated' });
  } catch (error) {
    console.error('Update ingredient error:', error);
    res.status(500).json({ error: 'Failed to update ingredient' });
  }
});

app.delete('/api/ingredients/:id', async (req, res) => {
  try {
    await turso.execute({
      sql: 'DELETE FROM ingredients WHERE id = ?',
      args: [req.params.id]
    });
    res.json({ message: 'Ingredient deleted' });
  } catch (error) {
    console.error('Delete ingredient error:', error);
    res.status(500).json({ error: 'Failed to delete ingredient' });
  }
});

export default app;
