const User = require('../../model/user/userModel');
const bcrypt = require('bcryptjs');
const Otp = require('../../model/user/otpModel');
const { sendOtp } = require('./otpController');
const { name } = require('ejs');

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

const signUp = async (req, res) => {
    const { name, email, password, conformpassword } = req.body;

    console.log(name, email, password, conformpassword);

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

    // const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    // if (!passwordRegex.test(password)) {
    //    
    //     return res.status(400).json({errorMessage:"please check your password structure!",fieldErrors:{password:true}})
    // }

    try {
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
        let OTP = otp.join('')
        const { name, email, password } = req.session.userNotAuthenticated


        const otpdata = await Otp.findOne({ email });

        if (otpdata) {
            console.log('otp data exist')

            let modelOtp = otpdata.otp;
            
            console.log('otpdata from model:', modelOtp)
            if (OTP === modelOtp) {
                // const{name,password}=req.session.user
                const newUser = new User({ name, email, password })
                // const newUser=new User({name,email,password,status})
                await newUser.save()

                req.session.user = newUser.toObject();
                return res.status(200).json({ message: "OTP verified successfully" })
            } else {
                console.log('otp is not matching')
                return res.status(400).json({ error: 'Please check your OTP,somthing went wrong!' })

            }
        } else {
            console.log('otp data is not getting')
            return res.status(400).json({ error: 'OTP expaired' })
        }

    } catch (error) {
        console.error('otp verifying error:', error.message);
        return res.status(500).json({ error: "Server error," })

    }
};

//resend Otp on the user mail

const resendOTP = async (req, res) => {
    const { email } = req.body;
    console.log("this is the req.body", req.body);
    console.log('this is resend otp mail:', email);
    try {
        await sendOtp(email);
        res.render('user/otp', { email, message: "New OTP sent to your email", errorMessage: '' });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
};

//user signin validation

const signIn = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({errorMessage:"please fill all fields",fieldErrors:{email:!email,password:!password}})
    }

    try {
        const user = await User.findOne({ email });
        // console.log("this is user :",user);
        if (!user) {
            return res.status(400).json({errorMessage:'please check your email',fieldErrors:{email:true}})
        }
        if (user.status==='Blocked') {
            return res.status(400).json({errorMessage:'Your account has been blocked by the admin. Please contact support for further assistance.'})
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({errorMessage:"Incorrect password, please check your password!",fieldErrors:{password:true}})
        }

        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email
        };

        return res.status(200).json({message:"sign in successful",redirectUrl:'/'})

    } catch (error) {

        console.error(error);

        return res.status(500).json({errorMessage:"Server error occurred"})
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
    renderOtp
};
