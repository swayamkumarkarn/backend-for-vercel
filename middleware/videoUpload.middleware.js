const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'multiplayr',
    upload_preset: 'multiplayr',
    format: 'mp4',
    resource_type: 'video',
    use_filename: true,
    overwrite: true
  },
});

const videoUpload = multer({
  storage,
});

module.exports = videoUpload;
