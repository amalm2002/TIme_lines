const Product = require('../../model/admin/productModel')
const User = require('../../model/user/userModel')
const Category = require('../../model/admin/categoryModel')
const Brand = require('../../model/admin/brandModel');
const Order = require('../../model/user/orderModel')

const orderPage = async (req, res) => {
    try {
        const orders = await Order.find().sort({dateOrdered:-1}).populate({ path: 'productItems.productId' })
        if (!orders) {
            console.log('orders not found', orders);
            return res.status(404).json({ error: 'orders not found' })
        }
        res.render('admin/orderListAdmin', { orders })
    } catch (error) {
        console.error('the error will show on the order page :', error)
        res.status(500).json({ error: 'server error will occuring' })
    }
}

// const orderStatus = async (req, res) => {
//     try {
//         const { orderId, status, productId} = req.body
//         const order = await Order.findOne({ _id: orderId })

        // console.log(order.productItems[0]);

        // const idx = order.productItems.findIndex(item => item.productId.toString() === productId)
          
        // order.productItems[idx].status = status;

//         
//         console.log("updated order", order);
//         await order.save()

//         // console.log('orderId :',orderId,'status :',status)

//         res.status(200).json({ message: 'Order status updated successfully!' });
//     } catch (error) {
//         console.error('error on the orderStatus :', error)
//         res.status(500).json({ error: 'server error' })
//     }
// }

const orderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        const order = await Order.findOneAndUpdate(
            { _id: orderId },
            { $set: { status: status } },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        console.log("updated order", order);

        res.status(200).json({ message: 'Order status updated successfully!' });
    } catch (error) {
        console.error('error on the orderStatus :', error);
        res.status(500).json({ error: 'server error' });
    }
};

const orderViewPage = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findOne({ _id: orderId })
            .populate('productItems.productId');
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Pass the order data to the EJS template
        res.render('admin/orderViewPage', { order });
        
    } catch (error) {
        console.error('error on the order view page:', error);
        res.status(500).json({ error: 'server error' });
    }
};



module.exports = {
    orderPage,
    orderStatus,
    orderViewPage
}