const User = require('../../model/user/userModel');
const Order = require('../../model/user/orderModel');
const Coupon=require('../../model/admin/coponModel')

const couponPageUser=async (req,res)=>{
    try {
        const userId=req.session.user._id
        const user=await User.findById(userId)
        if (!user) {
            return res.status(404).json({success:false,message:'User not found'})
        }
        const currentDate=new Date()

        // console.log('Current Date:', currentDate);

        const coupons=await Coupon.find().exec()
        
        const validCoupons = coupons.filter(coupon => {
            const expiryDate = new Date(coupon.expiryDate);
            return expiryDate >= currentDate;
        });


        res.render('user/couponPage',{user,coupon:validCoupons})
        
    } catch (error) {
        console.error('ther error will show on the user coupon section:',error)
        return res.status(500).json({error:'server error'})
    }
}

module.exports={
    couponPageUser
}