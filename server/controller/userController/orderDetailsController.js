const Product = require('../../model/admin/productModel');
const Category = require('../../model/admin/categoryModel')
const Brand = require('../../model/admin/brandModel');
const User = require('../../model/user/userModel');
const Order = require('../../model/user/orderModel');
const Cart = require('../../model/user/cartModel');
const Razorpay = require('razorpay');
const crypto = require('crypto');


const razorpay = new Razorpay({
    key_id: "rzp_test_Z3o7W5xFJXsiZY",
    key_secret: 'zzmgWLbhO91IV3vZHv0XJdZ9'
});


const orderDetailsPage = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const orderId = req.params.orderId;
        // const productId = req.query.productId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const order = await Order.findOne({ _id: orderId, userId }).populate('userId').populate(
            {
                path: 'productItems.productId',
                populate: {
                    path: 'category'
                }
            })
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found!' });
        }

        // const productItem = order.productItems.find(item => item.productId._id.toString() === productId);
        // if (!productItem) {
        //     return res.status(404).json({ success: false, message: 'Product not found in this order!' });
        // }

        // console.log('Order:', productItem);

        res.render('user/orderDetailsPage', { user, orders: order });

    } catch (error) {
        console.error('Error on the order details page:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const failedPaymentPage = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const orderId = req.params.orderId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const orders = await Order.findOne({ _id: orderId })
        if (!orders) {
            return res.status(404).json({ success: false, message: 'Order not found' })
        }


        res.render('user/failedPayment', { user, orders })

    } catch (error) {
        console.log('the error on failed payment side', error)
        res.status(500).json({ error: 'Server error' });
    }
}

const repayment = async (req, res) => {
    try {
        const { totalPriceInRupees } = req.body
        const userId = req.session.user._id

        const razorpayOrder = await razorpay.orders.create({
            amount: totalPriceInRupees * 100,
            currency: 'INR',
            receipt: userId.toString(),
            payment_capture: '1'
        });

        res.json({
            success: true,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            orderId: razorpayOrder.id,

        })


    } catch (error) {
        console.log('the error on showing repayment section', error)
        res.status(500).json({ success: false, message: 'server error' })
    }
}


const retryPayment = async (req, res) => {
    try {
        const { orderId, paymentId, signature, razorpay_orderId } = req.body

        const order = await Order.findOne({ _id: orderId })

        if (!order) {
            return res.status(404).json({ success: false, message: "order not found" })
        }



        // const razorpaySignature = crypto.createHmac('sha256', 'zzmgWLbhO91IV3vZHv0XJdZ9')
        //     .update(razorpay_orderId + '|' + paymentId)
        //     .digest('hex');
        const razorpaySignature = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
            .update(razorpay_orderId + '|' + paymentId)
            .digest('hex');


        if (razorpaySignature === signature) {
            await Order.findByIdAndUpdate(orderId, { paymentStatus: 'Paid' });

            return res.status(200).json({ success: true });
        } else {

            res.json({ success: false });
        }


    } catch (error) {
        console.log("the error will showing on retry payment", error)
        res.status(500).json({ success: false, message: "server error" })
    }
}

module.exports = {
    orderDetailsPage,
    failedPaymentPage,
    repayment,
    retryPayment
}