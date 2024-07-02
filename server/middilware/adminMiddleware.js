const isAdminAuthenticated = (req, res, next) => {
    if (req.session.admin) {
        return next()
    }
    res.redirect('/admin/adminLogin')
}

const ensureAuthenticated = (req, res, next) => {
    if (!req.session.admin) {
        return next()
    }
    res.redirect('/admin/adminHome')
}

module.exports = {
    isAdminAuthenticated,
    ensureAuthenticated
}