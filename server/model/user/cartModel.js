const mongoose = require('mongoose');
const User = require('../../model/user/userModel')
const Product = require('../../model/admin/productModel')
const Coupon=require('../../model/admin/coponModel')


const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User
  },
  couponId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:Coupon
  },
  items:
    [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: Product
      },
      quantity: {
        type: Number,
        default: 1
      },
      total: {
        type: Number,

      },
      offerPrice: {
        type: Number,
        required: false
      }
    }],
  grandTotal: {
    type: Number,
  },
  discount: {
    type: Number,
    default: 0
  },
  totalAmount:{
    type:Number
  },
  couponDiscount:{
    type:Number,
    default: 0
  }
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart