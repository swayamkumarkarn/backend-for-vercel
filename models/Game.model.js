const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
  {
    _id: {
      type: Number,
    },    
    name: {
      type: String,
    },
    description: {
      type: String,
    },
    imgUrl: {
      type: String,
      default: '/assets/media/default/game.jpg',
    },
    coverphoto:{
      type: String,
      default: "/assets/media/profile/cover_bg.jpg"
    },
    windowImg:{
      type: String,
      default:"/assets/media/profile/cover_bg.jpg"
    },
     platform: {
      type: [String],
      default: "PC"
    },
    publisher : {
      name: {type: String},
      imgUrl: {type: String}
    },
    videosgallery: [ { videodisc:{type:String},  tag: {type: String}, videos: {type: [Object]} , createdAt : {type: Date}} ],
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
    timestamps: true,
  }
);

module.exports = mongoose.model('Game', gameSchema);
