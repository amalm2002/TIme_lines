const renderHome = (req, res) => {
  
    res.render('user/index', { user: req.session.user });
    console.log('thisi the req.user in home',req.session.user)
};

// const guestHome = (req, res) => {
//   console.log("guest page");
//     res.render('user/guest');
//     // console.log('thisi the req.user in home',req.session.user)
// };

// const otpPage=(req,res)=>{
//     res.render('user/otp')
// }

module.exports = {
    renderHome,
    // otpPage
    // guestHome
};




