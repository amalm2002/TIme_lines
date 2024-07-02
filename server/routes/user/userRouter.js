const express = require('express');
const route = express.Router();
const userAuthController = require('../../controller/userController/userAuthController');
const userController = require('../../controller/userController/usercontroller');
const middleware = require('../../middilware/middleware');


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

//Protected Routes
route.get('/logout', middleware.ensureAuthenticated, userAuthController.logout);


module.exports = route;


