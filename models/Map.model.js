const mongoose = require('mongoose')

const mapSchema = new mongoose.Schema(
  {
  _id: {type: Number},
  name: {type: String, default: ''},
  game: {type: Number},
  imgUrl: {type: String},
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Map', mapSchema)