const multer = require('multer');

//Storing multerStorage on local server system

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.FILE_STORAGE_PATH);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname}` )
  },
});


const uploadLocal = multer({
  storage: multerStorage,
});

module.exports =  uploadLocal;

