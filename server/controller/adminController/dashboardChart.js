const Brand = require('../../model/admin/brandModel');
const Order = require('../../model/user/orderModel');


const dashboardChart = async (req, res) => {
    try {
        let startDate, endDate;
        const period = req.query.period || 'daily';
        const filterType = req.query.filterType || 'orders';
        const { startDate: customStartDate, endDate: customEndDate } = req.query;
    
        if (period === 'custom') {
            startDate = new Date(customStartDate);
            endDate = new Date(customEndDate);
        } else if (period === 'daily') {
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
        } else if (period === 'weekly') {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - startDate.getDay()); 
            endDate = new Date();
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
        } else if (period === 'monthly') {
            startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (period === 'yearly') {
            startDate = new Date(new Date().getFullYear(), 0, 1);
            endDate = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);
        }
    
        const orders = await Order.find({
            dateOrdered: {
                $gte: startDate,
                $lte: endDate
            }
        });
    
        const chartData = {
            totalOrders: orders.length,
            totalAmount: orders.reduce((sum, order) => sum + order.totalPrice, 0),
            orderStatus: {
                pending: 0,
                completed: 0,
                cancelled: 0,
                delivered: 0,
            },
            salesStatus: {
                pending: 0,
                completed: 0,
                cancelled: 0,
                delivered: 0,
            }
        };
    
        orders.forEach(order => {
            if (order.status === 'Pending') {
                chartData.orderStatus.pending++;
                chartData.salesStatus.pending += order.totalPrice;
            }
            if (order.status === 'Completed') {
                chartData.orderStatus.completed++;
                chartData.salesStatus.completed += order.totalPrice;
            }
            if (order.status === 'Cancelled') {
                chartData.orderStatus.cancelled++;
                chartData.salesStatus.cancelled += order.totalPrice;
            }
            if (order.status === 'Delivered') {
                chartData.orderStatus.delivered++;
                chartData.salesStatus.delivered += order.totalPrice;
            }
        });
    
        res.json(chartData);
    } catch (error) {
        console.error("Error retrieving orders for chart:", error);
        res.status(500).send('Internal Server Error');
    }
}    

const getTopSellingProducts = async () => {
    try {
        const topProducts = await Order.aggregate([
            {
                $unwind: '$productItems'
            },
            {
                $group: {
                    _id: '$productItems.productId',
                    totalSale: { $sum: '$productItems.quantity' },
                    productName: { $first: '$productItems.productName' },
                    offerPrice: { $first: '$productItems.offerPrice' }
                }
            },
            {
                $sort: { totalSale: -1 }
            },
            {
                $limit: 5
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $unwind: '$productDetails'
            },
            {
                $project: {
                    _id: 1,
                    totalSale: 1,
                    productName: 1,
                    offerPrice: 1,
                    productImage: { $arrayElemAt: ['$productDetails.images', 0] },
                    price: '$productDetails.price'
                }
            }
        ]);


        const topCategories = await Order.aggregate([
            {
                $unwind: '$productItems'
            },
            {
                $lookup: {
                    from: 'products',
                    localField: 'productItems.productId',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $unwind: '$productDetails'
            },
            {
                $group: {
                    _id: '$productDetails.category',
                    totalSale: { $sum: '$productItems.quantity' },
                    categoryName: { $first: '$productDetails.category' }
                }
            },
            {
                $sort: { totalSale: -1 }
            },
            {
                $limit: 5
            },
            {
                $lookup: {
                    from: 'categories', 
                    localField: '_id',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            {
                $unwind: '$categoryDetails'
            },
            {
                $project: {
                    _id: 1,
                    totalSale: 1,
                    categoryName: '$categoryDetails.name'
                }
            }
        ])

        const topBrands = await Order.aggregate([
            {
                $unwind: '$productItems'
            },
            {
                $lookup: {
                    from: 'products', 
                    localField: 'productItems.productId',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $unwind: '$productDetails' 
            },
            {
                $group: {
                    _id: '$productDetails.brand', 
                    totalSold: { $sum: '$productItems.quantity' },
                    brandName: { $first: '$productDetails.name' } 
                }
            },
            {
                $sort: { totalSold: -1 } 
            },
            {
                $limit: 5 
            },
            {
                $lookup: {
                    from: 'brands', 
                    localField: '_id',
                    foreignField: '_id',
                    as: 'brandDetails'
                }
            },
            {
                $unwind: '$brandDetails' 
            },
            {
                $project: {
                    _id: 1,
                    totalSold: 1,
                    brandName: '$brandDetails.name' 
                }
            }
        ]);
        

        return {topSellingProducts: topProducts, topSellingCategories: topCategories,topSellingBrands:topBrands }

    } catch (error) {
        console.error("Error fetching top-selling products:", error);
    }
}



module.exports = {
    dashboardChart,
    getTopSellingProducts
};
