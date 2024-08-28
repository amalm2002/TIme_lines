const User = require('../../model/user/userModel');
const bcrypt = require('bcryptjs');
const Otp = require('../../model/user/otpModel');
const { forgotOtp } = require('./otpController');
const { use } = require('passport');



const forgotPassPage = (req, res) => {
    res.render('user/forgotPassword')
}
const forgotOtpPage = (req, res) => {
    const email = req.session.forgotPasswordEmail;
    res.render('user/forgotPassOtp')
}
const newPasswordPage = (req, res) => {
    res.render('user/newForgotPassPage')
}

const forgotPassword = async (req, res) => {
    const { email } = req.body
    try {
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(403).json({ error: 'Invalid email,pleasen check your email!' })
        }

        // console.log('here is the email',user.email);
        
        req.session.forgotPasswordEmail = email

        await forgotOtp(email)

        return res.status(200).json({ messge: 'otp sent to your mail', })

    } catch (error) {
        console.error('the error will show on the forgotpass controller :', error)
        res.status(500).json({ error: 'server error' })
    }
}

const verifyForgotPasswordOtp = async (req, res) => {
    const { otp } = req.body;
    try {
        const email = req.session.forgotPasswordEmail;
        if (!email) {
            return res.status(404).json({ error: 'Email not found in the session' });
        }

        const otpData = await Otp.findOne({ email });

        if (!otpData || otpData.otp !== otp.join('')) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // res.render('user/newForgotPassPage')
        return res.status(200).json({ message: 'OTP verified successfully' });

    } catch (error) {
        console.error('Error verifying forgot password OTP:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};


const resendForgotOtp = async (req, res) => {
    const email=req.session.forgotPasswordEmail
    try {
        await forgotOtp(email)
        res.status(200).json({ success: true, message: 'new otp will send' })

    } catch (error) {
        console.error('this error on the resend forgot otp :', error)
        return res.status(500).json({ error: 'server error' })
    }
}

const newPassword = async (req, res) => {
    const { newPassword, confirmPassword } = req.body

    // console.log(newPassword,confirmPassword,"=========================");

    const email = req.session.forgotPasswordEmail
    // console.log(email,'++++++++++++++++++++++++++++++++++++');

    if (!newPassword || !confirmPassword) {
        return res.status(400).json({ errorMessage: 'please fill all field', fieldErrors: { newPassword: !newPassword, confirmPassword: !confirmPassword } })
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ errorMessage: 'please check your password,do not match', fieldErrors: { confirmPassword: true } })
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(newPassword)) {

        return res.status(400).json({ errorMessage: "please check your password structure!", fieldErrors: { newPassword: true } })
    }
    try {
        const user = await User.findOne({ email })

        // console.log(user,"----------------");

        if (!user) {
            return res.status(404).json({ errorMessage: 'user not found' })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)

        user.password = hashedPassword

        await user.save()


        res.status(200).json({ success: true, message: 'Password changed successfully' });

    } catch (error) {
        console.error('the error on show chnage password :', error)
        return res.status(500).json({ errorMessage: 'server error' })
    }

}

module.exports = {
    forgotPassPage,
    forgotOtpPage,
    newPasswordPage,
    forgotPassword,
    verifyForgotPasswordOtp,
    resendForgotOtp,
    newPassword
}