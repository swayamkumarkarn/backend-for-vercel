const mongoose = require('mongoose')

const AvatarSchema = new mongoose.Schema(
  {
        title:{
            type: String
        },
        image:{
            type: String,
            default: '/assets/media/game_avatar/1.jpg'
        },
        gender: { // Adding the gender field
          type: String,
          default: '' // You can set a default value or leave it empty if it's optional
      }
  }
)

module.exports = mongoose.model('Avatar', AvatarSchema)