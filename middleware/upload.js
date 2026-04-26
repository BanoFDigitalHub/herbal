const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = req.uploadFolder || 'products';
    const dest = path.join(__dirname, '..', 'public', 'uploads', folder);
    ensureDir(dest);
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const safe = file.originalname
      .replace(ext, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .slice(0, 40);
    cb(null, `${safe}-${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|avif|gif/;
  const ok = allowed.test(file.mimetype) || allowed.test(path.extname(file.originalname).toLowerCase());
  ok ? cb(null, true) : cb(new Error('Only image files allowed'));
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 } // 8MB
});
