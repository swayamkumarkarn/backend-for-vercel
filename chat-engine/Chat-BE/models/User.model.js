const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
    },
    firstName: {
      type: String
    },
    lastName: {
      type: String
    },    
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please enter a valid email address',
      ],
    },
    phone_number:{
      type:String,
      required:[true,'Please provide your Phone Number'],
      unique:true,
      match:[
        /^(?:(?:\+|0{0,2})91(\s*[\ -]\s*)?|[0]?)?[6789]\d{9}|(\d[ -]?){10}\d$/,
        'Please enter a valid Phone Number,'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      select: false,
    },
    username: {
      type: String,
      required: [true, 'Please provide an username'],
      unique: true,
      trim: true,
    },
    profilePicUrl: {
      type: String,
      default: '/assets/media/user.png',
    },
    coverPicUrl: {
      type: String,
      default: '/assets/media/profile/cover_bg.jpg',
    },
    country:{
      type:String
    },
    newMessagePopup: {
      type: Boolean,
      default: true,
    },
    unreadMessage: {
      type: Boolean,
      default: false,
    },
    unreadNotification: {
      type: Boolean,
      default: false,
    },    
    role: {
      type: String,
      default: 'user',
      enum: ['user', 'root', 'admin', 'manager'],
    },
    isVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    isPremiumPass:{
      type: Boolean,
      default: false,
    },
    isSuperAdmin: {
      type:Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  sentRequest:[{
    username: {type: String, default: ''}
  }],
  request: [{
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    username: {type: String, default: ''}
  }],
  friendsList: [{
    friendId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    friendName: {type: String, default: ''}
  }],
  totalRequest: {type: Number, default:0} , 
  public_key: {
      type: String,
      unique: true
  }
    
  },
  {
    timestamps: true
})

let Dataset = mongoose.models.User || mongoose.model('User', userSchema)

module.exports = Dataset
