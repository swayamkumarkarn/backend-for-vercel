const mongoose = require('mongoose');

const rankSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
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
    rank: {
      type: Number,
    },
    points: {
      type: Number,
    },    
    rank_type: {
      type: String,
    },
    games: [
      {
       gameId: {type: Number, ref: 'Game'}
      },
    ],        
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Rank', rankSchema);
