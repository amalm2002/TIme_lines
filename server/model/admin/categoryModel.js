const mongoose =require('mongoose')
const categorySchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    status: {
        type: String,
        default: 'Active'
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
})

const Category= mongoose.model('Category',categorySchema)

module.exports=Category