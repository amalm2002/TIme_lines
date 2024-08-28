const mongoose = require('mongoose');
const User = require('../../model/user/userModel')
const Product = require('../../model/admin/productModel')
const Cart = require('../../model/user/cartModel')
const Coupon = require('../../model/admin/coponModel')


const addressSchema = new mongoose.Schema({
    street: String,
    city: String,
    state: String,
    pinCode: String,
    country: String
})

const productSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: Product
    },
    productName: String,
    quantity: Number,
    total: Number,
    offerPrice: Number,

    status: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Cancelled', 'Returned', 
            'Request for returned', 'Returned', "Rejected"
        ]
    },
    returnReason:{
         type: String,
        default: 'not returned'
    }

});

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
        required: true
    },
    couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: Coupon,
    },
    userName: {
        type: String,
        default: true
    },
    couponDiscount: {
        type: Number,
        default: 0
    },
    totalQuantity: {
        type: Number
    },
    originalPrice: {
        type: Number
    },
    totalPrice: {
        type: Number
    },
    discount: {
        type: Number,
        default: 0
    },
    productItems: [productSchema],
    billingAddress: [addressSchema],

    paymentMethod: {
        type: String,
        required: true,
        enum: ['COD', 'Razorpay', 'Wallet'],
        default: 'COD'
    },
    dateOrdered: {
        type: Date,
        default: Date.now
    },
    paymentStatus: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Paid', 'Failed']
    },
    status: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Processing', 'Shipping', 'Delivered', 'Cancelled', 'Returned', 'Paid', 'Failed',
            'Request for returned', 'Returned', "Rejected"
        ]
    },
    returnReason:{
         type: String,
        default: 'not returned'
    }


});


const Order = mongoose.model('Order', orderSchema);

module.exports = Order