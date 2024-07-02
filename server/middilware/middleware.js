const ensureAuthenticated = (req, res, next) => {
    if ("this ",req.session.user) {
        return next();
    }
    res.redirect('/');
};

const forwardAuthenticated = (req, res, next) => {
    console.log('req user>>>>>>',req.session.user)
    if (!req.session.user) {
        return next();
    }
    res.redirect('/');
};

const checkBlocked=(req,res,next)=>{
    if (req.session.user&&req.session.isBlocked) {
        req.session.destroy()
        return res.status(401).json({errorMessage:'Admin has blocked you.'})
    }
    next()
}

module.exports = {
    ensureAuthenticated,
    forwardAuthenticated,
    checkBlocked   
};
