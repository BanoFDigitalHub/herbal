const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// helper - parse possibly-stringified JSON fields
const parseField = (v) => {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return v; }
  }
  return v;
};

// PUBLIC: list active products (filter by category, featured, bestseller, search)
router.get('/', async (req, res) => {
  try {
    const { category, featured, bestseller, search, limit } = req.query;
    const query = { active: true };
    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;
    if (bestseller === 'true') query.isBestSeller = true;
    if (search) query.name = { $regex: search, $options: 'i' };

    let q = Product.find(query).populate('category', 'name slug').sort({ createdAt: -1 });
    if (limit) q = q.limit(parseInt(limit));
    const products = await q;
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUBLIC: single product by slug-code
router.get('/slug/:slugCode', async (req, res) => {
  try {
    const slugCode = req.params.slugCode;
    // last 5 digits = productCode
    const code = slugCode.slice(-5);
    const product = await Product.findOne({ productCode: code, active: true }).populate('category', 'name slug');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUBLIC: by id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN: list all (incl inactive)
router.get('/admin/all', auth, async (req, res) => {
  try {
    const products = await Product.find().populate('category', 'name').sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN: upload single image
router.post('/upload', auth, (req, res, next) => { req.uploadFolder = 'products'; next(); }, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file' });
  res.json({ success: true, url: `/uploads/products/${req.file.filename}` });
});

// ADMIN: upload multiple gallery images
router.post('/upload-gallery', auth, (req, res, next) => { req.uploadFolder = 'products'; next(); }, upload.array('images', 10), (req, res) => {
  if (!req.files || !req.files.length) return res.status(400).json({ success: false, message: 'No files' });
  const urls = req.files.map(f => `/uploads/products/${f.filename}`);
  res.json({ success: true, urls });
});

// ADMIN: create product
router.post('/', auth, async (req, res) => {
  try {
    const data = {
      ...req.body,
      details: parseField(req.body.details) || [],
      variants: parseField(req.body.variants) || [],
      gallery: parseField(req.body.gallery) || [],
      reviews: parseField(req.body.reviews) || []
    };
    const product = new Product(data);
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ADMIN: update product
router.put('/:id', auth, async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.details !== undefined) data.details = parseField(data.details) || [];
    if (data.variants !== undefined) data.variants = parseField(data.variants) || [];
    if (data.gallery !== undefined) data.gallery = parseField(data.gallery) || [];
    if (data.reviews !== undefined) data.reviews = parseField(data.reviews) || [];

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    Object.assign(product, data);
    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ADMIN: delete product
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ADMIN: update stock quickly
router.patch('/:id/stock', auth, async (req, res) => {
  try {
    const { stock } = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, { stock }, { new: true });
    res.json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
