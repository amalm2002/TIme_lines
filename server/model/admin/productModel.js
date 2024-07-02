const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    modelNumber: {
        type: String, 
        required: true
    },
    category: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0  
    },
    discountPrice: {
        type: Number,
        default: 0,  
        min: 0 
    },
    stockQuantity: {
        type: Number,
        required: true,
        min: 0  
    },
    status:{
        type:String,
        default:'Active'
    },
    isActive: {
        type: Boolean,
        default: true 
    },
    warranty: {
        type: String,
        required: true
    },
    images: [String],
    rating: {
        type: Number,
        default: 1.0,
        min: 0.0, 
        max: 5.0
    },
    description: {
        type: String,
        required: true
    }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
