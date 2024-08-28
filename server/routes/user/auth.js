const route = require('express').Router()
const passport = require('passport')
const userDB = require('../../model/user/userModel');
const User = require('../../model/user/userModel');
route.get('/login/success', (req, res) => {
    // if (req.user) {
    //     try {
    //         // console.log(req.user);
    //         const { displayName: name, photos, emails, id: googleId,conformpassword } = req.user;
    //         const photo = photos && photos.length > 0 ? photos[0].value : null;
    //         const email = emails && emails.length > 0 ? emails[0].value : null;
      
    //           const User= new userDB({
    //               name,
    //               email,
    //               photo,
    //               googleId,conformpassword
    //           });
    //          User.save()
    //          req.session.user={
    //           _id:User._id,
    //           name:User.name,
    //           email:User.email,
    //          }         
    //        res.redirect('/')
    //     } catch (error) {
    //         console.log(error );
    //     }
       

    // } else {
    //     res.status(403).json({ error: true, message: "Not Autherized" })
    // }
  if (req.user) {
        const { displayName: name, photos, emails, id: googleId } = req.user;
        const photo = photos && photos.length > 0 ? photos[0].value : null;
        const email = emails && emails.length > 0 ? emails[0].value : null;

        User.findOne({ email })
            .then(existingUser => {
                if (!existingUser) {
                    const newUser = new User({ name, email, photo, googleId });
                    return newUser.save()
                        .then(() => {
                            req.session.user = { _id: newUser._id, name: newUser.name, email: newUser.email };
                            res.redirect('/');
                        });
                } else {
                    req.session.user = { _id: existingUser._id, name: existingUser.name, email: existingUser.email };
                    res.redirect('/');
                }
            })
            .catch(error => {
                console.error(error);
                res.status(500).json({ error: true, message: "Server error occurred" });
            });
    } else {
        res.status(403).json({ error: true, message: "Not Authorized" });
    }

})

route.get('/login/failed', (req, res) => {
    res.status(401).json({
        error: true,
        message: "Log in failure"
    })
})

route.get('/google', passport.authenticate('google', {
    scope:
        ['email', 'profile']
}))


route.get('/google/callback', passport.authenticate('google',
    {
        successRedirect: process.env.CLIENT_URL,
        failureRedirect: '/login/failed'

    }
))


route.get('/logout', (req, res) => {
    req.logOut()
    res.redirect(process.env.CLIENT_URL)
})

route.get("/signin/success", async(req, res) => {
    try {
        const { email } = req.user?._json;
        const existUser = await User.findOne({email: email});
        console.log("existUser: ", existUser);

        if(!existUser) {
            res.redirect("/userSignin");
        }
       res.redirect('/')
    } catch (error) {
        //error
    }
})

module.exports = route
