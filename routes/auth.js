const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (email.toLowerCase() !== adminEmail.toLowerCase() || password !== adminPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { email: adminEmail, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token, admin: { email: adminEmail } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/verify', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.json({ success: false });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ success: true, admin: decoded });
  } catch {
    res.json({ success: false });
  }
});

module.exports = router;
