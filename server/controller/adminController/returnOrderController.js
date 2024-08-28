const Product = require('../../model/admin/productModel')
const Order = require('../../model/user/orderModel')
const Wallet = require('../../model/user/walletModel')


// const returnOrderPage=async (req,res)=>{
//     try {
//         const orderId=req.params.orderId
//         const order=await Order.findOne({_id:orderId},{status:'Request for returned'}).populate('productItems.productId')
//         if (!order) {
//             return res.status(404).json({error:'Order not found'})
//         }

//         // const requestReturn = order.productItems.filter(item => item.status === 'Request for returned');


//         // res.render('admin/returnedOrderPage', { requestReturn, order: { ...order._doc } });
//         res.render('admin/returnedOrderPage', {  order: { ...order._doc } });

//     } catch (error) {
//         console.error('the error on showing return Order page:',error)
//         res.status(500).json({error:'server error'})
//     }
// }

const returnOrderPage = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findOne({ _id: orderId })
            .populate('productItems.productId');
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.status === 'Request for returned') {
            res.render('admin/returnedOrderPage', { order: { ...order._doc } });
        } else {
            res.status(404).json({ error: 'Order does not have a return request' });
        }
    } catch (error) {
        console.error('Error on showing return Order page:', error);
        res.status(500).json({ error: 'Server error' });
    }
};



const returnOrderStatusUpdate = async (req, res) => {
    try {
        const { orderId, reasonAcceptStatus } = req.body;

        if (!orderId || !reasonAcceptStatus) {
            return res.status(400).json({ error: 'Missing required fields' });
        }


        const order = await Order.findOne({ _id: orderId });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }


        if (reasonAcceptStatus === 'Returned') {
            order.status = 'Returned';

            for (const item of order.productItems) {
                const product = await Product.findById(item.productId);
                if (product) {
                    product.stockQuantity += item.quantity;
                    await product.save();
                }
            }

            const returnAmount = order.totalPrice;
            const userId = order.userId;

            let wallet = await Wallet.findOne({ userId });

            if (!wallet) {
                wallet = new Wallet({
                    userId,
                    balance: returnAmount,
                    transaction: [{
                        amount: returnAmount,
                        type: 'Credit',
                        description: `Refund for returned order ${orderId} (Payment Method: ${order.paymentMethod})`,
                        orderId: orderId
                    }]
                });
            } else {
                wallet.balance += returnAmount;
                wallet.transaction.push({
                    amount: returnAmount,
                    type: 'Credit',
                    description: `Refund for returned order ${orderId} (Payment Method: ${order.paymentMethod})`,
                    orderId: orderId
                });
            }

            await wallet.save();
        }

        await order.save();

        res.status(200).json({ success: true, message: 'Order status updated and refund processed successfully.' });

    } catch (error) {
        console.error('Error updating return status:', error);
        res.status(500).json({ error: 'Server error' });
    }
};




const returnOrderStatusReject = async (req, res) => {
    try {
        const { orderId, productId, reasonRejectedStatus } = req.body

        const order = await Order.findById(orderId)

        if (!order) {
            return res.status(404).json({ error: 'Order not found !' })
        }

        if (reasonRejectedStatus === 'Rejected') {
            order.status = reasonRejectedStatus
            await order.save()
        }


        res.status(200).json({ success: true, message: 'Order status updated successfully.' })

    } catch (error) {
        console.error('the error will show on the return reject status:', error)
        res.status(500).json({ error: 'server error' })
    }
}

const returnRejectedPage = async (req, res) => {
    try {
        const orderId = req.params.orderId
        const order = await Order.findOne({ _id: orderId },).populate('productItems.productId')
        if (!order) {
            return res.status(404).json({ error: 'Order not found!' })
        }
        if (order.status === 'Rejected') {

            res.render('admin/returnProductPage', { order: { ...order._doc } })
        }


    } catch (error) {
        console.error('the error will show on the return rejected page', error)
        res.status(500).json({ error: 'server error' })
    }
}

const returnAcceptPage = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findOne({ _id: orderId })
            .populate('productItems.productId');

        if (!order) {
            return res.status(404).json({ error: 'Order not found!' });
        }

        if (order.status === 'Returned') {
            res.render('admin/returnAcceptPage', { order: { ...order._doc } });
        } else {
            res.status(404).json({ error: 'Order status is not Returned' });
        }
    } catch (error) {
        console.error('Error showing the return accept page:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


module.exports = {
    returnOrderPage,
    returnOrderStatusUpdate,
    returnOrderStatusReject,
    returnRejectedPage,
    returnAcceptPage
}