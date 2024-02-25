const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema(
  {
    _id: {type: Number },    
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  
    name: {
      type: String,
    },
    game:{
      type:Number,
      ref:"Game"
    },
    nickName: {
      type: String,
    },
    description: {
      type: String, 
    },
    imgUrl: {
      type: String,
      default: "/assets/media/user.png",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    region: {
      type: [String],
    },
    nationality: { type: String },    
    slug: { type: String },    
    won: {
      type: Number,
    },
    loss: {
      type: Number,
    },
    drawn: {
      type: Number,
    },    
    total_games_played: {
      type: Number,
    }, 
    apidata : { type: Object},
    ranks: [
      {
        rank: {type: Number},
        rankId: {type: mongoose.Schema.Types.ObjectId, ref: 'Rank'}
      },
    ],   
    current_team : {
        _id : {type: Number, ref: 'Team'}
    } ,   
    current_videogame : {
        _id : {type: Number, ref: 'Game'}
    } ,      
    attributes: {
      roles: {
      type: [String],
    }, 
    regions: {
      type: String,
    }, 
    playertype:{
      type: String,
    },
    platform:{
      type: String
    },
    elo: {
      type: String,
    }, 
    timing: {
      type: Date,
    }, 
    language: {
      type: [String],
    }, 
    gender: {
      type: String,
    }, 
    paid: {
      type: String,
    }, 
    mic: {
      type: Boolean
    },
    streamer: {
      type: Boolean,
      default: false
    }
    }

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Player', playerSchema);