const Product = require('../../model/admin/productModel')
const User = require('../../model/user/userModel')
const Category = require('../../model/admin/categoryModel')
const Brand = require('../../model/admin/brandModel');
const multer = require('multer')

//add product page
const addProductPage = (req, res) => {
    res.render('admin/addProduct')
}

//productLists
const product = async (req, res) => {
    try {
        console.log('in product list page')
        const products = await Product.find()
        console.log('in product list for second', products)

        res.render('admin/demo', { products })
    } catch (error) {
        console.error('error for product page rendering:', error);
        res.status(500).json({ error: 'server error' })
    }
}

//add products
const addProduct = async (req, res) => {
    try {
        console.log('getting in add product', req.body);
        const { name, brand, modelNumber, category, price, discoutPrice, stockQuantity, warranty, description } = req.body;
        console.log('datas are getting', name, brand);
        const images = req.files.map(file => file.path);
        if (req.file) {
            console.log('image is getting');
        }
        const newProducts = new Product({
            name, brand, modelNumber, category, price, discoutPrice, stockQuantity, warranty, description, images
        });
        await newProducts.save();
        res.status(200).json({
            success: true,
            message: "Product added successfully",
            data: newProducts
        });
    } catch (error) {
        console.error("this error will show on add products:", error);
        res.status(500).json({ error: 'Server error' });
    }
}

//disable or enabel the status
const productStatus=async (req,res)=>{
    const {id}=req.params
    const {status}=req.body

    try {
        const product=await Product.findById(id)

        if (!product) {
            return res.status(404).json({success:false,error:'product not found'})
        }

        if (status==='Active') {
            product.isActive=true
            product.status='Active'
            console.log('Product is active now:',product);
        }else{
            product.isActive=false
            product.status='Blocked'
            console.log('product is unblock now:',product);
        }
        
        await  product.save()
        res.json({success:true,status:product.status})

    } catch (error) {
        console.error('this error will showing on the status of productlist:',error);
        res.status(500).json({success:true,error:'server error'})
    }
}


module.exports = {
    addProductPage,
    product,
    addProduct,
    productStatus
}