const User = require('../../model/user/userModel')
const Order = require('../../model/user/orderModel')

// const canceledOrderPage = async (req, res) => {
//     try {
//         const orderId = req.params.orderId
//         const order = await Order.findById({ _id: orderId }).populate('productItems.productId')

//         if (!order) {
//             return res.status(404).json({ error: 'Order not found' })
//         }
//         // const canceledOrder = order.productItems.filter(item => item.status === 'canceled')
//         if (order.status === 'Cancelled') {

//             res.render('admin/cancelOrder', { order: { ...order._id } })
//         }

//     } catch (error) {
//         console.error('the error will show on canceled order page :', error)
//         return res.status(500).json({ error: 'server error' })
//     }
// }

const canceledOrderPage = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findOne({ _id: orderId })
        .populate('productItems.productId');

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.status === 'Cancelled') {
            res.render('admin/cancelOrder', { 
                order: { ...order._doc } 
            });
        } else {
            res.status(404).json({ error: 'Order status is not Cancelled' });
        }
    } catch (error) {
        console.error('Error showing the canceled order page:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};


module.exports = {
    canceledOrderPage
}