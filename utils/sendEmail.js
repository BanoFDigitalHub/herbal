// mailer.js - Complete email system with professional design
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// ─── Transporter Setup ─────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service error:', error.message);
  } else {
    console.log('✅ Email service ready:', process.env.EMAIL_USER);
  }
});

// ─── Logo Path (root folder mein logo.png) ────────────────────────────────────
const logoPath = path.join(__dirname, '..', 'logo.png');
let logoBase64 = null;

try {
  if (fs.existsSync(logoPath)) {
    logoBase64 = fs.readFileSync(logoPath).toString('base64');
    console.log('✅ Logo loaded for emails');
  }
} catch (e) {
  console.warn('⚠️ Logo not found, using text fallback');
}

// ─── Helper Functions ──────────────────────────────────────────────────────────
const formatPrice = (price, currency = 'PKR') => {
  return `${currency} ${Number(price || 0).toLocaleString()}`;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getOrderNumber = (order) => {
  return order.orderNumber || String(order._id || '').toUpperCase().slice(-8);
};

// ─── Items Table HTML ──────────────────────────────────────────────────────────
const buildItemsTable = (items = []) => {
  if (!items.length) return '<p>No items</p>';
  
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      <thead>
        <tr>
          <th style="text-align: left; padding: 12px 0 8px 0; border-bottom: 2px solid #e8e0d5; font-size: 11px; font-weight: 600; color: #8a7a65; text-transform: uppercase;">Product</th>
          <th style="text-align: center; padding: 12px 0 8px 0; border-bottom: 2px solid #e8e0d5; font-size: 11px; font-weight: 600; color: #8a7a65; text-transform: uppercase;">Qty</th>
          <th style="text-align: right; padding: 12px 0 8px 0; border-bottom: 2px solid #e8e0d5; font-size: 11px; font-weight: 600; color: #8a7a65; text-transform: uppercase;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr style="border-bottom: 1px solid #f0ebe3;">
            <td style="padding: 14px 0;">
              <span style="font-weight: 500; color: #1a1612;">${item.name || item.productName || 'Product'}</span>
              ${item.variant ? `<br><span style="font-size: 11px; color: #a09080;">${item.variant}</span>` : ''}
              ${item.size ? `<br><span style="font-size: 11px; color: #a09080;">Size: ${item.size}</span>` : ''}
            </td>
            <td style="padding: 14px 0; text-align: center; color: #5a4a3a;">×${item.quantity || 1}</td>
            <td style="padding: 14px 0; text-align: right; font-weight: 500;">${formatPrice((item.price || item.subtotal || 0) * (item.quantity || 1))}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
};

// ─── Order Summary Box ─────────────────────────────────────────────────────────
const buildOrderBox = (order, badgeColor, badgeText) => {
  return `
    <div style="background: #f7f3ed; border: 1px solid #e5ddd2; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 10px; letter-spacing: 0.3em; color: #a09080; text-transform: uppercase; margin-bottom: 8px;">Order Reference</div>
      <div style="font-family: Georgia, serif; font-size: 24px; color: #1a1612; letter-spacing: 0.14em;">${getOrderNumber(order)}</div>
      <div style="font-size: 12px; color: #b8a898; margin-top: 8px;">${formatDate(order.createdAt)}</div>
      <div style="display: inline-block; margin-top: 14px; padding: 5px 20px; background: ${badgeColor}; color: #fff; font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; border-radius: 20px;">${badgeText}</div>
    </div>
  `;
};

// ─── Customer Details Block ────────────────────────────────────────────────────
const buildCustomerDetails = (order) => {
  return `
    <div style="margin-bottom: 24px;">
      <div style="font-size: 10px; letter-spacing: 0.28em; color: #a09080; text-transform: uppercase; margin-bottom: 14px;">Delivery Details</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width: 50%; padding-bottom: 12px;">
            <div style="font-size: 11px; color: #b0a090; margin-bottom: 4px;">Name</div>
            <div style="font-size: 14px; color: #1a1612;">${order.customerName || order.customer?.name || 'Customer'}</div>
           </td>
          <td style="width: 50%; padding-bottom: 12px;">
            <div style="font-size: 11px; color: #b0a090; margin-bottom: 4px;">Phone</div>
            <div style="font-size: 14px; color: #1a1612;">${order.phone || order.customer?.phone || 'N/A'}</div>
           </td>
         </tr>
        <tr>
          <td colspan="2" style="padding-bottom: 12px;">
            <div style="font-size: 11px; color: #b0a090; margin-bottom: 4px;">Delivery Address</div>
            <div style="font-size: 14px; color: #1a1612;">${order.address || order.customer?.address || 'N/A'}, ${order.city || ''}</div>
           </td>
         </tr>
        <tr>
          <td colspan="2">
            <div style="font-size: 11px; color: #b0a090; margin-bottom: 4px;">Payment Method</div>
            <div style="font-size: 14px; color: #1a1612;">${order.paymentMethod || 'Cash on Delivery'}</div>
           </td>
         </tr>
      </table>
    </div>
  `;
};

// ─── Totals Block ──────────────────────────────────────────────────────────────
const buildTotals = (order) => {
  const subtotal = order.items?.reduce((sum, i) => sum + ((i.price || i.subtotal || 0) * (i.quantity || 1)), 0) || order.subtotal || 0;
  const deliveryFee = order.deliveryFee || order.shipping || 0;
  const total = order.total || subtotal + deliveryFee;
  
  return `
    <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e8e0d5;">
      <table width="100%" cellpadding="8">
        <tr>
          <td style="color: #8a7a65;">Subtotal</td>
          <td style="text-align: right;">${formatPrice(subtotal)}</td>
         </tr>
        <tr>
          <td style="color: #8a7a65;">Delivery Fee</td>
          <td style="text-align: right;">${deliveryFee > 0 ? formatPrice(deliveryFee) : 'Free'}</td>
         </tr>
        <tr>
          <td style="font-weight: bold; font-size: 16px;">Total</td>
          <td style="text-align: right; font-weight: bold; font-size: 18px; color: #b8922a;">${formatPrice(total)}</td>
         </tr>
      </table>
    </div>
  `;
};

// ─── Note Box ──────────────────────────────────────────────────────────────────
const buildNoteBox = (message, borderColor = '#c9a96e', bgColor = '#f7f3ed') => {
  return `
    <div style="background: ${bgColor}; border-left: 3px solid ${borderColor}; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-top: 24px;">
      <p style="margin: 0; font-size: 13px; color: #7a6e62; line-height: 1.6;">${message}</p>
    </div>
  `;
};

// ─── Main Email Shell (Professional Design) ────────────────────────────────────
const createEmailShell = (content, statusColor = '#b8922a') => {
  const logoHtml = logoBase64
    ? `<img src="data:image/png;base64,${logoBase64}" alt="Herbal Power" style="max-width: 160px; height: auto; display: block; margin: 0 auto 16px;">`
    : `<div style="font-family: Georgia, serif; font-size: 28px; color: #1a1612; letter-spacing: 2px;">🌿 HERBAL<span style="font-weight: 300;">POWER</span></div>`;
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Herbal Power Order Update</title>
</head>
<body style="margin: 0; padding: 0; background: #f0ebe3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0ebe3; padding: 40px 16px;">
    <tr><td align="center">
      <table width="100%" max-width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        
        <!-- Top Gold Bar -->
        <tr><td style="height: 4px; background: linear-gradient(90deg, #b8922a, #e2b96a, #b8922a);"></td></tr>
        
        <!-- Header with Logo -->
        <tr>
          <td style="padding: 32px 32px 20px 32px; text-align: center; background: #ffffff;">
            ${logoHtml}
            <div style="width: 40px; height: 2px; background: ${statusColor}; margin: 16px auto 0 auto;"></div>
           </td>
         </tr>
        
        ${content}
        
        <!-- Footer -->
        <tr>
          <td style="background: #faf7f2; padding: 28px 32px; text-align: center; border-top: 1px solid #e8e0d5;">
            <div style="font-size: 11px; color: #b0a090; letter-spacing: 0.08em; margin-bottom: 8px;">Herbal Power — Natural Wellness</div>
            <a href="mailto:${process.env.EMAIL_USER}" style="font-size: 11px; color: #c9a96e; text-decoration: none;">${process.env.EMAIL_USER}</a>
            <div style="margin-top: 16px; font-size: 10px; color: #c8bfb2;">© ${new Date().getFullYear()} Herbal Power. All rights reserved.</div>
          </td>
         </tr>
        
        <!-- Bottom Gold Bar -->
        <tr><td style="height: 4px; background: linear-gradient(90deg, #b8922a, #e2b96a, #b8922a);"></td></tr>
      
      </table>
     </td></tr>
  </table>
</body>
</html>`;
};

// ══════════════════════════════════════════════════════════════════════════════
//  EMAIL TEMPLATES (Different Status)
// ══════════════════════════════════════════════════════════════════════════════

const orderReceivedEmail = (order) => {
  const content = `
    <tr><td style="padding: 0 32px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 48px; margin-bottom: 8px;">📥</div>
        <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 500; color: #1a1612;">Order Received</h1>
        <p style="margin: 0; font-size: 14px; color: #8a7a65;">Thank you, ${order.customerName || 'Valued Customer'}!</p>
      </div>
     </td></tr>
    ${buildOrderBox(order, '#8a7a65', 'Received')}
    <tr><td style="padding: 0 32px;">
      ${buildCustomerDetails(order)}
      <div style="font-size: 10px; letter-spacing: 0.28em; color: #a09080; text-transform: uppercase; margin: 20px 0 12px;">Your Order</div>
      ${buildItemsTable(order.items)}
      ${buildTotals(order)}
      ${buildNoteBox('We have received your order and will confirm it shortly. You will receive another update within 2-4 hours.')}
     </td></tr>
  `;
  return createEmailShell(content, '#8a7a65');
};

const orderConfirmedEmail = (order) => {
  const content = `
    <tr><td style="padding: 0 32px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 48px; margin-bottom: 8px;">✅</div>
        <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 500; color: #1a1612;">Order Confirmed</h1>
        <p style="margin: 0; font-size: 14px; color: #8a7a65;">Great news, ${order.customerName || 'Valued Customer'}!</p>
      </div>
     </td></tr>
    ${buildOrderBox(order, '#2e7d52', 'Confirmed')}
    <tr><td style="padding: 0 32px;">
      ${buildItemsTable(order.items)}
      ${buildTotals(order)}
      ${buildNoteBox('Your order has been confirmed and is now being prepared. We will notify you once it is shipped.')}
     </td></tr>
  `;
  return createEmailShell(content, '#2e7d52');
};

const orderProcessingEmail = (order) => {
  const content = `
    <tr><td style="padding: 0 32px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 48px; margin-bottom: 8px;">⚙️</div>
        <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 500; color: #1a1612;">Order Being Prepared</h1>
        <p style="margin: 0; font-size: 14px; color: #8a7a65;">We're packing your order, ${order.customerName || 'Valued Customer'}!</p>
      </div>
     </td></tr>
    ${buildOrderBox(order, '#b8922a', 'Processing')}
    <tr><td style="padding: 0 32px;">
      ${buildItemsTable(order.items)}
      ${buildTotals(order)}
      ${buildNoteBox('Your items are being carefully packed and will be handed over to our courier partner shortly.')}
     </td></tr>
  `;
  return createEmailShell(content, '#b8922a');
};

const orderShippedEmail = (order) => {
  const content = `
    <tr><td style="padding: 0 32px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 48px; margin-bottom: 8px;">🚚</div>
        <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 500; color: #1a1612;">Order Shipped</h1>
        <p style="margin: 0; font-size: 14px; color: #8a7a65;">Your order is on the way, ${order.customerName || 'Valued Customer'}!</p>
      </div>
     </td></tr>
    ${buildOrderBox(order, '#c9a96e', 'Shipped')}
    <tr><td style="padding: 0 32px;">
      ${buildItemsTable(order.items)}
      ${buildTotals(order)}
      ${buildNoteBox(`Expected delivery within 2-5 business days to ${order.city || 'your location'}. Our courier will contact you before delivery.`)}
     </td></tr>
  `;
  return createEmailShell(content, '#c9a96e');
};

const orderDeliveredEmail = (order) => {
  const content = `
    <tr><td style="padding: 0 32px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
        <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 500; color: #1a1612;">Order Delivered</h1>
        <p style="margin: 0; font-size: 14px; color: #8a7a65;">Delivered with care, ${order.customerName || 'Valued Customer'}!</p>
      </div>
     </td></tr>
    ${buildOrderBox(order, '#1a1612', 'Delivered')}
    <tr><td style="padding: 0 32px;">
      ${buildItemsTable(order.items)}
      ${buildTotals(order)}
      ${buildNoteBox('Thank you for choosing Herbal Power! Your order has been successfully delivered. We hope you love your products. For any concerns, simply reply to this email.')}
     </td></tr>
  `;
  return createEmailShell(content, '#2e7d52');
};

const orderCancelledEmail = (order) => {
  const content = `
    <tr><td style="padding: 0 32px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 48px; margin-bottom: 8px;">❌</div>
        <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 500; color: #1a1612;">Order Cancelled</h1>
        <p style="margin: 0; font-size: 14px; color: #8a7a65;">We're sorry, ${order.customerName || 'Valued Customer'}</p>
      </div>
     </td></tr>
    ${buildOrderBox(order, '#c0392b', 'Cancelled')}
    <tr><td style="padding: 0 32px;">
      ${buildItemsTable(order.items)}
      ${buildTotals(order)}
      ${buildNoteBox(`Your order #${getOrderNumber(order)} has been cancelled. If this was a mistake or you have any questions, please reply to this email.`, '#c0392b', '#fdf5f5')}
     </td></tr>
  `;
  return createEmailShell(content, '#c0392b');
};

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN SEND FUNCTIONS (Call these from controller)
// ══════════════════════════════════════════════════════════════════════════════

const sendOrderEmail = async (order, status) => {
  if (!order?.email && !order?.customerEmail && !order?.customer?.email) {
    console.error('❌ No customer email found');
    return false;
  }
  
  const to = order.email || order.customerEmail || order.customer?.email;
  
  let html, subject;
  const orderNum = getOrderNumber(order);
  const customerName = order.customerName || order.customer?.name || 'Customer';
  
  // Add customerName and other fields if missing
  const enrichedOrder = {
    ...order,
    customerName,
    customerEmail: to,
  };
  
  switch (status) {
    case 'received':
    case 'pending':
      html = orderReceivedEmail(enrichedOrder);
      subject = `📥 Order Received #${orderNum} – Herbal Power`;
      break;
    case 'confirmed':
      html = orderConfirmedEmail(enrichedOrder);
      subject = `✅ Order Confirmed #${orderNum} – Herbal Power`;
      break;
    case 'processing':
      html = orderProcessingEmail(enrichedOrder);
      subject = `⚙️ Order Being Prepared #${orderNum} – Herbal Power`;
      break;
    case 'shipped':
      html = orderShippedEmail(enrichedOrder);
      subject = `🚚 Order Shipped #${orderNum} – Herbal Power`;
      break;
    case 'delivered':
      html = orderDeliveredEmail(enrichedOrder);
      subject = `🎉 Order Delivered #${orderNum} – Herbal Power`;
      break;
    case 'cancelled':
      html = orderCancelledEmail(enrichedOrder);
      subject = `❌ Order Cancelled #${orderNum} – Herbal Power`;
      break;
    default:
      html = orderReceivedEmail(enrichedOrder);
      subject = `Order Update #${orderNum} – Herbal Power`;
  }
  
  try {
    await transporter.sendMail({
      from: `"Herbal Power" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent: ${status} → ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Email failed: ${status} → ${to}`, error.message);
    return false;
  }
};

// For backward compatibility - when order is first placed
const sendOrderReceivedEmail = async (order) => {
  return sendOrderEmail(order, 'received');
};

// For admin status updates
const sendOrderStatusEmail = async (order) => {
  return sendOrderEmail(order, order.status);
};

module.exports = {
  sendOrderEmail,
  sendOrderReceivedEmail,
  sendOrderStatusEmail,
};