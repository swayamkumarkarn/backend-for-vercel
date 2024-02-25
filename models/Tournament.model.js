const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema(
  {
    _id: {type: Number },    
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String
    },
    detaildescription: {
      type: String
    },
    slug: {
      type: String
    },    
    startDate: {type: Date} ,
    Type: { type: String},
    endDate: {type : Date},
    startTime: { type: String},
    endTime:{type: String},
    status: {type: String},
    tournamentType: {type: String},
    currency: {type: String},
    numberOfTeam: { type: Number},
    playType:{type:String},
    minTeams:{type:Number},
    room:{
      roomId: {type: Number},
      roompwd: {type: String}
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
    winnerType: {
      type: String
    },  
    leagues: [ { leagueId : {type: Number, ref: 'League'} }],
    games: [ { gameId : {type: Number, ref: 'Game'} }],
    teams: [ { teamId : {type: Number, ref: 'Team'} }],
    matches: [ { matchId : {type: Number, ref: 'Match'} }],
    // seriesId: { type: Number, ref: 'Series', default: null },
    prizepool: {type: String},
    category: {type: String},
    location : {type: String},
    address: {type: String},
    checkIn: {type: Number},
    teamSize: {type: String},
    isMatchSetting: { type: Boolean, default:false},
    eligibleCountries: [{name: {type: String}, iso: {type: String} }],
    participants : {type: Number},
    minParticipants: {type: Number},
    mode: {type: String},
    matchType: {type: String},
    registered : [
      {
        user: {
          type: mongoose.Types.ObjectId,
          ref: "User"
        }
      }
    ],
    entranceFee : {type: Number},
    imgUrl: {
      type: String,
      default: '/assets/media/default/tournament.jpg',
    },  
    coverPhoto: {
      type: String,
      default: '/assets/media/profile/cover_bg.jpg',
    },       
    organizers: [
      {
       organizerId: {type: mongoose.Schema.Types.ObjectId, ref: 'Organizer'}
      },
    ],
    followers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    // cohosts: {type: String},
    sponsors: [
      {
        sponsorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Sponsor',
        },
        title:{
          type: String,
          default: ''
        }
      },
    ],
    arenas: [
      {
        arenaId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Arena',
        },
      },
    ],
    maps: [
      {
        mapId: {
          type: Number,
          ref: 'Map',
        },
      },
    ],
    favourites: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    tournament_tier: {
      type: String,
      default: ''
    },
    imagesgallery: [ { title:{type:String}, tag: {type: String}, images: {type: [Object]} , createdAt : {type: Date}} ],    
    videosgallery: [ { videodisc:{type:String},  tag: {type: String}, videos: {type: [Object]} , createdAt : {type: Date}} ],        
    // tickets: {type: Number},
    website: {type: String},
    social: {
      facebook: { type: String, default: '' },
      twitch: { type: String, default: '' },
      instagram: { type: String, default: '' },
      youtube: { type: String, default: '' },
      discord:{ type: String, default: '' }
    },
    prizes: [{
      prizeName:{
        type: String
      },
      place:{
        type: String
      },
      goodies:{
        type: String
      },
      prize_sponsor:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sponsor'
      },
      trophy_img: {type: String, default: ''},
      winner_team_id: {
        type: Number,
        ref: 'Team'
      },
      winner_img: {
        type: String,
      },
      winnings: {
        type: Number,
      }
    }],
    playout:{
      type: String
    },
    platform:{
      type: String
    },
    isClaimed:{
      type:Boolean,
      default:false
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Tournament', tournamentSchema);
