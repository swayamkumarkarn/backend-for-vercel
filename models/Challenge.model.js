const mongoose = require('mongoose')

const ChallengeSchema = new mongoose.Schema(
  {
    User_team:{
        type: Number, ref: "Team"
    },
    opponent_team: {
        type: Number, ref:"Team"
    },
    game: {
        type: Number, ref: "Game"
    },
    room:{
      roomId: {type: Number},
      roompwd: {type: String}
    },
    format:{
      type:String
    },
    entry_fee:{
      type: Number
    },
    challengeType:{
      type:String
    },
    isOpenMatch:{
      type: Boolean,
      default:false
    },
    ChallType:{
      type:String,
    },
    players: [
      {
        playerId: { type: Number, ref: "Player" },
        teamId : {type:Number, ref: "Team"}
      },
    ],
    invites:[
      {
        playerId: {type: Number, ref: "Player"},
      }
    ],
    startDate:{
      type: Date
    },
    startTime:{
      type: String
    },
    maps: [
      {
        mapId: {
          type: Number,
          ref: 'Map',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('Challenge', ChallengeSchema)