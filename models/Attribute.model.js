const mongoose = require('mongoose');

const attributeSchema = new mongoose.Schema(
  {
    attributeId: {
      type: String,
    },
    attributeType:{
      type: String
    },
    games: [
      {
        gameId: { type: Number, ref: "Game" },
      },
    ],
    role: {
      type: [String]
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
    category:{
      type: String
    },
    date:{
      type:Date
    },
    platform:{
      type:String,
    },
    gender:{
      type: String
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Attribute', attributeSchema);
