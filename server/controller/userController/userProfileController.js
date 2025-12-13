const User = require('../../model/user/userModel');
const cloudinary = require('../../../config/cloudinary');



const userProfile = async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user._id : req.session.userNotAuthenticated.id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // const referralLink = `http://localhost:4000/register?userId=${user._id}`;
        const referralLink = `${process.env.REFERAL_URL}/register?userId=${user._id}`;

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

        const currentUser = await User.findById(userId?._id);

        const profileImage = req.file ? req.file.path : null;

        const updateData = { name };
        if (profileImage) {
            updateData.image = profileImage;

            if (currentUser.image &&
                currentUser.image.includes('cloudinary.com') &&
                !currentUser.image.includes('default-user-icon')) {

                try {
                    const urlParts = currentUser.image.split('/upload/');
                    if (urlParts[1]) {
                        const publicId = urlParts[1].split('.')[0];
                        await cloudinary.uploader.destroy(`user_profiles/${publicId}`);
                    }
                } catch (deleteErr) {
                    console.error('Failed to delete old image:', deleteErr);
                }
            }
        }

        const user = await User.findOneAndUpdate(
            { _id: userId?._id },
            updateData,
            { new: true }
        );

        res.json({
            success: true,
            name: user.name,
            profileImage: user.image
        });
    } catch (error) {
        console.error('Error in edit profile:', error);
        res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
};

module.exports = {
    userProfile,
    editProfile
}