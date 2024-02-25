const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    _id: { type: Number },
    name: { type: String },
    acronym: { type: String },
    description: {
      type: String,
    },
    imgUrl: {
      type: String,
      default: "/assets/media/default/team.jpg",
    },
    coverPhoto: {
      type: String,
      default: "/assets/media/profile/cover_bg.jpg",
    },
    social: {
      facebook: { type: String, default: '' },
      twitch: { type: String, default: '' },
      website: { type: String, default: '' },
      instagram: { type: String, default: '' },
      youtube: { type: String, default: '' },
      discord:{ type: String, default: '' }
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    founded: {
      type: Date,
      default: Date.now(),
    },
    region: { type: String },
    slug: { type: String },
    achievements: { type: String },
    about: {
      description: { type: String },
      contacts: [
        {
          emailname: { type: String },
          emailaddress: { type: String },
        },
      ],
    },
    rigs: [
      {
        rigId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "RigsData",
        },
      },
    ],
    employees: [
      {
        employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, default: "Owner" },
      },
    ],

    arenas: [
      {
        arenaId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Arena",
        },
      },
    ],

    sponsors: [
      {
        sponsorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Sponsor",
        },
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
    teamrank:{
      // rank: { type: Number },
      // rankType: { type: String, default: "country" },
      // rankId: { type: mongoose.Schema.Types.ObjectId, ref: "Rank" },
      rank: {type: Number},
      winning:{type: Number}
    },      
    games: [
      {
        gameId: { type: Number, ref: "Game" },
      },
    ],
    squads: [
      {
        squadId: { type: mongoose.Schema.Types.ObjectId, ref: "Squad" },
      },
    ],
    favourites: [
      {
        profile: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Profile",
        },
      },
    ],
    imagesgallery: [
      {
        title: { type: String },
        tag: { type: String },
        images: { type: [Object] },
        createdAt: { type: Date },
      },
    ],
    videosgallery: [
      {
        videodisc: { type: String },
        tag: { type: String },
        videos: { type: [Object] },
        createdAt: { type: Date },
      },
    ],
    request: [
      {
        playerId: { type: Number, ref: "Player" },
      },
    ],
    players: [
      {
        playerId: { type: Number, ref: "Player" },
      },
    ],
    isClaimed:{
      type:Boolean,
      default:false
    },
    team_winnings: {
      type: Number,
    },
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
        upload_proof:{ images: {type: String} , createdAt : {type: Date}}
      }
    ],
    team_points: {
      type: Number,
      default: 0
    },
    attributes: {
      roles: {
        type: [String],
      },
      regions: {
        type: String,
      },
      teamtype: {
        type: String,
      },
      platform: {
        type: String,
      },
      elo: {
        type: String,
      },
      timing: {
        type: Date,
        default: Date.now(),
      },
      languages: {
        type: [String],
      },
      gender: {
        type: String,
      },
      paid: {
        type: String,
      },
      mic: {
        type: Boolean,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Team", teamSchema);
