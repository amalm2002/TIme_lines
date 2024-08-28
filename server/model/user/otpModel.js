const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'User'
    },
    otp: {
        type: String, 
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: { expires: '2m' } 
    },
    email:{
        type:String
    }
});

module.exports = mongoose.model('Otp', otpSchema);
