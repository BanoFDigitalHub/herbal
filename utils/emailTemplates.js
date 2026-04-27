const fs   = require('fs');
const path = require('path');

// Load logo once at startup
let logoBase64 = '';
try {
  logoBase64 = fs.readFileSync(path.join(__dirname, '../logo.png')).toString('base64');
  console.log('✅ Logo loaded for emails');
} catch (e) {
  console.warn('⚠️ logo.png not found:', e.message);
}

const logo = logoBase64
  ? `<img src="data:image/png;base64,${logoBase64}" alt="Herbal Power" style="height:52px;">`
  : `<strong style="color:#fff;font-size:20px;">Herbal Power</strong>`;

// ── Shared layout ─────────────────────────────────────────────────────────────
const wrap = (accentColor, statusLabel, body) => `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:#f5f5f5;font-family:Arial,sans-serif;font-size:14px;color:#333;}
  a{color:#2e7d32;}
</style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">

  <!-- Header -->
  <tr>
    <td style="background:#2e7d32;padding:24px 32px;text-align:center;">
      ${logo}
    </td>
  </tr>

  <!-- Status bar -->
  <tr>
    <td style="background:${accentColor};padding:12px 32px;text-align:center;color:#fff;font-size:15px;font-weight:bold;letter-spacing:0.5px;">
      ${statusLabel}
    </td>
  </tr>

  <!-- Body -->
  <tr><td style="padding:32px;">${body}</td></tr>

  <!-- Footer -->
  <tr>
    <td style="background:#f9f9f9;padding:20px 32px;text-align:center;font-size:12px;color:#888;border-top:1px solid #eee;">
      Questions? Reply to this email or contact us at
      <a href="mailto:${process.env.EMAIL_USER}">${process.env.EMAIL_USER}</a><br>
      <span style="margin-top:6px;display:block;">© ${new Date().getFullYear()} Herbal Power</span>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body></html>`;

// ── Reusable blocks ───────────────────────────────────────────────────────────
const orderMeta = (order) => `
  <p style="color:#555;margin-bottom:20px;">
    Order <strong style="color:#2e7d32;">#${order.orderNumber}</strong> &nbsp;·&nbsp;
    ${new Date(order.createdAt).toLocaleDateString('en-PK',{day:'numeric',month:'long',year:'numeric'})}
  </p>`;

const itemsTable = (items, deliveryFee, total) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px;">
    <tr style="background:#f5f5f5;">
      <td style="padding:8px 10px;font-size:12px;font-weight:bold;color:#666;text-transform:uppercase;">Product</td>
      <td style="padding:8px 10px;font-size:12px;font-weight:bold;color:#666;text-align:center;">Qty</td>
      <td style="padding:8px 10px;font-size:12px;font-weight:bold;color:#666;text-align:right;">Total</td>
    </tr>
    ${items.map(i => `
    <tr style="border-bottom:1px solid #f0f0f0;">
      <td style="padding:10px;">
        ${i.productName}
        ${i.variant ? `<span style="color:#999;font-size:12px;"> · ${i.variant}</span>` : ''}
      </td>
      <td style="padding:10px;text-align:center;color:#555;">×${i.quantity}</td>
      <td style="padding:10px;text-align:right;">Rs. ${i.subtotal.toLocaleString()}</td>
    </tr>`).join('')}
    <tr>
      <td colspan="2" style="padding:10px;font-size:12px;color:#888;">Delivery</td>
      <td style="padding:10px;text-align:right;font-size:13px;">Rs. ${(deliveryFee || 0).toLocaleString()}</td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td colspan="2" style="padding:10px;font-weight:bold;">Total</td>
      <td style="padding:10px;text-align:right;font-weight:bold;color:#2e7d32;font-size:15px;">Rs. ${(total || 0).toLocaleString()}</td>
    </tr>
  </table>`;

const buildItemsBlock = (order) => itemsTable(order.items, order.deliveryFee, order.total);

const addressBlock = (order) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:6px;margin-bottom:20px;">
    <tr>
      <td style="padding:16px 18px;font-size:13px;line-height:1.8;color:#555;">
        <strong style="color:#333;">Delivery Address</strong><br>
        ${order.customerName} &nbsp;·&nbsp; ${order.phone}<br>
        ${order.address}, ${order.city}
        ${order.notes ? `<br><em style="color:#888;">Note: ${order.notes}</em>` : ''}
      </td>
    </tr>
  </table>`;

