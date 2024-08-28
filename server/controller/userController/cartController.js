const Product = require('../../model/admin/productModel');
const Category = require('../../model/admin/categoryModel')
const Brand = require('../../model/admin/brandModel');
const User = require('../../model/user/userModel');
const Cart = require('../../model/user/cartModel');
const Coupon = require('../../model/admin/coponModel')
const CategoryOffer=require('../../model/admin/categoryOfferModel');
const { path } = require('pdfkit');
const { model } = require('mongoose');


//render the shoping cart
const cartPage = async (req, res) => {
    try {
        const userId = req.session.user._id;

        const cart = await Cart.findOne({ userId }).populate({path:'items.productId',
            populate:{path:'category',model:'Category'}
        });

        // console.log('here coupon is',coupon);

        const currentDate = new Date();
        const categoryOffers = await CategoryOffer.find({ endDate: { $gte: currentDate } })
            .populate('categoryId');
    
        const categoryOffer = categoryOffers.length > 0 ? categoryOffers[0] : null;


        if (!cart) {
            return res.render('user/shopingCart', {
                items: [],
                grandTotal: 0,
                message: null,
                error: req.query.error || null,
                user: req.session.user,
                categoryOffer
            });
        }

        const activeItems = cart.items.filter(item => item.productId && item.productId.status === 'Active' && item.productId.stockQuantity!==0 &&  item.productId.category && 
            item.productId.category.status === 'Active')

        const message = req.session.message
        req.session.message = null

        if (activeItems.length !== cart.items.length) {
            cart.items = activeItems;
            cart.grandTotal = activeItems.reduce((total, item) => total + item.totalPrice, 0);
            cart.totalAmount = activeItems.reduce((total, item) => total + (item.productId.price * item.quantity), 0); 
            await cart.save();  
        }

        // res.render('user/shopingCart', { items: cart.items, grandTotal: cart.grandTotal,totalAmount:cart.totalAmount, user: req.session.user, message });
        res.render('user/shopingCart', {
            items: activeItems,
            grandTotal: cart.grandTotal,
            totalAmount: cart.totalAmount,
            user: req.session.user,
            message,
            error: req.query.error || null,
            categoryOffer
        });
    } catch (error) {
        console.error('Error on the cart rendering page:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const addToCart = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const { productId } = req.body;
        const product = await Product.findById(productId);

        if (product.stockQuantity === 0) {
            return res.status(404).json({ success: false, message: "This product on Out of stock" })
        }

        if (!product) {
            console.log('Product not found');
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const productPrice = product.price;
        // const offerPrice = product?.productOffer ? product?.productOffer : product?.categoryOfferamount ? product?.categoryOfferamount : 0;
        const offerPrice = product?.productOffer ? product?.productOffer : product?.categoryOfferamount ? product?.categoryOfferamount : productPrice;

        let cart = await Cart.findOne({ userId });

        if (cart) {
            console.log("ifcaer");

            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

            if (itemIndex === -1) {
                cart.items.push({ productId, quantity: 1, total: productPrice, offerPrice: offerPrice });
            } else {
                const newQuantity = cart.items[itemIndex].quantity + 1;
                if (newQuantity > product.stockQuantity) {
                    req.session.message = `Only ${product.stockQuantity} items in stock for ${product.name}`;
                    return res.redirect('/shoppingCartPage');
                }
                cart.items[itemIndex].quantity += 1
                cart.items[itemIndex].total += productPrice;
                cart.items[itemIndex].offerPrice += offerPrice;
            }

            cart.grandTotal = cart.items.reduce((acc, itm) => acc + itm.total, 0)

            const off = cart.items.reduce((acc, itm) => acc + itm.offerPrice, 0)
            cart.discount = cart.grandTotal - off;
            cart.totalAmount = cart.grandTotal - cart.discount;
            await cart.save();
        } else {
           

            const newCart = new Cart({
                userId,
                items: [{ productId, quantity: 1, total: productPrice, offerPrice: offerPrice }],
                grandTotal: productPrice,
                // discount: offerPrice != 0 ? productPrice - offerPrice : 0,
                discount: productPrice - offerPrice,
                // totalAmount: offerPrice ? offerPrice : productPrice
                totalAmount: offerPrice
            });


            cart = await newCart.save();
        }
        res.redirect('/shoppingCartPage');
    } catch (error) {
        console.error('Error in addToCart:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

//update the product quantity
const updateQuantity = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const { productId, quantity, action } = req.body;

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(itm => itm.productId.toString() === productId);

        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: 'Product not found in cart' });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (quantity > product.stockQuantity) {
            return res.status(400).json({ success: false, message: `only ${product.stockQuantity} items in stock for ${product.name}` })
        }

        // const offerPrice = product?.productOffer ? product?.productOffer : product?.categoryOfferamount ? product?.categoryOfferamount : 0;
        const offerPrice = product?.productOffer ? product?.productOffer : product?.categoryOfferamount ? product?.categoryOfferamount : product.price;

        if (action === "decrement" && cart.items[itemIndex].quantity === 1) {
            return res.status(400).json({ message: "minimum 1 quantity must" })
        }
        if (action === "increment") {
            cart.items[itemIndex].quantity = quantity;
            cart.items[itemIndex].total += product.price
            cart.items[itemIndex].offerPrice += offerPrice

        } else if (action === "decrement") {
            cart.items[itemIndex].quantity = quantity;
            cart.items[itemIndex].total -= product.price
            cart.items[itemIndex].offerPrice -= offerPrice
        }

        cart.grandTotal = cart.items.reduce((acc, itm) => acc + itm.total, 0);
        const off = cart.items.reduce((acc, itm) => acc + itm.offerPrice, 0)
        cart.discount = off ? cart.grandTotal - off : 0
        cart.totalAmount = cart.discount ? cart.grandTotal - cart.discount : cart.grandTotal

        await cart.save();

        res.status(200).json({ success: true, message: 'Cart updated successfully' });

    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

//clear cart
const clearCart = async (req, res) => {
    try {
        const userId = req.session.user._id
        const cart = await Cart.findOne({ userId })
        if (cart) {
            cart.items = []
            cart.grandTotal = 0
            cart.discount = 0
            cart.totalAmount = 0
            await cart.save()
        }
        req.session.message = 'Your cart has been cleared'
        res.status(200).json({ success: true, message: 'cart cleared successfully' })
    } catch (error) {
        console.error('the error on the clear cart side:', error)
        res.status(500).json({ success: false, message: 'server error' })
    }
}


//remove products on the cart
const removeCart = async (req, res) => {
    try {
        const userId = req.session.user._id
        const { productId } = req.body

        const cart = await Cart.findOneAndUpdate(
            { userId },
            { $pull: { items: { productId } } }, { new: true }
        ).populate('items.productId')
        if (!cart) {
            return res.status(404).json({ error: 'product not found' })
        }
        // const grandTotal = cart.items.reduce((total, item) => total + (item.productId.price * item.quantity), 0)
        // cart.grandTotal = grandTotal;

        const grandTotal = cart.items.reduce((acc, item) => acc + (item.total), 0)
        const off = cart.items.reduce((acc, item) => acc + (item.offerPrice), 0)
        const discount = grandTotal - off
        const totalAmount = grandTotal - discount

        await Cart.findOneAndUpdate({ userId }, {
            $set: {
                grandTotal: grandTotal,
                discount: discount,
                totalAmount: totalAmount,
                couponDiscount: 0
            }
        })

        // await cart.save();
        res.status(200).json({ totalAmount,message: 'product removed successfully!' })
    } catch (error) {
        console.log('the error on the remove product on the cart :', error)
        res.status(500).json({ error: 'server error' })
    }
}



module.exports = {
    cartPage,
    addToCart,
    updateQuantity,
    clearCart,
    removeCart
}