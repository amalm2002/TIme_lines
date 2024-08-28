const mongoose = require('mongoose');
const Category=require('../../model/admin/categoryModel')
const Brand=require('../../model/admin/brandModel')
const CategoryOffer=require('../../model/admin/categoryOfferModel')

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref:Brand,
        required: true
    },
    modelNumber: {
        type: String,

        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref:Category,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    productOffer: {
        type: Number,
        min: 0
    },
    productOfferendDate:{
        type:Date
    },
    categoryOfferamount:{
        type:Number,
        min:0
    },
    categoryOfferEndDate:{
        type:Date
    },
    categoryId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:Category,
    },
    stockQuantity: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        default: 'Active'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    warranty: {
        type: String,
        required: false
    },
    images: {
        type: Array,
        required: true,
    },
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
},{
    timestamps:true
});

productSchema.methods.checkAndUpdateOffers= async function () {
    const now =new Date()
    let isModified=false

    if (this.productOfferendDate &&  new Date(this.productOfferendDate)<now) {
        this.productOffer=null
        this.productOfferendDate=null
        isModified=true
    }

    if (this.categoryOfferEndDate && new Date(this.categoryOfferEndDate)<now) {
        this.categoryOfferamount=null
        this.categoryOfferEndDate=null
        isModified=true
    }

    if (!this.productOffer) {
        const categoryOffer= await CategoryOffer.findOne({
            categoryId:this.category,
            endDate:{$gt:now},
            
        })
        if (categoryOffer) {
            this.categoryOfferamount=(categoryOffer.discountPercentage* this.price)/100
            this.categoryOfferEndDate=categoryOffer.endDate;
            isModified=true
        }
    }
    if(isModified){
        await this.save()
    }
}





const Product = mongoose.model('Product', productSchema);

module.exports = Product;
