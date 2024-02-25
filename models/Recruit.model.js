const mongoose = require('mongoose');

const recruitSchema = new mongoose.Schema(
  {
    RecruitId: {
      type:String,
    },
    RecruitType:{
      type: String
    },
    games: [
      {
        gameId: { type: Number, ref: "Game" },
      },
    ],
    role: {
      type: String
    },
    regions: {
      type:String
    },
    mic: {
      type: Boolean,
      default: false
    },
    language:{
      type: [String]
    },
    type:{
      type: String
    },
    salary:{
      type: String
    },
    rank:{
      type: String
    },
    availability:{
      type: String
    },
    platform:{
      type:String,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Recruit', recruitSchema);
