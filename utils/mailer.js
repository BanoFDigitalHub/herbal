const nodemailer = require('nodemailer');
const path = require('path');
const fs   = require('fs');

// ─── Logo ──────────────────────────────────────────────────────────────────────
const logoPath = path.join(__dirname, '..', 'logo.png');

// ─── Transporter — Gmail App Password ─────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   'smtp-relay.brevo.com',
  port:   587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
});
// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (p) => `Rs. ${Number(p || 0).toLocaleString()}`;

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

const ordNo = (order) =>
  order.orderNumber || String(order._id).toUpperCase().slice(-8);

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
          <td style="font-size:13px;color:#6a9a72;padding-bottom:16px;">Delivery</td>
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

// ─── Delivery Details ──────────────────────────────────────────────────────────
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

// ─── Order Box ─────────────────────────────────────────────────────────────────
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

// ─── Base Shell ────────────────────────────────────────────────────────────────
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

        <!-- Top Green Bar -->
        <tr>
          <td style="height:3px;background:linear-gradient(90deg,#2e7d44,#5dba72,#2e7d44);"></td>
        </tr>

        <!-- Logo -->
        <tr>
          <td style="padding:40px 48px 28px;text-align:center;background:#ffffff;">
            <img src="cid:herbal-logo" alt="Herbal Store"
                 style="max-width:160px;height:auto;display:block;margin:0 auto 18px;"/>
            <div style="width:36px;height:1px;background:#3a8a52;margin:0 auto;"></div>
          </td>
        </tr>

        ${bodyContent}

        <!-- Footer -->
        <tr>
          <td style="background:#f0f7f2;padding:28px 48px;text-align:center;
                     border-top:1px solid #d0e5d8;">
            <div style="font-family:Georgia,serif;font-size:13px;letter-spacing:0.14em;
                        color:#1a2e1e;text-transform:uppercase;margin-bottom:5px;">
              Herbal Store
            </div>
            <div style="font-size:11px;color:#6a9a72;letter-spacing:0.08em;margin-bottom:6px;">
              Pure · Natural · Genuine
            </div>
            <div style="font-size:11px;color:#8ab890;margin-bottom:4px;">
              📞 0331-7358159
            </div>
            <a href="${process.env.DOMAIN || 'https://herbalpowerstore.com'}"
               style="font-size:11px;color:#3a8a52;text-decoration:none;letter-spacing:0.06em;">
              herbalpowerstore.com
            </a>
            <div style="margin-top:14px;font-size:10px;color:#8ab890;">
              © ${new Date().getFullYear()} Herbal Store. All rights reserved. Pakistan
            </div>
          </td>
        </tr>

        <!-- Bottom Green Bar -->
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

// 1. Order Received
const pendingTemplate = (order) => {
  const body = `
    <tr>
      <td style="padding:0 48px 28px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">🌿</div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;
                   font-weight:400;color:#1a2e1e;letter-spacing:0.06em;">
          Order Received!
        </h1>
        <p style="margin:0;font-size:13px;color:#6a9a72;letter-spacing:0.1em;text-transform:uppercase;">
          Shukriya, ${order.customerName}
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
      'Aapka order successfully receive ho gaya hai. Hum jald hi aapko ' +
      'deliver karenge. Har step pe aapko update kiya jayega. ' +
      'Koi sawal ho tou WhatsApp ya email pe rabta karein.'
    )}`;
  return { subject: `Order Received — ${ordNo(order)} | Herbal Store`, html: shell(body) };
};

// 2. Confirmed
const confirmedTemplate = (order) => {
  const body = `
    <tr>
      <td style="padding:0 48px 28px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">✅</div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;
                   font-weight:400;color:#1a2e1e;letter-spacing:0.06em;">
          Order Confirmed
        </h1>
        <p style="margin:0;font-size:13px;color:#6a9a72;letter-spacing:0.1em;text-transform:uppercase;">
          Mubarak ho, ${order.customerName}!
        </p>
      </td>
    </tr>
    ${orderBox(order, '#2e7d44', 'Confirmed')}
    ${noteBox(
      'Aapka order confirm ho gaya hai aur ab tayyari shuru ho gayi hai. ' +
      'Jaise hi dispatch hoga, aapko immediately update karenge. ' +
      'Herbal Store choose karne ka shukriya!'
    )}`;
  return { subject: `Order Confirmed — ${ordNo(order)} | Herbal Store`, html: shell(body) };
};

// 3. Processing
const processingTemplate = (order) => {
  const body = `
    <tr>
      <td style="padding:0 48px 28px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">⚙️</div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;
                   font-weight:400;color:#1a2e1e;letter-spacing:0.06em;">
          Order Processing
        </h1>
        <p style="margin:0;font-size:13px;color:#6a9a72;letter-spacing:0.1em;text-transform:uppercase;">
          Pack ho raha hai, ${order.customerName}
        </p>
      </td>
    </tr>
    ${orderBox(order, '#3a8a52', 'Processing')}
    ${noteBox(
      'Aapka order carefully pack kiya ja raha hai. ' +
      'Yeh process 1-2 business days mein complete ho jata hai. ' +
      'Dispatch hone pe aapko shipping notification milegi.'
    )}`;
  return { subject: `Order Processing — ${ordNo(order)} | Herbal Store`, html: shell(body) };
};

