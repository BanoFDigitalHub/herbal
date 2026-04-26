const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// PUBLIC: place order from frontend
router.post('/', async (req, res) => {
  try {
    const { customerName, phone, email, address, city, notes, items, deliveryFee } = req.body;

    if (!customerName || !phone || !address || !city || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // build server-side items (prevent price tampering)
    const builtItems = [];
    let subtotal = 0;
    for (const it of items) {
      const product = await Product.findById(it.productId);
      if (!product) continue;

      // pick variant if any
      let price = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;
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
        product: product._id,
        productName: product.name,
        productCode: product.productCode,
        variant: variantName,
        image: product.mainImage,
        price,
        quantity: qty,
        subtotal: sub
      });
    }

    if (!builtItems.length) {
      return res.status(400).json({ success: false, message: 'No valid items' });
    }

    const fee = parseFloat(deliveryFee) || 0;
    const total = subtotal + fee;

    const order = new Order({
      customerName, phone, email, address, city, notes,
      items: builtItems,
      subtotal, deliveryFee: fee, total
    });
    await order.save();

    // build whatsapp link
    const waNumber = process.env.WHATSAPP_NUMBER || '923001234567';
    let msg = `🛒 *New Order - ${order.orderNumber}*\n\n`;
    msg += `👤 *Name:* ${customerName}\n📱 *Phone:* ${phone}\n📍 *Address:* ${address}, ${city}\n\n`;
    msg += `*Items:*\n`;
    builtItems.forEach((i, idx) => {
      msg += `${idx + 1}. ${i.productName}${i.variant ? ' ('+i.variant+')' : ''} x${i.quantity} = Rs.${i.subtotal}\n`;
    });
    msg += `\n💰 Subtotal: Rs.${subtotal}\n🚚 Delivery: Rs.${fee}\n*Total: Rs.${total}*`;
    if (notes) msg += `\n\n📝 Notes: ${notes}`;

    const whatsappLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;

    res.json({ success: true, order, whatsappLink });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN: list all orders
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

// ADMIN: single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN: update status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ADMIN: delete
router.delete('/:id', auth, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ADMIN: dashboard stats
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });

    const revenueAgg = await Order.aggregate([
      { $match: { status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const totalRevenue = revenueAgg[0] ? revenueAgg[0].total : 0;

    const totalProducts = await Product.countDocuments();
    const lowStock = await Product.countDocuments({ stock: { $lte: 5 } });

    // last 7 days revenue
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
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

module.exports = router;
