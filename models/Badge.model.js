const mongoose = require('mongoose')

const BadgeSchema = new mongoose.Schema(
  {
        title:{
            type: String
        },
        image:{
            type: String,
            default: '/assets/media/profile/badges1.png'
        },
        description: {
            type: String
        },
  }
)

module.exports = mongoose.model('Badge', BadgeSchema)