const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// PUBLIC: list active categories
router.get('/', async (req, res) => {
  try {
    const cats = await Category.find({ active: true }).sort({ order: 1, createdAt: 1 });
    res.json({ success: true, categories: cats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN: list all
router.get('/all', auth, async (req, res) => {
  try {
    const cats = await Category.find().sort({ order: 1, createdAt: 1 });
    res.json({ success: true, categories: cats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN: create
router.post('/', auth, async (req, res) => {
  try {
    const { name, heroImage, heroTitle, heroSubtitle, order } = req.body;
    const cat = new Category({ name, heroImage, heroTitle, heroSubtitle, order: order || 0 });
    await cat.save();
    res.json({ success: true, category: cat });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ADMIN: upload hero image for category
router.post('/upload-hero', auth, (req, res, next) => { req.uploadFolder = 'gallery'; next(); }, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file' });
  const url = `/uploads/gallery/${req.file.filename}`;
  res.json({ success: true, url });
});

// ADMIN: update
router.put('/:id', auth, async (req, res) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, category: cat });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ADMIN: delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ success: false, message: 'Not found' });
    if (cat.isDefault) return res.status(400).json({ success: false, message: 'Cannot delete default category' });
    await cat.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
