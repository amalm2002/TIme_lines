const Product = require('../../model/admin/productModel');
const Category = require('../../model/admin/categoryModel')
const Brand = require('../../model/admin/brandModel');
const User = require('../../model/user/userModel');
const Cart = require('../../model/user/cartModel');
const Coupon = require('../../model/admin/coponModel')
const CategoryOffer=require('../../model/admin/categoryOfferModel')
const Wallet=require('../../model/user/walletModel')



const checkOutPage = async (req, res) => {
    try {
        const userId = req.session.user._id

        if (!userId) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const user = await User.findOne({ _id: userId })

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const address = user.address

        const cart = await Cart.findOne({ userId }).populate('items.productId');

        if (!cart) {
            return res.status(404).json({ error: 'cart not found' })
        }
        // const outOfStockItems=cart.items.filter(item=>item.productId.stockQuantity<item.quantity)

        // if (outOfStockItems.length>0) {
        //     return res.redirect(`user/shoppingCartPage?error=Some items are out of stoc`)
        // }
        const wallet=await Wallet.findOne({userId:userId})

        const currentDate = new Date();
        const categoryOffers = await CategoryOffer.find({ endDate: { $gte: currentDate } })
            .populate('categoryId');
    
        const categoryOffer = categoryOffers.length > 0 ? categoryOffers[0] : null;

        if (cart.couponId) {
            const coupon = await Coupon.findById(cart.couponId);
            if (cart.totalAmount < coupon.maxAmount) {
                cart.couponDiscount = 0;
                cart.couponId = null;
                await cart.save();
            }

        }


        res.render('user/checkOut', { cart, user: req.session.user, address,categoryOffer,wallet })

    } catch (error) {
        console.error('the error will show on the check out page:', error)
        res.status(500).json({ error: 'server error' })
    }
}


module.exports = {
    checkOutPage
}