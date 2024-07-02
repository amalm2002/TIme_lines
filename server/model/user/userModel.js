const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
       
    },
    googleId:{
      type:String  
    },
    photos:{
       type:String
    },
    conformpassword:{
        type:String,

    },
    date:{
        type:Date,
        default:Date.now
    },
    status:{
        type:String,
        default:'Active'
    },
    isBlocked:{
        type:Boolean,
        default:false
    }
});


const User = mongoose.model("userDb", userSchema);

module.exports = User;