// 4. Shipped
const shippedTemplate = (order) => {
  const body = `
    <tr>
      <td style="padding:0 48px 28px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">🚚</div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;
                   font-weight:400;color:#1a2e1e;letter-spacing:0.06em;">
          Order Dispatched!
        </h1>
        <p style="margin:0;font-size:13px;color:#6a9a72;letter-spacing:0.1em;text-transform:uppercase;">
          Raste mein hai, ${order.customerName}
        </p>
      </td>
    </tr>
    ${orderBox(order, '#5dba72', 'Shipped')}
    ${noteBox(
      'Aapka order dispatch ho gaya hai aur aapki taraf aa raha hai. ' +
      '<strong>2-5 business days</strong> mein deliver ho jayega. ' +
      'Phone accessible rakhein — courier call kar sakta hai.'
    )}`;
  return { subject: `Order Dispatched — ${ordNo(order)} | Herbal Store`, html: shell(body) };
};

// 5. Delivered
const deliveredTemplate = (order) => {
  const body = `
    <tr>
      <td style="padding:0 48px 28px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">🎁</div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;
                   font-weight:400;color:#1a2e1e;letter-spacing:0.06em;">
          Delivered!
        </h1>
        <p style="margin:0;font-size:13px;color:#6a9a72;letter-spacing:0.1em;text-transform:uppercase;">
          Pasand aaye, ${order.customerName}!
        </p>
      </td>
    </tr>
    ${orderBox(order, '#1a2e1e', 'Delivered')}
    ${noteBox(
      '<span style="font-family:Georgia,serif;font-size:15px;color:#1a2e1e;display:block;margin-bottom:8px;">' +
      'Herbal Store choose karne ka dil se shukriya!</span>' +
      'Aapka order successfully deliver ho gaya hai. Umeed hai aap bilkul satisfied hain. ' +
      'Koi concern ho tou reply karein ya WhatsApp pe rabta karein — hum hamesha available hain.'
    )}`;
  return { subject: `Delivered — ${ordNo(order)} | Herbal Store`, html: shell(body) };
};

// 6. Cancelled
const cancelledTemplate = (order) => {
  const body = `
    <tr>
      <td style="padding:0 48px 28px;text-align:center;">
        <div style="font-size:36px;margin-bottom:12px;">✕</div>
        <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:24px;
                   font-weight:400;color:#1a2e1e;letter-spacing:0.06em;">
          Order Cancelled
        </h1>
        <p style="margin:0;font-size:13px;color:#6a9a72;letter-spacing:0.1em;text-transform:uppercase;">
          Maafi chahte hain, ${order.customerName}
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
      `Aapka order <strong>${ordNo(order)}</strong> جس کی مالیت <strong>${fmt(order.total)}</strong> thi, cancel ho gaya hai. ` +
      'Agar yeh ghalti se hua hai ya koi sawal hai tou WhatsApp ya email pe rabta karein.',
      '#c0392b', '#fdf5f5'
    )}
    ${noteBox(
      'Dobara order karne ke liye visit karein: ' +
      `<a href="${process.env.DOMAIN || 'https://herbalpowerstore.com'}" style="color:#3a8a52;text-decoration:none;">herbalpowerstore.com</a>`
    )}`;
  return { subject: `Order Cancelled — ${ordNo(order)} | Herbal Store`, html: shell(body) };
};

// ══════════════════════════════════════════════════════════════════════════════
//  CORE SEND
// ══════════════════════════════════════════════════════════════════════════════
const sendMail = async (to, subject, html, attempt = 1) => {
  try {
    const attachments = [];
    if (fs.existsSync(logoPath)) {
      attachments.push({
        filename: 'logo.png',
        path:     logoPath,
        cid:      'herbal-logo',
      });
    } else {
      console.warn('⚠️ logo.png not found — sending without logo');
    }

    await transporter.sendMail({
      from:        `"Herbal Store" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      attachments,
    });

    console.log(`✅ Email sent → ${to} | ${subject}`);

  } catch (err) {
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

// ══════════════════════════════════════════════════════════════════════════════
//  EXPORTS — orders.js route ke sath compatible
//  templates aur subjects same format mein hain
// ══════════════════════════════════════════════════════════════════════════════
const templates = {
  pending:    pendingTemplate,
  confirmed:  confirmedTemplate,
  processing: processingTemplate,
  shipped:    shippedTemplate,
  delivered:  deliveredTemplate,
  cancelled:  cancelledTemplate,
};

const subjects = {
  pending:    (num) => `Order Received — ${num} | Herbal Store`,
  confirmed:  (num) => `Order Confirmed — ${num} | Herbal Store`,
  processing: (num) => `Order Processing — ${num} | Herbal Store`,
  shipped:    (num) => `Order Dispatched — ${num} | Herbal Store`,
  delivered:  (num) => `Delivered — ${num} | Herbal Store`,
  cancelled:  (num) => `Order Cancelled — ${num} | Herbal Store`,
};

module.exports = { sendMail, templates, subjects };