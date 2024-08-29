const Product = require('../../model/admin/productModel');
const User = require('../../model/user/userModel');
const Order = require('../../model/user/orderModel');
const Cart = require('../../model/user/cartModel');
const Wallet = require('../../model/user/walletModel');
const Coupon = require('../../model/admin/coponModel')
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Copon = require('../../model/admin/coponModel');




const razorpay = new Razorpay({
    key_id: "rzp_test_Z3o7W5xFJXsiZY",
    key_secret: 'zzmgWLbhO91IV3vZHv0XJdZ9'
});




const placeOrder = async (req, res) => {
    try {
        const { address, cartItems, paymentMethod, paymentStatus } = req.body;
        const userId = req.session.user._id;

        console.log("here place oreder section cartItems", paymentStatus);



        if (!address || !cartItems || !paymentMethod) {
            return res.status(400).json({ success: false, message: 'Missing required fields.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const cart = await Cart.findOne({ userId }).populate('couponId');
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found.' });
        }



        const originalPrice = cartItems.reduce((acc, item) => acc + item.total, 0);
        const discount = cart.discount || 0;
        const couponDiscount = cart.couponId ? cart.couponDiscount || 0 : 0;
        const finalTotalPrice = Math.floor(originalPrice - discount - couponDiscount);

        console.log("=======================================================================>", finalTotalPrice);



        if (paymentMethod === 'COD' && finalTotalPrice > 2000) {
            return res.status(400).json({ success: false, message: 'Cash on Delivery is only available for orders below ₹2000.' });
        } else {
            for (const item of cartItems) {
                const product = await Product.findById(item.productId);
                if (product) {
                    if (product.stockQuantity < item.quantity) {
                        return res.status(400).json({ success: false, message: `Insufficient stock for product ${product.name}` });
                    }
                    product.stockQuantity = Math.max(0, product.stockQuantity - item.quantity); // Ensure stock does not go below 0
                    await product.save();
                } else {
                    return res.status(404).json({ success: false, message: `Product with id ${item.productId} not found` });
                }
            }

        }

        if (paymentMethod === 'Wallet') {
            const wallet = await Wallet.findOne({ userId });
            if (!wallet) {
                return res.status(404).json({ success: false, message: 'Wallet not found' });
            }

            let totalWalletAmount = wallet.transaction.reduce((acc, entry) => {
                return entry.type === 'Credit' ? acc + entry.amount : acc - entry.amount;
            }, 0);

            if (finalTotalPrice > totalWalletAmount) {
                return res.status(400).json({ success: false, message: 'Insufficient balance in wallet' });
            }
            for (const item of cartItems) {
                const product = await Product.findById(item.productId);
                if (product) {
                    if (product.stockQuantity < item.quantity) {
                        return res.status(400).json({ success: false, message: `Insufficient stock for product ${product.name}` });
                    }
                    product.stockQuantity = Math.max(0, product.stockQuantity - item.quantity); 
                    await product.save();
                } else {
                    return res.status(404).json({ success: false, message: `Product with id ${item.productId} not found` });
                }

            }

            wallet.balance -= finalTotalPrice;
            wallet.transaction.push({
                amount: finalTotalPrice,
                type: 'Debit',
                description: 'Order Payment using wallet',
            });

            await wallet.save();
        }


        if (paymentMethod === 'Razorpay' && paymentStatus) {
            const razorpayOrder = await razorpay.orders.create({
                amount: finalTotalPrice * 100,
                currency: 'INR',
                receipt: userId.toString(),
                payment_capture: '1'
            });

            return res.json({
                success: true,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                orderId: razorpayOrder.id,
                userId: userId,
                originalPrice: originalPrice,
                finalTotalPrice: finalTotalPrice,
                discount: discount,
                address: address,
                couponDiscount: couponDiscount,
                cartItems: cartItems
            });
        } else {
            const newOrder = new Order({
                userId: userId,
                userName: user.name,
                billingAddress: address,
                // productItems: cartItems,
                productItems: cartItems.map(item => ({
                    ...item,
                    offerPrice: item.offerPrice
                })),
                totalPrice: finalTotalPrice,
                originalPrice: originalPrice,
                discount: discount,
                couponDiscount: couponDiscount,
                couponId: cart.couponId ? cart.couponId._id : null,
                paymentMethod: paymentMethod,
                paymentStatus: paymentStatus ? "Paid" : "Failed"
            });

            await newOrder.save();

            cart.items = [];
            cart.discount = 0;
            cart.couponDiscount = 0;
            cart.totalAmount = 0;
            await cart.save();

            res.json({ success: true, message: 'Order placed successfully.' });
        }
    } catch (error) {
        console.log('Error placing order:', error);
        // res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};



const verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId, signature, userId, originalPrice, finalTotalPrice, discount, couponDiscount, address, cartItems } = req.body;

        // const razorpaySignature = crypto.createHmac('sha256', 'zzmgWLbhO91IV3vZHv0XJdZ9')
        //     .update(orderId + '|' + paymentId)
        //     .digest('hex');
        const razorpaySignature = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
            .update(orderId + '|' + paymentId)
            .digest('hex');

        if (razorpaySignature === signature) {

            await createOrder(req, userId, cartItems, finalTotalPrice, originalPrice, couponDiscount, discount, address, 'Razorpay');

            res.json({ success: true, message: 'Payment verified successfully, order placed.' });
        } else {
            await createFailedOrder(req, userId, cartItems, finalTotalPrice, originalPrice, couponDiscount, discount, address, 'Razorpay')
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};




async function createOrder(req, userId, cartItems, finalTotalPrice, originalPrice, couponDiscount, discount, address, paymentMethod) {


    for (const item of cartItems) {
        const product = await Product.findById(item.productId);
        if (product) {
            product.stockQuantity -= item.quantity;
            await product.save();
        } else {
            throw new Error(`Product with id ${item.productId} not found`);
        }
    }




    const user = await User.findById(userId)
    const cart = await Cart.findOne({ userId });

    const newOrder = new Order({
        userId: userId,
        userName: user.name,
        totalQuantity: cartItems.reduce((acc, item) => acc + item.quantity, 0),
        originalPrice,
        totalPrice: finalTotalPrice,
        couponDiscount,
        couponId: cart.couponId,
        discount,
        // productItems: cartItems,
        productItems: cartItems.map(item => ({
            ...item,
            offerPrice: item.offerPrice
        })),
        billingAddress: req.body.address,
        paymentMethod,
        paymentStatus: paymentMethod === 'Razorpay' ? 'Paid' : 'Pending',
        dateOrdered: new Date()
    });

    await newOrder.save();
    await Cart.findOneAndDelete({ userId });
}

async function createFailedOrder(req, userId, cartItems, finalTotalPrice, originalPrice, couponDiscount, discount, address, paymentMethod) {
    for (const item of cartItems) {
        const product = await Product.findById(item.productId);
        if (product) {
            product.stockQuantity -= item.quantity;
            await product.save();
        } else {
            throw new Error(`Product with id ${item.productId} not found`);
        }
    }




    const user = await User.findById(userId)
    const cart = await Cart.findOne({ userId });

    const newOrder = new Order({
        userId: userId,
        userName: user.name,
        totalQuantity: cartItems.reduce((acc, item) => acc + item.quantity, 0),
        originalPrice,
        totalPrice: finalTotalPrice,
        couponDiscount,
        couponId: cart.couponId,
        discount,
        // productItems: cartItems,
        productItems: cartItems.map(item => ({
            ...item,
            offerPrice: item.offerPrice
        })),
        billingAddress: req.body.address,
        paymentMethod,
        paymentStatus: paymentMethod === 'Razorpay' ? 'Failed' : 'Pending',
        dateOrdered: new Date()
    });

    await newOrder.save();
    await Cart.findOneAndDelete({ userId });
}

const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.session.user._id;

        if (!couponCode) {
            return res.status(400).json({ success: false, message: 'Coupon code is required.' });
        }

        const coupon = await Coupon.findOne({ couponCode });

        // console.log("__________________________________________________________________________");
        // console.log("coupon", coupon);
        // console.log("__________________________________________________________________________");


        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found.' });
        }

        const cart = await Cart.findOne({ userId });

        // console.log("_______________________________>>>>>>>>>><<<<<<<<<<<<<<__________________________________________");
        // console.log("cart", cart);
        // console.log("__________________________________>>>>>>>>>><<<<<<<<<<<<<<_______________________________________");



        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found.' });
        }

        const totalPrice = cart.totalAmount;
        const couponMaxAmount = coupon.maxAmount;
        const discountPercentage = coupon.discountPercentage;

        if (totalPrice < couponMaxAmount) {
            return res.status(400).json({ success: false, message: 'Coupon exceeds maximum allowable amount.' });
        }

        const discount = Math.floor((totalPrice * discountPercentage) / 100);
        const newTotal = Math.floor(totalPrice - discount);

        console.log("Calculated discount:>", discount);
        console.log("Total price before discount:>", totalPrice);
        console.log("new total after discount:>", newTotal);


        cart.couponDiscount = discount;
        cart.totalAmount = newTotal;
        cart.couponId = coupon._id;

        const saveCart = await cart.save();

        // console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
        // console.log("SAVE CART", saveCart);
        // console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");




        const updatedCart = await Cart.findById(cart._id);

        // console.log("after save:", {
        //     couponDiscount: updatedCart.couponDiscount,
        //     totalAmount: updatedCart.totalAmount,
        //     couponId: updatedCart.couponId
        // });

        res.json({ success: true, newTotal, discount });

    } catch (error) {
        console.error('Error in applying coupon:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


const removeCoupon = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const cart = await Cart.findOne({ userId });
        console.log("the user cart is here", cart);


        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }


        const originalTotal = cart.totalAmount + cart.couponDiscount;

        // console.log( "orginal amount",originalTotal);


        cart.totalAmount = originalTotal;
        cart.couponDiscount = 0;
        cart.couponId = null;

        await cart.save();

        res.json({ success: true, newTotal: originalTotal });

    } catch (error) {
        console.error('Error in removing coupon:', error);
        res.status(500).json({ error: 'Server error' });
    }
};





