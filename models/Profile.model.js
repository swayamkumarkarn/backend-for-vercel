const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    bio: {
      type: String,
      required: false,
    },
    techStack: {
      type: [String],
    }, 
    gender:{type: String, default:''},
    social: {
      facebook: {type: String},
      instagram: {type: String},
      twitch: {type: String},
      youtube: {type: String},
      discord: {type: String},
      website: {type: String},
  },
    playergames: [
      {
        game: {type: Number, ref: 'Game'},
        userign:{type: String},
        player: { type: Number, ref: 'Player' }
      }
    ],
    request: [
      {
        playerId: { type: Number, ref: "Player" },
        teamId:{ type: Number, ref: "Team"}
      },
    ],
    badges: [
      {
        badgeId: { type: mongoose.Schema.Types.ObjectId, ref: "Badge" },
      },
    ],
    teams:[
      {
        teamId: {
          type: Number,
          ref: 'Team'
        },
        games: [
          {
            gameId: { type: Number, ref: "Game" },
          },
        ],
        role: {
          type: String,
          default: ''
        },
        startDate: {
          type: String
        },
        endDate: {
          type: String
        }
      }
    ],
    tournaments:[
      {
        tournamentId: {
          type: Number,
          ref: 'Tournament'
        },
        organizer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Organizer'
        },
        games: [
        {
          gameId: { type: Number, ref: "Game" },
        },
        ],
        team: {
          type: Number,
          ref: 'Team'
        },
        role:{
          type: String,
          default:''
        },
        year: {
          type: Date
        },
        currency:{
          type: String,
          default: 'Rs'
        },
        team_ranking:{
          type: Number
        },
        winnings: {
          type: Number
        },
        upload_proof:
          [ { images: {type: [Object]} , createdAt : {type: Date}} ]
      }
    ],
    headline:{
      profileType:{
        type:String
      },
      team:{
        type: Number
      },
      inGameRole:{
        type: String
      },
      game:{
        type:Number,
        ref: 'Game'
      },
      link:{
        type:String
      },
      streamingPlatform:{
        type:String
      },
      company:{
        type:String
      },
      industry:{
        type:String
      },
      business_role:{
        type:String
      },
      startDate:{
        type: Date,
        default: Date.now(),
      }
    },
    online_status:{
      type: Boolean,
      default:false
    },
    isStatVisible: {
      type: Boolean,
      default: false
    },
    isWagerVisible: {
      type: Boolean,
      default: false
    },
    isShortcutVisible: {
      type: Boolean,
      default: true
    },
    DOB: {type: Date},
    blockList: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    rigs: [
      {
        rigId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "RigsData",
        },
      },
    ],
    current_team: {type: Number, ref:'Team', default: null},
    imagesgallery: [ { title:{type:String}, tag: {type: String}, images: {type: [Object]} , createdAt : {type: Date}} ],
    videosgallery: [ { videodisc:{type:String},  tag: {type: String}, videos: {type: [Object]} , createdAt : {type: Date}} ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Profile', profileSchema);
