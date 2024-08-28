const mongoose = require('mongoose');
const Category=require('../../model/admin/categoryModel');

const offerSchema=new mongoose.Schema({
   categoryId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:Category,

    },
    discountPercentage: {
        type: Number, 
        required: true
    },
    endDate: {
        type: Date,
        required: true
    }
    
}, {
    timestamps: true
});

const productOffer=mongoose.model('CategoryOffer', offerSchema);

module.exports=productOffer