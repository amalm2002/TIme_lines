const User = require('../../model/user/userModel');
const Wishlist = require('../../model/user/wishlistModel');


const wishlistPage = async (req, res) => {
    try {
        const userId = req.session.user._id;

        const user = await User.findOne({ _id: userId });

        const wishlist = await Wishlist.findOne({ userId }).populate('products');
        

       if (!wishlist) {
            // console.log("hhhhhhhhhhhhhhhhhh");
            return res.render('user/wishlistPage', { user,wishlist:[] });
        }

        res.render('user/wishlistPage', { user,wishlist:wishlist.products });
        // console.log("here is the wishlist ========================:",wishlist,user);
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ error: 'Server error' });
    }
};



    const addToWishlist = async (req, res) => {
        try {
            const { productId } = req.body;
            const userId = req.session.user._id;

            // console.log('here is the userId -------------------------------->',userId);
    
            let wishlist = await Wishlist.findOne({ userId });
            // console.log('wishlist,',wishlist);
    
            if (!wishlist) {
                wishlist = new Wishlist({ userId, products: [] });
            }
    
           
            const isExist = wishlist.products.includes(productId);
    
            if (isExist) {
               
                wishlist.products.pull(productId);
            } else {
               
                wishlist.products.push(productId);
            }
    
            await wishlist.save();
    
            res.status(200).json({ success: true, wishlist: wishlist.products });
        } catch (error) {
            console.error('Error updating wishlist:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }

 const removeWishlist=async (req,res)=>{
    try {
        const{productId}=req.body
        const userId=req.session.user._id

        const wishlist=await Wishlist.findOne({userId})

      if (!wishlist) {
        return res.status(404).json({suceess:false, message: 'Wishlist not found'})
      }

      const productIndex=wishlist.products.indexOf(productId)

      if (productIndex>-1) {
        wishlist.products.splice(productIndex,1)
        await wishlist.save()
        res.status(200).json({success:true})
      }else {
        return res.status(404).json({ success: false, message: 'Product not found in wishlist' });
    }
        
    } catch (error) {
        console.error('the error will show on the remove wishlist page:',error)
    }
 }   

module.exports = {
    wishlistPage,
    addToWishlist,
    removeWishlist
}