const orderListpage = async (req, res) => {
    try {
        const userId = req.session.user._id
        const user = await User.findOne({ _id: userId })
        if (!user) {
            return res.status(404).json({ success: false, message: 'User Not Found.' })
        }
        const orders = await Order.find({ userId }).sort({ dateOrdered: -1 }).populate('productItems.productId')

        if (!Array.isArray(orders)) {
            throw new Error("Orders is not an array");
        }

        orders.forEach(order => {
            order.productItems.forEach(item => {
                const product = item.productId;
                let offerPrice = product.price;

                if (product.productOffer && new Date(product.productOfferendDate) > new Date()) {
                    offerPrice = product.productOffer;
                }
                else if (product.categoryOfferamount && new Date(product.categoryOfferEndDate) > new Date()) {
                    offerPrice = product.categoryOfferamount;
                }

                item.displayPrice = offerPrice;
                item.originalPrice = product.price;
                item.discountPercentage = ((product.price - offerPrice) / product.price) * 100;
            });
        });


        res.render('user/orderList', { user, orders })
    } catch (error) {
        console.error('the error will showing on the orderList page :', error)
        res.status(500).json({ error: 'sever error' })
    }
}

const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, newStatus } = req.body;

        if (!orderId || !newStatus) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const order = await Order.findById(orderId).populate('productItems.productId');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (newStatus === 'Cancelled') {

            order.status = newStatus;


            for (let item of order.productItems) {
                const product = await Product.findById(item.productId._id);
                if (product) {
                    product.stockQuantity += item.quantity;
                    await product.save();
                }
            }


            if (order.paymentMethod !== 'COD') {
                const refundAmount = order.totalPrice;

                let wallet = await Wallet.findOne({ userId: order.userId });

                if (!wallet) {

                    wallet = new Wallet({
                        userId: order.userId,
                        balance: refundAmount,
                        transaction: [{
                            amount: refundAmount,
                            type: 'Credit',
                            description: `Refund for canceled order ${orderId} (Payment Method: ${order.paymentMethod})`,
                            orderId: orderId
                        }]
                    });
                } else {

                    wallet.balance += refundAmount;
                    wallet.transaction.push({
                        amount: refundAmount,
                        type: 'Credit',
                        description: `Refund for canceled order ${orderId} (Payment Method: ${order.paymentMethod})`,
                        orderId: orderId
                    });
                }

                await wallet.save();
            }

            await order.save();
            return res.json({ success: true, message: 'Order status updated and refund processed successfully' });
        } else {

            order.status = newStatus;
            await order.save();
            return res.json({ success: true, message: 'Order status updated successfully' });
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};


    const cancelPerticularProduct = async (req, res) => {
        try {
            const { orderId, productId, newStatus } = req.body;

            if (!orderId || !productId || !newStatus) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }

            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            const productItemIndex = order.productItems.findIndex(item => item.productId.toString() === productId);
            if (productItemIndex === -1) {
                return res.status(404).json({ success: false, message: 'Product item not found in order' });
            }

            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            if (newStatus === 'Cancelled' && order.couponDiscount === 0 && order.paymentMethod !== 'COD') {
                order.productItems[productItemIndex].status = newStatus;

                product.stockQuantity += order.productItems[productItemIndex].quantity;
                await product.save();

                const refundAmount = order.productItems[productItemIndex].offerPrice ?
                    order.productItems[productItemIndex].offerPrice :
                    order.productItems[productItemIndex].total;

                order.originalPrice -= refundAmount;

                order.totalPrice -= refundAmount;

                let wallet = await Wallet.findOne({ userId: order.userId });
                if (!wallet) {
                    wallet = new Wallet({
                        userId: order.userId,
                        balance: refundAmount,
                        transaction: [{
                            amount: refundAmount,
                            type: 'Credit',
                            description: `Refund for canceled product ${product.name} from order ${orderId} (Payment Method: ${order.paymentMethod})`,
                            orderId: orderId
                        }]
                    });
                } else {
                    wallet.balance += refundAmount;
                    wallet.transaction.push({
                        amount: refundAmount,
                        type: 'Credit',
                        description: `Refund for canceled product ${product.name} from order ${orderId} (Payment Method: ${order.paymentMethod})`,
                        orderId: orderId
                    });
                }

                await wallet.save();
            } else {
                return res.status(400).json({ success: false, message: 'Cannot cancel product: Coupon applied or invalid payment method' });
            }

            await order.save();
            res.status(200).json({ success: true, message: 'Product cancelled successfully' });
        } catch (error) {
            console.error('Error cancelling product:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    };


// const cancelPerticularProduct = async (req, res) => {
//     try {
//         const { orderId, productId, newStatus } = req.body;

//         if (!orderId || !productId || !newStatus) {
//             return res.status(400).json({ success: false, message: 'Missing required fields' });
//         }

//         const order = await Order.findById(orderId);
//         if (!order) {
//             return res.status(404).json({ success: false, message: 'Order not found' });
//         }

//         const productItemIndex = order.productItems.findIndex(item => item.productId.toString() === productId);
//         if (productItemIndex === -1) {
//             return res.status(404).json({ success: false, message: 'Product item not found in order' });
//         }

//         const product = await Product.findById(productId);
//         if (!product) {
//             return res.status(404).json({ success: false, message: 'Product not found' });
//         }


//         if (newStatus === 'Cancelled') {
    
//             if (order.couponDiscount > 0 && order.paymentMethod !== 'COD') {
//                 return res.status(400).json({ success: false, message: 'Cannot cancel product: Coupon applied' });
//             }

//             order.productItems[productItemIndex].status = newStatus;

//             product.stockQuantity += order.productItems[productItemIndex].quantity;
//             await product.save();

//             const refundAmount = order.productItems[productItemIndex].offerPrice ?
//                 order.productItems[productItemIndex].offerPrice :
//                 order.productItems[productItemIndex].total;

//             order.originalPrice -= refundAmount;
//             order.totalPrice -= refundAmount;

//             if (order.paymentMethod !== 'COD') {
//                 let wallet = await Wallet.findOne({ userId: order.userId });
//                 if (!wallet) {
//                     wallet = new Wallet({
//                         userId: order.userId,
//                         balance: refundAmount,
//                         transaction: [{
//                             amount: refundAmount,
//                             type: 'Credit',
//                             description: `Refund for canceled product ${product.name} from order ${orderId} (Payment Method: ${order.paymentMethod})`,
//                             orderId: orderId
//                         }]
//                     });
//                 } else {
//                     wallet.balance += refundAmount;
//                     wallet.transaction.push({
//                         amount: refundAmount,
//                         type: 'Credit',
//                         description: `Refund for canceled product ${product.name} from order ${orderId} (Payment Method: ${order.paymentMethod})`,
//                         orderId: orderId
//                     });
//                 }

//                 await wallet.save();
//             }

//             await order.save();
//             return res.status(200).json({ success: true, message: 'Product cancelled successfully' });
//         } else {
//             return res.status(400).json({ success: false, message: 'Invalid status for cancellation' });
//         }
//     } catch (error) {
//         console.error('Error cancelling product:', error);
//         res.status(500).json({ success: false, message: 'Server error' });
//     }
// };




const returnOrder = async (req, res) => {
    try {
        const { orderId, reasonStatus, returnReason } = req.body;
        // console.log('orderId:', orderId, returnReason);

        if (!orderId || !returnReason) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const order = await Order.findOne({ _id: orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.returnReason = returnReason;
        order.status = reasonStatus;

        await order.save();

        res.json({ success: true, message: 'Return reason and order status updated successfully' });
    } catch (error) {
        console.error('Error on returnOrder form submission:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// const returnProduct = async (req,res)=>{
//     try {
//         const {orderId, productId, returnReason, reasonStatus }=req.body

//         if (!orderId||!returnReason||!productId) {
//             return res.status(400).json({ success: false, message: 'Missing required fields' })
//         }

//         const order=await Order.findById(orderId)
//         if (!order) {
//             return res.status(404).json({ success: false, message: 'Order not found' });
//         }

//         const productItemIndex = order.productItems.findIndex(item => item.productId.toString() === productId);
//         if (productItemIndex === -1) {
//             return res.status(404).json({ success: false, message: 'Product item not found in order' });
//         }

//         order.productItems[productItemIndex].status = reasonStatus;
//         order.productItems[productItemIndex].returnReason = returnReason;

//         await order.save();

//         return res.status(200).json({ success: true, message: 'Product status and return reason updated successfully' });

//     } catch (error) {
//         console.log('the error will show on the return perticular product',error)
//     }
// }


module.exports = {
    placeOrder,
    verifyPayment,
    removeCoupon,
    applyCoupon,
    orderListpage,
    updateOrderStatus,
    returnOrder,
    cancelPerticularProduct,
    // returnProduct
}