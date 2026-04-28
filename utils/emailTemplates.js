// emailTemplates.js
const fs = require('fs');
const path = require('path');

// Load logo once at startup with better error handling
let logoBase64Cache = null;
let logoLoadError = null;

const loadLogoBase64 = () => {
  if (logoBase64Cache !== null) return logoBase64Cache;
  
  const possiblePaths = [
    path.join(__dirname, '../logo.png'),
    path.join(__dirname, '../public/logo.png'),
    path.join(__dirname, '../assets/logo.png'),
    path.join(process.cwd(), 'logo.png'),
    path.join(process.cwd(), 'public/logo.png'),
  ];
  
  for (const logoPath of possiblePaths) {
    try {
      if (fs.existsSync(logoPath)) {
        const buffer = fs.readFileSync(logoPath);
        logoBase64Cache = buffer.toString('base64');
        console.log('✅ Logo loaded successfully from:', logoPath);
        return logoBase64Cache;
      }
    } catch (e) {
      // continue to next path
    }
  }
  
  logoLoadError = 'Logo file not found in any expected location';
  console.warn('⚠️ Logo not found. Using text fallback.');
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFESSIONAL EMAIL TEMPLATE WITH PROPER RESPONSIVE DESIGN
// ─────────────────────────────────────────────────────────────────────────────

const createEmailLayout = (content, options = {}) => {
  const {
    accentColor = '#2e7d32',
    statusLabel = 'Order Update',
    statusIcon = '📦',
    preheader = 'Your order status update from Herbal Power'
  } = options;

  const logoBase64 = loadLogoBase64();
  const logoHtml = logoBase64
    ? `<img src="data:image/png;base64,${logoBase64}" alt="Herbal Power Logo" style="display:block;max-height:60px;width:auto;margin:0 auto;" border="0">`
    : `<span style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#fff;">HERBAL<span style="font-weight:400;">POWER</span></span>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Herbal Power - ${statusLabel}</title>
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <style>
    /* CLIENT-SAFE STYLES */
    @media only screen and (max-width: 600px) {
      .responsive-table { width: 100% !important; }
      .responsive-padding { padding: 24px 20px !important; }
      .responsive-logo { max-height: 48px !important; }
      .stack-on-mobile { display: block !important; width: 100% !important; text-align: center !important; margin-bottom: 12px !important; }
      .mobile-text-center { text-align: center !important; }
      .mobile-padding-small { padding: 16px !important; }
    }
    /* OUTLOOK FIXES */
    .ExternalClass, .ReadMsgBody { width: 100%; background-color: #f5f5f5; }
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    body { margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  </style>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;">

  <!--[if (gte mso 9)|(IE)]>
    <table width="600" align="center" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td>
  <![endif]-->

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        
        <!-- MAIN CONTAINER -->
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;width:100%;background:#ffffff;border-radius:20px;box-shadow:0 4px 12px rgba(0,0,0,0.05);overflow:hidden;">
          
          <!-- HEADER SECTION WITH LOGO -->
          <tr>
            <td style="background:${accentColor};padding:28px 24px;text-align:center;">
              ${logoHtml}
              <p style="margin:12px 0 0 0;font-size:13px;color:rgba(255,255,255,0.85);letter-spacing:0.5px;">Natural Wellness • Pure Heritage</p>
            </td>
           </tr>
          
          <!-- STATUS BAR -->
          <tr>
            <td style="background:${accentColor};padding:8px 24px;text-align:center;border-bottom:1px solid rgba(0,0,0,0.05);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <span style="display:inline-block;background:rgba(255,255,255,0.2);padding:6px 16px;border-radius:40px;font-size:13px;font-weight:600;color:#ffffff;letter-spacing:0.3px;">
                      ${statusIcon} &nbsp; ${statusLabel}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
           </tr>
          
          <!-- CONTENT AREA -->
          <tr>
            <td class="responsive-padding" style="padding:32px 32px 24px 32px;">
              ${content}
            </td>
           </tr>
          
          <!-- DIVIDER -->
          <tr>
            <td style="padding:0 32px;">
              <hr style="border:0;height:1px;background:#eaeaea;margin:0;">
            </td>
           </tr>
          
          <!-- FOOTER -->
          <tr>
            <td style="background:#fafafa;padding:24px 32px 32px 32px;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 8px 0;font-size:12px;color:#999;">
                      Need help? <a href="mailto:${process.env.EMAIL_USER || 'support@herbalpower.com'}" style="color:${accentColor};text-decoration:none;">Contact Support</a>
                    </p>
                    <p style="margin:0;font-size:11px;color:#bbb;">
                      © ${new Date().getFullYear()} Herbal Power. All rights reserved.
                    </p>
                    <p style="margin:16px 0 0 0;font-size:11px;color:#ccc;">
                      This email was sent regarding your order with Herbal Power.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
           </tr>
        </table>
        
        <!-- POST-SCRIPT NOTE -->
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;margin-top:16px;">
          <tr>
            <td align="center" style="padding:16px 20px;">
              <p style="margin:0;font-size:11px;color:#aaa;">
                Herbal Power — Bringing nature's finest to your doorstep
              </p>
            </td>
           </tr>
        </table>
        
      </td>
    </tr>
  </table>

  <!--[if (gte mso 9)|(IE)]>
        </td>
      </tr>
    </table>
  <![endif]-->
  
</body>
</html>`;
};

// ── REUSABLE CONTENT BLOCKS ───────────────────────────────────────────────────

const buildOrderSummary = (order) => {
  const items = order.items || [];
  const subtotal = items.reduce((sum, i) => sum + (i.subtotal || 0), 0);
  const deliveryFee = order.deliveryFee || 0;
  const total = order.total || subtotal + deliveryFee;
  
  return `
    <div style="margin-bottom:28px;">
      <h2 style="margin:0 0 6px 0;font-size:18px;font-weight:600;color:#222;">Order Summary</h2>
      <p style="margin:0;font-size:13px;color:#777;">
        Order #${order.orderNumber} • ${new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </div>
    
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <thead>
        <tr>
          <th style="text-align:left;padding:12px 0 8px 0;border-bottom:2px solid #eee;font-size:12px;font-weight:600;color:#888;text-transform:uppercase;">Product</th>
          <th style="text-align:center;padding:12px 0 8px 0;border-bottom:2px solid #eee;font-size:12px;font-weight:600;color:#888;text-transform:uppercase;">Qty</th>
          <th style="text-align:right;padding:12px 0 8px 0;border-bottom:2px solid #eee;font-size:12px;font-weight:600;color:#888;text-transform:uppercase;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr style="border-bottom:1px solid #f0f0f0;">
            <td style="padding:14px 0;">
              <span style="font-weight:500;color:#333;">${item.productName}</span>
              ${item.variant ? `<br><span style="font-size:11px;color:#999;">${item.variant}</span>` : ''}
            </td>
            <td style="padding:14px 0;text-align:center;color:#555;">×${item.quantity}</td>
            <td style="padding:14px 0;text-align:right;font-weight:500;">Rs. ${(item.subtotal || 0).toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:12px 0 6px 0;text-align:right;color:#666;">Subtotal</td>
          <td style="padding:12px 0 6px 0;text-align:right;">Rs. ${subtotal.toLocaleString()}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:0 0 6px 0;text-align:right;color:#666;">Delivery Fee</td>
          <td style="padding:0 0 6px 0;text-align:right;">Rs. ${deliveryFee.toLocaleString()}</td>
        </tr>
        <tr style="border-top:2px solid #eee;">
          <td colspan="2" style="padding:14px 0 0 0;text-align:right;font-weight:700;color:#222;">Total</td>
          <td style="padding:14px 0 0 0;text-align:right;font-weight:700;color:${accentColor || '#2e7d32'};font-size:18px;">Rs. ${total.toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>
  `;
};

const buildAddressBlock = (order) => {
  return `
    <div style="background:#f8f8f8;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align:top;width:50%;">
            <strong style="display:block;margin-bottom:8px;font-size:13px;color:#888;">SHIPPING ADDRESS</strong>
            <p style="margin:0;font-size:14px;line-height:1.5;color:#333;">
              ${order.customerName}<br>
              ${order.phone}<br>
              ${order.address}, ${order.city}
            </p>
          </td>
        </tr>
        ${order.notes ? `
        <tr>
          <td style="padding-top:16px;">
            <strong style="display:block;margin-bottom:6px;font-size:11px;color:#888;">ORDER NOTES</strong>
            <p style="margin:0;font-size:13px;color:#666;font-style:italic;">“${order.notes}”</p>
          </td>
        </tr>
        ` : ''}
      </table>
    </div>
  `;
};

const buildNoticeBox = (message, type = 'info') => {
  const styles = {
    info: { bg: '#e8f5e9', border: '#c8e6c9', icon: '💡', color: '#2e7d32' },
    warning: { bg: '#fff3e0', border: '#ffe0b2', icon: '⚠️', color: '#ef6c00' },
    success: { bg: '#e8f5e9', border: '#c8e6c9', icon: '✅', color: '#2e7d32' },
    shipping: { bg: '#e3f2fd', border: '#bbdefb', icon: '🚚', color: '#1565c0' }
  };
  const s = styles[type] || styles.info;
  return `
    <div style="background:${s.bg};border-left:4px solid ${s.border};border-radius:8px;padding:14px 18px;margin-top:8px;">
      <p style="margin:0;font-size:13px;color:${s.color};line-height:1.5;">
        <span style="margin-right:8px;">${s.icon}</span> ${message}
      </p>
    </div>
  `;
};

// ── PROFESSIONAL TEMPLATES FOR EACH ORDER STATUS ─────────────────────────────

const orderReceived = (order) => {
  const content = `
    <h1 style="margin:0 0 12px 0;font-size:24px;font-weight:600;color:#222;">Hi ${order.customerName.split(' ')[0]},</h1>
    <p style="margin:0 0 20px 0;font-size:15px;color:#555;line-height:1.5;">
      We've successfully received your order and it's now in our system. Our team will review it shortly.
    </p>
    ${buildOrderSummary(order)}
    ${buildAddressBlock(order)}
    ${buildNoticeBox('We will notify you once your order is confirmed. You can expect an update within 2-4 hours.', 'info')}
    <div style="margin-top:24px;text-align:center;">
      <a href="#" style="display:inline-block;background:#2e7d32;color:#fff;padding:12px 28px;border-radius:40px;text-decoration:none;font-weight:500;font-size:14px;">Track Your Order</a>
    </div>
  `;
  return createEmailLayout(content, { 
    accentColor: '#f57c00', 
    statusLabel: 'ORDER RECEIVED', 
    statusIcon: '🕐',
    preheader: `Order #${order.orderNumber} has been received successfully`
  });
};

const orderConfirmed = (order) => {
  const content = `
    <h1 style="margin:0 0 12px 0;font-size:24px;font-weight:600;color:#222;">Great news, ${order.customerName.split(' ')[0]}!</h1>
    <p style="margin:0 0 20px 0;font-size:15px;color:#555;line-height:1.5;">
      Your order has been <strong>confirmed</strong> and is now being prepared for shipment.
    </p>
    ${buildOrderSummary(order)}
    ${buildAddressBlock(order)}
    ${buildNoticeBox('We are now preparing your items. You will receive another update once your order is shipped.', 'info')}
  `;
  return createEmailLayout(content, { 
    accentColor: '#1976d2', 
    statusLabel: 'ORDER CONFIRMED', 
    statusIcon: '✅',
    preheader: `Order #${order.orderNumber} has been confirmed`
  });
};

const orderProcessing = (order) => {
  const content = `
    <h1 style="margin:0 0 12px 0;font-size:24px;font-weight:600;color:#222;">We're preparing your order, ${order.customerName.split(' ')[0]}!</h1>
    <p style="margin:0 0 20px 0;font-size:15px;color:#555;line-height:1.5;">
      Your items are being carefully packed and will be handed over to our courier partner soon.
    </p>
    ${buildOrderSummary(order)}
    ${buildAddressBlock(order)}
    ${buildNoticeBox('We\'re taking extra care to ensure everything is packed perfectly for you.', 'info')}
  `;
  return createEmailLayout(content, { 
    accentColor: '#6a1b9a', 
    statusLabel: 'PROCESSING', 
    statusIcon: '⚙️',
    preheader: `Order #${order.orderNumber} is being prepared`
  });
};

const orderShipped = (order) => {
  const content = `
    <h1 style="margin:0 0 12px 0;font-size:24px;font-weight:600;color:#222;">Your order is on the way, ${order.customerName.split(' ')[0]}!</h1>
    <p style="margin:0 0 20px 0;font-size:15px;color:#555;line-height:1.5;">
      Great news! Your order has been dispatched and is now on its way to you.
    </p>
    ${buildOrderSummary(order)}
    ${buildAddressBlock(order)}
    ${buildNoticeBox(`Expected delivery to ${order.city} within 2-5 business days. Our courier will contact you before delivery.`, 'shipping')}
    <div style="margin-top:24px;text-align:center;">
      <a href="#" style="display:inline-block;background:#0277bd;color:#fff;padding:12px 28px;border-radius:40px;text-decoration:none;font-weight:500;font-size:14px;">Track Shipment</a>
    </div>
  `;
  return createEmailLayout(content, { 
    accentColor: '#0277bd', 
    statusLabel: 'ORDER SHIPPED', 
    statusIcon: '🚚',
    preheader: `Order #${order.orderNumber} has been shipped`
  });
};

const orderDelivered = (order) => {
  const content = `
    <h1 style="margin:0 0 12px 0;font-size:24px;font-weight:600;color:#222;">Delivered! Thank you, ${order.customerName.split(' ')[0]}!</h1>
    <p style="margin:0 0 20px 0;font-size:15px;color:#555;line-height:1.5;">
      Your order has been successfully delivered. We hope you love your products!
    </p>
    ${buildOrderSummary(order)}
    ${buildAddressBlock(order)}
    ${buildNoticeBox('We\'d love to hear your feedback! If you have any questions about your products, please don\'t hesitate to reach out.', 'success')}
    <div style="margin-top:24px;background:#f0faf0;border-radius:12px;padding:16px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#2e7d32;">💚 Thank you for choosing Herbal Power. We look forward to serving you again!</p>
    </div>
  `;
  return createEmailLayout(content, { 
    accentColor: '#2e7d32', 
    statusLabel: 'ORDER DELIVERED', 
    statusIcon: '🎉',
    preheader: `Order #${order.orderNumber} has been delivered`
  });
};

const orderCancelled = (order) => {
  const content = `
    <h1 style="margin:0 0 12px 0;font-size:24px;font-weight:600;color:#222;">Order Cancelled, ${order.customerName.split(' ')[0]}</h1>
    <p style="margin:0 0 20px 0;font-size:15px;color:#555;line-height:1.5;">
      We're writing to confirm that order <strong>#${order.orderNumber}</strong> has been cancelled as requested.
    </p>
    <div style="background:#fff5f5;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 10px 0;font-weight:600;color:#c62828;">Cancellation Details:</p>
      <p style="margin:0;font-size:14px;color:#555;">Order total of Rs. ${(order.total || 0).toLocaleString()} has been cancelled. No charges will be processed.</p>
    </div>
    ${buildOrderSummary(order)}
    ${buildNoticeBox('If you did not request this cancellation or have any questions, please reply to this email immediately.', 'warning')}
  `;
  return createEmailLayout(content, { 
    accentColor: '#c62828', 
    statusLabel: 'ORDER CANCELLED', 
    statusIcon: '❌',
    preheader: `Order #${order.orderNumber} has been cancelled`
  });
};

// ── EMAIL SUBJECT LINES ──────────────────────────────────────────────────────
const subjects = {
  pending:    (n) => `✨ Order Received #${n} – Herbal Power`,
  confirmed:  (n) => `✅ Order Confirmed #${n} – Herbal Power`,
  processing: (n) => `⚙️ Order Being Prepared #${n} – Herbal Power`,
  shipped:    (n) => `🚚 Your Order is On the Way #${n} – Herbal Power`,
  delivered:  (n) => `🎉 Order Delivered #${n} – Thank You! – Herbal Power`,
  cancelled:  (n) => `❌ Order Cancelled #${n} – Herbal Power`,
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