const cron = require('node-cron')
const Product = require('../server/model/admin/productModel')


cron.schedule('* * * * *', async () => {
    console.log('Running offer expiry check...');
    try {
        const products = await Product.find({
            $or: [
                { productOfferendDate: { $lte: new Date() } },
                { categoryOfferEndDate: { $lte: new Date() } }
            ]
        })

        for (const product of products) {
            await product.checkAndUpdateOffers()
        }
        console.log(`Checked and updated ${products.length} products.`);
    } catch (error) {
        console.log('the error show on the cron job side', error)
    }
})