const Copon = require('../../model/admin/coponModel')


//coupon list page
const couponListPage=async (req,res)=>{
    try {
        const coupon=await Copon.find()
        if (!coupon) {
            return res.status(404).json({success:false,message:'coupon not found!'})
        }
        res.render('admin/couponListPage',{coupon})
        
    } catch (error) {
        console.error('the error will show on the coupon list page:',error)
        return res.status(500).json({error:'server error'})
    }
}

//add coupon page
const coponPage = async (req, res) => {
    try {
        const copon = await Copon.find()
        res.render('admin/addCopon', { copon })

    } catch (error) {
        console.error('the error will show on the copon page:', error)
        return res.status(500).json({ error: 'server error' })
    }
}


//add coupon code
const addCopon = async (req, res) => {
    try {
        const { couponName, couponCode, discountPercentage, startDate, expireDate, maxAmount } = req.body;
        // console.log("Received coupon details:", req.body);

        if (!couponName || !couponCode || !discountPercentage || !startDate || !expireDate || !maxAmount) {
            return res.status(400).json({ success: false, message: 'Please fill all required fields!' });
        }

        const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
        const [expireYear, expireMonth, expireDay] = expireDate.split('-').map(Number);

        if (startYear > expireYear || 
           (startYear === expireYear && startMonth > expireMonth) || 
           (startYear === expireYear && startMonth === expireMonth && startDay > expireDay)) {
            return res.status(400).json({ success: false, message: 'Expiry date must be after the start date.' });
        }

        if (discountPercentage < 0 || discountPercentage > 90) {
            return res.status(400).json({ success: false, message: 'Discount percentage must be between 0 and 90.' });
        }

        
        if (maxAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Max amount must be greater than zero.' });
        }

      
        const couponCodePattern = /^(?=.*\d)(?=.*[a-zA-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,20}$/;
        if (!couponCodePattern.test(couponCode)) {
            return res.status(400).json({ success: false, message: 'Coupon code must include numbers, characters, and symbols.' });
        }

        
        const newCoupon = new Copon({
            couponName,
            couponCode,
            discountPercentage,
            startDate,  
            expiryDate: expireDate,  
            maxAmount
        });

        console.log('newCoupon:', newCoupon);

        await newCoupon.save();
        console.log(newCoupon,"++++++++++++++++++++++++++++");
        
        res.json({ success: true, message: 'Coupon added successfully.' });

    } catch (error) {
        console.error('Error in adding coupon:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

//edit coupon page
const editCouponPage=async (req,res)=>{
try {
const couponId=req.params.couponId
const coupon=await Copon.findById(couponId)
if (!coupon) {
    return res.status(404).json({success:false,message:'coupon not found !'})
}
res.render('admin/editCoupon',{coupon})
    
} catch (error) {
    console.error('the error will show on the edit coupon page:',error)
    return res.status(500).json({error:'server error'})
}
}

//edit coupon code
const editCoupon = async (req, res) => {
    try {
        const { couponName, couponCode, discountPercentage, startDate, expireDate, maxAmount } = req.body;
        const couponId = req.params.couponId;        
        
        const coupon = await Copon.findById(couponId);

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        if (!couponName || !couponCode || !discountPercentage || !startDate || !expireDate || !maxAmount) {
            return res.status(400).json({ success: false, message: 'Please fill all required fields!' });
        }

        const start = new Date(startDate);
        const expire = new Date(expireDate);


        if (start > expire) {
            return res.status(400).json({ success: false, message: 'Expiry date must be after the start date.' });
        }

        if (discountPercentage < 0 || discountPercentage > 90) {
            return res.status(400).json({ success: false, message: 'Discount percentage must be between 0 and 90.' });
        }

        if (maxAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Max amount must be greater than zero.' });
        }

        const couponCodePattern = /^(?=.*\d)(?=.*[a-zA-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,20}$/;
        if (!couponCodePattern.test(couponCode)) {
            return res.status(400).json({ success: false, message: 'Coupon code must include numbers, characters, and symbols.' });
        }
        const updatedCoupon = await Copon.findByIdAndUpdate(
            couponId,
            {
                couponName,
                couponCode,
                discountPercentage,
                startDate: start.toISOString().split('T')[0], 
                expiryDate: expire.toISOString().split('T')[0], 
                maxAmount
            },
            { new: true }
        );


        

        if (updatedCoupon) {
            return res.json({ success: true, message: 'Coupon updated successfully.' });
        } else {
            return res.status(500).json({ success: false, message: 'Failed to update coupon.' });
        }
    } catch (error) {
        console.error('Error in editCoupon:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}

const deleteCoupon=async (req,res)=>{
    try {
        const couponId=req.params.couponId
        const coupon=await Copon.findById(couponId)
        if (!coupon) {
            return res.status(404).json({success:false,message:'Coupon not found!'})
        }
        await Copon.findByIdAndDelete(couponId)
        res.json({success:true,message:'Coupon deleted successfully.'})
        
    } catch (error) {
        console.error('the error will show on the delete coupon section :',error)
        return res.status(500).json({error:'server error'})
    }
}


module.exports = {
    coponPage,
    addCopon,
    couponListPage,
    editCouponPage,
    editCoupon,
    deleteCoupon
}