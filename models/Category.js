const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  slug: { type: String, unique: true, lowercase: true },
  heroImage: { type: String, default: '' },
  heroTitle: { type: String, default: '' },
  heroSubtitle: { type: String, default: '' },
  isDefault: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