const notice = (bgColor, text) => `
  <p style="background:${bgColor};border-radius:6px;padding:14px 16px;font-size:13px;color:#333;line-height:1.6;margin-top:4px;">
    ${text}
  </p>`;

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

const orderReceived = (order) => wrap(
  '#f57c00', '🕐 Order Received',
  `<h2 style="font-size:18px;margin-bottom:8px;">Hi ${order.customerName},</h2>
   <p style="color:#555;margin-bottom:20px;">We've received your order and will confirm it shortly.</p>
   ${orderMeta(order)}
   ${buildItemsBlock(order)}
   ${addressBlock(order)}
   ${notice('#fff8e1', '⏳ Our team will review your order and send you a confirmation email soon.')}`
);

const orderConfirmed = (order) => wrap(
  '#1976d2', '✅ Order Confirmed',
  `<h2 style="font-size:18px;margin-bottom:8px;">Great news, ${order.customerName}!</h2>
   <p style="color:#555;margin-bottom:20px;">Your order has been confirmed and is being prepared.</p>
   ${orderMeta(order)}
   ${buildItemsBlock(order)}
   ${addressBlock(order)}
   ${notice('#e3f2fd', "🔄 We'll notify you once your order is on its way.")}`
);

const orderProcessing = (order) => wrap(
  '#6a1b9a', '⚙️ Order Being Prepared',
  `<h2 style="font-size:18px;margin-bottom:8px;">We're packing your order, ${order.customerName}!</h2>
   <p style="color:#555;margin-bottom:20px;">Your items are being carefully packed for dispatch.</p>
   ${orderMeta(order)}
   ${buildItemsBlock(order)}
   ${addressBlock(order)}
   ${notice('#f3e5f5', '📦 Your order will be handed to our courier partner shortly.')}`
);

const orderShipped = (order) => wrap(
  '#0277bd', '🚚 Order Shipped',
  `<h2 style="font-size:18px;margin-bottom:8px;">Your order is on the way, ${order.customerName}!</h2>
   <p style="color:#555;margin-bottom:20px;">Your order has been dispatched and is heading to you.</p>
   ${orderMeta(order)}
   ${buildItemsBlock(order)}
   ${addressBlock(order)}
   ${notice('#e1f5fe', `📍 Expected delivery in <strong>2–5 business days</strong> to <strong>${order.city}</strong>. Please keep your phone reachable.`)}`
);

const orderDelivered = (order) => wrap(
  '#2e7d32', '🎉 Order Delivered',
  `<h2 style="font-size:18px;margin-bottom:8px;">Thank you, ${order.customerName}!</h2>
   <p style="color:#555;margin-bottom:20px;">Your order has been delivered successfully. We hope you love it!</p>
   ${orderMeta(order)}
   ${buildItemsBlock(order)}
   ${notice('#e8f5e9', '💚 If you have any questions or concerns, feel free to reply to this email. Thank you for choosing Herbal Power!')}`
);

const orderCancelled = (order) => wrap(
  '#c62828', '❌ Order Cancelled',
  `<h2 style="font-size:18px;margin-bottom:8px;">Hi ${order.customerName},</h2>
   <p style="color:#555;margin-bottom:20px;">Your order <strong>#${order.orderNumber}</strong> has been cancelled.</p>
   ${buildItemsBlock(order)}
   ${notice('#ffebee', '❓ If you did not request this cancellation or need help, please reply to this email immediately.')}`
);

// ── Subject lines ─────────────────────────────────────────────────────────────
const subjects = {
  pending:    (n) => `Order Received #${n} — Herbal Power`,
  confirmed:  (n) => `Order Confirmed #${n} — Herbal Power`,
  processing: (n) => `Order Being Prepared #${n} — Herbal Power`,
  shipped:    (n) => `Your Order is On the Way #${n} — Herbal Power`,
  delivered:  (n) => `Order Delivered #${n} — Herbal Power`,
  cancelled:  (n) => `Order Cancelled #${n} — Herbal Power`,
};

const templates = {
  orderReceived,
  orderConfirmed,
  orderProcessing,
  orderShipped,
  orderDelivered,
  orderCancelled,
};

module.exports = { templates, subjects };