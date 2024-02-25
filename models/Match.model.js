const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    _id: {type: Number },
    name: {type: String },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
    },
    instance:{
      type:String,
    },
    participants:[{
      participantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      isByes: { type: Boolean, default: false },
      isPlayer: { type: Boolean }
    }],
    startDate: {type: Date} ,
    endDate: {type : Date},
    status:{type: String},
    leagueId: { type: Number, ref: 'League'},
    matchType:{type: String},
    tournamentId: { type: Number, ref: 'Tournament'},
    draw:{  type: Boolean,
            default:false
    },
    forfeit:{type: Boolean, default:false},
    liveEmbedUrl:{type: String},    
    officialStreamUrl:{type: String},    
    live:{type: Object},    
    streamsList:{type: [Object]},    
    games: {type: [Object]},
    winner: {type: Object},
    opponents: [
      {
        opponent: { type: Object},
        isByes: { type: Boolean, default: false },
        isPlayer: {type: Boolean }
      }
    ],
    results: [
      {
        score: { type: Number},
        teamId : { type: Number}
      }
    ] 
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Match', matchSchema);
