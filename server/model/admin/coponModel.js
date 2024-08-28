const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  couponName: {
    type: String,
    required: true
  },
  couponCode: {
    type: String,
    required: true,
  },
  startDate: {
    type: String,
    required: true 
  },
  expiryDate: {
    type: String,
    required: true
  },
  discountPercentage: {
    type: Number,
    required: true
  },
  maxAmount: {
    type: Number,
    required: true
  }
});

couponSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 });
const Copon = mongoose.model('coupons', couponSchema);
module.exports = Copon;
