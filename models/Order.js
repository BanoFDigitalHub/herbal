const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: String,
  productCode: String,
  variant: String,
  image: String,
  price: Number,
  quantity: { type: Number, default: 1 },
  subtotal: Number
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  address: { type: String, required: true },
  city: { type: String, required: true },
  notes: { type: String, default: '' },
  items: [orderItemSchema],
  subtotal: Number,
  deliveryFee: { type: Number, default: 0 },
  total: Number,
  paymentMethod: { type: String, default: 'COD' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  }
}, { timestamps: true });

orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.models.Order.countDocuments();
    const stamp = Date.now().toString().slice(-5);
    this.orderNumber = `VC${stamp}${(count + 1).toString().padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
