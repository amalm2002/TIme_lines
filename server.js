const express = require("express");
const cors=require("cors")
require("dotenv").config();
const passport= require('passport')
const authRoute=require('./server/routes/user/auth')
require('./passport')
const userRoute=require('./server/routes/user/userRouter')
const adminRoute=require('./server/routes/admin/adminRouter')
const connectDB = require('./config/dbConnection');
const bodyparser = require("body-parser");
const path = require("path");
const session = require("express-session");
const { v4: uuidv4 } = require("uuid");
require('./utils/offerExpiryJob')

const app = express();
app.use(express.json());

app.use(session({
    secret: uuidv4(),
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use((req,res,next)=>{
    res.set('Cache-Control','no-store')
    next()
})

app.use(passport.initialize())
app.use(passport.session())

const PORT = process.env.PORT || 4000;

// MongoDB connection
connectDB();

// Parse request to body-parser
app.use(bodyparser.urlencoded({ extended: true }));

// Set view engine
app.set("view engine", "ejs");

// Load public
app.use(express.static(path.join(__dirname,'public')))
app.use(express.static(path.join(__dirname,'public/userHome')))
app.use(express.static(path.join(__dirname,'public/adminHome')))
// app.use(express.static(path.join(__dirname,'public/')))


app.use('/',userRoute)
app.use('/admin',adminRoute)
app.use('/auth',authRoute)

//404 message middlware
app.use((req,res,next)=>{
    res.status(404).render('404')
})

// app.use((err,req,res,next)=>{
//     res.status(500).render('500')
// })

app.listen(PORT, () => {
    console.log(`Server is started on http://localhost:${PORT}`);
});

