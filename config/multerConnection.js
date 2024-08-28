const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(file,"file from multer")
    cb(null, 'public/images/products/'); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}_${file.originalname}`); 
  },
});


const upload = multer({ storage });

module.exports = upload;