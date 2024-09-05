const User = require('../../model/user/userModel');
const Wallet = require('../../model/user/walletModel')
const bcrypt = require('bcryptjs');
const Otp = require('../../model/user/otpModel');
const { sendOtp } = require('./otpController');
const { name } = require('ejs');
const { default: mongoose } = require('mongoose');

const register = (req, res) => {
    res.render('user/userSignUp', { errorMessage: '' });
};

const userSignIn = (req, res) => {
    res.render('user/userSigIn', { errorMessage: '' });
};

const renderOtp = (req, res) => {
    const email = req.session.userNotAuthenticated.email
    res.render('user/otp', {
        message: "OTP sent to your email",
        errorMessage: '', email: email
    });
}

async function giveReward(userId) {
    try {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            console.error('Invalid userId:', userId);
            return;
        }

        const rewardUser = await User.findById(userId);
        if (!rewardUser) {
            console.error('User not found for userId:', userId);
            return;
        }

        const exist = await Wallet.findOne({ userId: userId });

        if (exist) {
            await Wallet.findByIdAndUpdate(exist._id, {
                $inc: { balance: 100 },
                $push: {
                    transaction: {
                        amount: 100,
                        type: 'Credit',
                        description: "referral link reward",
                    }
                }
            });
        } else {
            await Wallet.create({
                userId: userId,
                balance: 100,
                transaction: [{
                    amount: 100,
                    type: 'Credit',
                    description: "referral link reward"
                }]
            });
        }
    } catch (error) {
        console.error('Error in giveReward function:', error);
    }
}

const signUp = async (req, res) => {
    const { name, email, password, conformpassword, userId } = req.body;

    // console.log(name, email, password, conformpassword);
    if (mongoose.Types.ObjectId.isValid(userId)) {
        req.session.refferalUser = userId
    }

    if (!name || !email || !password || !conformpassword) {
        return res.status(400).json({
            errorMessage: "Please fill all fields", fieldErrors: {
                name: !name, email: !email,
                password: !password, conformpassword: !conformpassword
            }
        });
    }


    if (password !== conformpassword) {
        return res.status(400).json({ errorMessage: 'please check your password,Do not match', fieldErrors: { conformpassword: true } })
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(password)) {

        return res.status(400).json({ errorMessage: "please check your password structure!", fieldErrors: { password: true } })
    }

    const nameCheck = /^[A-Za-z]+$/
    if (!nameCheck.test(name)) {
        return res.status(400).json({ errorMessage: 'Name should only contain alphabetic characters.', fieldErrors: { name: true } })
    }
    try {

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            if (existingUser.googleId) {
                return res.status(400).json({ errorMessage: 'You have already signed up with Google. Please sign in with Google instead.' });
            } else {
                return res.status(400).json({ errorMessage: 'Email is already registered. Please sign in instead.' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        req.session.userNotAuthenticated = {
            name,
            email,
            password: hashedPassword,
        };

        console.log("email is:", email)

        await sendOtp(email);

        return res.status(200).json({ message: "OTP sent,redirecting...", redirectUrl: '/otpPage' })

    } catch (error) {
        console.error(error);

        res.status(500).json({ errorMessage: "server error wiil occuried !" })
    }
};

//verifying the otp 
const verifyOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        const OTP = otp.join('');
        const { name, email, password } = req.session.userNotAuthenticated;

        const otpdata = await Otp.findOne({ email });

        if (otpdata) {
            const modelOtp = otpdata.otp;

            if (OTP === modelOtp) {
                const newUser = new User({ name, email, password });
                await newUser.save();

                // Update the new user with the referral link
                // const referralLink = `http://localhost:4000/register?userId=${newUser._id}`;
                const referralLink = `https://timeslines.shop/register?userId=${newUser._id}`;
                await User.findByIdAndUpdate(newUser._id, { referredBy: referralLink });

                req.session.user = newUser.toObject();

                const referralUser = req.session.refferalUser;

                if (mongoose.Types.ObjectId.isValid(referralUser)) {
                    await giveReward(referralUser);  
                }

                return res.status(200).json({ message: "OTP verified successfully" });
            } else {
                return res.status(400).json({ error: 'Please check your OTP, something went wrong!' });
            }
        } else {
            return res.status(400).json({ error: 'OTP expired' });
        }
    } catch (error) {
        console.error('Error verifying OTP:', error.message);
        return res.status(500).json({ error: "Server error" });
    }
};

//resend Otp on the user mail
const resendOTP = async (req, res) => {
    const { email } = req.body;
    // console.log("this is the req.body", req.body);
    // console.log('this is resend otp mail:', email);
    try {
        await sendOtp(email);
        res.status(200).json({
            success: true,
            message: "New OTP sent to your email",
        })
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
};

//user signin validation
const signIn = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ errorMessage: "please fill all fields", fieldErrors: { email: !email, password: !password } })
    }

    try {
        const user = await User.findOne({ email });
        // console.log("this is user :",user);
        if (!user) {
            return res.status(400).json({ errorMessage: 'please check your email', fieldErrors: { email: true } })
        }
        if (user.status === 'Blocked') {
            return res.status(400).json({ errorMessage: 'Your account has been blocked by the admin. Please contact support for further assistance.' })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ errorMessage: "Incorrect password, please check your password!", fieldErrors: { password: true } })
        }

        req.session.user = {
            _id: user._id,
            name: user.name,
            email: user.email
        };

        return res.status(200).json({ message: "sign in successful", redirectUrl: '/' })

    } catch (error) {

        console.error(error);

        return res.status(500).json({ errorMessage: "Server error occurred" })
    }
};


const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Server error');
        }
        res.redirect('/');
    });
};



module.exports = {
    register,
    userSignIn,
    signUp,
    signIn,
    verifyOTP,
    resendOTP,
    logout,
    renderOtp,
};
