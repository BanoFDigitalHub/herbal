// ─────────────────────────────────────────────────────────────────────────────
// mailer.js  —  Herbal Power
// ROOT FIX: Custom DNS lookup jo SIRF IPv4 return karta hai
// Render pe Node v24 mein dns.setDefaultResultOrder kaam nahi karta
// Is liye nodemailer ka `lookup` option use karo — guaranteed IPv4 only
// ─────────────────────────────────────────────────────────────────────────────

const nodemailer = require('nodemailer');
const dns        = require('dns');
const path       = require('path');
const fs         = require('fs');

// ─────────────────────────────────────────────
// LOGO
// ─────────────────────────────────────────────
const logoPath = path.join(__dirname, '..', 'logo.png');

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const fmt = (p) => `PKR ${Number(p || 0).toLocaleString()}`;

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const ordNo = (order) =>
  order.orderNumber || String(order._id).slice(-8).toUpperCase();

// ─────────────────────────────────────────────
// ⭐ ROOT FIX: IPv4-only DNS lookup
//
// Yeh function nodemailer TCP connection banane se
// PEHLE call hota hai. dns.resolve4() se directly
// IPv4 address return karte hain — IPv6 ka chance
// hi nahi milta Render pe.
// ─────────────────────────────────────────────// ─────────────────────────────────────────────
// ⭐ ROOT FIX: IPv4-only DNS lookup
// ─────────────────────────────────────────────
function ipv4Lookup(hostname, _options, callback) {
  dns.resolve4(hostname, (err, addresses) => {
    if (err || !addresses || addresses.length === 0) {
      return dns.lookup(hostname, { family: 4 }, callback);
    }
    callback(null, addresses[0], 4);
  });
}

// ─────────────────────────────────────────────
// TRANSPORTER — Port 587, family:4, IPv4 lookup
// ─────────────────────────────────────────────
const createTransporter = () =>
  nodemailer.createTransport({
    host:   'smtp.gmail.com',
    port:   587,          // ✅ 465 → 587 (Render pe 465 block hai)
    secure: false,        // ✅ 587 ke liye false
    family: 4,            // ✅ Extra IPv4 force

    lookup: ipv4Lookup,   // ✅ DNS level pe IPv4 only

    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },

    pool: false,

    connectionTimeout: 20000,
    greetingTimeout:   15000,
    socketTimeout:     20000,

    tls: {
      rejectUnauthorized: false,
      servername: 'smtp.gmail.com',  // ✅ TLS SNI fix
    },
  });

