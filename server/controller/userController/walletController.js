const Wallet = require('../../model/user/walletModel');
const User = require('../../model/user/userModel');
const Order = require('../../model/user/orderModel');

const walletPage = async (req, res) => {
    try {
        const userId = req.session.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const wallet = await Wallet.findOne({ userId });  
        console.log('wallet', wallet);
        if (!wallet) {
            return res.render('user/walletPage', { user, total: 0, returnAmount: 0, canceledAmount: 0, walletEntries: [] });
        }

        let total = wallet.balance;
        let returnAmount = 0;
        let canceledAmount = 0;

        wallet.transaction.forEach(entry => {
            if (entry.type === 'Credit') {
                if (entry.description.includes('returned')) {
                    returnAmount += entry.amount;
                } else if (entry.description.includes('canceled')) {
                    canceledAmount += entry.amount;
                }
            }
        });

        res.render('user/walletPage', { user, total, returnAmount, canceledAmount, walletEntries: wallet.transaction });

    } catch (error) {
        console.error('Error displaying wallet page:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


module.exports = {
    walletPage
};
