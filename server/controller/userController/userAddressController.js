const Product = require('../../model/admin/productModel');
const Category = require('../../model/admin/categoryModel')
const Brand = require('../../model/admin/brandModel');
const User = require('../../model/user/userModel');
const { use } = require('passport');
const Cart = require('../../model/user/cartModel');


//render the address page 
const userAddress = async (req, res) => {
    try {
        const userId = req.session.user._id
        const user = await User.findOne({ _id: userId })

        // console.log("address section user :",user);

        if (!user) {
            return res.status(404).json({ error: "user not found" })
        }
        res.render('user/userAddress', { user })

    } catch (error) {
        console.error('the error on user Address page :', error)
    }
}



const addAddressPage = async (req, res) => {
    try {
        const page = req.query.page;
        console.log(page, "add address--------------------->");
        const userId = req.session.user._id;
        const user = await User.findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.render('user/addAddress', { user, page });
    } catch (error) {
        console.error('Error on user address page:', error);
    }
};

const addAddress = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const { street, city, state, pincode, country, page } = req.body;
        // console.log(page, "==========================================>");

        if (!street || !city || !state || !pincode || !country) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!/^\d{6}$/.test(pincode)) {
            return res.status(400).json({ error: 'Pincode must be a 6-digit number' });
        }

        const user = await User.findOne({ _id: userId });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.address.length >= 3) {
            return res.status(400).json({ error: 'Maximum of 3 addresses allowed' });
        }

        user.address.push({ street, city, state, pincode, country });
        await user.save();

        res.status(200).json({ newAddress: { street, city, state, pincode, country }, page });
    } catch (error) {
        console.error('Error adding address:', error);
    }
};


//render the edit address page
const editAddressPage = async (req, res) => {
    try {
        const page = req.query?.page;
        // console.log(page, "--------------------->");
        const userId = req.session.user._id;
        const addressId = req.params.addressId;
        const user = await User.findOne({ _id: userId, 'address._id': addressId });

        if (!user) {
            return res.status(404).send('Address not found');
        }
        const address = user.address.id(addressId);

        if (!address) {
            return res.status(404).send('Address not found');
        }

        res.render('user/editAddress', { address, user, page });

    } catch (error) {
        console.error('Error fetching address:', error);
        res.status(500).send('Server error');
    }
}

const editAddress = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const addressId = req.params.addressId;
        const { street, city, state, pincode, country, page } = req.body;
        // console.log(page, "==========================================>");

        if (!street || !city || !state || !pincode || !country) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (!/^\d{6}$/.test(pincode)) {
            return res.status(400).json({ error: 'Pincode must be a 6-digit number' });
        }

        const user = await User.findOneAndUpdate(
            { _id: userId, 'address._id': addressId },
            {
                $set: {
                    'address.$.street': street,
                    'address.$.city': city,
                    'address.$.state': state,
                    'address.$.pincode': pincode,
                    'address.$.country': country
                }
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.status(200).json({ message: 'Updated successfully', address: user.address.id(addressId), page: page });
    } catch (error) {
        console.error('Error on edit address:', error);
        res.status(500).json({ error: 'Server error' });
    }
};



//delete address
const deleteAddress = async (req, res) => {
    try {
        const userId = req.session.user._id
        const addressId = req.params.addressId

        const user = await User.findOne({ _id: userId })

        if (!user) {
            return res.status(404).json({ error: 'user not found' })
        }

        user.address = user.address.filter(add => add._id != addressId)

        await user.save()

        res.status(200).json({ message: 'Address deleted successfully' })
    } catch (error) {
        console.error('the error on delete address:', error);
        res.status(500).json({ errorMessage: 'server error' })
    }
}

module.exports = {
    userAddress,
    editAddressPage,
    addAddressPage,
    addAddress,
    deleteAddress,
    editAddress
}