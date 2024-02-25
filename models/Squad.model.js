const mongoose = require('mongoose');

const squadSchema = new mongoose.Schema(
  {
    game : {
      type:Number,
      ref: 'Game'
    },
    country:{
      type: String,
    },
    players: [
      {
      player: {type: Number, ref: 'Player'},
      role:{type: String}
      },
    ],        
  }
);

module.exports = mongoose.model('Squad', squadSchema);
