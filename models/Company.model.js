const mongoose = require('mongoose')

const companySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name:{
      type: String,
      required: [true, 'Company name is required']
    },
    description:{
      type: String,
    },
    logoUrl:{
      type: String,
      default: "/assets/media/discover/lxg.png"
    },
    location:{
      type: String
    },
    founded:{
      type: Number
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Company', companySchema)