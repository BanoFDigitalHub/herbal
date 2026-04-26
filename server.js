require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

const app = express();

// middleware
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// static
app.use(express.static(path.join(__dirname, 'public')));

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));

// public config endpoint (whatsapp number etc.)
app.get('/api/config', (req, res) => {
  res.json({
    whatsappNumber: process.env.WHATSAPP_NUMBER || '',
    domain: process.env.DOMAIN || '',
    deliveryFee: 50,
    freeDeliveryAbove: 2000
  });
});

// admin SPA fallback
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// health
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date() }));

// 404 for api
app.use('/api', (req, res) => res.status(404).json({ success: false, message: 'API route not found' }));

// seed defaults
async function seedDefaults() {
  const Category = require('./models/Category');
  const defaults = [
    { name: 'Delay Tablets', slug: 'delay-tablets', isDefault: true, order: 1 },
    { name: 'Delay Spray', slug: 'delay-spray', isDefault: true, order: 2 },
    { name: 'Delay Creams', slug: 'delay-creams', isDefault: true, order: 3 },
    { name: 'Combo Deals', slug: 'combo-deals', isDefault: true, order: 4 }
  ];
  for (const d of defaults) {
    const exists = await Category.findOne({ slug: d.slug });
    if (!exists) await Category.create(d);
  }
  console.log('✓ Default categories ready');
}

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✓ MongoDB connected');
    await seedDefaults();
    app.listen(PORT, () => console.log(`✓ Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('✗ MongoDB connection error:', err.message);
    process.exit(1);
  });
