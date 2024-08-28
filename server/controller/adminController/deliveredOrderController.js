const Product = require('../../model/admin/productModel')
const Order = require('../../model/user/orderModel')

const deliveredOrderPage = async (req, res) => {
    try {
        const orderId = req.params.orderId
        const order = await Order.findOne({ _id: orderId })
        .populate('productItems.productId');
        if (!order) {
            return res.status(404).json({ error: 'Order not found!' })
        }
        if (order.status==='Delivered') {
            res.render('admin/deliveredOrer', {  order: { ...order._doc } })
        }
    } catch (error) {
        console.error('the error will show on the devilvered order section', error)
        return res.status(500).json({ error: 'server error' })
    }
}

module.exports = {
    deliveredOrderPage
}