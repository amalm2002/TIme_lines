const express=require('express')
const route=express.Router()
const adminAuthController=require('../../controller/adminController/adminAuthController')
const productController=require('../../controller/adminController/productController')
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
route.delete('/customer/:id',adminAuthController.deleteCategory)

//brand
route.get('/brand',middilware.isAdminAuthenticated,adminAuthController.brand)
route.get('/checkBrand',adminAuthController.checkBrand)
route.post('/addBrand',adminAuthController.addBrands)
route.put('/updateBrand/:id',adminAuthController.updateBrand)
route.delete('/brand/:id',adminAuthController.deleteBrand)

//admin logout
route.get('/logout',adminAuthController.Logout)


//product side
route.get('/products', productController.product);
route.get('/addProductPage',productController.addProductPage)
route.post('/addProducts', upload.array('images', 3), productController.addProduct);
route.put('/productStatus/:id',productController.productStatus)

module.exports=route