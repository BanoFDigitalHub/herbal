// mailer.js - Clean Production Email System
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// ─── TRANSPORT ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((err) => {
  if (err) console.error('Email Error:', err.message);
  else console.log('Email Service Ready');
});

// ─── LOGO (ROOT FOLDER) ────────────────────────────────────
const logoPath = path.join(__dirname, '..', 'logo.png');
let logoBase64 = null;

try {
  if (fs.existsSync(logoPath)) {
    logoBase64 = fs.readFileSync(logoPath).toString('base64');
  }
} catch (e) {
  console.warn('Logo not found');
}

// ─── HELPERS ───────────────────────────────────────────────
const money = (v) => `PKR ${Number(v || 0).toLocaleString()}`;

const orderId = (o) =>
  o.orderNumber || String(o._id).slice(-8).toUpperCase();

const date = (d) =>
  new Date(d).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

// ─── ITEMS ────────────────────────────────────────────────
const itemsHTML = (items = []) => {
  return items
    .map(
      (i) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;">
          ${i.productName || 'Product'}
        </td>
        <td style="text-align:center;border-bottom:1px solid #eee;">
          ${i.quantity}
        </td>
        <td style="text-align:right;border-bottom:1px solid #eee;">
          ${money(i.price * i.quantity)}
        </td>
      </tr>`
    )
    .join('');
};

// ─── CORE TEMPLATE ─────────────────────────────────────────
const template = (content) => {
  const logo = logoBase64
    ? `<img src="data:image/png;base64,${logoBase64}" style="height:50px;margin-bottom:10px;" />`
    : `<h2 style="margin:0;">HERBAL POWER</h2>`;

  return `
  <div style="background:#f6f6f6;padding:30px;font-family:Arial;">
    <div style="max-width:600px;margin:auto;background:#fff;padding:25px;border-radius:10px;">
      <div style="text-align:center;margin-bottom:20px;">
        ${logo}
      </div>
      ${content}
      <div style="text-align:center;margin-top:20px;font-size:12px;color:#888;">
        Herbal Power © ${new Date().getFullYear()}
      </div>
    </div>
  </div>`;
};

// ─── ORDER BLOCK ──────────────────────────────────────────
const orderBlock = (order, status, color) => {
  const subtotal =
    order.items?.reduce((a, i) => a + i.price * i.quantity, 0) || 0;

  const total = order.total || subtotal;

  return `
    <div style="text-align:center;">
      <h2 style="margin:0;">Order #${orderId(order)}</h2>
      <p style="color:${color};margin:5px 0;">${status}</p>
      <p>${date(order.createdAt)}</p>
    </div>

    <hr/>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr style="font-weight:bold;">
        <td>Product</td>
        <td align="center">Qty</td>
        <td align="right">Total</td>
      </tr>
      ${itemsHTML(order.items)}
    </table>

    <hr/>

    <p style="text-align:right;">
      <b>Total: ${money(total)}</b>
    </p>

    <div style="margin-top:15px;font-size:13px;">
      <p><b>Name:</b> ${order.customerName}</p>
      <p><b>Phone:</b> ${order.phone}</p>
      <p><b>Address:</b> ${order.address}, ${order.city}</p>
    </div>
  `;
};

// ─── EMAILS ────────────────────────────────────────────────
const emailTypes = {
  received: { title: 'Order Received', color: '#555' },
  confirmed: { title: 'Order Confirmed', color: 'green' },
  processing: { title: 'Processing Order', color: '#b8860b' },
  shipped: { title: 'Order Shipped', color: '#1e90ff' },
  delivered: { title: 'Order Delivered', color: '#222' },
  cancelled: { title: 'Order Cancelled', color: 'red' },
};

// ─── MAIN SEND ────────────────────────────────────────────
const sendOrderEmail = async (order, status) => {
  const to = order.email;
  if (!to) return false;

  const cfg = emailTypes[status] || emailTypes.received;

  const html = template(`
    <h3 style="text-align:center;">${cfg.title}</h3>
    ${orderBlock(order, cfg.title, cfg.color)}
  `);

  try {
    await transporter.sendMail({
      from: `Herbal Power <${process.env.EMAIL_USER}>`,
      to,
      subject: `${cfg.title} - #${orderId(order)}`,
      html,
    });

    console.log('Email sent:', status, to);
    return true;
  } catch (err) {
    console.error('Email error:', err.message);
    return false;
  }
};

module.exports = {
  sendOrderEmail,
};