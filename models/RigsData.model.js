const mongoose = require('mongoose')

const RigsData = new mongoose.Schema(
  {
    name:{type:String},
    image:{
        type:String,
        default: '/assets/media/user.png',
    },
    link:{
        type:String,
        default:''
    },
    category : {type:String}, 
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('RigsData', RigsData)