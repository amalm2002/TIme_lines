const express = require('express')
const route = express.Router()
const userAuthController = require('../../controller/userController/userAuthController')
const forgotPasswordController=require('../../controller/userController/forgotPasswordController')
const userController = require('../../controller/userController/usercontroller')
const userProfileController= require('../../controller/userController/userProfileController')
const changePasswordController= require('../../controller/userController/changePasswordController')
const userAddressController= require('../../controller/userController/userAddressController')
const cartController= require('../../controller/userController/cartController')
const checkOutController= require('../../controller/userController/checkOutContrller')
const orderController= require('../../controller/userController/orderController')
const orderDetailsController= require('../../controller/userController/orderDetailsController')
const wishlistController= require('../../controller/userController/wishlistController')
const walletController= require('../../controller/userController/walletController')
const couponController= require('../../controller/userController/couponUserController')
const downloadInvoiceController=require('../../controller/userController/downloadInvoiceController')
const middleware = require('../../middilware/middleware')
const upload=require('../../../config/multerConnection')



//Public Routes
route.get('/',userController.renderHome);
route.get('/userSignin', middleware.forwardAuthenticated,userAuthController.userSignIn);
route.get('/register', middleware.forwardAuthenticated, userAuthController.register);
route.post('/signup', middleware.forwardAuthenticated,userAuthController.signUp);
route.post('/signin',middleware.checkBlocked, userAuthController.signIn); 
route.get("/otpPage",middleware.forwardAuthenticated,userAuthController.renderOtp);

//OTP Routes
route.post('/verifyOtp', userAuthController.verifyOTP);
route.post('/resendOtp', userAuthController.resendOTP);

//forgotPassword
route.get('/forgotPasswordPage',middleware.forwardAuthenticated,forgotPasswordController.forgotPassPage)
route.get('/forgotOtpPage',middleware.forwardAuthenticated,forgotPasswordController.forgotOtpPage)
route.get('/newForgotPassPage',middleware.forwardAuthenticated,forgotPasswordController.newPasswordPage)
route.post('/forgotPassword',middleware.forwardAuthenticated,forgotPasswordController.forgotPassword)
route.post('/verifyForgotPasswordOtp',middleware.forwardAuthenticated,forgotPasswordController.verifyForgotPasswordOtp)
route.post('/resendForgotPasswordOtp',middleware.forwardAuthenticated,forgotPasswordController.resendForgotOtp)
route.put('/newPassword',middleware.forwardAuthenticated,forgotPasswordController.newPassword)


//product details
route.get('/productDetails/:id',middleware.ensureAuthenticated,userController.productDetails)

//category
route.get('/productPage',userController.productListPage)
route.post('/productPage',userController.filterProducts)

//user profile
route.get('/userProfile',userProfileController.userProfile)
route.put('/userProfile',upload.single('profileImage'), userProfileController.editProfile)

//change password
route.get('/changePassword',changePasswordController.changePassword)
route.put('/changePassword',changePasswordController.updatePassword)

//address route
route.get('/addAddressPage',userAddressController.addAddressPage)
route.get('/address',userAddressController.userAddress)
route.post('/addAddress',userAddressController.addAddress)
route.get('/editAddress/:addressId',userAddressController.editAddressPage)
route.put('/editAddress/:addressId',userAddressController.editAddress)
route.delete('/deleteAddress/:addressId',userAddressController.deleteAddress)

//shoping cart 
route.get('/shoppingCartPage', middleware.ensureAuthenticated, cartController.cartPage);
route.post('/addCart',middleware.ensureAuthenticated,cartController.addToCart)
route.post('/updateCartQuantity',middleware.ensureAuthenticated,cartController.updateQuantity)
route.delete('/removeCart',middleware.ensureAuthenticated,cartController.removeCart)
route.delete('/clearCart',middleware.ensureAuthenticated,cartController.clearCart)

//check Out page
route.get('/checkOut',middleware.ensureAuthenticated,checkOutController.checkOutPage)

//apply coupon
route.post('/applyCoupon',middleware.ensureAuthenticated,orderController.applyCoupon)

//remove coupon
route.post('/removeCoupon',middleware.ensureAuthenticated,orderController.removeCoupon)

//place Order
route.post('/placeOrder',middleware.ensureAuthenticated,orderController.placeOrder)
route.post('/verifyPayment',orderController.verifyPayment)
route.get('/orderListPage',middleware.ensureAuthenticated,orderController.orderListpage)
route.get('/orderDetails/:orderId',middleware.ensureAuthenticated,orderDetailsController.orderDetailsPage)
route.post('/updateOrderStatus', middleware.ensureAuthenticated, orderController.updateOrderStatus);
route.post('/orderReturn',middleware.ensureAuthenticated,orderController.returnOrder)
// route.post('/returnProduct',middleware.ensureAuthenticated,orderController.returnProduct)

//canncle each product
route.post('/cancelProduct',middleware.ensureAuthenticated,orderController.cancelPerticularProduct)

//failed payments orderlist
route.get('/failedPayment/:orderId',middleware.ensureAuthenticated,orderDetailsController.failedPaymentPage)
route.post('/retry-payment',middleware.ensureAuthenticated,orderDetailsController.repayment)
route.post('/retryPayment',middleware.ensureAuthenticated,orderDetailsController.retryPayment)

//wishlist
route.get('/wishlist',middleware.ensureAuthenticated,wishlistController.wishlistPage)
route.post('/addToWishlist',middleware.ensureAuthenticated,wishlistController.addToWishlist)
route.delete('/removeFromWishlist',middleware.ensureAuthenticated,wishlistController.removeWishlist)

//wallet page
route.get('/walletPage',middleware.ensureAuthenticated,walletController.walletPage)

//coupon page
route.get('/userCouponPage',middleware.ensureAuthenticated,couponController.couponPageUser)

//download invoice
route.get('/downloadInvoice/:orderId',middleware.ensureAuthenticated, downloadInvoiceController.downloadInvoice);


//Protected Routes
route.get('/logout', middleware.ensureAuthenticated, userAuthController.logout);


module.exports = route;


