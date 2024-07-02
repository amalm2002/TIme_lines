const route = require('express').Router()
const passport = require('passport')
const userDB = require('../../model/user/userModel')
route.get('/login/success', (req, res) => {
    if (req.user) {
        try {
            console.log(req.user);
            const { displayName: name, photos, emails, id: googleId,conformpassword } = req.user;
            const photo = photos && photos.length > 0 ? photos[0].value : null;
            const email = emails && emails.length > 0 ? emails[0].value : null;
      
              const User= new userDB({
                  name,
                  email,
                  photo,
                  googleId,conformpassword
              });
             User.save()
             req.session.user={
              id:User._id,
              name:User.name,
              email:User.email,
             }         
           res.redirect('/')
        } catch (error) {
            console.log(error );
        }
       

    } else {
        res.status(403).json({ error: true, message: "Not Autherized" })
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

module.exports = route
