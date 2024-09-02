const { log10 } = require('chart.js/helpers');
const Product = require('../../model/admin/productModel')
const Order = require('../../model/user/orderModel')
const Wallet = require('../../model/user/walletModel');


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

const returnAcceptIndividualProductPage = async (req, res) => {
    try {
        const { orderId } = req.params;  
        const order = await Order.findById(orderId).populate('productItems.productId');

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const productItem = order.productItems.find(item => item.status === 'Request for returned');

        if (!productItem) {
            return res.status(404).json({ error: 'Product with return request not found' });
        }

        res.render('admin/returnIndividualProduct', { order, productItem });
    } catch (error) {
        console.error('Error showing the return accept page:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const returnProductStatusUpdate = async (req, res) => {
    try {
        const { orderId, productId, reasonAcceptStatus } = req.body;

        if (!orderId || !productId || !reasonAcceptStatus) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const order = await Order.findOne({ _id: orderId });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        let productItemIndex = order.productItems.findIndex(item => item.productId.toString() === productId);

        if (productItemIndex === -1) {
            return res.status(404).json({ error: 'Product not found in the order' });
        }

        const productItem = order.productItems[productItemIndex];
        const product = await Product.findOne({ _id: productId });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }


        if (reasonAcceptStatus === 'Returned' && order.couponDiscount === 0) {
            order.productItems[productItemIndex].status = 'Returned';

     
            product.stockQuantity += productItem.quantity;
            await product.save();

            const refundAmount = productItem.offerPrice || productItem.total;
            order.totalPrice -= refundAmount;  

            const userId = order.userId;
            let wallet = await Wallet.findOne({ userId });


            if (!wallet) {
                wallet = new Wallet({
                    userId,
                    balance: refundAmount,
                    transaction: [{
                        amount: refundAmount,
                        type: 'Credit',
                        description: `Refund for returned order ${orderId} (Payment Method: ${order.paymentMethod})`,
                        orderId: orderId
                    }]
                });
            } else {
                wallet.balance += refundAmount;
                wallet.transaction.push({
                    amount: refundAmount,
                    type: 'Credit',
                    description: `Refund for returned order ${orderId} (Payment Method: ${order.paymentMethod})`,
                    orderId: orderId
                });
            }

            await wallet.save();

        } else if (reasonAcceptStatus === 'Returned' && order.couponDiscount > 0) {
            order.productItems[productItemIndex].status = 'Returned';

            product.stockQuantity += productItem.quantity;
            await product.save();

            const refundAmount = productItem.offerPrice || productItem.total;

            // console.log(refundAmount,"[[[[[[[[[[[]]]]]]]]]");
            

            const couponDiscount = order.couponDiscount;
            // console.log(couponDiscount,"______________");
            
            const countOfProducts = order.productItems.length;
            // console.log(countOfProducts,"=====================");
            
            const productDiscountedAmount = Math.round(couponDiscount / countOfProducts);
            // console.log(productDiscountedAmount,"here is the product discout");
              
            // const refund = refundAmount > productDiscountedAmount?refundAmount-productDiscountedAmount:productDiscountedAmount-refundAmount;
            const refund = Math.max(refundAmount - productDiscountedAmount, 0);

            console.log( refund);
            

            order.totalPrice -= refund; 
            
            

            const userId = order.userId;
            let wallet = await Wallet.findOne({ userId });

   
            if (!wallet) {
                wallet = new Wallet({
                    userId,
                    balance: refund,
                    transaction: [{
                        amount: refund,
                        type: 'Credit',
                        description: `Refund for returned order ${orderId} (Payment Method: ${order.paymentMethod})`,
                        orderId: orderId
                    }]
                });
            } else {
                wallet.balance += refund;
                wallet.transaction.push({
                    amount: refund,
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

const rejectProductStatus = async (req, res) => {
    try {
        const { orderId, productId, reasonRejectedStatus } = req.body;

     
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found!' });
        }

        let productItemIndex = order.productItems.findIndex(item => item.productId.toString() === productId);

        if (productItemIndex === -1) {
            return res.status(404).json({ error: 'Product not found in the order' });
        }

        if (reasonRejectedStatus === 'Rejected') {
            order.productItems[productItemIndex].status = 'Rejected';
            await order.save();
        }

        res.status(200).json({ success: true, message: 'Product status updated successfully.' });

    } catch (error) {
        console.error('Error updating product status:', error);
        res.status(500).json({ error: 'Server error' });
    }
};




    



module.exports = {
    returnOrderPage,
    returnOrderStatusUpdate,
    returnOrderStatusReject,
    returnRejectedPage,
    returnAcceptPage,
    returnAcceptIndividualProductPage,
    returnProductStatusUpdate,
    rejectProductStatus
}