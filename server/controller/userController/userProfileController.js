const Product = require('../../model/admin/productModel');
const Category = require('../../model/admin/categoryModel')
const Brand = require('../../model/admin/brandModel');
const User = require('../../model/user/userModel');
const { error } = require('console');



// const userProfile = async (req, res) => {
//     try {
//         const userId =  req.session.user ? req.session.user._id : req.session.userNotAuthenticated.id;
//         // console.log('req.session.user.id :',req.session.user,   'req.session.userNotAuthenticated.id:',req.session.userNotAuthenticated);
//         const user = await User.findOne({ _id: userId })

//         if (!user) {
//             return res.status(404).json({ error: 'user not found' })
//         }

//         res.render('user/userProfile', { user })
//     } catch (error) {
//         console.error('the error will showing on the user profile side:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// }

const userProfile = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user._id : req.session.userNotAuthenticated.id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // const referralLink = `http://localhost:4000/register?userId=${user._id}`;
        const referralLink = `https://timeslines.shop/register?userId=${user._id}`;

        res.render('user/userProfile', { user, referralLink });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


const editProfile = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.session.user;
        console.log('here is the userId :',userId);
        const profileImage = req.file ? req.file.filename : null;

        const updateData={name}
        if (profileImage) {
            updateData.image=profileImage
        }

        const user = await User.findOneAndUpdate({ _id: userId?._id }, updateData, { new: true });
console.log('user   >>>>>>>>>>>>>>>>>>>>>>>',user);
        res.json({ success: true, name:user.name, profileImage:user.image });
    } catch (error) {
        console.error('the error will showing on the edit profile page:', error);
    }
}
module.exports = {
    userProfile,
    editProfile
}