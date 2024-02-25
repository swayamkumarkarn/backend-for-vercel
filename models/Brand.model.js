const mongoose = require('mongoose')

const brandSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name:{
      type: String,
      required: [true, 'Brand name is required']
    },
    description:{
      type: String,
    },
    logoUrl:{
      type: String,
      default: "/assets/media/discover/lxg.png"
    },
    social: {
      facebook: {type: String},
      instagram: {type: String},
      twitch: {type: String},
      youtube: {type: String},
      discord: {type: String},
      website: {type: String},
  },
  isClaimed:{
    type: Boolean,
    default:false
  },
  followers: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Brand', brandSchema)