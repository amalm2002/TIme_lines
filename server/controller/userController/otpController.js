const nodemailer = require('nodemailer');
const Otp = require('../../model/user/otpModel');
const User = require('../../model/user/userModel');

// Function to generate a 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to send OTP via email
const sendOtpMail = async (email, otp) => {

    console.log('this is the email from .env',process.env.AUTH_EMAIL)
    if (!process.env.AUTH_EMAIL || !process.env.AUTH_PASS) {
        throw new Error('Email authentication environment variables not set');
    }

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.AUTH_EMAIL,
            pass: process.env.AUTH_PASS
        }
    });

    let mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: 'Your OTP Code',
        text: `Your verification code is ${otp}. Do not share this code with anyone.`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        if (error.responseCode === 511) {
            throw new Error('Invalid recipient address');
        }
        throw error;
    }
};

// Function to handle OTP generation and sending
const sendOtp = async (email) => {
    try {
        const user = await User.findOne({email});
        console.log('user email :',email);
        if (user) {
            console.log('user  exist')
            // throw new Error('User not found');
        }else{

        

        const otp = generateOTP();
        console.log("this is generated otp :  ",otp);
        await Otp.deleteMany({ email });
        const newOtp = new Otp({
            email,
            otp
        });

        await newOtp.save();
        await sendOtpMail(email, otp);
        console.log('otp send successfully')
        return { success: true, message: 'OTP has been sent to your email' };
    }
    } catch (error) {
        console.error('Error generating or sending OTP:', error.message);
        throw new Error('Error generating or sending OTP');
    }
};

const forgotOtp=async(email)=>{
    try {const user = await User.findOne({email});
    console.log('user forgot email :',email);
    if (user) {
    const otp = generateOTP();
    console.log("this is generated otpfor forgot Password :  ",otp);
    await Otp.deleteMany({ email });
    const newOtp = new Otp({
        email,
        otp
    });

    await newOtp.save();
    await sendOtpMail(email, otp);
    console.log('otp send successfully')
    return { success: true, message: 'OTP has been sent to your email' };
}
        
    } catch (error) {
        console.error('Error generating or sending OTP:', error.message);
        throw new Error('Error generating or sending OTP'); 
    }
}

module.exports = {
    sendOtp,
    forgotOtp
};
