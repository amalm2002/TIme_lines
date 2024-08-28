const express=require('express')
const route=express.Router()
const adminAuthController=require('../../controller/adminController/adminAuthController')
const productController=require('../../controller/adminController/productController')
const orderController=require('../../controller/adminController/adminOrderController')
const returnOrderController=require('../../controller/adminController/returnOrderController')
const cancelOrderController=require('../../controller/adminController/canceledOrderController')
const deliveredOrderController=require('../../controller/adminController/deliveredOrderController')
const coponController=require('../../controller/adminController/coponController')
const categoryOfferController=require('../../controller/adminController/categoryOfferController')
const salesReportController=require('../../controller/adminController/salesReportcontroller')
const dashboardChartController=require('../../controller/adminController/dashboardChart')
const middilware=require('../../middilware/adminMiddleware')
const upload=require('../../../config/multerConnection')

//admin authentication
route.get('/adminHome',middilware.isAdminAuthenticated,adminAuthController.adminHome)
route.get('/adminLogin',middilware.ensureAuthenticated,adminAuthController.adminLogin)
route.post('/adminLogin',middilware.ensureAuthenticated,adminAuthController.Login)

//customer list
route.get('/userList',middilware.isAdminAuthenticated,adminAuthController.customerList)
route.put('/changeStatus/:id',adminAuthController.changeStatus)

//category
route.get('/category',middilware.isAdminAuthenticated,adminAuthController.category)
route.get('/checkCategory',adminAuthController.checkCategory)
route.post('/addCategories',adminAuthController.addCategory)
route.put('/updateCategories/:id',adminAuthController.updateCategory)
// route.delete('/customer/:id',adminAuthController.deleteCategory)
route.put('/category/:id/status',adminAuthController.updateCategoryStatus)

//brand
route.get('/brand',middilware.isAdminAuthenticated,adminAuthController.brand)
route.get('/checkBrand',adminAuthController.checkBrand)
route.post('/addBrand',adminAuthController.addBrands)
route.put('/updateBrand/:id',adminAuthController.updateBrand)
route.delete('/brand/:id',adminAuthController.deleteBrand)

//product side
route.get('/products',middilware.isAdminAuthenticated,productController.product);
route.get('/addProductPage',middilware.isAdminAuthenticated,productController.addProductPage)
route.post('/addProducts', upload.array('images', 3), productController.addProduct);
route.get('/productStatus/:id',middilware.isAdminAuthenticated,productController.productStatus)
route.get('/editProductPage/:id',middilware.isAdminAuthenticated,productController.editProductPage)
route.put('/editProduct/:id',upload.array('images',3),productController.editProduct)

//order side
route.get('/orderPage',middilware.isAdminAuthenticated,orderController.orderPage)
route.post('/updateOrderStatus',orderController.orderStatus)

//return order
route.get('/returnOrder/:orderId',middilware.isAdminAuthenticated,returnOrderController.returnOrderPage)
route.post('/updateRetrunStatus',returnOrderController.returnOrderStatusUpdate)
route.post('/rejectRetrunStatus',returnOrderController.returnOrderStatusReject)

//return rejected/accept order page
route.get('/returnRejected/:orderId',middilware.isAdminAuthenticated,returnOrderController.returnRejectedPage)
route.get('/returnAccept/:orderId',middilware.isAdminAuthenticated,returnOrderController.returnAcceptPage)



//cancel order page
route.get('/canceledOrder/:orderId',middilware.isAdminAuthenticated,cancelOrderController.canceledOrderPage)

//delivered order page
route.get('/deliveredOrder/:orderId',middilware.isAdminAuthenticated,deliveredOrderController.deliveredOrderPage)

//copon section
route.get('/addCoponListPage',middilware.isAdminAuthenticated,coponController.couponListPage)
route.get('/addCoponPage',middilware.isAdminAuthenticated,coponController.coponPage)
route.post('/addCopons',middilware.isAdminAuthenticated,coponController.addCopon)
//edit section
route.get('/editCoupon/:couponId',middilware.isAdminAuthenticated,coponController.editCouponPage)
route.put('/editCopons/:couponId',middilware.isAdminAuthenticated,coponController.editCoupon)
//delete coupon
route.delete('/deleteCoupon/:couponId',middilware.isAdminAuthenticated,coponController.deleteCoupon)

//category offer section
route.get('/CategoryOfferListPage',middilware.isAdminAuthenticated,categoryOfferController.CategoryOfferListPage)
route.get('/addCategoryOffer',middilware.isAdminAuthenticated,categoryOfferController.addOfferCategoryPage)
route.post('/addOffers',middilware.isAdminAuthenticated,categoryOfferController.addCategoryOffer)
route.get('/editCategoryOffer/:offerId', middilware.isAdminAuthenticated, categoryOfferController.editCategoryOfferPage);
route.put('/updateCategoryOffer/:offerId',middilware.isAdminAuthenticated,categoryOfferController.updateCategoryOffer)

//delete offer
route.delete('/deleteCategoryOffer/:offerId',middilware.isAdminAuthenticated,categoryOfferController.removeCategoryOffer)

//sales report
route.post('/generateReport',middilware.isAdminAuthenticated,salesReportController.salesReport)

//Dashboard chart
route.get('/orderChart',middilware.isAdminAuthenticated,dashboardChartController.dashboardChart)

//admin logout
route.get('/logout',adminAuthController.Logout)


module.exports=route