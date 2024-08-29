const Product = require('../../model/admin/productModel')
const User = require('../../model/user/userModel')
const Category = require('../../model/admin/categoryModel')
const Brand = require('../../model/admin/brandModel');
const multer = require('multer')
const path = require('path');
const { error } = require('console');

//add product page
const addProductPage = async (req, res) => {
    const [brands, category] = await Promise.all([
        Brand.find(),
        Category.find()
    ]);

    console.log("category: ", brands);
    res.render('admin/addProduct', { category, brands })
}



//productLists
const product = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const products = await Product.find().skip(skip).limit(limit).populate('brand')
        const total = await Product.countDocuments();

        res.render('admin/productList', {
            products,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            limit: limit
        });
    } catch (error) {
        console.error('Error for product page rendering:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

const addProduct = async (req, res) => {
    try {
        const { name, brand, modelNumber, category, price,  stockQuantity, description,productOffer=null,offerEndDate=null} = req.body;
        console.log('full details:', req.body);

        if (!name || !brand || !modelNumber || !category || !price || !stockQuantity || !description) {
            console.log('one thing in body is missing')
            return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
        }

        if (productOffer) {
            if (!offerEndDate) {
                return res.status(400).json({ success: false, message: 'Offer end date is required when offer is provided.' });
            }

            const offerEndDateObj = new Date(offerEndDate);
            const today = new Date();
            if (offerEndDateObj <= today) {
                return res.status(400).json({ success: false, message: 'Offer end date must be a future date.' });
            }

            if (parseFloat(productOffer) > parseFloat(price)) {
                return res.status(400).json({ success: false, message: 'Offer price cannot be greater than the actual price.' });
            }
        }


        const productOfferendDate= offerEndDate?new Date(offerEndDate):null
        const newProduct = new Product({
            name,
            brand,
            modelNumber,
            category,
            price,
            productOffer,
            productOfferendDate,
            // discountPrice,
            stockQuantity,
            description,
        });
        if (!req.files || req.files.length !== 3) {
            return res.status(500).json({ success: false, message: 'add exactly 3 images' });
        } else {
            const imagePaths = req.files.map(file => file?.filename);
            console.log('image paths:', imagePaths)
            newProduct.images = imagePaths;
            await newProduct.save();
            res.json({ success: true, message: 'Product added successfully!' });
        }
    } catch (error) {
        console.error('Error adding product', error);
        res.status(500).json({ success: false, message: 'Server Error: Unable to add product.' });
    }
};


//disable or enabel the status

const productStatus = async (req, res) => {
    const { id } = req.params;
    const status = req.query.status;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    try {
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        if (status === 'Active') {
            product.isActive = true;
            product.status = 'Blocked';
            console.log('Product is active now:', product);
        } else {
            product.isActive = false;
            product.status = 'Active';
            console.log('Product is unblocked now:', product);
        }

        await product.save();


        res.redirect(`/admin/products?page=${page}&limit=${limit}`);

    } catch (error) {
        console.error('Error updating product status:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};



//edit product page
const editProductPage = async (req, res) => {
    const { id } = req.params;
    const [product, brands, category] = await Promise.all([
        Product.findById(id).populate('brand category'),
        Brand.find(),
        Category.find()
    ]);
    if (!product) {
        console.log('product not found :', product);
    }
    res.render('admin/editProduct', { category, brands, product })
}

// edit products
const editProduct = async (req, res) => {
    try {
        const id = req.params.id

        const { name, brand, modelNumber, category, price, stockQuantity, warranty, description, existingImages,productOffer=0,offerEndDate=null } = req.body;
       

        const existingProduct=await Product.findOne({name:name})

        if (existingProduct===name) {
            return res.status(400).json({error:'this product have already in Product schema'})
        }

      
        const existingImagesArray = Array.isArray(existingImages) ? existingImages : []


        if (existingImagesArray.length + (req.files ? req.files.length : 0) !== 3) {
            return res.status(500).json({ error: 'you must have exactly 3 images' })
        }
        let images = req.files ? req.files.map(file => file?.filename) : []



        if (existingImagesArray.length) {
            const existingImagesFilenames = existingImagesArray.map(img => path.basename(img))
            images = [...existingImagesFilenames, ...images]
        }

        const productOfferendDate= offerEndDate?new Date(offerEndDate):null

        const updatedProduct = await Product.findByIdAndUpdate(id, {

            name, brand, modelNumber, category, price,  stockQuantity, warranty, description, images, productOffer,
            productOfferendDate,

        }, { new: true })

        if (!updatedProduct) {

            return res.status(404).json({ error: 'product not found' })
        }
        res.status(200).json({ message: 'product upadte successfully', updatedProduct })

    } catch (error) {
        console.error('this error will showing on edit product :', error);
        res.status(500).json({ error: 'server error' })
    }
}

module.exports = {
    addProductPage,
    product,
    addProduct,
    productStatus,
    editProductPage,
    editProduct
}