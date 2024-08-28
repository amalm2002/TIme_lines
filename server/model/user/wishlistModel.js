const mongoose = require('mongoose');
const User=require('../../model/user/userModel')
const Product=require('../../model/admin/productModel')

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: User,
        required: true
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: Product
    }],
  
})


const Wishlist=mongoose.model('Wishlist', wishlistSchema);
module.exports = Wishlist