// ─────────────────────────────────────────────
// EMAIL SENDER — exponential backoff retry
// ─────────────────────────────────────────────
const sendMail = async (to, subject, html, attempt = 1) => {
  const transporter = createTransporter();

  try {
    const attachments = [];
    if (fs.existsSync(logoPath)) {
      attachments.push({ filename: 'logo.png', path: logoPath, cid: 'logo' });
    }

    const info = await transporter.sendMail({
      from:        `"Herbal Power" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      attachments,
    });

    console.log(`✅ Email sent → ${to} | ${subject}`);
    try { transporter.close(); } catch (_) {}
    return info;

  } catch (err) {
    try { transporter.close(); } catch (_) {}
    console.error(`❌ Email attempt ${attempt}/3 failed → ${to} | ${err.message}`);

    if (attempt < 3) {
      const delay = attempt * 2000;
      console.log(`🔄 Retrying in ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
      return sendMail(to, subject, html, attempt + 1);
    }

    throw new Error(`Email failed after 3 attempts: ${err.message}`);
  }
};

// ─── Items Table ───────────────────────────────────────────────────────────────
const itemsHTML = (items = []) =>
  items.map(item => `
  <tr>
    <td style="padding:16px 0;border-bottom:1px solid #e0ede5;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width:58px;vertical-align:top;">
            ${item.image
              ? `<img src="${item.image}" width="50" height="50"
                   style="border-radius:3px;object-fit:cover;display:block;border:1px solid #d0e5d8;"/>`
              : `<div style="width:50px;height:50px;background:#eaf3ec;border-radius:3px;"></div>`
            }
          </td>
          <td style="padding-left:14px;vertical-align:top;">
            <div style="font-family:Georgia,serif;font-size:14px;color:#1a2e1e;
                        letter-spacing:0.02em;margin-bottom:4px;">
              ${item.productName || item.name || 'Product'}
            </div>
            ${item.variant ? `<div style="font-size:11px;color:#6a9a72;margin-top:2px;">Variant: ${item.variant}</div>` : ''}
            ${item.size    ? `<div style="font-size:11px;color:#6a9a72;margin-top:2px;">Size: ${item.size}</div>`    : ''}
            ${item.color   ? `<div style="font-size:11px;color:#6a9a72;margin-top:2px;">Color: ${item.color}</div>`  : ''}
            <div style="font-size:11px;color:#6a9a72;margin-top:2px;">Qty: ${item.quantity || 1}</div>
          </td>
          <td style="text-align:right;vertical-align:top;">
            <div style="font-family:Georgia,serif;font-size:14px;color:#1a2e1e;">
              ${fmt((item.price || 0) * (item.quantity || 1))}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`).join('');

// ─── Totals Block ──────────────────────────────────────────────────────────────
const totalsHTML = (order) => `
  <tr>
    <td style="padding:8px 48px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:13px;color:#6a9a72;padding-bottom:8px;">Subtotal</td>
          <td style="font-size:13px;color:#6a9a72;text-align:right;padding-bottom:8px;">
            ${fmt(order.subtotal)}
          </td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#6a9a72;padding-bottom:16px;">Shipping</td>
          <td style="font-size:13px;color:#6a9a72;text-align:right;padding-bottom:16px;">
            ${Number(order.deliveryFee || 0) > 0 ? fmt(order.deliveryFee) : 'Free'}
          </td>
        </tr>
        <tr>
          <td style="border-top:1px solid #d0e5d8;padding-top:14px;
                     font-family:Georgia,serif;font-size:17px;color:#1a2e1e;">Total</td>
          <td style="border-top:1px solid #d0e5d8;padding-top:14px;
                     font-family:Georgia,serif;font-size:17px;color:#1a2e1e;
                     text-align:right;font-weight:700;">
            ${fmt(order.total)}
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

// ─── Delivery Details Block ────────────────────────────────────────────────────
const deliveryHTML = (order) => `
  <tr><td style="padding:0 48px 24px;">
    <div style="height:1px;background:#d0e5d8;"></div>
  </td></tr>
  <tr>
    <td style="padding:0 48px 24px;">
      <div style="font-size:10px;letter-spacing:0.28em;color:#6a9a72;
                  text-transform:uppercase;margin-bottom:14px;">Delivery Details</div>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width:50%;vertical-align:top;padding-bottom:12px;">
            <div style="font-size:11px;color:#8ab890;margin-bottom:4px;">Name</div>
            <div style="font-family:Georgia,serif;font-size:14px;color:#1a2e1e;">
              ${order.customerName || ''}
            </div>
          </td>
          <td style="width:50%;vertical-align:top;padding-bottom:12px;">
            <div style="font-size:11px;color:#8ab890;margin-bottom:4px;">Phone</div>
            <div style="font-family:Georgia,serif;font-size:14px;color:#1a2e1e;">
              ${order.phone || ''}
            </div>
          </td>
        </tr>
        ${order.address ? `
        <tr>
          <td colspan="2" style="padding-bottom:12px;">
            <div style="font-size:11px;color:#8ab890;margin-bottom:4px;">Delivery Address</div>
            <div style="font-family:Georgia,serif;font-size:14px;color:#1a2e1e;">
              ${order.address}${order.city ? `, ${order.city}` : ''}
            </div>
          </td>
        </tr>` : ''}
        <tr>
          <td colspan="2">
            <div style="font-size:11px;color:#8ab890;margin-bottom:4px;">Payment Method</div>
            <div style="font-family:Georgia,serif;font-size:14px;color:#1a2e1e;">
              ${order.paymentMethod || 'Cash on Delivery'}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

// ─── Order ID Box ──────────────────────────────────────────────────────────────
const orderBox = (order, badgeColor, badgeText) => `
  <tr>
    <td style="padding:0 48px 28px;">
      <div style="background:#f0f7f2;border:1px solid #c5e0cc;border-radius:2px;
                  padding:20px;text-align:center;">
        <div style="font-size:10px;letter-spacing:0.3em;color:#6a9a72;
                    text-transform:uppercase;margin-bottom:8px;">Order Reference</div>
        <div style="font-family:Georgia,serif;font-size:22px;color:#1a2e1e;
                    letter-spacing:0.14em;">${ordNo(order)}</div>
        <div style="font-size:11px;color:#8ab890;margin-top:6px;">${fmtDate(order.createdAt)}</div>
        <div style="display:inline-block;margin-top:12px;padding:5px 18px;
                    background:${badgeColor};color:#fff;font-size:10px;
                    letter-spacing:0.25em;text-transform:uppercase;border-radius:1px;">
          ${badgeText}
        </div>
      </div>
    </td>
  </tr>`;

// ─── Note Box ──────────────────────────────────────────────────────────────────
const noteBox = (text, borderColor = '#3a8a52', bgColor = '#f0f7f2') => `
  <tr>
    <td style="padding:0 48px 40px;">
      <div style="background:${bgColor};border-left:3px solid ${borderColor};
                  padding:16px 18px;border-radius:0 2px 2px 0;">
        <p style="margin:0;font-size:13px;color:#4a6e52;line-height:1.8;">${text}</p>
      </div>
    </td>
  </tr>`;

// ─── Base Email Shell ──────────────────────────────────────────────────────────
const shell = (bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#e8f3eb;
             font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:#e8f3eb;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0"
             style="max-width:600px;width:100%;background:#ffffff;border-radius:2px;
                    box-shadow:0 2px 32px rgba(0,0,0,0.08);overflow:hidden;">
        <tr>
          <td style="height:3px;background:linear-gradient(90deg,#2e7d44,#5dba72,#2e7d44);"></td>
        </tr>
        <tr>
          <td style="padding:40px 48px 28px;text-align:center;background:#ffffff;">
            <img src="cid:logo" alt="Herbal Power"
                 style="max-width:160px;height:auto;display:block;margin:0 auto 18px;"/>
            <div style="width:36px;height:1px;background:#3a8a52;margin:0 auto;"></div>
          </td>
        </tr>
        ${bodyContent}
        <tr>
          <td style="background:#f0f7f2;padding:28px 48px;text-align:center;
                     border-top:1px solid #d0e5d8;">
            <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.14em;
                        color:#1a2e1e;text-transform:uppercase;margin-bottom:5px;">
              Herbal Power
            </div>
            <div style="font-size:11px;color:#6a9a72;letter-spacing:0.08em;margin-bottom:10px;">
              Natural · Pure · Powerful
            </div>
            <a href="${process.env.DOMAIN || '#'}"
               style="font-size:11px;color:#3a8a52;text-decoration:none;letter-spacing:0.06em;">
              ${(process.env.DOMAIN || '').replace('https://', '')}
            </a>
            <div style="margin-top:14px;font-size:10px;color:#8ab890;">
              © ${new Date().getFullYear()} Herbal Power. All rights reserved.
            </div>
          </td>
        </tr>
        <tr>
          <td style="height:3px;background:linear-gradient(90deg,#2e7d44,#5dba72,#2e7d44);"></td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ══════════════════════════════════════════════════════════════════════════════
//  TEMPLATES
// ══════════════════════════════════════════════════════════════════════════════
const templates = {

  pending: (order) => shell(`
    <tr>
      <td style="padding:0 48px 28px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">🌿</div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;
                   font-weight:400;color:#1a2e1e;letter-spacing:0.06em;">Order Received</h1>
        <p style="margin:0;font-size:13px;color:#6a9a72;letter-spacing:0.1em;text-transform:uppercase;">
          Thank you, ${order.customerName}
        </p>
      </td>
    </tr>
    ${orderBox(order, '#1a2e1e', 'Received')}
    ${deliveryHTML(order)}
    <tr><td style="padding:0 48px 24px;"><div style="height:1px;background:#d0e5d8;"></div></td></tr>
    <tr>
      <td style="padding:0 48px 8px;">
        <div style="font-size:10px;letter-spacing:0.28em;color:#6a9a72;
                    text-transform:uppercase;margin-bottom:8px;">Your Order</div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          ${itemsHTML(order.items)}
        </table>
      </td>
    </tr>
    ${totalsHTML(order)}
    ${noteBox(
      'We have received your order and it will be delivered to you soon. ' +
      'You will be notified at every step. For any queries, reach us on WhatsApp or reply to this email.'
    )}`),

  confirmed: (order) => shell(`
    <tr>
      <td style="padding:0 48px 28px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">✅</div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;
                   font-weight:400;color:#1a2e1e;letter-spacing:0.06em;">Order Confirmed</h1>
        <p style="margin:0;font-size:13px;color:#6a9a72;letter-spacing:0.1em;text-transform:uppercase;">
          Great news, ${order.customerName}
        </p>
      </td>
    </tr>
    ${orderBox(order, '#2e7d44', 'Confirmed')}
    ${noteBox(
      'Your order has been confirmed and is now being prepared with great care. ' +
      'We will notify you as soon as it is on its way. Thank you for choosing Herbal Power.'
    )}`),

  processing: (order) => shell(`
    <tr>
      <td style="padding:0 48px 28px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">⚙️</div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;
                   font-weight:400;color:#1a2e1e;letter-spacing:0.06em;">Order Being Prepared</h1>
        <p style="margin:0;font-size:13px;color:#6a9a72;letter-spacing:0.1em;text-transform:uppercase;">
          We are getting it ready, ${order.customerName}
        </p>
      </td>
    </tr>
    ${orderBox(order, '#3a8a52', 'Processing')}
    ${noteBox(
      'Your order is currently being processed and carefully packed. ' +
      'This usually takes 1–2 business days. You will receive a shipping notification once dispatched.'
    )}`),

  shipped: (order) => shell(`
    <tr>
      <td style="padding:0 48px 28px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">🚚</div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;
                   font-weight:400;color:#1a2e1e;letter-spacing:0.06em;">Your Order Is On Its Way</h1>
        <p style="margin:0;font-size:13px;color:#6a9a72;letter-spacing:0.1em;text-transform:uppercase;">
          Dispatched with care, ${order.customerName}
        </p>
      </td>
    </tr>
    ${orderBox(order, '#5dba72', 'Shipped')}
    ${noteBox(
      'Your order has been dispatched and is on its way to you. ' +
      'Please expect delivery within <strong>2–5 business days</strong>. ' +
      'Keep your phone accessible — the courier may call before arrival.'
    )}`),

  delivered: (order) => shell(`
    <tr>
      <td style="padding:0 48px 28px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">🎁</div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;
                   font-weight:400;color:#1a2e1e;letter-spacing:0.06em;">Delivered with Care</h1>
        <p style="margin:0;font-size:13px;color:#6a9a72;letter-spacing:0.1em;text-transform:uppercase;">
          We hope you love it, ${order.customerName}
        </p>
      </td>
    </tr>
    ${orderBox(order, '#1a2e1e', 'Delivered')}
    ${noteBox(
      '<span style="font-family:Georgia,serif;font-size:15px;color:#1a2e1e;display:block;margin-bottom:8px;">' +
      'Thank you for choosing Herbal Power.</span>' +
      'Your order has been successfully delivered. We hope it exceeded your expectations. ' +
      'For any concerns, reply to this email or reach us on WhatsApp — we are always here for you.'
    )}`),

  cancelled: (order) => shell(`
    <tr>
      <td style="padding:0 48px 28px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">✕</div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;
                   font-weight:400;color:#1a2e1e;letter-spacing:0.06em;">Order Cancelled</h1>
        <p style="margin:0;font-size:13px;color:#6a9a72;letter-spacing:0.1em;text-transform:uppercase;">
          We are sorry, ${order.customerName}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 48px 28px;">
        <div style="background:#fdf5f5;border:1px solid #f0ddd8;border-radius:2px;
                    padding:20px;text-align:center;">
          <div style="font-size:10px;letter-spacing:0.3em;color:#6a9a72;
                      text-transform:uppercase;margin-bottom:8px;">Order Reference</div>
          <div style="font-family:Georgia,serif;font-size:22px;color:#1a2e1e;
                      letter-spacing:0.14em;">${ordNo(order)}</div>
          <div style="font-size:11px;color:#8ab890;margin-top:6px;">${fmtDate(order.createdAt)}</div>
          <div style="display:inline-block;margin-top:12px;padding:5px 18px;
                      background:#c0392b;color:#fff;font-size:10px;
                      letter-spacing:0.25em;text-transform:uppercase;border-radius:1px;">
            Cancelled
          </div>
        </div>
      </td>
    </tr>
    ${noteBox(
      `Your order <strong>${ordNo(order)}</strong> totalling <strong>${fmt(order.total)}</strong> has been cancelled. ` +
      'If this was a mistake or you have any questions, please reach out on WhatsApp or reply to this email.',
      '#c0392b', '#fdf5f5'
    )}
    ${noteBox(
      `We hope to serve you again. Visit us at ` +
      `<a href="${process.env.DOMAIN || '#'}" style="color:#3a8a52;text-decoration:none;">` +
      `${(process.env.DOMAIN || '').replace('https://', '')}</a>`
    )}`),
};

// ══════════════════════════════════════════════════════════════════════════════
//  SUBJECTS
// ══════════════════════════════════════════════════════════════════════════════
const subjects = {
  pending:    (num) => `Order Received — ${num} | Herbal Power`,
  confirmed:  (num) => `Order Confirmed — ${num} | Herbal Power`,
  processing: (num) => `Order Processing — ${num} | Herbal Power`,
  shipped:    (num) => `Your Order Is On Its Way — ${num} | Herbal Power`,
  delivered:  (num) => `Delivered — ${num} | Herbal Power`,
  cancelled:  (num) => `Order Cancelled — ${num} | Herbal Power`,
};

// ══════════════════════════════════════════════════════════════════════════════
//  EXPORTS
// ══════════════════════════════════════════════════════════════════════════════
module.exports = { sendMail, templates, subjects };