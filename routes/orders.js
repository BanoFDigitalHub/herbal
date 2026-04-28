const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { sendMail, templates, subjects } = require('../utils/mailer');

// ─── Helper: Send order email safely ─────────────────────────────────────────
const sendOrderEmail = async (order, status) => {
  try {
    if (!order.email || order.email.trim() === '') {
      console.warn(`⚠️ No email for order ${order.orderNumber} — skipping`);
      return;
    }

    const buildTemplate = templates[status];
    if (!buildTemplate) {
      console.warn(`⚠️ No template for status: ${status}`);
      return;
    }

    const html    = buildTemplate(order);
    const subject = subjects[status](order.orderNumber);

    await sendMail(order.email, subject, html);
    console.log(`✅ Email sent [${status}] to ${order.email} — Order ${order.orderNumber}`);
  } catch (err) {
    console.error(`❌ Email failed [${status}] for order ${order.orderNumber}:`, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: place order
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { customerName, phone, email, address, city, notes, items, deliveryFee } = req.body;

    console.log('📦 New order request:', { customerName, phone, email, city, itemCount: items?.length });

    if (!customerName || !phone || !address || !city || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Build server-side items
    const builtItems = [];
    let subtotal = 0;

    for (const it of items) {
      console.log('🔍 Looking up product:', it.productId);
      const product = await Product.findById(it.productId);
      if (!product) {
        console.warn('⚠️ Product not found:', it.productId);
        continue;
      }

      let price = product.discountPrice && product.discountPrice > 0
        ? product.discountPrice
        : product.price;
      let variantName = '';

      if (it.variantId && product.variants && product.variants.length) {
        const v = product.variants.id(it.variantId);
        if (v) {
          variantName = v.name;
          price = v.discountPrice && v.discountPrice > 0 ? v.discountPrice : (v.price || price);
        }
      }

      const qty = parseInt(it.quantity) || 1;
      const sub = price * qty;
      subtotal += sub;

      builtItems.push({
        product:     product._id,
        productName: product.name,
        productCode: product.productCode,
        variant:     variantName,
        image:       product.mainImage,
        price,
        quantity:    qty,
        subtotal:    sub,
      });
    }

    if (!builtItems.length) {
      console.error('❌ No valid items found in order');
      return res.status(400).json({ success: false, message: 'No valid items' });
    }

    const fee   = parseFloat(deliveryFee) || 0;
    const total = subtotal + fee;

    const order = new Order({
      customerName, phone, email, address, city, notes,
      items: builtItems,
      subtotal, deliveryFee: fee, total,
    });
    await order.save();
    console.log('✅ Order saved:', order.orderNumber);

    // Send email — 'pending' status pe orderReceived template jaayega
    await sendOrderEmail(order, 'pending');

    // Build WhatsApp link
    const waNumber = process.env.WHATSAPP_NUMBER || '923001234567';
    let msg = `🌿 *New Order - ${order.orderNumber}*\n\n`;
    msg += `👤 *Name:* ${customerName}\n📱 *Phone:* ${phone}\n📍 *Address:* ${address}, ${city}\n\n`;
    msg += `*Items:*\n`;
    builtItems.forEach((i, idx) => {
      msg += `${idx + 1}. ${i.productName}${i.variant ? ' (' + i.variant + ')' : ''} x${i.quantity} = Rs.${i.subtotal}\n`;
    });
    msg += `\n💰 Subtotal: Rs.${subtotal}\n🚚 Delivery: Rs.${fee}\n*Total: Rs.${total}*`;
    if (notes) msg += `\n\n📝 Notes: ${notes}`;

    const whatsappLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;

    res.json({ success: true, order, whatsappLink });

  } catch (err) {
    console.error('❌ Order error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: list all orders
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: stats  ← /:id se PEHLE hona zaroori hai warna crash karta hai
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const totalOrders     = await Order.countDocuments();
    const pendingOrders   = await Order.countDocuments({ status: 'pending' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });

    const revenueAgg = await Order.aggregate([
      { $match: { status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalRevenue = revenueAgg[0] ? revenueAgg[0].total : 0;

    const totalProducts = await Product.countDocuments();
    const lowStock      = await Product.countDocuments({ stock: { $lte: 5 } });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id:     { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders:  { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      stats: { totalOrders, pendingOrders, deliveredOrders, totalRevenue, totalProducts, lowStock, recent }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: single order
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: update status
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    await sendOrderEmail(order, status);
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: delete
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;