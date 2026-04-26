const mongoose = require('mongoose');
const slugify = require('slugify');

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  discountPrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0 }
}, { _id: true });

const detailSchema = new mongoose.Schema({
  key: String,
  value: String
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, default: '' },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  text: { type: String, required: true },
  verified: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true },
  productCode: { type: String, unique: true }, // e.g. 12345
  productUrl: { type: String, default: '' },   // full link
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  mainImage: { type: String, required: true }, // URL or /uploads path
  gallery: [{ type: String }],
  shortDescription: { type: String, default: '' },
  description: { type: String, default: '' },
  details: [detailSchema], // additional details key-value
  variants: [variantSchema],
  price: { type: Number, required: true },
  discountPrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  reviews: [reviewSchema],
  averageRating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  saleTag: { type: String, default: '' }, // SALE, NEW, POPULAR, BEST
  active: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.pre('save', async function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }

  // generate productCode (5 random digits) once
  if (!this.productCode) {
    let unique = false;
    while (!unique) {
      const code = Math.floor(10000 + Math.random() * 90000).toString();
      const exists = await mongoose.models.Product.findOne({ productCode: code });
      if (!exists) {
        this.productCode = code;
        unique = true;
      }
    }
  }

  // recompute average rating
  if (this.reviews && this.reviews.length > 0) {
    const sum = this.reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    this.averageRating = +(sum / this.reviews.length).toFixed(1);
    this.reviewsCount = this.reviews.length;
  } else {
    this.averageRating = 0;
    this.reviewsCount = 0;
  }

  // build product URL
  const domain = process.env.DOMAIN || '';
  this.productUrl = `${domain}/product/${this.slug}-${this.productCode}`;

  next();
});

module.exports = mongoose.model('Product', productSchema);
