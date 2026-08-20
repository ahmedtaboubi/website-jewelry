import nodemailer from 'nodemailer';
import 'dotenv/config';

// Create a transporter using SMTP credentials from .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const fromAddress = process.env.SMTP_FROM || '"ÉCLAT Perfumes" <noreply@eclat.com>';

/**
 * Send a welcome email to a new user
 */
export const sendWelcomeEmail = async (user) => {
  if (!process.env.SMTP_USER) return; // Skip if no email configured

  const mailOptions = {
    from: fromAddress,
    to: user.email,
    subject: 'Welcome to ÉCLAT! ✨',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #000;">Welcome, ${user.name}!</h2>
        <p>Thank you for joining ÉCLAT. We're thrilled to have you in our community.</p>
        <p>As a member, you'll get early access to our newest fragrance drops and exclusive member-only sales.</p>
        <br/>
        <a href="http://localhost:5173" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Shop Now</a>
        <br/><br/>
        <p style="font-size: 12px; color: #888;">If you didn't create this account, please ignore this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

/**
 * Send a password reset email
 */
export const sendPasswordResetEmail = async (user, token) => {
  if (!process.env.SMTP_USER) {
    // Development fallback if no SMTP configured
    console.log('\n=============================================');
    console.log(`[MOCK EMAIL] Password Reset for ${user.email}`);
    console.log(`Link: http://localhost:5173/reset-password?token=${token}`);
    console.log('=============================================\n');
    return;
  }

  const resetLink = `http://localhost:5173/reset-password?token=${token}`;

  const mailOptions = {
    from: fromAddress,
    to: user.email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #000;">Reset Your Password</h2>
        <p>We received a request to reset your password. Click the button below to choose a new one:</p>
        <br/>
        <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        <br/><br/>
        <p>Or copy and paste this link into your browser:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <br/>
        <p>This link will expire in 1 hour.</p>
        <p style="font-size: 12px; color: #888;">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};

/**
 * Send an order confirmation email
 */
export const sendOrderConfirmationEmail = async (user, orderId, total, items) => {
  if (!process.env.SMTP_USER) return; // Skip if no email configured

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">Qty: ${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">€${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: fromAddress,
    to: user.email,
    subject: `Order Confirmation #${orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #000;">Thank You For Your Order!</h2>
        <p>Hi ${user.name}, your order <strong>#${orderId}</strong> has been received and is being processed.</p>
        
        <h3 style="border-bottom: 2px solid #000; padding-bottom: 5px; margin-top: 30px;">Order Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          ${itemsHtml}
        </table>
        
        <div style="text-align: right; font-size: 18px; margin-top: 20px;">
          <strong>Total: €${total.toFixed(2)}</strong>
        </div>
        
        <p style="margin-top: 40px; font-size: 14px; color: #555;">We will notify you again once your order has shipped.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
  }
};
