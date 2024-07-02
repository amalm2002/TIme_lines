// const multer=require('multer')
// const path = require('path')

// const storage=multer.diskStorage({
//     destination:function (req,file,cb) {
//         cb(null,'/public/imegaes/products')
//     },
//     filename:function (req,file,cb) {
//         cb(null,Date.now()+path.extname(file.originalname))   
//     }
// },
// console.log('-------------------------------------------------------->')
// )

// const upload=multer({storage:storage})

// module.exports=upload


const multer = require('multer');
const path = require('path');

// Define storage for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/products'); // Ensure this path is correct and the directory exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));   
    }
});

// Create the upload middleware
const upload = multer({ storage: storage });

console.log('Multer configuration loaded successfully');

// Export the upload module
module.exports = upload;
