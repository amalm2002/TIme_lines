const Product = require('../../model/admin/productModel');
const Category = require('../../model/admin/categoryModel')
const Brand = require('../../model/admin/brandModel');
const User = require('../../model/user/userModel');
const bcrypt = require('bcryptjs');


const changePassword = async (req, res) => {
    try {
        const userId = req.session.user._id
        const user = await User.findOne({ _id: userId })
        res.render('user/changePassword', { user })
    } catch (error) {
        console.error('the error will show on the change password:', error);
    }
}

const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmNewPassword } = req.body;
        const userId = req.session.user._id;
        const user = await User.findById(userId);
        
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ errorMessage: "Current password is incorrect", fieldErrors: { currentPassword: true } });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ fieldErrors: { confirmNewPassword: 'Passwords do not match' } });
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ errorMessage: "Password must be at least 8 characters long and include at least one uppercase letter, one number, and one special character", fieldErrors: { newPassword: true } });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



module.exports = {
    changePassword,
    updatePassword
}